/**
 * 赛博朋克城市 · 数据基建宇宙
 * ============================================================
 * 一个 Three.js 等距视角赛博朋克城市场景，
 * 展示不同数据基建成熟度的公司群。
 *
 * 使用方式：在 HTML 中引入 Three.js r128 CDN，再引入本文件即可。
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
 *   <script src="cyber-universe.js"></script>
 *
 * 配色主题：
 *   - 背景 #000000
 *   - 金色主色 #D4AF37
 *   - 深蓝辅助 #1a1a2e
 * ============================================================
 */
;(function () {
  'use strict';

  /* ============================================================
   * 全局配置
   * ============================================================ */
  var CONFIG = {
    // 配色
    COLOR_GOLD:      0xD4AF37,
    COLOR_DARK_BLUE: 0x1a1a2e,
    COLOR_BG:        0x000000,
    COLOR_FOG:       0x050510,

    // NPC 颜色
    NPC_COLORS: {
      gold:   0xFFD700, // AI算法科学家
      blue:   0x4FC3F7, // 开发工程师
      green:  0x66BB6A, // 产品经理
      red:    0xEF5350, // 业务决策者
      purple: 0xAB47BC, // AI销售
      white:  0xFFFFFF, // 数据工程师
    },

    // 场景尺寸
    GROUND_LENGTH:    600,   // 地面总长度（X 轴）
    GROUND_WIDTH:     200,   // 地面宽度（Z 轴）
    ZONE_GAP:         40,    // 区域间距

    // 相机
    CAMERA_FOV:       45,
    CAMERA_NEAR:      1,
    CAMERA_FAR:       800,

    // 滚动
    SCROLL_SPEED:     0.3,
    DRAG_SPEED:       0.5,
    MIN_X:            -100,
    MAX_X:            500,

    // 初始视角位置（区域3 - AI城邦）
    INIT_X:           220,

    // 星星数量
    STAR_COUNT:       1500,

    // NPC 动画速度
    NPC_SPEED:        0.02,
  };

  /* ============================================================
   * 区域定义
   * 从左到右四个区域
   * ============================================================ */
  var ZONES = [
    {
      id: 'zone1',
      name: '初创荒漠 · 数据散落',
      level: 'L0 无基建',
      x: 20,
      z: 0,
      width: 80,
      depth: 120,
      buildingCount: 18,
      minH: 1,
      maxH: 3,
      color: 0x333344,
      emissive: 0x111122,
      density: 0.3,
    },
    {
      id: 'zone2',
      name: '数据村落 · 有了池塘',
      level: 'L1 有数据池',
      x: 140,
      z: 0,
      width: 100,
      depth: 140,
      buildingCount: 35,
      minH: 3,
      maxH: 6,
      color: 0x3a3a55,
      emissive: 0x1a1a33,
      density: 0.5,
    },
    {
      id: 'zone3',
      name: 'AI 城邦 · 数据流通',
      level: 'L2 数据可联通',
      x: 280,
      z: 0,
      width: 120,
      depth: 150,
      buildingCount: 55,
      minH: 6,
      maxH: 15,
      color: 0x444466,
      emissive: 0x222244,
      density: 0.7,
      hasTower: true,
    },
    {
      id: 'zone4',
      name: '赛博帝国 · 智能闭环',
      level: 'L3 数据智能',
      x: 440,
      z: 0,
      width: 120,
      depth: 150,
      buildingCount: 70,
      minH: 15,
      maxH: 30,
      color: 0x555577,
      emissive: 0x333355,
      density: 0.9,
    },
  ];

  /* ============================================================
   * NPC 角色定义
   * ============================================================ */
  var NPC_DATA = [
    {
      name: 'Amy Su',
      title: 'AI算法科学家',
      color: 'gold',
      zone: 'zone3',
      x: 285, z: 0,
      patrol: [{ x: 280, z: -10 }, { x: 295, z: 5 }, { x: 285, z: 10 }],
      card: {
        title: 'AI 算法科学家 · 能力产品化者',
        desc: '站在算法与产品的交叉点。判断AI能力的边界，验证效果，把能力适配给不同数据成熟度的客户。',
        skills: '预测建模 | 场景定义 | 数据诊断 | 能力封装',
        location: '百胜城邦 · 能力塔',
      },
    },
    {
      name: '百胜算法团队',
      title: '开发工程师',
      color: 'blue',
      zone: 'zone3',
      x: 290, z: 15,
      patrol: [{ x: 285, z: 10 }, { x: 300, z: 20 }, { x: 290, z: 15 }],
      card: {
        title: '开发工程师 · 能力持久化者',
        desc: '将算法模型转化为可复用的能力组件，搭建数据管道，确保AI能力稳定运行。',
        skills: '模型部署 | 数据管道 | API封装 | 性能优化',
        location: '百胜城邦 · 技术区',
      },
    },
    {
      name: '九阳业务负责人',
      title: '业务决策者',
      color: 'red',
      zone: 'zone2',
      x: 155, z: -5,
      patrol: [{ x: 148, z: -10 }, { x: 165, z: 0 }, { x: 155, z: 5 }],
      card: {
        title: '业务决策者 · 采购者',
        desc: '审视业务痛点，判断AI能力的ROI，推动组织采纳数据驱动决策。',
        skills: '预算规划 | 供应商评估 | 效果追踪 | 组织变革',
        location: '数据村落 · 九阳片区',
      },
    },
    {
      name: '字节AI架构师',
      title: '开发工程师',
      color: 'blue',
      zone: 'zone4',
      x: 455, z: 5,
      patrol: [{ x: 448, z: 0 }, { x: 465, z: 10 }, { x: 455, z: 5 }],
      card: {
        title: '开发工程师 · AI架构专家',
        desc: '设计大规模AI系统架构，支撑亿级用户的智能推荐和内容理解。',
        skills: '分布式系统 | 模型训练 | 推荐引擎 | 基础设施',
        location: '赛博帝国 · 字节片区',
      },
    },
    {
      name: '阿里AI产品经理',
      title: '产品经理',
      color: 'green',
      zone: 'zone4',
      x: 470, z: -10,
      patrol: [{ x: 462, z: -15 }, { x: 478, z: -5 }, { x: 470, z: -10 }],
      card: {
        title: '产品经理 · 翻译者',
        desc: '将商业需求翻译为AI产品方案，在技术可能性与商业价值之间搭建桥梁。',
        skills: '需求分析 | 产品设计 | 用户研究 | 数据洞察',
        location: '赛博帝国 · 阿里片区',
      },
    },
    {
      name: '能力贩卖者',
      title: 'AI销售',
      color: 'purple',
      zone: 'between',
      x: 220, z: 0,
      patrol: [{ x: 195, z: 0 }, { x: 250, z: 0 }, { x: 220, z: 10 }, { x: 195, z: 0 }],
      card: {
        title: 'AI销售 · 能力贩卖者',
        desc: '穿梭于城邦与村落之间，将AI能力包装成可理解的方案，卖给不同成熟度的客户。',
        skills: '方案包装 | 客户洞察 | 商务谈判 | 价值传递',
        location: '城邦与村落之间',
      },
    },
    {
      name: '数据工程师',
      title: '数据工程师',
      color: 'white',
      zone: 'edges',
      x: 100, z: 30,
      patrol: [{ x: 80, z: 25 }, { x: 120, z: 35 }, { x: 100, z: 30 }],
      card: {
        title: '数据工程师 · 地基建设者',
        desc: '在各区域边缘默默搭建数据基础设施，打通数据孤岛，铺设数据管道。',
        skills: 'ETL流程 | 数据仓库 | 数据治理 | 流处理',
        location: '各区域边缘',
      },
    },
  ];

  /* ============================================================
   * 运行时变量
   * ============================================================ */
  var scene, camera, renderer;
  var raycaster, mouse;
  var clock;
  var isDragging = false;
  var dragStartX = 0;
  var currentX = 0;    // 当前相机 X 位置
  var targetX = 0;     // 目标相机 X 位置
  var buildingMeshes = [];
  var npcObjects = [];
  var npcSprites = [];
  var towerGroup = null;
  var starSystem = null;
  var infoCard = null;
  var miniMap = null;
  var groundGroup = null;

  /* ============================================================
   * 初始化入口
   * ============================================================ */
  function init() {
    // 场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.COLOR_BG);
    scene.fog = new THREE.FogExp2(CONFIG.COLOR_FOG, 0.004);

    // 相机（等距视角）
    camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA_NEAR,
      CONFIG.CAMERA_FAR
    );
    currentX = CONFIG.INIT_X;
    targetX = CONFIG.INIT_X;
    updateCameraPosition();

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    document.body.appendChild(renderer.domElement);

    // 射线检测
    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.5;
    mouse = new THREE.Vector2();

    // 时钟
    clock = new THREE.Clock();

    // 创建场景内容
    createLights();
    createGround();
    createGrid();
    createStars();
    createZones();
    createRoads();
    createNPCs();
    createUI();
    createMiniMap();

    // 事件监听
    bindEvents();

    // 启动动画循环
    animate();
    console.log('[赛博朋克城市] 数据基建宇宙场景已初始化');
  }

  /* ============================================================
   * 等距相机定位
   * 从侧上方 45 度俯视
   * ============================================================ */
  function updateCameraPosition() {
    var d = 120; // 距离
    camera.position.set(currentX, d * 0.85, d * 0.55);
    camera.lookAt(currentX, 0, 0);
  }

  /* ============================================================
   * 灯光系统
   * ============================================================ */
  function createLights() {
    // 环境光
    var ambient = new THREE.AmbientLight(0x111122, 0.4);
    scene.add(ambient);

    // 主方向光（偏金色）
    var dirLight = new THREE.DirectionalLight(0xD4AF37, 0.3);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // 补光（深蓝）
    var fillLight = new THREE.DirectionalLight(0x1a1a2e, 0.2);
    fillLight.position.set(-100, 100, -50);
    scene.add(fillLight);

    // 点光源 - 区域3能力塔位置
    var towerLight = new THREE.PointLight(0xD4AF37, 1.5, 80);
    towerLight.position.set(285, 20, 0);
    scene.add(towerLight);

    // 点光源 - 区域4
    var empireLight = new THREE.PointLight(0x4FC3F7, 0.8, 60);
    empireLight.position.set(450, 25, 0);
    scene.add(empireLight);
  }

  /* ============================================================
   * 地面
   * ============================================================ */
  function createGround() {
    groundGroup = new THREE.Group();

    // 主地面
    var groundGeo = new THREE.PlaneGeometry(CONFIG.GROUND_LENGTH, CONFIG.GROUND_WIDTH);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a18,
      roughness: 0.9,
      metalness: 0.1,
    });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(CONFIG.GROUND_LENGTH / 2, -0.1, 0);
    groundGroup.add(ground);

    scene.add(groundGroup);
  }

  /* ============================================================
   * 网格线（暗金色地面网格）
   * ============================================================ */
  function createGrid() {
    var gridGroup = new THREE.Group();
    var gridMat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.08,
    });

    // X 方向线条
    for (var x = 0; x <= CONFIG.GROUND_LENGTH; x += 10) {
      var geoX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.01, -CONFIG.GROUND_WIDTH / 2),
        new THREE.Vector3(x, 0.01, CONFIG.GROUND_WIDTH / 2),
      ]);
      var lineX = new THREE.Line(geoX, gridMat);
      gridGroup.add(lineX);
    }

    // Z 方向线条
    for (var z = -CONFIG.GROUND_WIDTH / 2; z <= CONFIG.GROUND_WIDTH / 2; z += 10) {
      var geoZ = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.01, z),
        new THREE.Vector3(CONFIG.GROUND_LENGTH, 0.01, z),
      ]);
      var lineZ = new THREE.Line(geoZ, gridMat);
      gridGroup.add(lineZ);
    }

    scene.add(gridGroup);
  }

  /* ============================================================
   * 星星粒子系统
   * ============================================================ */
  function createStars() {
    var count = CONFIG.STAR_COUNT;
    var positions = new Float32Array(count * 3);
    var sizes = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.3) * 800 + 200;
      positions[i * 3 + 1] = Math.random() * 300 + 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    var mat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.6,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    starSystem = new THREE.Points(geo, mat);
    scene.add(starSystem);
  }

  /* ============================================================
   * 生成单个建筑
   * ============================================================ */
  function createBuilding(x, z, w, d, h, baseColor, emissiveColor, zoneDensity) {
    var group = new THREE.Group();

    // 建筑主体
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.4,
      emissive: emissiveColor,
      emissiveIntensity: 0.15,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // 发光窗户
    var windowRows = Math.floor(h / 2);
    var windowCols = Math.floor(w / 1.5);
    var windowMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.3 ? CONFIG.COLOR_GOLD : CONFIG.COLOR_DARK_BLUE,
      transparent: true,
      opacity: 0.6 + Math.random() * 0.4,
    });

    for (var row = 0; row < windowRows; row++) {
      for (var col = 0; col < windowCols; col++) {
        // 概率决定窗户是否亮
        if (Math.random() > zoneDensity * 0.8) continue;

        var winGeo = new THREE.PlaneGeometry(0.4, 0.3);
        var win = new THREE.Mesh(winGeo, windowMat);

        // 放在前面的面上
        var wx = -w / 2 + (col + 0.5) * (w / windowCols);
        var wy = 1 + row * 2;
        win.position.set(wx, wy, d / 2 + 0.01);
        group.add(win);

        // 背面也加一些
        if (Math.random() > 0.5) {
          var winBack = win.clone();
          winBack.position.z = -d / 2 - 0.01;
          winBack.rotation.y = Math.PI;
          group.add(winBack);
        }
      }
    }

    // 高级区域加霓虹顶部发光
    if (zoneDensity > 0.6) {
      var neonGeo = new THREE.BoxGeometry(w + 0.2, 0.15, d + 0.2);
      var neonColor = Math.random() > 0.5 ? CONFIG.COLOR_GOLD : 0x4FC3F7;
      var neonMat = new THREE.MeshBasicMaterial({
        color: neonColor,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.5,
      });
      var neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.y = h + 0.075;
      group.add(neon);
    }

    group.position.set(x, 0, z);
    return group;
  }

  /* ============================================================
   * 创建所有区域和建筑
   * ============================================================ */
  function createZones() {
    ZONES.forEach(function (zone) {
      var zoneGroup = new THREE.Group();

      // 为这个区域生成建筑
      for (var i = 0; i < zone.buildingCount; i++) {
        var bw = 2 + Math.random() * 5;
        var bd = 2 + Math.random() * 5;
        var bh = zone.minH + Math.random() * (zone.maxH - zone.minH);

        // 随机分布在区域内
        var bx = zone.x - zone.width / 2 + Math.random() * zone.width;
        var bz = -zone.depth / 2 + Math.random() * zone.depth;

        // 轻微颜色变化
        var colorVar = new THREE.Color(zone.color);
        colorVar.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
        var emissiveVar = new THREE.Color(zone.emissive);
        emissiveVar.offsetHSL(0, 0, (Math.random() - 0.5) * 0.02);

        var building = createBuilding(bx, bz, bw, bd, bh, colorVar.getHex(), emissiveVar.getHex(), zone.density);
        zoneGroup.add(building);
        buildingMeshes.push(building);
      }

      // 区域标签（使用 Sprite）
      var labelCanvas = createLabelCanvas(zone.name);
      var labelTexture = new THREE.CanvasTexture(labelCanvas);
      var labelMat = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0.9,
      });
      var label = new THREE.Sprite(labelMat);
      label.scale.set(30, 6, 1);
      label.position.set(zone.x, zone.maxH + 5, zone.depth / 2 + 10);
      zoneGroup.add(label);

      // 能力塔（仅区域3）
      if (zone.hasTower) {
        towerGroup = createTower(zone.x, 0);
        zoneGroup.add(towerGroup);
      }

      // 地面区域发光标记
      var areaGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(zone.width, zone.depth),
        new THREE.MeshBasicMaterial({
          color: CONFIG.COLOR_GOLD,
          transparent: true,
          opacity: 0.02,
        })
      );
      areaGlow.rotation.x = -Math.PI / 2;
      areaGlow.position.set(zone.x, 0.05, 0);
      zoneGroup.add(areaGlow);

      scene.add(zoneGroup);
    });
  }

  /* ============================================================
   * 创建区域标签 Canvas
   * ============================================================ */
  function createLabelCanvas(text) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    var ctx = canvas.getContext('2d');

    // roundRect 兼容性处理
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        this.beginPath();
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        this.closePath();
      };
    }

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(10, 10, 492, 76, 10);
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.roundRect(10, 10, 492, 76, 10);
    ctx.stroke();

    // 文字
    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 48);

    return canvas;
  }

  /* ============================================================
   * 能力塔
   * ============================================================ */
  function createTower(x, z) {
    var group = new THREE.Group();
    var towerH = 35;

    // 塔主体
    var towerGeo = new THREE.BoxGeometry(4, towerH, 4);
    var towerMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xD4AF37,
      emissiveIntensity: 0.4,
    });
    var towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(x, towerH / 2, z);
    towerMesh.castShadow = true;
    group.add(towerMesh);

    // 旋转光环
    var ringGeo = new THREE.TorusGeometry(6, 0.2, 8, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.7,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, towerH + 2, z);
    ring.rotation.x = Math.PI / 2;
    ring.userData.isRing = true;
    group.add(ring);

    // 第二个光环（倾斜）
    var ring2Geo = new THREE.TorusGeometry(5, 0.15, 8, 32);
    var ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.5,
    });
    var ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.position.set(x, towerH + 5, z);
    ring2.rotation.x = Math.PI / 3;
    ring2.userData.isRing2 = true;
    group.add(ring2);

    // 塔身发光窗户
    var windowMat2 = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.8,
    });
    for (var wy = 2; wy < towerH - 2; wy += 3) {
      var wGeo = new THREE.PlaneGeometry(0.8, 1.2);
      var wMesh = new THREE.Mesh(wGeo, windowMat2);
      wMesh.position.set(x, wy, z + 2.01);
      group.add(wMesh);

      var wMesh2 = new THREE.Mesh(wGeo, windowMat2);
      wMesh2.position.set(x, wy, z - 2.01);
      wMesh2.rotation.y = Math.PI;
      group.add(wMesh2);
    }

    // 顶部点光
    var topLight = new THREE.PointLight(0xFFD700, 2, 40);
    topLight.position.set(x, towerH + 3, z);
    group.add(topLight);

    return group;
  }

  /* ============================================================
   * 区域间发光道路
   * ============================================================ */
  function createRoads() {
    var roadMat = new THREE.MeshBasicMaterial({
      color: CONFIG.COLOR_GOLD,
      transparent: true,
      opacity: 0.15,
    });

    // 区域间道路连接
    var roadPairs = [
      { x1: ZONES[0].x + ZONES[0].width / 2, x2: ZONES[1].x - ZONES[1].width / 2 },
      { x1: ZONES[1].x + ZONES[1].width / 2, x2: ZONES[2].x - ZONES[2].width / 2 },
      { x1: ZONES[2].x + ZONES[2].width / 2, x2: ZONES[3].x - ZONES[3].width / 2 },
    ];

    roadPairs.forEach(function (pair) {
      var length = pair.x2 - pair.x1;
      var roadGeo = new THREE.PlaneGeometry(length, 4);
      var road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set((pair.x1 + pair.x2) / 2, 0.15, 0);
      scene.add(road);

      // 道路中心发光线
      var lineGeo = new THREE.PlaneGeometry(length, 0.3);
      var lineMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.4,
      });
      var line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set((pair.x1 + pair.x2) / 2, 0.2, 0);
      scene.add(line);
    });
  }

  /* ============================================================
   * NPC 光点创建
   * ============================================================ */
  function createNPCs() {
    NPC_DATA.forEach(function (npc) {
      // 光点球体
      var sphereGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var colorVal = CONFIG.NPC_COLORS[npc.color];
      var sphereMat = new THREE.MeshBasicMaterial({
        color: colorVal,
        transparent: true,
        opacity: 0.9,
      });
      var sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(npc.x, 2, npc.z);

      // 发光外圈
      var glowGeo = new THREE.SphereGeometry(1.0, 8, 8);
      var glowMat = new THREE.MeshBasicMaterial({
        color: colorVal,
        transparent: true,
        opacity: 0.3,
      });
      var glow = new THREE.Mesh(glowGeo, glowMat);
      sphere.add(glow);

      // 底部光柱
      var pillarGeo = new THREE.CylinderGeometry(0.05, 0.3, 2, 6);
      var pillarMat = new THREE.MeshBasicMaterial({
        color: colorVal,
        transparent: true,
        opacity: 0.2,
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = -1;
      sphere.add(pillar);

      // 存储NPC数据到 mesh
      sphere.userData = {
        type: 'npc',
        npcData: npc,
        patrolIndex: 0,
        patrolDir: 1,
      };

      // 名字标签
      var nameSprite = createNameSprite(npc.name, npc.color);
      nameSprite.position.set(0, 2.5, 0);
      sphere.add(nameSprite);

      scene.add(sphere);
      npcObjects.push(sphere);
    });
  }

  /* ============================================================
   * 创建NPC名字标签 Sprite
   * ============================================================ */
  function createNameSprite(name, colorKey) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');

    // 颜色映射
    var colorMap = {
      gold: '#FFD700',
      blue: '#4FC3F7',
      green: '#66BB6A',
      red: '#EF5350',
      purple: '#AB47BC',
      white: '#FFFFFF',
    };
    var c = colorMap[colorKey] || '#FFFFFF';

    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = c;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 文字描边
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, 128, 32);
    ctx.fillText(name, 128, 32);

    var texture = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(12, 3, 1);
    return sprite;
  }

  /* ============================================================
   * NPC 移动动画
   * ============================================================ */
  function animateNPCs(delta) {
    npcObjects.forEach(function (npc) {
      var data = npc.userData;
      if (!data.npcData || !data.npcData.patrol) return;

      var patrol = data.npcData.patrol;
      if (patrol.length < 2) return;

      var target = patrol[data.patrolIndex];
      var dx = target.x - npc.position.x;
      var dz = target.z - npc.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5) {
        // 到达巡逻点，切换下一个
        data.patrolIndex += data.patrolDir;
        if (data.patrolIndex >= patrol.length || data.patrolIndex < 0) {
          data.patrolDir *= -1;
          data.patrolIndex += data.patrolDir * 2;
          if (data.patrolIndex < 0) data.patrolIndex = 0;
          if (data.patrolIndex >= patrol.length) data.patrolIndex = patrol.length - 1;
        }
      } else {
        // 移动向目标
        npc.position.x += dx * CONFIG.NPC_SPEED;
        npc.position.z += dz * CONFIG.NPC_SPEED;

        // 面向移动方向
        npc.rotation.y = Math.atan2(dx, dz);
      }

      // 上下浮动
      npc.position.y = 2 + Math.sin(Date.now() * 0.003 + npc.position.x) * 0.3;
    });
  }

  /* ============================================================
   * 创建 HTML UI（信息卡片等）
   * ============================================================ */
  function createUI() {
    // 信息卡片容器
    infoCard = document.createElement('div');
    infoCard.id = 'cyber-info-card';
    infoCard.style.cssText = [
      'position: fixed',
      'top: 50%',
      'left: 50%',
      'transform: translate(-50%, -50%) scale(0)',
      'width: 360px',
      'padding: 30px',
      'background: rgba(10, 10, 30, 0.75)',
      'backdrop-filter: blur(20px)',
      '-webkit-backdrop-filter: blur(20px)',
      'border: 1px solid rgba(212, 175, 55, 0.3)',
      'border-radius: 16px',
      'color: #e0e0e0',
      'font-family: "Microsoft YaHei", "PingFang SC", sans-serif',
      'z-index: 1000',
      'transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      'opacity: 0',
      'pointer-events: none',
      'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
    ].join(';');
    document.body.appendChild(infoCard);

    // 点击空白关闭卡片
    infoCard.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    renderer.domElement.addEventListener('click', function () {
      hideInfoCard();
    });

    // 左上角场景标题
    var title = document.createElement('div');
    title.id = 'cyber-title';
    title.style.cssText = [
      'position: fixed',
      'top: 20px',
      'left: 20px',
      'color: #D4AF37',
      'font-family: "Microsoft YaHei", sans-serif',
      'font-size: 18px',
      'font-weight: bold',
      'letter-spacing: 2px',
      'z-index: 100',
      'text-shadow: 0 0 10px rgba(212, 175, 55, 0.5)',
      'pointer-events: none',
    ].join(';');
    title.textContent = '数据基建宇宙 · 赛博朋克城市';
    document.body.appendChild(title);

    // 左下角操作提示
    var hint = document.createElement('div');
    hint.id = 'cyber-hint';
    hint.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'left: 20px',
      'color: rgba(212, 175, 55, 0.5)',
      'font-family: "Microsoft YaHei", sans-serif',
      'font-size: 12px',
      'z-index: 100',
      'pointer-events: none',
    ].join(';');
    hint.textContent = '鼠标滚轮 / 拖拽平移 | 点击光点查看角色信息';
    document.body.appendChild(hint);
  }

  /* ============================================================
   * 显示信息卡片
   * ============================================================ */
  function showInfoCard(cardData, npcColor) {
    var colorMap = {
      gold: '#FFD700',
      blue: '#4FC3F7',
      green: '#66BB6A',
      red: '#EF5350',
      purple: '#AB47BC',
      white: '#FFFFFF',
    };
    var accent = colorMap[npcColor] || '#D4AF37';

    infoCard.innerHTML = [
      '<div style="margin-bottom: 16px;">',
      '  <div style="font-size: 20px; font-weight: bold; color: ' + accent + '; margin-bottom: 4px; text-shadow: 0 0 10px ' + accent + ';">' + cardData.title + '</div>',
      '</div>',
      '<div style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; color: #cccccc;">' + cardData.desc + '</div>',
      '<div style="margin-bottom: 12px;">',
      '  <div style="font-size: 11px; color: rgba(212,175,55,0.6); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">核心技能</div>',
      '  <div style="font-size: 13px; color: #D4AF37;">' + cardData.skills + '</div>',
      '</div>',
      '<div style="padding-top: 12px; border-top: 1px solid rgba(212,175,55,0.15);">',
      '  <span style="font-size: 11px; color: rgba(255,255,255,0.4);">所在：' + cardData.location + '</span>',
      '</div>',
      '<div style="margin-top: 16px; text-align: right;">',
      '  <span style="font-size: 11px; color: rgba(255,255,255,0.25); cursor: pointer;">点击空白处关闭</span>',
      '</div>',
    ].join('');

    infoCard.style.opacity = '1';
    infoCard.style.transform = 'translate(-50%, -50%) scale(1)';
    infoCard.style.pointerEvents = 'auto';
  }

  /* ============================================================
   * 隐藏信息卡片
   * ============================================================ */
  function hideInfoCard() {
    if (infoCard) {
      infoCard.style.opacity = '0';
      infoCard.style.transform = 'translate(-50%, -50%) scale(0)';
      infoCard.style.pointerEvents = 'none';
    }
  }

  /* ============================================================
   * 小地图 / 进度条
   * ============================================================ */
  function createMiniMap() {
    miniMap = document.createElement('div');
    miniMap.id = 'cyber-minimap';
    miniMap.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'right: 20px',
      'width: 200px',
      'height: 40px',
      'background: rgba(10, 10, 30, 0.7)',
      'backdrop-filter: blur(10px)',
      '-webkit-backdrop-filter: blur(10px)',
      'border: 1px solid rgba(212, 175, 55, 0.2)',
      'border-radius: 8px',
      'z-index: 100',
      'overflow: hidden',
      'font-family: "Microsoft YaHei", sans-serif',
    ].join(';');

    // 进度条
    var bar = document.createElement('div');
    bar.style.cssText = [
      'position: absolute',
      'bottom: 0',
      'left: 0',
      'height: 3px',
      'background: #D4AF37',
      'border-radius: 0 0 8px 8px',
      'transition: width 0.3s ease',
      'box-shadow: 0 0 8px rgba(212,175,55,0.5)',
    ].join(';');
    bar.id = 'cyber-minimap-bar';
    miniMap.appendChild(bar);

    // 区域标签
    var labels = document.createElement('div');
    labels.style.cssText = [
      'display: flex',
      'justify-content: space-around',
      'align-items: center',
      'height: 100%',
      'padding: 0 8px',
    ].join(';');

    var zoneNames = ['荒漠', '村落', '城邦', '帝国'];
    zoneNames.forEach(function (name, i) {
      var span = document.createElement('span');
      span.style.cssText = [
        'font-size: 10px',
        'color: rgba(212,175,55,0.5)',
        'transition: color 0.3s ease',
      ].join(';');
      span.textContent = name;
      span.dataset.zone = i;
      labels.appendChild(span);
    });

    miniMap.appendChild(labels);
    document.body.appendChild(miniMap);
  }

  /* ============================================================
   * 更新小地图
   * ============================================================ */
  function updateMiniMap() {
    if (!miniMap) return;
    var bar = document.getElementById('cyber-minimap-bar');
    if (!bar) return;

    // 计算进度百分比
    var progress = (currentX - CONFIG.MIN_X) / (CONFIG.MAX_X - CONFIG.MIN_X);
    progress = Math.max(0, Math.min(1, progress));
    bar.style.width = (progress * 100) + '%';

    // 高亮当前区域
    var spans = miniMap.querySelectorAll('span[data-zone]');
    spans.forEach(function (span) {
      var idx = parseInt(span.dataset.zone);
      var zoneCenter = ZONES[idx].x;
      var dist = Math.abs(currentX - zoneCenter);
      if (dist < 50) {
        span.style.color = '#D4AF37';
      } else {
        span.style.color = 'rgba(212,175,55,0.5)';
      }
    });
  }

  /* ============================================================
   * 事件绑定
   * ============================================================ */
  function bindEvents() {
    var domElement = renderer.domElement;

    // 鼠标滚轮平移
    domElement.addEventListener('wheel', function (e) {
      e.preventDefault();
      targetX += e.deltaY * CONFIG.SCROLL_SPEED;
      targetX = Math.max(CONFIG.MIN_X, Math.min(CONFIG.MAX_X, targetX));
    }, { passive: false });

    // 拖拽平移
    domElement.addEventListener('mousedown', function (e) {
      isDragging = true;
      dragStartX = e.clientX;
      domElement.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = (e.clientX - dragStartX) * CONFIG.DRAG_SPEED;
      targetX -= dx;
      targetX = Math.max(CONFIG.MIN_X, Math.min(CONFIG.MAX_X, targetX));
      dragStartX = e.clientX;
    });

    window.addEventListener('mouseup', function () {
      isDragging = false;
      domElement.style.cursor = 'grab';
    });

    domElement.style.cursor = 'grab';

    // NPC 点击检测（排除拖拽操作）
    var clickStartX = 0;
    var clickStartY = 0;
    domElement.addEventListener('mousedown', function (e) {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
    }, { passive: true });

    domElement.addEventListener('click', function (e) {
      // 如果鼠标移动距离过大，视为拖拽而非点击
      var dist = Math.abs(e.clientX - clickStartX) + Math.abs(e.clientY - clickStartY);
      if (dist > 5) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(npcObjects, true);

      if (intersects.length > 0) {
        // 找到NPC
        var hit = intersects[0].object;
        // 向上查找到有 npcData 的对象
        while (hit && (!hit.userData || !hit.userData.npcData)) {
          hit = hit.parent;
        }
        if (hit && hit.userData && hit.userData.npcData) {
          var npcData = hit.userData.npcData;
          if (npcData.card) {
            showInfoCard(npcData.card, npcData.color);
          }
        }
      }
    });

    // 触摸支持
    var touchStartX = 0;
    domElement.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    domElement.addEventListener('touchmove', function (e) {
      var dx = (e.touches[0].clientX - touchStartX) * CONFIG.DRAG_SPEED;
      targetX -= dx;
      targetX = Math.max(CONFIG.MIN_X, Math.min(CONFIG.MAX_X, targetX));
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    // 窗口大小调整
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ============================================================
   * 动画循环
   * ============================================================ */
  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    // 相机平滑移动
    currentX += (targetX - currentX) * 0.05;
    updateCameraPosition();

    // NPC 移动
    animateNPCs(delta);

    // 能力塔光环旋转
    if (towerGroup) {
      towerGroup.children.forEach(function (child) {
        if (child.userData && child.userData.isRing) {
          child.rotation.z = elapsed * 0.5;
        }
        if (child.userData && child.userData.isRing2) {
          child.rotation.z = -elapsed * 0.7;
          child.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.3) * 0.2;
        }
      });
    }

    // 星星闪烁
    if (starSystem) {
      starSystem.rotation.y = elapsed * 0.01;
      starSystem.material.opacity = 0.5 + Math.sin(elapsed * 0.5) * 0.2;
    }

    // NPC 光点脉冲
    npcObjects.forEach(function (npc, i) {
      var scale = 1 + Math.sin(elapsed * 3 + i) * 0.15;
      npc.scale.set(scale, scale, scale);
    });

    // 更新小地图
    updateMiniMap();

    // 渲染
    renderer.render(scene, camera);
  }

  /* ============================================================
   * 启动
   * ============================================================ */
  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
