/* ============================================================
   mindmap.js — Canvas 力导向脑图引擎（零依赖）
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Configuration ---------- */
  var CONFIG = {
    repulsion: 8000,        // 节点间斥力系数
    attraction: 0.008,      // 连线引力系数
    damping: 0.88,          // 速度衰减
    centerGravity: 0.02,    // 中心引力
    nodeRadius: 24,          // 节点半径
    clusterRadius: 30,      // cluster 标签节点半径
    fontSize: 13,            // 节点文字大小
    clusterFontSize: 14,     // cluster 标签文字大小
    edgeLabelFontSize: 11,   // 连线标签文字大小
    maxSpeed: 12,            // 速度上限
    padding: 80,            // 初始散布半径
    animationFrames: 90,     // 初始动画帧数
    zoomMin: 0.2,
    zoomMax: 4,
    highlightGlow: 18       // 搜索高亮光晕半径
  };

  /* ---------- State ---------- */
  var canvas, ctx;
  var nodes = [];        // { id, label, detail, cluster, x, y, vx, vy, radius, color, highlighted }
  var edges = [];        // { from, to, label, sourceNode, targetNode }
  var clusters = {};     // { id: { name, color, nodes: [] } }
  var clusterMeta = [];  // [{ id, name, color, cx, cy }] -- cluster center for label rendering

  // Camera / interaction
  var camera = { x: 0, y: 0, zoom: 1 };
  var dragNode = null;
  var isPanning = false;
  var panStart = { x: 0, y: 0 };
  var hoveredNode = null;
  var selectedNode = null;

  // Animation
  var animProgress = 0;  // 0→1 for initial expand animation
  var animating = true;

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    setupCanvas();
    setupSidebar();
    setupSearch();
    loadData();
  });

  function setupCanvas() {
    var container = document.getElementById('mindmap-container');
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);

    // Touch events
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
  }

  function resizeCanvas() {
    var container = document.getElementById('mindmap-container');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Data Loading ---------- */
  function loadData() {
    fetch('./data/mindmap-data.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        buildGraph(data);
        buildLegend(data.clusters);
        // Center camera
        camera.x = canvas.clientWidth / 2;
        camera.y = canvas.clientHeight / 2;
        // Start simulation
        requestAnimationFrame(simulate);
      })
      .catch(function (err) {
        console.error('Failed to load mindmap data:', err);
      });
  }

  function buildGraph(data) {
    // Build cluster map
    data.clusters.forEach(function (cl) {
      clusters[cl.id] = { name: cl.name, color: cl.color, nodes: [] };
    });

    // Create nodes — start at center for animation
    var centerX = 0;
    var centerY = 0;
    data.clusters.forEach(function (cl) {
      var angle = (Math.PI * 2 * data.clusters.indexOf(cl)) / data.clusters.length;
      var spread = CONFIG.padding * 1.5;
      cl.nodes.forEach(function (n, i) {
        var node = {
          id: n.id,
          label: n.label,
          detail: n.detail,
          cluster: cl.id,
          color: cl.color,
          x: centerX,
          y: centerY,
          targetX: centerX + Math.cos(angle) * spread + (Math.random() - 0.5) * 100,
          targetY: centerY + Math.sin(angle) * spread + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0,
          radius: CONFIG.nodeRadius,
          highlighted: false
        };
        nodes.push(node);
        clusters[cl.id].nodes.push(node);
      });
    });

    // Create edges
    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });
    data.edges.forEach(function (e) {
      var edge = {
        from: e.from,
        to: e.to,
        label: e.label || '',
        sourceNode: nodeMap[e.from] || null,
        targetNode: nodeMap[e.to] || null
      };
      if (edge.sourceNode && edge.targetNode) {
        edges.push(edge);
      }
    });

    // Compute cluster centers
    clusterMeta = data.clusters.map(function (cl) {
      var clNodes = clusters[cl.id].nodes;
      var cx = 0, cy = 0;
      clNodes.forEach(function (n) { cx += n.x; cy += n.y; });
      cx /= clNodes.length || 1;
      cy /= clNodes.length || 1;
      return { id: cl.id, name: cl.name, color: cl.color, cx: cx, cy: cy };
    });
  }

  /* ---------- Force Simulation ---------- */
  function simulate() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    // Initial expand animation
    if (animating) {
      animProgress += 1 / CONFIG.animationFrames;
      if (animProgress >= 1) {
        animProgress = 1;
        animating = false;
      }
      var t = easeOutCubic(animProgress);
      nodes.forEach(function (n) {
        n.x = n.x + (n.targetX - n.x) * t * 0.08;
        n.y = n.y + (n.targetY - n.y) * t * 0.08;
      });
    } else {
      // Apply forces
      applyForces(width, height);
    }

    // Update cluster centers
    updateClusterCenters();

    // Render
    render(width, height);

    requestAnimationFrame(simulate);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function applyForces(width, height) {
    var i, j, dx, dy, dist, force, nodeA, nodeB;

    // Repulsion between all nodes
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        nodeA = nodes[i];
        nodeB = nodes[j];
        dx = nodeA.x - nodeB.x;
        dy = nodeA.y - nodeB.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 1;
        force = CONFIG.repulsion / (dist * dist);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    }

    // Attraction along edges
    for (i = 0; i < edges.length; i++) {
      var edge = edges[i];
      nodeA = edge.sourceNode;
      nodeB = edge.targetNode;
      dx = nodeB.x - nodeA.x;
      dy = nodeB.y - nodeA.y;
      dist = Math.sqrt(dx * dx + dy * dy) || 1;
      force = dist * CONFIG.attraction;
      var ax = (dx / dist) * force;
      var ay = (dy / dist) * force;
      nodeA.vx += ax;
      nodeA.vy += ay;
      nodeB.vx -= ax;
      nodeB.vy -= ay;
    }

    // Center gravity
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.vx -= n.x * CONFIG.centerGravity;
      n.vy -= n.y * CONFIG.centerGravity;
    }

    // Update positions & damping
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n === dragNode) continue;
      n.vx *= CONFIG.damping;
      n.vy *= CONFIG.damping;
      // Clamp speed
      var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > CONFIG.maxSpeed) {
        n.vx = (n.vx / speed) * CONFIG.maxSpeed;
        n.vy = (n.vy / speed) * CONFIG.maxSpeed;
      }
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  function updateClusterCenters() {
    clusterMeta.forEach(function (cm) {
      var clNodes = clusters[cm.id].nodes;
      if (clNodes.length === 0) return;
      var cx = 0, cy = 0;
      clNodes.forEach(function (n) { cx += n.x; cy += n.y; });
      cm.cx = cx / clNodes.length;
      cm.cy = cy / clNodes.length;
    });
  }

  /* ---------- Rendering ---------- */
  function render(width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Apply camera transform
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw edges
    drawEdges();

    // Draw cluster labels
    drawClusterLabels();

    // Draw nodes
    drawNodes();

    ctx.restore();
  }

  function drawEdges() {
    edges.forEach(function (edge) {
      var sx = edge.sourceNode.x;
      var sy = edge.sourceNode.y;
      var tx = edge.targetNode.x;
      var ty = edge.targetNode.y;

      // Edge line
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5 / camera.zoom;
      ctx.stroke();

      // Edge label at midpoint
      if (edge.label) {
        var mx = (sx + tx) / 2;
        var my = (sy + ty) / 2;
        ctx.save();
        ctx.font = CONFIG.edgeLabelFontSize + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Background pill for label
        var textW = ctx.measureText(edge.label).width + 10;
        ctx.fillStyle = 'rgba(15, 17, 23, 0.8)';
        ctx.beginPath();
        var pillH = 18 / camera.zoom;
        var pillR = 4 / camera.zoom;
        roundRect(ctx, mx - textW / 2, my - pillH / 2, textW, pillH, pillR);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(edge.label, mx, my);
        ctx.restore();
      }
    });
  }

  function drawClusterLabels() {
    clusterMeta.forEach(function (cm) {
      ctx.save();
      ctx.font = '600 ' + CONFIG.clusterFontSize + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Compute bounding box of cluster nodes
      var clNodes = clusters[cm.id].nodes;
      if (clNodes.length < 2) return;

      // Find topmost node
      var topY = Infinity;
      clNodes.forEach(function (n) { if (n.y < topY) topY = n.y; });

      var labelY = topY - CONFIG.clusterRadius - 10;
      var labelX = cm.cx;

      // Background
      var textW = ctx.measureText(cm.name).width + 20;
      ctx.fillStyle = hexToRgba(cm.color, 0.15);
      ctx.beginPath();
      roundRect(ctx, labelX - textW / 2, labelY - 12, textW, 24, 6);
      ctx.fill();

      // Border
      ctx.strokeStyle = hexToRgba(cm.color, 0.4);
      ctx.lineWidth = 1 / camera.zoom;
      ctx.beginPath();
      roundRect(ctx, labelX - textW / 2, labelY - 12, textW, 24, 6);
      ctx.stroke();

      // Text
      ctx.fillStyle = cm.color;
      ctx.fillText(cm.name, labelX, labelY);
      ctx.restore();
    });
  }

  function drawNodes() {
    nodes.forEach(function (node) {
      var r = node.radius / camera.zoom;
      r = Math.max(r, 2); // minimum visible size

      // Highlight glow
      if (node.highlighted) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + CONFIG.highlightGlow / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(node.color, 0.25);
        ctx.fill();
        ctx.restore();
      }

      // Hover / selected ring
      if (node === hoveredNode || node === selectedNode) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4 / camera.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(node.color, 0.6);
        ctx.lineWidth = 2 / camera.zoom;
        ctx.stroke();
        ctx.restore();
      }

      // Node circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, 0.18);
      ctx.fill();
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2 / camera.zoom;
      ctx.stroke();
      ctx.restore();

      // Node label
      ctx.save();
      ctx.font = '500 ' + CONFIG.fontSize + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#F9FAFB';
      ctx.fillText(node.label, node.x, node.y + r + 4 / camera.zoom);
      ctx.restore();
    });
  }

  /* ---------- Interaction: Mouse ---------- */
  function screenToWorld(sx, sy) {
    return {
      x: (sx - camera.x) / camera.zoom,
      y: (sy - camera.y) / camera.zoom
    };
  }

  function getNodeAt(wx, wy) {
    // Check in reverse order (top nodes first)
    for (var i = nodes.length - 1; i >= 0; i--) {
      var n = nodes[i];
      var dx = wx - n.x;
      var dy = wy - n.y;
      var r = n.radius / camera.zoom + 6; // small tolerance
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
      dragNode.vx = 0;
      dragNode.vy = 0;
      canvas.style.cursor = 'grabbing';
    } else {
      isPanning = true;
      panStart.x = sx - camera.x;
      panStart.y = sy - camera.y;
      canvas.style.cursor = 'grabbing';
    }
  }

  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;

    if (dragNode) {
      var w = screenToWorld(sx, sy);
      dragNode.x = w.x;
      dragNode.y = w.y;
      dragNode.vx = 0;
      dragNode.vy = 0;
    } else if (isPanning) {
      camera.x = sx - panStart.x;
      camera.y = sy - panStart.y;
    } else {
      // Hover detection
      var w = screenToWorld(sx, sy);
      var node = getNodeAt(w.x, w.y);
      hoveredNode = node;
      canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  }

  function onMouseUp(e) {
    if (dragNode) {
      // If barely moved, treat as click
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
      dragNode = null;
    }
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'grab';
    }
  }

  function onDblClick(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var w = screenToWorld(sx, sy);
    var node = getNodeAt(w.x, w.y);
    if (node) {
      openSidebar(node);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;

    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newZoom = camera.zoom * delta;
    newZoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, newZoom));

    // Zoom towards cursor
    var wx = (sx - camera.x) / camera.zoom;
    var wy = (sy - camera.y) / camera.zoom;
    camera.zoom = newZoom;
    camera.x = sx - wx * camera.zoom;
    camera.y = sy - wy * camera.zoom;
  }

  /* ---------- Touch Support ---------- */
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
        dragNode.vx = 0;
        dragNode.vy = 0;
      } else {
        isPanning = true;
        panStart.x = sx - camera.x;
        panStart.y = sy - camera.y;
      }
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
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
        dragNode.x = w.x;
        dragNode.y = w.y;
      } else if (isPanning) {
        camera.x = sx - panStart.x;
        camera.y = sy - panStart.y;
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
    dragNode = null;
    isPanning = false;
    if (e.touches.length < 2) {
      lastTouchDist = 0;
      lastTouchCenter = null;
    }
  }

  /* ---------- Sidebar ---------- */
  function setupSidebar() {
    var closeBtn = document.getElementById('sidebar-close');
    closeBtn.addEventListener('click', closeSidebar);
  }

  function openSidebar(node) {
    selectedNode = node;
    var sidebar = document.getElementById('sidebar');
    document.getElementById('sidebar-title').textContent = node.label;
    document.getElementById('sidebar-detail').textContent = node.detail || '';
    sidebar.classList.add('open');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    selectedNode = null;
  }

  /* ---------- Search ---------- */
  function setupSearch() {
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      // Clear highlights
      nodes.forEach(function (n) { n.highlighted = false; });

      if (!query) {
        results.classList.remove('visible');
        results.innerHTML = '';
        return;
      }

      var matches = nodes.filter(function (n) {
        return n.label.toLowerCase().indexOf(query) !== -1 ||
               (n.detail && n.detail.toLowerCase().indexOf(query) !== -1);
      });

      matches.forEach(function (n) { n.highlighted = true; });

      if (matches.length > 0) {
        results.innerHTML = '';
        matches.forEach(function (n) {
          var item = document.createElement('div');
          item.className = 'result-item';
          var clusterName = clusters[n.cluster] ? clusters[n.cluster].name : '';
          item.innerHTML = n.label + '<span class="result-cluster">' + clusterName + '</span>';
          item.addEventListener('click', function () {
            // Pan camera to center on node
            camera.x = canvas.clientWidth / 2 - n.x * camera.zoom;
            camera.y = canvas.clientHeight / 2 - n.y * camera.zoom;
            openSidebar(n);
            results.classList.remove('visible');
            input.value = '';
            nodes.forEach(function (nd) { nd.highlighted = false; });
          });
          results.appendChild(item);
        });
        results.classList.add('visible');
      } else {
        results.innerHTML = '<div class="result-item" style="color:#6B7280;">未找到匹配节点</div>';
        results.classList.add('visible');
      }
    });

    // Close results on outside click
    document.addEventListener('click', function (e) {
      if (!document.getElementById('search-box').contains(e.target)) {
        results.classList.remove('visible');
      }
    });
  }

  /* ---------- Legend ---------- */
  function buildLegend(clustersData) {
    var legend = document.getElementById('cluster-legend');
    clustersData.forEach(function (cl) {
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = '<span class="legend-dot" style="background:' + cl.color + '"></span>' + cl.name;
      legend.appendChild(item);
    });
  }

  /* ---------- Helpers ---------- */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
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

})();
