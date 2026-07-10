/* ============================================================
   mindmap.js — Obsidian Graph View 风格的力导向脑图引擎
   零依赖，纯 Canvas 2D API | L'Oreal 黑金主题
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     Configuration
     ============================================================ */
  var CONFIG = {
    // Force parameters
    repulsion: 6000,           // 节点间斥力系数
    attraction: 0.005,         // 连线引力系数
    damping: 0.85,             // 速度衰减
    centerGravity: 0.015,      // 中心引力
    maxSpeed: 10,              // 单帧速度上限
    minDist: 30,               // 最小距离（防止力爆炸）

    // Node appearance
    nodeRadius: 22,            // 节点半径
    nodeFillAlpha: 0.25,       // 节点填充透明度
    nodeStrokeWidth: 2,        // 节点边框宽度
    nodeGlowRadius: 6,         // 节点发光半径
    nodeGlowAlpha: 0.15,       // 节点发光透明度

    // Labels
    nodeFontSize: 12,          // 节点标签字号
    clusterFontSize: 13,       // Cluster 标签字号
    edgeLabelFontSize: 11,     // 连线标签字号

    // Edge particles
    particleCount: 2,          // 每条线默认粒子数
    particleCountLow: 1,       // 节点多时每条线粒子数
    particleSize: 2,           // 粒子大小
    particleSpeedMin: 0.002,   // 粒子最小速度
    particleSpeedMax: 0.005,   // 粒子最大速度
    particleColor: '#D4AF37',  // 粒子颜色
    particleGlow: 4,           // 粒子发光半径
    highNodeThreshold: 50,     // 节点阈值（超过此数降低粒子）

    // Zoom
    zoomMin: 0.15,
    zoomMax: 5,
    zoomStep: 0.1,            // 滚轮缩放步进因子

    // Gold theme
    goldColor: '#D4AF37',
    edgeColor: 'rgba(255,255,255,0.08)',
    edgeWidth: 1,
    bgColor: '#000000',

    // Animation
    initialAnimFrames: 80,     // 初始展开动画帧数
    spreadRadius: 300,         // 初始散布半径

    // Sidebar
    sidebarWidth: 320,

    // Pulse animation
    pulseSpeed: 0.06,          // 脉冲速度
    pulseMinAlpha: 0.3,
    pulseMaxAlpha: 0.8,
  };

  var GH_PATH = './data/mindmap-data.json';
  var NOTES_PATH = './data/mindmap-notes.json';
  var mmData = null;     // 原始 mindmap 数据
  var mmNotes = { nodeNotes: {}, nodeEdits: {} };
  var mmSha = '';
  var notesSha = '';

  /* ============================================================
     State
     ============================================================ */
  var canvas, ctx, dpr;
  var editingNode = null;      // 当前正在编辑的节点
  var nodes = [];              // { id, label, detail, cluster, x, y, vx, vy, radius, color, pinned, highlighted }
  var edges = [];              // { from, to, label, sourceNode, targetNode, particles: [{t, dir, speed}] }
  var clusters = {};           // { id: { name, color, nodes:[] } }
  var clusterMeta = [];        // [{ id, name, color, cx, cy }]

  // Camera
  var camera = { x: 0, y: 0, zoom: 1 };

  // Interaction
  var dragNode = null;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragMoved = false;
  var isPanning = false;
  var panStart = { x: 0, y: 0 };
  var hoveredNode = null;
  var selectedNode = null;

  // Animation
  var animProgress = 0;
  var animating = true;
  var frameTime = 0;
  var rafId = null;

  // Search
  var searchQuery = '';

  /* ============================================================
     Initialization
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    setupCanvas();
    setupSidebar();
    setupSearch();
    loadData();
  });

  function setupCanvas() {
    var container = document.getElementById('mindmap-container');
    if (!container) {
      console.error('[mindmap] #mindmap-container not found');
      return;
    }
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 150));

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('click', onClick);

    // Touch events
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // Default cursor
    canvas.style.cursor = 'grab';
  }

  function resizeCanvas() {
    var container = document.getElementById('mindmap-container');
    if (!container) return;
    dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    if (!animating && animProgress === 0) {
      // Initial camera not yet set
    }
  }

  /* ============================================================
     Data Loading & Graph Construction
     ============================================================ */
  function loadData() {
    // 1. 先加载本地数据，保证正常展示
    fetch('./data/mindmap-data.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        mmData = data;
        buildGraph(data);
        buildLegend(data.clusters);
        // Center camera
        camera.x = (canvas.clientWidth / 2) || 400;
        camera.y = (canvas.clientHeight / 2) || 300;
        camera.zoom = 1;
        // Start simulation loop
        frameTime = performance.now();
        if (!rafId) rafId = requestAnimationFrame(simulate);

        // 2. 如果有 GitHub Token，再尝试从 GitHub 读取最新数据覆盖
        if (window.GitHubAPI && GitHubAPI.hasToken()) {
          loadFromGitHub();
        }
      })
      .catch(function (err) {
        console.error('[mindmap] Failed to load local data:', err);
        if (window.GitHubAPI && GitHubAPI.hasToken()) {
          loadFromGitHub();
        }
      });

    // 3. 同时加载 notes
    loadNotes();
  }

  function loadFromGitHub() {
    GitHubAPI.readFile('data/mindmap-data.json')
      .then(function (result) {
        mmData = result.content;
        mmSha = result.sha;
        buildGraph(mmData);
        buildLegend(mmData.clusters);
      })
      .catch(function (err) {
        console.error('[mindmap] Failed to load from GitHub:', err);
      });
  }

  function loadNotes() {
    if (window.GitHubAPI && GitHubAPI.hasToken()) {
      GitHubAPI.ensureFile('data/mindmap-notes.json', { nodeNotes: {}, nodeEdits: {} })
        .then(function (result) {
          mmNotes = result.content;
          notesSha = result.sha;
          if (editingNode) openSidebar(editingNode);
        })
        .catch(function (err) {
          console.error('[mindmap] Failed to load notes from GitHub:', err);
        });
    } else {
      fetch('./data/mindmap-notes.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          mmNotes = data;
          if (editingNode) openSidebar(editingNode);
        })
        .catch(function () {
          mmNotes = { nodeNotes: {}, nodeEdits: {} };
        });
    }
  }

  function buildGraph(data) {
    // Build cluster map
    clusters = {};
    data.clusters.forEach(function (cl) {
      clusters[cl.id] = { name: cl.name, color: cl.color, nodes: [] };
    });

    // Create nodes — all start at origin (0,0) for initial animation
    nodes = [];
    var centerX = 0;
    var centerY = 0;
    var totalNodes = 0;
    data.clusters.forEach(function (cl) { totalNodes += cl.nodes.length; });

    var nodeIndex = 0;
    data.clusters.forEach(function (cl) {
      var angle = (Math.PI * 2 * data.clusters.indexOf(cl)) / data.clusters.length;
      var spread = CONFIG.spreadRadius;
      cl.nodes.forEach(function (n) {
        var node = {
          id: n.id,
          label: n.label,
          detail: n.detail || '',
          cluster: cl.id,
          color: cl.color,
          x: centerX,
          y: centerY,
          // Target is the final spread position
          targetX: centerX + Math.cos(angle) * spread + (Math.random() - 0.5) * 120,
          targetY: centerY + Math.sin(angle) * spread + (Math.random() - 0.5) * 120,
          vx: 0,
          vy: 0,
          radius: CONFIG.nodeRadius,
          pinned: false,
          highlighted: false
        };
        nodes.push(node);
        clusters[cl.id].nodes.push(node);
        nodeIndex++;
      });
    });

    // Create edges
    edges = [];
    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    var useLowParticles = nodes.length > CONFIG.highNodeThreshold;
    var particleCount = useLowParticles ? CONFIG.particleCountLow : CONFIG.particleCount;

    data.edges.forEach(function (e) {
      var src = nodeMap[e.from];
      var tgt = nodeMap[e.to];
      if (!src || !tgt) return;
      // Generate particles
      var particles = [];
      var count = 1 + Math.floor(Math.random() * particleCount);
      for (var i = 0; i < count; i++) {
        particles.push({
          t: Math.random(),                       // 0..1 在线段上的位置
          dir: Math.random() > 0.5 ? 1 : -1,      // 移动方向
          speed: CONFIG.particleSpeedMin + Math.random() * (CONFIG.particleSpeedMax - CONFIG.particleSpeedMin)
        });
      }
      edges.push({
        from: e.from,
        to: e.to,
        label: e.label || '',
        sourceNode: src,
        targetNode: tgt,
        particles: particles
      });
    });

    // Compute initial cluster centers
    updateClusterCenters();
  }

  /* ============================================================
     Force Simulation
     ============================================================ */
  function simulate(now) {
    var dt = Math.min((now - frameTime) / 16.667, 3); // cap at 3x to avoid spiral
    frameTime = now;

    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    // Initial expand animation
    if (animating) {
      animProgress += 1 / CONFIG.initialAnimFrames;
      if (animProgress >= 1) {
        animProgress = 1;
        animating = false;
      }
      var t = easeOutCubic(animProgress);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += (n.targetX - n.x) * t * 0.1;
        n.y += (n.targetY - n.y) * t * 0.1;
      }
    } else {
      // Apply forces
      applyForces(width, height, dt);
    }

    // Update particles
    updateParticles();

    // Update cluster centers
    updateClusterCenters();

    // Render
    render(width, height);

    rafId = requestAnimationFrame(simulate);
  }

  function applyForces(width, height, dt) {
    var i, j, dx, dy, dist, force, nodeA, nodeB;

    // Repulsion between all nodes
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        nodeA = nodes[i];
        nodeB = nodes[j];
        dx = nodeA.x - nodeB.x;
        dy = nodeA.y - nodeB.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.minDist) dist = CONFIG.minDist;
        force = CONFIG.repulsion / (dist * dist);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        if (!nodeA.pinned) { nodeA.vx += fx; nodeA.vy += fy; }
        if (!nodeB.pinned) { nodeB.vx -= fx; nodeB.vy -= fy; }
      }
    }

    // Attraction along edges
    for (i = 0; i < edges.length; i++) {
      var edge = edges[i];
      nodeA = edge.sourceNode;
      nodeB = edge.targetNode;
      dx = nodeB.x - nodeA.x;
      dy = nodeB.y - nodeA.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.minDist) dist = CONFIG.minDist;
      force = dist * CONFIG.attraction;
      var ax = (dx / dist) * force;
      var ay = (dy / dist) * force;
      if (!nodeA.pinned) { nodeA.vx += ax; nodeA.vy += ay; }
      if (!nodeB.pinned) { nodeB.vx -= ax; nodeB.vy -= ay; }
    }

    // Center gravity
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.pinned) continue;
      n.vx -= n.x * CONFIG.centerGravity;
      n.vy -= n.y * CONFIG.centerGravity;
    }

    // Update positions with damping
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
      n.vx *= CONFIG.damping;
      n.vy *= CONFIG.damping;
      var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > CONFIG.maxSpeed) {
        n.vx = (n.vx / speed) * CONFIG.maxSpeed;
        n.vy = (n.vy / speed) * CONFIG.maxSpeed;
      }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
    }
  }

  function updateParticles() {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      if (!edge.sourceNode || !edge.targetNode) continue;
      for (var j = 0; j < edge.particles.length; j++) {
        var p = edge.particles[j];
        p.t += p.speed * p.dir;
        if (p.t > 1) { p.t = 1; p.dir = -1; }
        if (p.t < 0) { p.t = 0; p.dir = 1; }
      }
    }
  }

  function updateClusterCenters() {
    clusterMeta = [];
    for (var id in clusters) {
      if (!clusters.hasOwnProperty(id)) continue;
      var cl = clusters[id];
      var clNodes = cl.nodes;
      if (clNodes.length === 0) continue;
      var cx = 0, cy = 0;
      for (var i = 0; i < clNodes.length; i++) {
        cx += clNodes[i].x;
        cy += clNodes[i].y;
      }
      cx /= clNodes.length;
      cy /= clNodes.length;
      clusterMeta.push({ id: id, name: cl.name, color: cl.color, cx: cx, cy: cy });
    }
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function render(width, height) {
    // Clear & fill background
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = CONFIG.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Apply camera transform
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw edges
    drawEdges();

    // Draw edge labels
    drawEdgeLabels();

    // Draw cluster labels
    drawClusterLabels();

    // Draw nodes
    drawNodes();

    ctx.restore();
  }

  /* ---- Edges ---- */
  function drawEdges() {
    ctx.lineWidth = CONFIG.edgeWidth / camera.zoom;
    ctx.strokeStyle = CONFIG.edgeColor;

    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var sx = edge.sourceNode.x;
      var sy = edge.sourceNode.y;
      var tx = edge.targetNode.x;
      var ty = edge.targetNode.y;

      // Edge line
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Gold particles
      drawEdgeParticles(edge, sx, sy, tx, ty);
    }
  }

  function drawEdgeParticles(edge, sx, sy, tx, ty) {
    var dx = tx - sx;
    var dy = ty - sy;
    var particleSize = CONFIG.particleSize / camera.zoom;
    var glowSize = CONFIG.particleGlow / camera.zoom;

    for (var i = 0; i < edge.particles.length; i++) {
      var p = edge.particles[i];
      var px = sx + dx * p.t;
      var py = sy + dy * p.t;

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212,175,55,0.15)';
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.particleColor;
      ctx.fill();
    }
  }

  /* ---- Edge Labels ---- */
  function drawEdgeLabels() {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      if (!edge.label) continue;
      var sx = edge.sourceNode.x;
      var sy = edge.sourceNode.y;
      var tx = edge.targetNode.x;
      var ty = edge.targetNode.y;
      var mx = (sx + tx) / 2;
      var my = (sy + ty) / 2;

      ctx.save();
      var fontSize = CONFIG.edgeLabelFontSize / camera.zoom;
      ctx.font = fontSize + 'px "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var textW = ctx.measureText(edge.label).width + 12;
      var pillH = 18 / camera.zoom;
      var pillR = 4 / camera.zoom;

      // Pill background
      ctx.fillStyle = 'rgba(15,17,23,0.85)';
      ctx.beginPath();
      roundRect(ctx, mx - textW / 2, my - pillH / 2, textW, pillH, pillR);
      ctx.fill();

      // Pill border
      ctx.strokeStyle = 'rgba(212,175,55,0.25)';
      ctx.lineWidth = 0.5 / camera.zoom;
      ctx.stroke();

      // Text
      ctx.fillStyle = CONFIG.goldColor;
      ctx.fillText(edge.label, mx, my);
      ctx.restore();
    }
  }

  /* ---- Cluster Labels ---- */
  function drawClusterLabels() {
    for (var i = 0; i < clusterMeta.length; i++) {
      var cm = clusterMeta[i];
      var clNodes = clusters[cm.id].nodes;
      if (clNodes.length < 2) continue;

      // Find topmost node of this cluster
      var topY = Infinity;
      for (var j = 0; j < clNodes.length; j++) {
        if (clNodes[j].y < topY) topY = clNodes[j].y;
      }
      var labelY = topY - CONFIG.nodeRadius - 14;
      var labelX = cm.cx;

      ctx.save();
      var fontSize = CONFIG.clusterFontSize / camera.zoom;
      ctx.font = '600 ' + fontSize + 'px "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var textW = ctx.measureText(cm.name).width + 20;
      var bgH = 26 / camera.zoom;
      var bgR = 6 / camera.zoom;

      // Background
      ctx.fillStyle = hexToRgba(cm.color, 0.12);
      ctx.beginPath();
      roundRect(ctx, labelX - textW / 2, labelY - bgH / 2, textW, bgH, bgR);
      ctx.fill();

      // Border
      ctx.strokeStyle = hexToRgba(cm.color, 0.35);
      ctx.lineWidth = 1 / camera.zoom;
      ctx.stroke();

      // Text
      ctx.fillStyle = cm.color;
      ctx.fillText(cm.name, labelX, labelY);
      ctx.restore();
    }
  }

  /* ---- Nodes ---- */
  function drawNodes() {
    var pulsePhase = performance.now() * CONFIG.pulseSpeed * 0.001;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var r = node.radius / camera.zoom;
      r = Math.max(r, 3); // minimum visible size

      var isSelected = (node === selectedNode);
      var isHovered = (node === hoveredNode);
      var isHighlighted = node.highlighted;

      // ---- Search highlight: gold pulse glow ----
      if (isHighlighted) {
        var pulseAlpha = CONFIG.pulseMinAlpha + (CONFIG.pulseMaxAlpha - CONFIG.pulseMinAlpha) * (0.5 + 0.5 * Math.sin(pulsePhase + i));
        var pulseR = r + 14 / camera.zoom;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,175,55,' + pulseAlpha + ')';
        ctx.fill();

        // Second ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 6 / camera.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,' + (pulseAlpha * 0.8) + ')';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.stroke();
      }

      // ---- Selected/Hovered: gold ring ----
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4 / camera.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = CONFIG.goldColor;
        ctx.lineWidth = 2.5 / camera.zoom;
        ctx.stroke();

        if (isSelected) {
          // Outer glow for selected
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 8 / camera.zoom, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(212,175,55,0.3)';
          ctx.lineWidth = 1.5 / camera.zoom;
          ctx.stroke();
        }
      }

      // ---- Node glow ----
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + CONFIG.nodeGlowRadius / camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, CONFIG.nodeGlowAlpha);
      ctx.fill();

      // ---- Node circle ----
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, CONFIG.nodeFillAlpha);
      ctx.fill();
      ctx.strokeStyle = isSelected || isHovered ? CONFIG.goldColor : node.color;
      ctx.lineWidth = CONFIG.nodeStrokeWidth / camera.zoom;
      ctx.stroke();

      // ---- Pinned indicator (small dot) ----
      if (node.pinned) {
        ctx.beginPath();
        ctx.arc(node.x, node.y - r - 3 / camera.zoom, 2.5 / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.goldColor;
        ctx.fill();
      }

      // ---- Node label ----
      ctx.save();
      var fontSize = CONFIG.nodeFontSize / camera.zoom;
      ctx.font = '500 ' + fontSize + 'px "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#F9FAFB';
      ctx.fillText(node.label, node.x, node.y + r + 4 / camera.zoom);
      ctx.restore();
    }
  }

  /* ============================================================
     Interaction: Mouse
     ============================================================ */
  function screenToWorld(sx, sy) {
    return {
      x: (sx - camera.x) / camera.zoom,
      y: (sy - camera.y) / camera.zoom
    };
  }

  function getNodeAt(wx, wy) {
    for (var i = nodes.length - 1; i >= 0; i--) {
      var n = nodes[i];
      var dx = wx - n.x;
      var dy = wy - n.y;
      var r = n.radius / camera.zoom + 6; // tolerance
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  function onMouseDown(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var w = screenToWorld(sx, sy);
    var node = getNodeAt(w.x, w.y);

    if (node) {
      dragNode = node;
      dragStartX = node.x;
      dragStartY = node.y;
      dragMoved = false;
      node.vx = 0;
      node.vy = 0;
      node.pinned = true;
      canvas.style.cursor = 'grabbing';
    } else {
      isPanning = true;
      panStart.x = e.clientX - camera.x;
      panStart.y = e.clientY - camera.y;
      canvas.style.cursor = 'grabbing';
    }
  }

  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;

    if (dragNode) {
      var w = screenToWorld(sx, sy);
      var movedDist = Math.sqrt(
        (w.x - dragStartX) * (w.x - dragStartX) +
        (w.y - dragStartY) * (w.y - dragStartY)
      );
      if (movedDist > 3) dragMoved = true;
      dragNode.x = w.x;
      dragNode.y = w.y;
      dragNode.vx = 0;
      dragNode.vy = 0;
    } else if (isPanning) {
      camera.x = e.clientX - panStart.x;
      camera.y = e.clientY - panStart.y;
    } else {
      var w = screenToWorld(sx, sy);
      var node = getNodeAt(w.x, w.y);
      if (hoveredNode !== node) {
        hoveredNode = node;
        canvas.style.cursor = node ? 'pointer' : 'grab';
      }
    }
  }

  function onMouseUp(e) {
    if (dragNode) {
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
      dragNode = null;
    }
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'grab';
    }
  }

  function onClick(e) {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var w = screenToWorld(sx, sy);
    var node = getNodeAt(w.x, w.y);
    if (node) {
      if (selectedNode !== node) {
        selectedNode = node;
        openSidebar(node);
      }
    } else {
      // Click on empty space: deselect
      if (selectedNode) {
        closeSidebar();
        selectedNode = null;
      }
    }
  }

  function onDblClick(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var w = screenToWorld(sx, sy);
    var node = getNodeAt(w.x, w.y);
    if (node && node.pinned) {
      node.pinned = false;
      node.vx = 0;
      node.vy = 0;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;

    var delta = e.deltaY > 0 ? (1 - CONFIG.zoomStep) : (1 + CONFIG.zoomStep);
    var newZoom = camera.zoom * delta;
    newZoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, newZoom));

    // Zoom centered on cursor
    var wx = (sx - camera.x) / camera.zoom;
    var wy = (sy - camera.y) / camera.zoom;
    camera.zoom = newZoom;
    camera.x = sx - wx * camera.zoom;
    camera.y = sy - wy * camera.zoom;
  }

  /* ============================================================
     Interaction: Touch
     ============================================================ */
  var lastTouchDist = 0;
  var lastTouchCenter = null;

  function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var sx = touch.clientX - rect.left;
      var sy = touch.clientY - rect.top;
      var w = screenToWorld(sx, sy);
      var node = getNodeAt(w.x, w.y);
      if (node) {
        dragNode = node;
        dragStartX = node.x;
        dragStartY = node.y;
        dragMoved = false;
        node.vx = 0;
        node.vy = 0;
        node.pinned = true;
      } else {
        isPanning = true;
        panStart.x = touch.clientX - camera.x;
        panStart.y = touch.clientY - camera.y;
      }
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      isPanning = false;
      dragNode = null;
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var sx = touch.clientX - rect.left;
      var sy = touch.clientY - rect.top;
      if (dragNode) {
        var w = screenToWorld(sx, sy);
        var movedDist = Math.sqrt(
          (w.x - dragStartX) * (w.x - dragStartX) +
          (w.y - dragStartY) * (w.y - dragStartY)
        );
        if (movedDist > 3) dragMoved = true;
        dragNode.x = w.x;
        dragNode.y = w.y;
      } else if (isPanning) {
        camera.x = touch.clientX - panStart.x;
        camera.y = touch.clientY - panStart.y;
      }
    } else if (e.touches.length === 2 && lastTouchDist > 0) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var scale = dist / lastTouchDist;
      var rect = canvas.getBoundingClientRect();
      var cx = lastTouchCenter.x - rect.left;
      var cy = lastTouchCenter.y - rect.top;
      var newZoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, camera.zoom * scale));
      var wx = (cx - camera.x) / camera.zoom;
      var wy = (cy - camera.y) / camera.zoom;
      camera.zoom = newZoom;
      camera.x = cx - wx * camera.zoom;
      camera.y = cy - wy * camera.zoom;
      lastTouchDist = dist;
    }
  }

  function onTouchEnd(e) {
    if (dragNode) {
      dragNode = null;
    }
    isPanning = false;
    if (e.touches.length < 2) {
      lastTouchDist = 0;
      lastTouchCenter = null;
    }
  }

  /* ============================================================
     Sidebar
     ============================================================ */
  function setupSidebar() {
    var closeBtn = document.getElementById('sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeSidebar();
        selectedNode = null;
        editingNode = null;
      });
    }

    // 实时更新内存数据
    var labelInput = document.getElementById('edit-label');
    var detailInput = document.getElementById('edit-detail');
    var insightInput = document.getElementById('edit-insight');

    if (labelInput) {
      labelInput.addEventListener('input', function () {
        if (editingNode) editingNode.label = labelInput.value;
      });
    }
    if (detailInput) {
      detailInput.addEventListener('input', function () {
        if (editingNode) editingNode.detail = detailInput.value;
      });
    }
    if (insightInput) {
      insightInput.addEventListener('input', function () {
        if (editingNode) {
          if (!mmNotes.nodeEdits) mmNotes.nodeEdits = {};
          mmNotes.nodeEdits[editingNode.id] = insightInput.value;
        }
      });
    }

    // 按钮事件
    var btnSave = document.getElementById('btn-save');
    var btnDelete = document.getElementById('btn-delete');
    var btnAddChild = document.getElementById('btn-add-child');

    if (btnSave) btnSave.addEventListener('click', saveNodeEdit);
    if (btnDelete) btnDelete.addEventListener('click', deleteNode);
    if (btnAddChild) btnAddChild.addEventListener('click', addChildNode);

    // Token 设置
    var tokenSaveBtn = document.getElementById('mm-token-save');
    var tokenInput = document.getElementById('mm-gh-token');
    if (tokenSaveBtn && tokenInput) {
      tokenSaveBtn.addEventListener('click', function () {
        var t = tokenInput.value.trim();
        if (t && window.GitHubAPI) {
          GitHubAPI.setToken(t);
          showSaveStatus('Token 已保存');
          loadFromGitHub();
          loadNotes();
        }
      });
    }
  }

  function openSidebar(node) {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    editingNode = node;

    var labelInput = document.getElementById('edit-label');
    var detailInput = document.getElementById('edit-detail');
    var insightInput = document.getElementById('edit-insight');
    var insightList = document.getElementById('insight-list');
    var tokenSetup = document.getElementById('mm-token-setup');

    if (labelInput) labelInput.value = node.label || '';
    if (detailInput) detailInput.value = node.detail || '';

    // 感悟 / 发现
    var savedInsight = '';
    if (mmNotes.nodeEdits && mmNotes.nodeEdits[node.id]) {
      savedInsight = mmNotes.nodeEdits[node.id];
    }
    if (insightInput) insightInput.value = savedInsight;

    // 渲染历史感悟列表
    if (insightList) {
      insightList.innerHTML = '';
      var notes = mmNotes.nodeNotes ? (mmNotes.nodeNotes[node.id] || []) : [];
      if (typeof notes === 'string') notes = [notes];
      if (savedInsight) {
        notes = notes.slice();
        notes.push(savedInsight);
      }
      if (notes.length === 0) {
        insightList.innerHTML = '<div class="insight-item">暂无感悟</div>';
      } else {
        notes.forEach(function (note) {
          var div = document.createElement('div');
          div.className = 'insight-item';
          div.textContent = note;
          insightList.appendChild(div);
        });
      }
    }

    // 显示 Token 设置（如果没有）
    if (tokenSetup) {
      tokenSetup.style.display = (window.GitHubAPI && GitHubAPI.hasToken()) ? 'none' : 'block';
    }

    sidebar.classList.add('open');
  }

  function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
    editingNode = null;
  }

  function showSaveStatus(msg) {
    var el = document.getElementById('save-status');
    if (el) {
      el.textContent = msg;
      setTimeout(function () { el.textContent = ''; }, 2500);
    }
  }

  function syncMmDataFromNodes() {
    if (!mmData || !mmData.clusters) return;
    // 将 nodes 数组中的改动同步回 mmData
    mmData.clusters.forEach(function (cl) {
      cl.nodes.forEach(function (n) {
        var live = nodes.find(function (nd) { return nd.id === n.id; });
        if (live) {
          n.label = live.label;
          n.detail = live.detail;
        }
      });
    });
    // 同步 edges
    mmData.edges = edges.map(function (e) {
      return { from: e.from, to: e.to, label: e.label || '' };
    });
  }

  function saveNodeEdit() {
    if (!editingNode || !mmData) return;
    syncMmDataFromNodes();

    // 同时保存感悟为正式 note
    var insightInput = document.getElementById('edit-insight');
    if (insightInput && insightInput.value.trim()) {
      if (!mmNotes.nodeNotes) mmNotes.nodeNotes = {};
      var notes = mmNotes.nodeNotes[editingNode.id];
      if (!notes) notes = [];
      if (typeof notes === 'string') notes = [notes];
      notes.push(insightInput.value.trim());
      mmNotes.nodeNotes[editingNode.id] = notes;
      mmNotes.nodeEdits[editingNode.id] = '';
      insightInput.value = '';
    }

    // 写回 GitHub
    if (window.GitHubAPI && GitHubAPI.hasToken()) {
      showSaveStatus('正在保存...');
      Promise.resolve()
        .then(function () {
          // 先读取两个文件的最新 SHA，避免 SHA 过期
          return Promise.all([
            GitHubAPI.readFile('data/mindmap-data.json').catch(function () { return null; }),
            GitHubAPI.readFile('data/mindmap-notes.json').catch(function () { return null; })
          ]);
        })
        .then(function (results) {
          if (results[0]) { mmData = results[0].content; mmSha = results[0].sha; }
          if (results[1]) { mmNotes = results[1].content; notesSha = results[1].sha; }
        })
        .then(function () {
          // 重新同步用户编辑到 mmData（因为上面可能覆盖了）
          syncMmDataFromNodes();
          return GitHubAPI.writeFile('data/mindmap-data.json', mmData, mmSha, 'Update mindmap data');
        })
        .then(function (res) {
          if (res && res.content && res.content.sha) mmSha = res.content.sha;
          showSaveStatus('脑图数据已保存');
          return GitHubAPI.writeFile('data/mindmap-notes.json', mmNotes, notesSha, 'Update mindmap notes');
        })
        .then(function (res) {
          if (res && res.content && res.content.sha) notesSha = res.content.sha;
          showSaveStatus('脑图与笔记已保存');
          if (editingNode) openSidebar(editingNode);
        })
        .catch(function (err) {
          console.error(err);
          showSaveStatus('保存失败: ' + (err.message || err));
        });
    } else {
      showSaveStatus('已更新（无 GitHub Token，未同步）');
    }
  }

  function deleteNode() {
    if (!editingNode || !mmData) return;
    if (!confirm('确定要删除节点 "' + editingNode.label + '" 吗？')) return;

    var nodeId = editingNode.id;

    // 从 mmData.clusters 中删除
    mmData.clusters.forEach(function (cl) {
      cl.nodes = cl.nodes.filter(function (n) { return n.id !== nodeId; });
    });
    // 从 mmData.edges 中删除相关边
    mmData.edges = mmData.edges.filter(function (e) {
      return e.from !== nodeId && e.to !== nodeId;
    });

    // 从运行时数组删除
    nodes = nodes.filter(function (n) { return n.id !== nodeId; });
    edges = edges.filter(function (e) {
      return e.from !== nodeId && e.to !== nodeId;
    });
    // 清理 cluster nodes 引用
    for (var cid in clusters) {
      if (clusters.hasOwnProperty(cid)) {
        clusters[cid].nodes = clusters[cid].nodes.filter(function (n) { return n.id !== nodeId; });
      }
    }

    closeSidebar();
    selectedNode = null;
    editingNode = null;

    if (window.GitHubAPI && GitHubAPI.hasToken()) {
      GitHubAPI.writeFile('data/mindmap-data.json', mmData, mmSha, 'Delete node')
        .then(function (res) {
          if (res && res.content && res.content.sha) mmSha = res.content.sha;
        })
        .catch(function (err) {
          console.error(err);
          showSaveStatus('删除保存失败: ' + (err.message || err));
        });
    }
  }

  function addChildNode() {
    if (!editingNode || !mmData) return;
    var name = prompt('请输入子节点名称：');
    if (!name || !name.trim()) return;

    var newId = 'node_' + Date.now();
    var parentCluster = editingNode.cluster;

    var newNodeData = {
      id: newId,
      label: name.trim(),
      detail: ''
    };

    // 添加到 mmData
    var cluster = mmData.clusters.find(function (c) { return c.id === parentCluster; });
    if (cluster) {
      cluster.nodes.push(newNodeData);
    } else {
      // fallback: 添加到第一个 cluster
      mmData.clusters[0].nodes.push(newNodeData);
    }
    mmData.edges.push({ from: editingNode.id, to: newId, label: '' });

    // 添加到运行时
    var liveNode = {
      id: newId,
      label: newNodeData.label,
      detail: '',
      cluster: parentCluster || mmData.clusters[0].id,
      color: cluster ? cluster.color : mmData.clusters[0].color,
      x: editingNode.x + (Math.random() - 0.5) * 60,
      y: editingNode.y + (Math.random() - 0.5) * 60,
      targetX: editingNode.x + (Math.random() - 0.5) * 120,
      targetY: editingNode.y + (Math.random() - 0.5) * 120,
      vx: 0,
      vy: 0,
      radius: CONFIG.nodeRadius,
      pinned: false,
      highlighted: false
    };
    nodes.push(liveNode);
    if (cluster) {
      clusters[cluster.id].nodes.push(liveNode);
    } else {
      clusters[mmData.clusters[0].id].nodes.push(liveNode);
    }

    edges.push({
      from: editingNode.id,
      to: newId,
      label: '',
      sourceNode: editingNode,
      targetNode: liveNode,
      particles: [{
        t: Math.random(),
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: CONFIG.particleSpeedMin + Math.random() * (CONFIG.particleSpeedMax - CONFIG.particleSpeedMin)
      }]
    });

    if (window.GitHubAPI && GitHubAPI.hasToken()) {
      GitHubAPI.writeFile('data/mindmap-data.json', mmData, mmSha, 'Add child node')
        .then(function (res) {
          if (res && res.content && res.content.sha) mmSha = res.content.sha;
          showSaveStatus('子节点已添加');
        })
        .catch(function (err) {
          console.error(err);
          showSaveStatus('保存失败: ' + (err.message || err));
        });
    } else {
      showSaveStatus('子节点已添加（未同步到 GitHub）');
    }
  }

  function saveNodeNote() {
    if (!editingNode) return;
    var insightInput = document.getElementById('edit-insight');
    if (!insightInput || !insightInput.value.trim()) return;

    if (!mmNotes.nodeNotes) mmNotes.nodeNotes = {};
    var notes = mmNotes.nodeNotes[editingNode.id];
    if (!notes) notes = [];
    if (typeof notes === 'string') notes = [notes];
    notes.push(insightInput.value.trim());
    mmNotes.nodeNotes[editingNode.id] = notes;
    mmNotes.nodeEdits[editingNode.id] = '';
    insightInput.value = '';

    if (window.GitHubAPI && GitHubAPI.hasToken()) {
      GitHubAPI.writeFile('data/mindmap-notes.json', mmNotes, notesSha, 'Update mindmap notes')
        .then(function (res) {
          if (res && res.content && res.content.sha) notesSha = res.content.sha;
          showSaveStatus('感悟已保存');
          if (editingNode) openSidebar(editingNode);
        })
        .catch(function (err) {
          console.error(err);
          showSaveStatus('保存失败: ' + (err.message || err));
        });
    } else {
      showSaveStatus('感悟已保存（未同步到 GitHub）');
      if (editingNode) openSidebar(editingNode);
    }
  }

  /* ============================================================
     Search
     ============================================================ */
  function setupSearch() {
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', function () {
      searchQuery = input.value.trim().toLowerCase();
      nodes.forEach(function (n) { n.highlighted = false; });

      if (!searchQuery) {
        results.classList.remove('visible');
        results.innerHTML = '';
        return;
      }

      var matches = nodes.filter(function (n) {
        return n.label.toLowerCase().indexOf(searchQuery) !== -1 ||
               (n.detail && n.detail.toLowerCase().indexOf(searchQuery) !== -1);
      });

      matches.forEach(function (n) { n.highlighted = true; });

      if (matches.length > 0) {
        results.innerHTML = '';
        matches.forEach(function (n) {
          var item = document.createElement('div');
          item.className = 'result-item';
          var clusterName = clusters[n.cluster] ? clusters[n.cluster].name : '';
          item.innerHTML = '<span class="result-label">' + n.label + '</span>' +
                           '<span class="result-cluster">' + clusterName + '</span>';
          item.addEventListener('click', function () {
            // Center camera on node
            camera.x = canvas.clientWidth / 2 - n.x * camera.zoom;
            camera.y = canvas.clientHeight / 2 - n.y * camera.zoom;
            selectedNode = n;
            openSidebar(n);
            results.classList.remove('visible');
            input.value = '';
            searchQuery = '';
            nodes.forEach(function (nd) { nd.highlighted = false; });
          });
          results.appendChild(item);
        });
        results.classList.add('visible');
      } else {
        results.innerHTML = '<div class="result-item result-empty">No matching nodes</div>';
        results.classList.add('visible');
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      var searchBox = document.getElementById('search-box');
      if (searchBox && !searchBox.contains(e.target)) {
        results.classList.remove('visible');
      }
    });
  }

  /* ============================================================
     Legend
     ============================================================ */
  function buildLegend(clustersData) {
    var legend = document.getElementById('cluster-legend');
    if (!legend) return;
    legend.innerHTML = '';
    clustersData.forEach(function (cl) {
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = '<span class="legend-dot" style="background:' + cl.color + '"></span>' + cl.name;
      legend.appendChild(item);
    });
  }

  /* ============================================================
     Helpers
     ============================================================ */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

})();