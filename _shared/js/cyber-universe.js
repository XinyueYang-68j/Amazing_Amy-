/**
 * 赛博朋克城市 · 数据基建宇宙
 * ============================================================
 * 一个 Three.js 等距视角场景，展示不同数据基建成熟度的公司群。
 * 四个区域分别呈现：撒哈拉荒漠、原始部落、雅典城邦、罗马帝国。
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

    // 初始视角位置（区域3 - 城邦）
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
    },
    {
      id: 'zone2',
      name: '数据村落 · 有了池塘',
      level: 'L1 有数据池',
      x: 140,
      z: 0,
      width: 100,
      depth: 140,
    },
    {
      id: 'zone3',
      name: 'AI 城邦 · 数据流通',
      level: 'L2 数据可联通',
      x: 280,
      z: 0,
      width: 120,
      depth: 150,
    },
    {
      id: 'zone4',
      name: '赛博帝国 · 智能闭环',
      level: 'L3 数据智能',
      x: 440,
      z: 0,
      width: 120,
      depth: 150,
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
   * ============================================================ */
  function updateCameraPosition() {
    var d = 120;
    camera.position.set(currentX, d * 0.85, d * 0.55);
    camera.lookAt(currentX, 0, 0);
  }

  /* ============================================================
   * 灯光系统
   * ============================================================ */
  function createLights() {
    // 微弱全局环境光
    var ambient = new THREE.AmbientLight(0x111122, 0.3);
    scene.add(ambient);

    // 主方向光（偏金色，整体基调）
    var dirLight = new THREE.DirectionalLight(0xD4AF37, 0.2);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // 补光（深蓝）
    var fillLight = new THREE.DirectionalLight(0x1a1a2e, 0.15);
    fillLight.position.set(-100, 100, -50);
    scene.add(fillLight);

    // ---- 区域1 荒漠灯光：偏暖橙色，低强度 ----
    var desertLight = new THREE.PointLight(0xFF8C00, 0.6, 100);
    desertLight.position.set(20, 15, 0);
    scene.add(desertLight);
    // 额外暖色补光
    var desertFill = new THREE.DirectionalLight(0xFF8C00, 0.15);
    desertFill.position.set(20, 50, 30);
    scene.add(desertFill);

    // ---- 区域2 部落灯光：篝火暖光为主 ----
    var campfireLight = new THREE.PointLight(0xFF6600, 1.5, 15);
    campfireLight.position.set(140, 3, 0);
    campfireLight.userData.isCampfireLight = true;
    scene.add(campfireLight);

    // ---- 区域3 城邦灯光：明亮白金 ----
    var cityLight1 = new THREE.PointLight(0xFFF8DC, 1.0, 100);
    cityLight1.position.set(280, 30, 0);
    scene.add(cityLight1);
    var cityLight2 = new THREE.PointLight(0xD4AF37, 0.8, 60);
    cityLight2.position.set(280, 15, 20);
    scene.add(cityLight2);

    // ---- 区域4 帝国灯光：强烈红色+金色 ----
    var empireLight = new THREE.PointLight(0xFF4444, 1.2, 100);
    empireLight.position.set(440, 30, 0);
    scene.add(empireLight);
    var empireGold = new THREE.PointLight(0xD4AF37, 0.8, 80);
    empireGold.position.set(440, 20, -20);
    scene.add(empireGold);
  }

  /* ============================================================
   * 地面 — 为每个区域铺设不同材质
   * ============================================================ */
  function createGround() {
    groundGroup = new THREE.Group();

    // 基础深色地面
    var baseGeo = new THREE.PlaneGeometry(CONFIG.GROUND_LENGTH + 100, CONFIG.GROUND_WIDTH + 100);
    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      roughness: 1.0,
      metalness: 0.0,
    });
    var baseGround = new THREE.Mesh(baseGeo, baseMat);
    baseGround.rotation.x = -Math.PI / 2;
    baseGround.position.set(CONFIG.GROUND_LENGTH / 2, -0.5, 0);
    groundGroup.add(baseGround);

    // 区域1 地面 — 沙色
    var z1Geo = new THREE.PlaneGeometry(ZONES[0].width, ZONES[0].depth);
    var z1Mat = new THREE.MeshStandardMaterial({
      color: 0xC2956B,
      roughness: 0.95,
      metalness: 0.0,
    });
    var z1Ground = new THREE.Mesh(z1Geo, z1Mat);
    z1Ground.rotation.x = -Math.PI / 2;
    z1Ground.position.set(ZONES[0].x, -0.2, 0);
    z1Ground.receiveShadow = true;
    groundGroup.add(z1Ground);

    // 区域2 地面 — 深绿色
    var z2Geo = new THREE.PlaneGeometry(ZONES[1].width, ZONES[1].depth);
    var z2Mat = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.9,
      metalness: 0.0,
    });
    var z2Ground = new THREE.Mesh(z2Geo, z2Mat);
    z2Ground.rotation.x = -Math.PI / 2;
    z2Ground.position.set(ZONES[1].x, -0.2, 0);
    z2Ground.receiveShadow = true;
    groundGroup.add(z2Ground);

    // 区域3 地面 — 浅灰大理石
    var z3Geo = new THREE.PlaneGeometry(ZONES[2].width, ZONES[2].depth);
    var z3Mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.7,
      metalness: 0.1,
    });
    var z3Ground = new THREE.Mesh(z3Geo, z3Mat);
    z3Ground.rotation.x = -Math.PI / 2;
    z3Ground.position.set(ZONES[2].x, -0.2, 0);
    z3Ground.receiveShadow = true;
    groundGroup.add(z3Ground);

    // 区域4 地面 — 深色石板
    var z4Geo = new THREE.PlaneGeometry(ZONES[3].width, ZONES[3].depth);
    var z4Mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      roughness: 0.6,
      metalness: 0.2,
    });
    var z4Ground = new THREE.Mesh(z4Geo, z4Mat);
    z4Ground.rotation.x = -Math.PI / 2;
    z4Ground.position.set(ZONES[3].x, -0.2, 0);
    z4Ground.receiveShadow = true;
    groundGroup.add(z4Ground);

    scene.add(groundGroup);
  }

  /* ============================================================
   * 网格线（各区域不同风格）
   * ============================================================ */
  function createGrid() {
    // 区域3 铺装网格（白色大理石方格）
    var gridGroup3 = new THREE.Group();
    var gridMat3 = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.1,
    });
    var z3 = ZONES[2];
    var startX = z3.x - z3.width / 2;
    var startZ = -z3.depth / 2;
    for (var gx = 0; gx <= z3.width; gx += 8) {
      var geoX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX + gx, 0.01, startZ),
        new THREE.Vector3(startX + gx, 0.01, startZ + z3.depth),
      ]);
      gridGroup3.add(new THREE.Line(geoX, gridMat3));
    }
    for (var gz = 0; gz <= z3.depth; gz += 8) {
      var geoZ = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX, 0.01, startZ + gz),
        new THREE.Vector3(startX + z3.width, 0.01, startZ + gz),
      ]);
      gridGroup3.add(new THREE.Line(geoZ, gridMat3));
    }
    scene.add(gridGroup3);

    // 区域4 深色整齐网格
    var gridGroup4 = new THREE.Group();
    var gridMat4 = new THREE.LineBasicMaterial({
      color: 0x444466,
      transparent: true,
      opacity: 0.12,
    });
    var z4 = ZONES[3];
    var startX4 = z4.x - z4.width / 2;
    var startZ4 = -z4.depth / 2;
    for (var gx4 = 0; gx4 <= z4.width; gx4 += 6) {
      var geoX4 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX4 + gx4, 0.01, startZ4),
        new THREE.Vector3(startX4 + gx4, 0.01, startZ4 + z4.depth),
      ]);
      gridGroup4.add(new THREE.Line(geoX4, gridMat4));
    }
    for (var gz4 = 0; gz4 <= z4.depth; gz4 += 6) {
      var geoZ4 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX4, 0.01, startZ4 + gz4),
        new THREE.Vector3(startX4 + z4.width, 0.01, startZ4 + gz4),
      ]);
      gridGroup4.add(new THREE.Line(geoZ4, gridMat4));
    }
    scene.add(gridGroup4);
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

    // 区域2 上方额外密集星空
    var extraStars = 400;
    var ePos = new Float32Array(extraStars * 3);
    for (var j = 0; j < extraStars; j++) {
      ePos[j * 3]     = ZONES[1].x + (Math.random() - 0.5) * ZONES[1].width;
      ePos[j * 3 + 1] = Math.random() * 200 + 50;
      ePos[j * 3 + 2] = (Math.random() - 0.5) * ZONES[1].depth;
    }
    var eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    var eMat = new THREE.PointsMaterial({
      color: 0xFFFFCC,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    var extraStarSystem = new THREE.Points(eGeo, eMat);
    scene.add(extraStarSystem);
  }

  /* ============================================================
   * 区域1：撒哈拉荒漠（L0 无基建）
   * 视觉风格：沙漠地貌 + 古埃及/中东风格
   * ============================================================ */
  function buildDesertZone(zone) {
    var group = new THREE.Group();
    var z = zone;

    // — 沙丘（倾斜的 PlaneGeometry） —
    for (var d = 0; d < 5; d++) {
      var duneGeo = new THREE.PlaneGeometry(
        20 + Math.random() * 20,
        15 + Math.random() * 10
      );
      var duneMat = new THREE.MeshStandardMaterial({
        color: 0xC2956B,
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.7,
      });
      var dune = new THREE.Mesh(duneGeo, duneMat);
      dune.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.15;
      dune.rotation.z = (Math.random() - 0.5) * 0.2;
      dune.position.set(
        z.x - z.width / 2 + Math.random() * z.width,
        Math.random() * 0.5 + 0.1,
        -z.depth / 2 + Math.random() * z.depth
      );
      group.add(dune);
    }

    // — 远处大沙丘（半球形） —
    for (var bd = 0; bd < 3; bd++) {
      var bigDuneGeo = new THREE.SphereGeometry(
        15 + Math.random() * 10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2
      );
      var bigDuneMat = new THREE.MeshStandardMaterial({
        color: 0xD4A574,
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.35,
      });
      var bigDune = new THREE.Mesh(bigDuneGeo, bigDuneMat);
      var edgeSide = Math.random() > 0.5 ? 1 : -1;
      bigDune.position.set(
        z.x + edgeSide * (z.width / 2 + 5 + Math.random() * 10),
        -0.1,
        (Math.random() - 0.5) * z.depth * 0.8
      );
      group.add(bigDune);
    }

    // — 泥砖房（宽矮 BoxGeometry，密度很低） —
    var houseCount = 6;
    for (var h = 0; h < houseCount; h++) {
      var houseGroup = new THREE.Group();
      var hw = 4 + Math.random() * 3;
      var hh = 1.5 + Math.random() * 1.0;
      var hd = 3 + Math.random() * 2;
      var houseColor = Math.random() > 0.5 ? 0xA0826D : 0x8B7355;

      var houseGeo = new THREE.BoxGeometry(hw, hh, hd);
      var houseMat = new THREE.MeshStandardMaterial({
        color: houseColor,
        roughness: 0.9,
        metalness: 0.0,
      });
      var houseMesh = new THREE.Mesh(houseGeo, houseMat);
      houseMesh.position.y = hh / 2;
      houseMesh.castShadow = true;
      houseGroup.add(houseMesh);

      // 平顶（略宽的扁平面）
      var roofGeo = new THREE.BoxGeometry(hw + 0.5, 0.2, hd + 0.5);
      var roofMat = new THREE.MeshStandardMaterial({
        color: 0x9E7B5A,
        roughness: 0.95,
      });
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = hh + 0.1;
      houseGroup.add(roof);

      houseGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.66,
        0,
        -z.depth / 3 + Math.random() * z.depth * 0.66
      );
      group.add(houseGroup);
      buildingMeshes.push(houseGroup);
    }

    // — 方尖碑（细高 BoxGeometry + 金字塔顶） —
    var obeliskCount = 3;
    for (var ob = 0; ob < obeliskCount; ob++) {
      var obGroup = new THREE.Group();
      var obW = 1.2;
      var obH = 6 + Math.random() * 4;

      // 方尖碑主体
      var obGeo = new THREE.BoxGeometry(obW, obH, obW);
      var obMat = new THREE.MeshStandardMaterial({
        color: 0xA0826D,
        roughness: 0.7,
        metalness: 0.1,
      });
      var obMesh = new THREE.Mesh(obGeo, obMat);
      obMesh.position.y = obH / 2;
      obGroup.add(obMesh);

      // 金字塔顶部
      var topH = 1.5;
      var topGeo = new THREE.ConeGeometry(obW * 0.8, topH, 4);
      var topMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0xD4AF37,
        emissiveIntensity: 0.2,
      });
      var topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = obH + topH / 2;
      topMesh.rotation.y = Math.PI / 4;
      obGroup.add(topMesh);

      obGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.66,
        0,
        -z.depth / 3 + Math.random() * z.depth * 0.66
      );
      group.add(obGroup);
      buildingMeshes.push(obGroup);
    }

    // — 枯树（细柱 + 几根横枝） —
    for (var t = 0; t < 4; t++) {
      var treeGroup = new THREE.Group();
      var trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 3, 5);
      var trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4A3728,
        roughness: 0.9,
      });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      treeGroup.add(trunk);

      // 横枝
      for (var b = 0; b < 3; b++) {
        var branchGeo = new THREE.CylinderGeometry(0.06, 0.1, 1.5, 4);
        var branchMat = new THREE.MeshStandardMaterial({
          color: 0x3D2B1F,
          roughness: 0.9,
        });
        var branch = new THREE.Mesh(branchGeo, branchMat);
        branch.position.y = 2 + Math.random() * 0.8;
        branch.rotation.z = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.5);
        treeGroup.add(branch);
      }

      treeGroup.position.set(
        z.x - z.width / 2 + Math.random() * z.width,
        0,
        -z.depth / 2 + Math.random() * z.depth
      );
      group.add(treeGroup);
    }

    // — 热浪效果（地面附近半透明波纹，用多个扁平板模拟） —
    for (var wv = 0; wv < 3; wv++) {
      var waveGeo = new THREE.PlaneGeometry(12, 2);
      var waveMat = new THREE.MeshBasicMaterial({
        color: 0xFF8C00,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
      });
      var wave = new THREE.Mesh(waveGeo, waveMat);
      wave.position.set(
        z.x - 15 + Math.random() * 30,
        0.8 + Math.random() * 1.5,
        (Math.random() - 0.5) * z.depth * 0.6
      );
      wave.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      wave.userData.isHeatWave = true;
      wave.userData.wavePhase = Math.random() * Math.PI * 2;
      group.add(wave);
    }

    // — 区域地面发光标记 —
    var areaGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(z.width, z.depth),
      new THREE.MeshBasicMaterial({
        color: 0xFF8C00,
        transparent: true,
        opacity: 0.015,
      })
    );
    areaGlow.rotation.x = -Math.PI / 2;
    areaGlow.position.set(z.x, 0.05, 0);
    group.add(areaGlow);

    // — 区域标签 —
    var label = createZoneLabel(z);
    group.add(label);

    return group;
  }

  /* ============================================================
   * 区域2：原始部落（L1 有数据池）
   * 视觉风格：热带雨林 + 非洲/亚马逊部落
   * ============================================================ */
  function buildTribeZone(zone) {
    var group = new THREE.Group();
    var z = zone;

    // — 泥土色路径（中心十字路） —
    var pathMat = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 1.0,
      metalness: 0.0,
    });
    var pathX = new THREE.Mesh(
      new THREE.PlaneGeometry(z.width * 0.8, 3),
      pathMat
    );
    pathX.rotation.x = -Math.PI / 2;
    pathX.position.set(z.x, 0.01, 0);
    group.add(pathX);
    var pathZ = new THREE.Mesh(
      new THREE.PlaneGeometry(3, z.depth * 0.6),
      pathMat
    );
    pathZ.rotation.x = -Math.PI / 2;
    pathZ.position.set(z.x, 0.01, 0);
    group.add(pathZ);

    // — 树木（散布在区域边缘和空地） —
    for (var t = 0; t < 15; t++) {
      var treeGroup = new THREE.Group();
      var trunkH = 3 + Math.random() * 3;
      var trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, trunkH, 6);
      var trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3D2B1F,
        roughness: 0.9,
      });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkH / 2;
      treeGroup.add(trunk);

      // 树冠（混合球体和锥体）
      var isCone = Math.random() > 0.5;
      if (isCone) {
        var crownGeo = new THREE.ConeGeometry(2 + Math.random(), 3 + Math.random() * 2, 6);
      } else {
        var crownGeo = new THREE.SphereGeometry(2 + Math.random(), 8, 6);
      }
      var greenVar = 0x1a4a1a + Math.floor(Math.random() * 0x002000);
      var crownMat = new THREE.MeshStandardMaterial({
        color: greenVar,
        roughness: 0.85,
      });
      var crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = trunkH + 1.5;
      treeGroup.add(crown);

      // 随机放在区域边缘或空位
      var tx, tz;
      var onEdge = Math.random() > 0.4;
      if (onEdge) {
        tx = z.x + (Math.random() > 0.5 ? 1 : -1) * (z.width / 2 - 5 + Math.random() * 10);
        tz = -z.depth / 2 + Math.random() * z.depth;
      } else {
        tx = z.x - z.width / 3 + Math.random() * z.width * 0.66;
        tz = -z.depth / 3 + Math.random() * z.depth * 0.66;
      }
      treeGroup.position.set(tx, 0, tz);
      group.add(treeGroup);
    }

    // — 篝火（中心位置） —
    var campfireGroup = new THREE.Group();

    // 石圈基座
    for (var s = 0; s < 8; s++) {
      var angle = (s / 8) * Math.PI * 2;
      var stoneGeo = new THREE.SphereGeometry(0.3, 6, 4);
      var stoneMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.9,
      });
      var stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(Math.cos(angle) * 1.2, 0.2, Math.sin(angle) * 1.2);
      campfireGroup.add(stone);
    }

    // 火焰（多个锥体模拟）
    for (var f = 0; f < 3; f++) {
      var flameGeo = new THREE.ConeGeometry(0.3 + Math.random() * 0.2, 1.5 + Math.random(), 6);
      var flameMat = new THREE.MeshBasicMaterial({
        color: f === 0 ? 0xFF4500 : (f === 1 ? 0xFF6600 : 0xFFAA00),
        transparent: true,
        opacity: 0.8,
      });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(
        (Math.random() - 0.5) * 0.5,
        1.0 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      flame.userData.isFlame = true;
      flame.userData.flamePhase = Math.random() * Math.PI * 2;
      campfireGroup.add(flame);
    }

    campfireGroup.position.set(z.x, 0, 0);
    group.add(campfireGroup);

    // — 圆锥草屋（围绕中心广场排列，形成村落感） —
    var hutCount = 8;
    for (var hh = 0; hh < hutCount; hh++) {
      var hutGroup = new THREE.Group();
      var hutAngle = (hh / hutCount) * Math.PI * 2;
      var hutR = 15 + Math.random() * 10;

      var hutH = 2.5 + Math.random() * 1.0;
      var hutR2 = 2 + Math.random() * 1.0;

      // 圆锥体草屋
      var hutGeo = new THREE.ConeGeometry(hutR2, hutH, 6);
      var hutMat = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.0,
      });
      var hut = new THREE.Mesh(hutGeo, hutMat);
      hut.position.y = hutH / 2;
      hut.castShadow = true;
      hutGroup.add(hut);

      hutGroup.position.set(
        z.x + Math.cos(hutAngle) * hutR,
        0,
        Math.sin(hutAngle) * hutR
      );
      group.add(hutGroup);
      buildingMeshes.push(hutGroup);
    }

    // — 长方形棚屋（稍大，宽扁 BoxGeometry + 三角屋顶） —
    for (var sh = 0; sh < 4; sh++) {
      var shedGroup = new THREE.Group();
      var sw = 5 + Math.random() * 3;
      var sd = 3 + Math.random() * 2;
      var shh = 2 + Math.random() * 1;

      // 棚屋主体
      var shedGeo = new THREE.BoxGeometry(sw, shh, sd);
      var shedMat = new THREE.MeshStandardMaterial({
        color: 0x6B3A2A,
        roughness: 0.9,
      });
      var shed = new THREE.Mesh(shedGeo, shedMat);
      shed.position.y = shh / 2;
      shedGroup.add(shed);

      // 三角屋顶（用两个倾斜的平面）
      var roofAngle = Math.atan2(shh * 0.6, sw / 2);
      var roofW = Math.sqrt((sw / 2) * (sw / 2) + (shh * 0.6) * (shh * 0.6));
      var roofGeo = new THREE.PlaneGeometry(roofW, sd + 0.5);
      var roofMat = new THREE.MeshStandardMaterial({
        color: 0x5C3317,
        roughness: 0.85,
        side: THREE.DoubleSide,
      });

      var roofLeft = new THREE.Mesh(roofGeo, roofMat);
      roofLeft.position.set(-sw / 4, shh + shh * 0.25, 0);
      roofLeft.rotation.z = roofAngle;
      shedGroup.add(roofLeft);

      var roofRight = new THREE.Mesh(roofGeo.clone(), roofMat);
      roofRight.position.set(sw / 4, shh + shh * 0.25, 0);
      roofRight.rotation.z = -roofAngle;
      shedGroup.add(roofRight);

      shedGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.66,
        0,
        -z.depth / 3 + Math.random() * z.depth * 0.66
      );
      group.add(shedGroup);
      buildingMeshes.push(shedGroup);
    }

    // — 区域地面发光标记 —
    var areaGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(z.width, z.depth),
      new THREE.MeshBasicMaterial({
        color: 0x66BB6A,
        transparent: true,
        opacity: 0.015,
      })
    );
    areaGlow.rotation.x = -Math.PI / 2;
    areaGlow.position.set(z.x, 0.05, 0);
    group.add(areaGlow);

    // — 区域标签 —
    var label = createZoneLabel(z);
    group.add(label);

    return group;
  }

  /* ============================================================
   * 区域3：雅典城邦（L2 数据可联通）
   * 视觉风格：古希腊雅典 — 白色大理石 + 金色 + 柱式建筑
   * ============================================================ */
  function buildCityZone(zone) {
    var group = new THREE.Group();
    var z = zone;

    // — 神庙（Parthenon 式） —
    var templeCount = 3;
    for (var tp = 0; tp < templeCount; tp++) {
      var templeGroup = new THREE.Group();
      var tW = 10 + Math.random() * 6;
      var tD = 6 + Math.random() * 3;
      var tBaseH = 1.5;

      // 底座（三层阶梯）
      for (var step = 0; step < 3; step++) {
        var stepW = tW + (2 - step) * 1.5;
        var stepD = tD + (2 - step) * 1.0;
        var stepGeo = new THREE.BoxGeometry(stepW, 0.5, stepD);
        var stepMat = new THREE.MeshStandardMaterial({
          color: 0xCCCCCC,
          roughness: 0.4,
          metalness: 0.1,
        });
        var stepMesh = new THREE.Mesh(stepGeo, stepMat);
        stepMesh.position.y = step * 0.5 + 0.25;
        stepMesh.receiveShadow = true;
        templeGroup.add(stepMesh);
      }

      // 圆柱
      var colCount = 6;
      var colH = 5 + Math.random() * 2;
      var colR = 0.3;
      for (var ci = 0; ci < colCount; ci++) {
        var colX = -tW / 2 + 1 + (ci / (colCount - 1)) * (tW - 2);
        // 前排
        var colGeo = new THREE.CylinderGeometry(colR, colR * 1.1, colH, 8);
        var colMat = new THREE.MeshStandardMaterial({
          color: 0xEEEEEE,
          roughness: 0.3,
          metalness: 0.15,
        });
        var col = new THREE.Mesh(colGeo, colMat);
        col.position.set(colX, tBaseH + colH / 2, tD / 2 + 0.5);
        templeGroup.add(col);
        // 后排
        var colB = col.clone();
        colB.position.z = -tD / 2 - 0.5;
        templeGroup.add(colB);
      }

      // 横梁
      var beamGeo = new THREE.BoxGeometry(tW + 1, 0.6, tD + 2);
      var beamMat = new THREE.MeshStandardMaterial({
        color: 0xDDDDDD,
        roughness: 0.35,
        metalness: 0.1,
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = tBaseH + colH + 0.3;
      templeGroup.add(beam);

      // 三角形山花（用旋转的 BoxGeometry 近似）
      var pedH = 2;
      var pedGeo = new THREE.ConeGeometry((tW + 1) / 2, pedH, 3);
      var pedMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        roughness: 0.3,
        metalness: 0.4,
        emissive: 0xD4AF37,
        emissiveIntensity: 0.1,
      });
      var ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = tBaseH + colH + 0.6 + pedH / 2;
      ped.rotation.y = Math.PI / 2;
      ped.rotation.z = 0;
      templeGroup.add(ped);

      templeGroup.position.set(
        z.x - z.width / 3 + (tp + 0.5) * (z.width * 0.66 / templeCount),
        0,
        -z.depth / 4 + Math.random() * z.depth * 0.5
      );
      group.add(templeGroup);
      buildingMeshes.push(templeGroup);
    }

    // — 阶梯式基座（层层递减的 BoxGeometry） —
    for (var pl = 0; pl < 4; pl++) {
      var platGroup = new THREE.Group();
      var levels = 3 + Math.floor(Math.random() * 3);
      for (var lv = 0; lv < levels; lv++) {
        var lvW = 5 - lv * 0.8;
        var lvD = 4 - lv * 0.6;
        var lvH = 0.6;
        if (lvW <= 0 || lvD <= 0) continue;
        var lvGeo = new THREE.BoxGeometry(lvW, lvH, lvD);
        var lvMat = new THREE.MeshStandardMaterial({
          color: 0xBBBBBB,
          roughness: 0.4,
          metalness: 0.1,
        });
        var lvMesh = new THREE.Mesh(lvGeo, lvMat);
        lvMesh.position.y = lv * lvH + lvH / 2;
        platGroup.add(lvMesh);
      }
      platGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.66,
        0,
        z.depth / 4 + Math.random() * z.depth * 0.3
      );
      group.add(platGroup);
      buildingMeshes.push(platGroup);
    }

    // — 柱廊（连排圆柱） —
    for (var colRow = 0; colRow < 2; colRow++) {
      var corridorGroup = new THREE.Group();
      var cColCount = 8;
      var cColH = 4;
      for (var ci2 = 0; ci2 < cColCount; ci2++) {
        var cGeo = new THREE.CylinderGeometry(0.25, 0.3, cColH, 8);
        var cMat = new THREE.MeshStandardMaterial({
          color: 0xEEEEEE,
          roughness: 0.35,
          metalness: 0.12,
        });
        var c = new THREE.Mesh(cGeo, cMat);
        c.position.set(ci2 * 3, cColH / 2, 0);
        corridorGroup.add(c);
      }
      // 横梁
      var cBeamGeo = new THREE.BoxGeometry(cColCount * 3, 0.4, 1.5);
      var cBeamMat = new THREE.MeshStandardMaterial({
        color: 0xDDDDDD,
        roughness: 0.35,
      });
      var cBeam = new THREE.Mesh(cBeamGeo, cBeamMat);
      cBeam.position.set((cColCount - 1) * 1.5, cColH + 0.2, 0);
      corridorGroup.add(cBeam);

      corridorGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.3,
        0,
        -z.depth / 3 + colRow * z.depth * 0.5 + 15
      );
      group.add(corridorGroup);
    }

    // — 地面金色光圈（能力辐射隐喻） —
    for (var gc = 0; gc < 3; gc++) {
      var glowGeo = new THREE.RingGeometry(3, 4, 32);
      var glowMat = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      var glowRing = new THREE.Mesh(glowGeo, glowMat);
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.set(
        z.x - 20 + gc * 20 + Math.random() * 5,
        0.02,
        (Math.random() - 0.5) * z.depth * 0.4
      );
      group.add(glowRing);
    }

    // — 智慧神殿（替代原来的能力塔） —
    towerGroup = buildTempleOfWisdom(z.x, 0);
    group.add(towerGroup);

    // — 区域地面发光标记 —
    var areaGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(z.width, z.depth),
      new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.02,
      })
    );
    areaGlow.rotation.x = -Math.PI / 2;
    areaGlow.position.set(z.x, 0.05, 0);
    group.add(areaGlow);

    // — 区域标签 —
    var label = createZoneLabel(z);
    group.add(label);

    return group;
  }

  /* ============================================================
   * 智慧神殿（区域3 特殊建筑，替代原来的能力塔）
   * 高大神殿结构 + 金字塔屋顶 + 旋转光环
   * ============================================================ */
  function buildTempleOfWisdom(x, z) {
    var group = new THREE.Group();
    var templeH = 30;
    var baseW = 10;

    // 宽底座
    for (var st = 0; st < 3; st++) {
      var stW = baseW + (2 - st) * 2;
      var stD = baseW + (2 - st) * 2;
      var stGeo = new THREE.BoxGeometry(stW, 1.0, stD);
      var stMat = new THREE.MeshStandardMaterial({
        color: 0xCCCCBB,
        roughness: 0.3,
        metalness: 0.2,
      });
      var stMesh = new THREE.Mesh(stGeo, stMat);
      stMesh.position.y = st + 0.5;
      group.add(stMesh);
    }

    // 6根高大圆柱围合
    var colPositions = [];
    var colH = templeH - 5;
    var colArrangement = [
      { cx: -3, cz: -3 }, { cx: 3, cz: -3 },
      { cx: -3, cz: 3 },  { cx: 3, cz: 3 },
      { cx: 0, cz: -3 },  { cx: 0, cz: 3 },
    ];
    colArrangement.forEach(function (pos) {
      var cGeo = new THREE.CylinderGeometry(0.4, 0.5, colH, 8);
      var cMat = new THREE.MeshStandardMaterial({
        color: 0xEEEECC,
        roughness: 0.25,
        metalness: 0.2,
        emissive: 0xD4AF37,
        emissiveIntensity: 0.05,
      });
      var c = new THREE.Mesh(cGeo, cMat);
      c.position.set(x + pos.cx, 3 + colH / 2, z + pos.cz);
      c.castShadow = true;
      group.add(c);
      colPositions.push({ x: x + pos.cx, z: z + pos.cz, y: 3 + colH });
    });

    // 柱子间发光连线（模拟知识流动）
    var connMat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.4,
    });
    for (var ci = 0; ci < colPositions.length; ci++) {
      for (var cj = ci + 1; cj < colPositions.length; cj++) {
        var p1 = colPositions[ci];
        var p2 = colPositions[cj];
        var dist = Math.sqrt(
          (p1.x - p2.x) * (p1.x - p2.x) + (p1.z - p2.z) * (p1.z - p2.z)
        );
        if (dist < 6.5) {
          var connGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(p1.x, p1.y - 5, p1.z),
            new THREE.Vector3(p2.x, p2.y - 5, p2.z),
          ]);
          var conn = new THREE.Line(connGeo, connMat);
          conn.userData.isKnowledgeLine = true;
          group.add(conn);
        }
      }
    }

    // 横梁
    var topBeamGeo = new THREE.BoxGeometry(baseW + 1, 0.8, baseW + 1);
    var topBeamMat = new THREE.MeshStandardMaterial({
      color: 0xDDDDCC,
      roughness: 0.3,
      metalness: 0.15,
    });
    var topBeam = new THREE.Mesh(topBeamGeo, topBeamMat);
    topBeam.position.set(x, 3 + colH + 0.4, z);
    group.add(topBeam);

    // 金字塔屋顶（金色发光）
    var pyrGeo = new THREE.ConeGeometry(6, 5, 4);
    var pyrMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0xD4AF37,
      emissiveIntensity: 0.4,
    });
    var pyr = new THREE.Mesh(pyrGeo, pyrMat);
    pyr.position.set(x, 3 + colH + 0.8 + 2.5, z);
    pyr.rotation.y = Math.PI / 4;
    group.add(pyr);

    // 旋转光环（保留在神殿顶部）
    var ringGeo = new THREE.TorusGeometry(7, 0.2, 8, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.7,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 3 + colH + 0.8 + 5 + 2, z);
    ring.rotation.x = Math.PI / 2;
    ring.userData.isRing = true;
    group.add(ring);

    // 第二个光环（倾斜）
    var ring2Geo = new THREE.TorusGeometry(6, 0.15, 8, 32);
    var ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.5,
    });
    var ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.position.set(x, 3 + colH + 0.8 + 5 + 5, z);
    ring2.rotation.x = Math.PI / 3;
    ring2.userData.isRing2 = true;
    group.add(ring2);

    // 顶部点光
    var topLight = new THREE.PointLight(0xFFD700, 2, 40);
    topLight.position.set(x, 3 + colH + 0.8 + 5 + 3, z);
    group.add(topLight);

    return group;
  }

  /* ============================================================
   * 区域4：罗马帝国（L3 数据智能）
   * 视觉风格：古罗马 — 红色/金色 + 拱形 + 宏大建筑
   * ============================================================ */
  function buildEmpireZone(zone) {
    var group = new THREE.Group();
    var z = zone;
    var colRed = 0x8B0000;
    var colGold = 0xD4AF37;
    var colGray = 0x333344;

    // — 斗兽场/圆形竞技场（TorusGeometry 主体） —
    var arenaGroup = new THREE.Group();
    var arenaOuterR = 12;
    var arenaTube = 3;

    // 外墙环
    var arenaGeo = new THREE.TorusGeometry(arenaOuterR, arenaTube, 8, 24);
    var arenaMat = new THREE.MeshStandardMaterial({
      color: colRed,
      roughness: 0.5,
      metalness: 0.2,
      emissive: colRed,
      emissiveIntensity: 0.05,
    });
    var arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = arenaTube;
    arena.rotation.x = Math.PI / 2;
    arenaGroup.add(arena);

    // 内环（竞技场地面）
    var arenaFloorGeo = new THREE.RingGeometry(arenaOuterR - arenaTube - 1, arenaOuterR - 1, 24);
    var arenaFloorMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.1,
    });
    var arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.y = 0.1;
    arenaGroup.add(arenaFloor);

    // 拱形窗户（在环上叠加小半圆）
    for (var aw = 0; aw < 16; aw++) {
      var awAngle = (aw / 16) * Math.PI * 2;
      var archGeo = new THREE.TorusGeometry(1.2, 0.2, 4, 8, Math.PI);
      var archMat = new THREE.MeshStandardMaterial({
        color: colGold,
        roughness: 0.4,
        metalness: 0.3,
        emissive: colGold,
        emissiveIntensity: 0.15,
      });
      var arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(
        Math.cos(awAngle) * arenaOuterR,
        arenaTube * 2 + 0.5,
        Math.sin(awAngle) * arenaOuterR
      );
      arch.lookAt(0, arenaTube * 2 + 0.5, 0);
      arenaGroup.add(arch);
    }

    arenaGroup.position.set(z.x - 15, 0, z.depth / 4);
    group.add(arenaGroup);
    buildingMeshes.push(arenaGroup);

    // — 凯旋门 —
    for (var tr = 0; tr < 3; tr++) {
      var archGroup = new THREE.Group();
      var trH = 10 + Math.random() * 4;
      var trW = 6;

      // 左柱
      var pillarGeo = new THREE.BoxGeometry(1.5, trH, 1.5);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: colGray,
        roughness: 0.5,
        metalness: 0.2,
      });
      var leftP = new THREE.Mesh(pillarGeo, pillarMat);
      leftP.position.set(-trW / 2, trH / 2, 0);
      archGroup.add(leftP);

      // 右柱
      var rightP = new THREE.Mesh(pillarGeo.clone(), pillarMat);
      rightP.position.set(trW / 2, trH / 2, 0);
      archGroup.add(rightP);

      // 横梁
      var beamGeo = new THREE.BoxGeometry(trW + 2, 1.2, 2);
      var beamMat = new THREE.MeshStandardMaterial({
        color: colGold,
        roughness: 0.4,
        metalness: 0.3,
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, trH + 0.6, 0);
      archGroup.add(beam);

      // 三角顶饰
      var topTriGeo = new THREE.ConeGeometry((trW + 1) / 2, 2.5, 3);
      var topTriMat = new THREE.MeshStandardMaterial({
        color: colGold,
        roughness: 0.3,
        metalness: 0.4,
        emissive: colGold,
        emissiveIntensity: 0.2,
      });
      var topTri = new THREE.Mesh(topTriGeo, topTriMat);
      topTri.position.set(0, trH + 1.2 + 1.25, 0);
      topTri.rotation.y = Math.PI / 2;
      archGroup.add(topTri);

      // 拱形（门洞上方）
      var doorArchGeo = new THREE.TorusGeometry(trW / 2 - 0.75, 0.25, 6, 12, Math.PI);
      var doorArchMat = new THREE.MeshStandardMaterial({
        color: colRed,
        roughness: 0.4,
        metalness: 0.2,
      });
      var doorArch = new THREE.Mesh(doorArchGeo, doorArchMat);
      doorArch.position.set(0, 4, 0.76);
      archGroup.add(doorArch);

      archGroup.position.set(
        z.x - z.width / 3 + tr * 25 + 10,
        0,
        -z.depth / 4 + Math.random() * z.depth * 0.5
      );
      group.add(archGroup);
      buildingMeshes.push(archGroup);
    }

    // — 高大矩形建筑（有拱形窗户） —
    for (var rb = 0; rb < 5; rb++) {
      var rbGroup = new THREE.Group();
      var rbW = 4 + Math.random() * 4;
      var rbH = 8 + Math.random() * 12;
      var rbD = 4 + Math.random() * 3;

      // 主体
      var rbGeo = new THREE.BoxGeometry(rbW, rbH, rbD);
      var rbColor = [colRed, colGray, 0x444466][Math.floor(Math.random() * 3)];
      var rbMat = new THREE.MeshStandardMaterial({
        color: rbColor,
        roughness: 0.5,
        metalness: 0.25,
        emissive: rbColor === colRed ? colRed : 0x000000,
        emissiveIntensity: 0.05,
      });
      var rbMesh = new THREE.Mesh(rbGeo, rbMat);
      rbMesh.position.y = rbH / 2;
      rbMesh.castShadow = true;
      rbGroup.add(rbMesh);

      // 拱形窗户
      var winRows = Math.floor(rbH / 3);
      var winCols = Math.floor(rbW / 2);
      for (var wr = 0; wr < winRows; wr++) {
        for (var wc = 0; wc < winCols; wc++) {
          if (Math.random() > 0.7) continue;
          var winArchGeo = new THREE.TorusGeometry(0.5, 0.08, 4, 8, Math.PI);
          var winArchMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? colGold : 0xFF4444,
            transparent: true,
            opacity: 0.6,
          });
          var winArch = new THREE.Mesh(winArchGeo, winArchMat);
          var winX = -rbW / 2 + 1 + wc * 2;
          var winY = 2 + wr * 3;
          winArch.position.set(winX, winY, rbD / 2 + 0.02);
          rbGroup.add(winArch);

          // 窗户发光面
          var winGlowGeo = new THREE.PlaneGeometry(0.9, 1.0);
          var winGlowMat = new THREE.MeshBasicMaterial({
            color: 0xFFAA44,
            transparent: true,
            opacity: 0.3,
          });
          var winGlow = new THREE.Mesh(winGlowGeo, winGlowMat);
          winGlow.position.set(winX, winY - 0.2, rbD / 2 + 0.03);
          rbGroup.add(winGlow);
        }
      }

      // 霓虹顶部发光
      var neonGeo = new THREE.BoxGeometry(rbW + 0.3, 0.2, rbD + 0.3);
      var neonColor = Math.random() > 0.5 ? colGold : 0xFF4444;
      var neonMat = new THREE.MeshBasicMaterial({
        color: neonColor,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.5,
      });
      var neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.y = rbH + 0.1;
      rbGroup.add(neon);

      rbGroup.position.set(
        z.x - z.width / 3 + Math.random() * z.width * 0.66,
        0,
        -z.depth / 3 + Math.random() * z.depth * 0.66
      );
      group.add(rbGroup);
      buildingMeshes.push(rbGroup);
    }

    // — 皇帝雕像基座（高台 + 小人形） —
    for (var st = 0; st < 3; st++) {
      var statueGroup = new THREE.Group();
      // 高台
      var platGeo = new THREE.BoxGeometry(3, 3, 3);
      var platMat = new THREE.MeshStandardMaterial({
        color: 0x444455,
        roughness: 0.5,
        metalness: 0.2,
      });
      var plat = new THREE.Mesh(platGeo, platMat);
      plat.position.y = 1.5;
      statueGroup.add(plat);

      // 小人形（简化：圆柱身 + 球头）
      var bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: colGold,
        metalness: 0.6,
        roughness: 0.3,
      });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 4;
      statueGroup.add(body);

      var headGeo = new THREE.SphereGeometry(0.4, 8, 6);
      var head = new THREE.Mesh(headGeo, bodyMat);
      head.position.y = 5.3;
      statueGroup.add(head);

      statueGroup.position.set(
        z.x + (st - 1) * 20,
        0,
        -z.depth / 3 + Math.random() * z.depth * 0.3
      );
      group.add(statueGroup);
    }

    // — 水道桥/渡槽（连续拱形结构，从远处延伸） —
    var aqueductGroup = new THREE.Group();
    var aqueductLen = z.width * 0.8;
    var archCount = 6;
    var archSpan = aqueductLen / archCount;
    var aqueductH = 12;

    for (var aq = 0; aq < archCount; aq++) {
      var aqX = -aqueductLen / 2 + aq * archSpan + archSpan / 2;
      // 拱柱
      var aqPillarGeo = new THREE.BoxGeometry(1, aqueductH, 1.5);
      var aqPillarMat = new THREE.MeshStandardMaterial({
        color: colGray,
        roughness: 0.6,
        metalness: 0.15,
      });
      var aqLeftP = new THREE.Mesh(aqPillarGeo, aqPillarMat);
      aqLeftP.position.set(aqX - archSpan / 2 + 0.5, aqueductH / 2, 0);
      aqueductGroup.add(aqLeftP);
      var aqRightP = new THREE.Mesh(aqPillarGeo.clone(), aqPillarMat);
      aqRightP.position.set(aqX + archSpan / 2 - 0.5, aqueductH / 2, 0);
      aqueductGroup.add(aqRightP);

      // 拱形
      var aqArchGeo = new THREE.TorusGeometry(archSpan / 2 - 0.5, 0.3, 6, 12, Math.PI);
      var aqArchMat = new THREE.MeshStandardMaterial({
        color: colRed,
        roughness: 0.5,
        metalness: 0.2,
      });
      var aqArch = new THREE.Mesh(aqArchGeo, aqArchMat);
      aqArch.position.set(aqX, aqueductH, 0);
      aqueductGroup.add(aqArch);
    }

    // 水道顶部槽
    var troughGeo = new THREE.BoxGeometry(aqueductLen, 1, 2);
    var troughMat = new THREE.MeshStandardMaterial({
      color: colGray,
      roughness: 0.5,
    });
    var trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, aqueductH + 0.5, 0);
    aqueductGroup.add(trough);

    aqueductGroup.position.set(z.x, 0, -z.depth / 2 - 5);
    group.add(aqueductGroup);

    // — 霓虹发光线条（赛博感） —
    for (var nl = 0; nl < 8; nl++) {
      var neonLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(
          z.x - z.width / 3 + Math.random() * z.width * 0.66,
          2 + Math.random() * 10,
          -z.depth / 3 + Math.random() * z.depth * 0.66
        ),
        new THREE.Vector3(
          z.x - z.width / 3 + Math.random() * z.width * 0.66,
          2 + Math.random() * 10,
          -z.depth / 3 + Math.random() * z.depth * 0.66
        ),
      ]);
      var neonLineMat = new THREE.LineBasicMaterial({
        color: Math.random() > 0.5 ? colGold : 0xFF2222,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.5,
      });
      var neonLine = new THREE.Line(neonLineGeo, neonLineMat);
      neonLine.userData.isNeonLine = true;
      neonLine.userData.neonPhase = Math.random() * Math.PI * 2;
      group.add(neonLine);
    }

    // — 区域地面发光标记 —
    var areaGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(z.width, z.depth),
      new THREE.MeshBasicMaterial({
        color: 0xFF4444,
        transparent: true,
        opacity: 0.02,
      })
    );
    areaGlow.rotation.x = -Math.PI / 2;
    areaGlow.position.set(z.x, 0.05, 0);
    group.add(areaGlow);

    // — 区域标签 —
    var label = createZoneLabel(z);
    group.add(label);

    return group;
  }

  /* ============================================================
   * 通用建筑函数（保留作为基础，供简单场景使用）
   * ============================================================ */
  function createBuilding(x, z, w, d, h, baseColor, emissiveColor, zoneDensity) {
    var group = new THREE.Group();

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

    group.position.set(x, 0, z);
    return group;
  }

  /* ============================================================
   * 创建所有区域
   * ============================================================ */
  function createZones() {
    // 区域1：撒哈拉荒漠
    var zone1Group = buildDesertZone(ZONES[0]);
    scene.add(zone1Group);

    // 区域2：原始部落
    var zone2Group = buildTribeZone(ZONES[1]);
    scene.add(zone2Group);

    // 区域3：雅典城邦
    var zone3Group = buildCityZone(ZONES[2]);
    scene.add(zone3Group);

    // 区域4：罗马帝国
    var zone4Group = buildEmpireZone(ZONES[3]);
    scene.add(zone4Group);
  }

  /* ============================================================
   * 创建区域标签 Sprite
   * ============================================================ */
  function createZoneLabel(zone) {
    var labelCanvas = createLabelCanvas(zone.name);
    var labelTexture = new THREE.CanvasTexture(labelCanvas);
    var labelMat = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      opacity: 0.9,
    });
    var label = new THREE.Sprite(labelMat);
    label.scale.set(30, 6, 1);
    // 根据区域设置不同高度
    var labelY = 12;
    if (zone.id === 'zone3') labelY = 40;
    if (zone.id === 'zone4') labelY = 20;
    label.position.set(zone.x, labelY, zone.depth / 2 + 10);
    return label;
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
   * 区域间道路（不同风格）
   * ============================================================ */
  function createRoads() {
    // 荒漠→村落：沙土小路（窄，土色）
    var road1Len = (ZONES[1].x - ZONES[1].width / 2) - (ZONES[0].x + ZONES[0].width / 2);
    var road1Geo = new THREE.PlaneGeometry(road1Len, 2.5);
    var road1Mat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 1.0,
      metalness: 0.0,
    });
    var road1 = new THREE.Mesh(road1Geo, road1Mat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.set(
      (ZONES[0].x + ZONES[0].width / 2 + ZONES[1].x - ZONES[1].width / 2) / 2,
      0.05,
      0
    );
    scene.add(road1);

    // 村落→城邦：石板路（中等宽度，灰色）
    var road2Len = (ZONES[2].x - ZONES[2].width / 2) - (ZONES[1].x + ZONES[1].width / 2);
    var road2Geo = new THREE.PlaneGeometry(road2Len, 4);
    var road2Mat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.1,
    });
    var road2 = new THREE.Mesh(road2Geo, road2Mat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(
      (ZONES[1].x + ZONES[1].width / 2 + ZONES[2].x - ZONES[2].width / 2) / 2,
      0.08,
      0
    );
    scene.add(road2);

    // 石板路中心线
    var road2LineGeo = new THREE.PlaneGeometry(road2Len, 0.2);
    var road2LineMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    var road2Line = new THREE.Mesh(road2LineGeo, road2LineMat);
    road2Line.rotation.x = -Math.PI / 2;
    road2Line.position.set(
      (ZONES[1].x + ZONES[1].width / 2 + ZONES[2].x - ZONES[2].width / 2) / 2,
      0.12,
      0
    );
    scene.add(road2Line);

    // 城邦→帝国：罗马大道（宽，石板+金色中线）
    var road3Len = (ZONES[3].x - ZONES[3].width / 2) - (ZONES[2].x + ZONES[2].width / 2);
    var road3Geo = new THREE.PlaneGeometry(road3Len, 6);
    var road3Mat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.15,
    });
    var road3 = new THREE.Mesh(road3Geo, road3Mat);
    road3.rotation.x = -Math.PI / 2;
    road3.position.set(
      (ZONES[2].x + ZONES[2].width / 2 + ZONES[3].x - ZONES[3].width / 2) / 2,
      0.1,
      0
    );
    scene.add(road3);

    // 金色中线
    var road3LineGeo = new THREE.PlaneGeometry(road3Len, 0.4);
    var road3LineMat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.5,
    });
    var road3Line = new THREE.Mesh(road3LineGeo, road3LineMat);
    road3Line.rotation.x = -Math.PI / 2;
    road3Line.position.set(
      (ZONES[2].x + ZONES[2].width / 2 + ZONES[3].x - ZONES[3].width / 2) / 2,
      0.15,
      0
    );
    scene.add(road3Line);

    // 道路边缘发光线
    var road3EdgeMat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.2,
    });
    var road3EdgeGeo = new THREE.PlaneGeometry(road3Len, 0.15);
    [-2.8, 2.8].forEach(function (offset) {
      var edge = new THREE.Mesh(road3EdgeGeo.clone(), road3EdgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(
        (ZONES[2].x + ZONES[2].width / 2 + ZONES[3].x - ZONES[3].width / 2) / 2,
        0.15,
        offset
      );
      scene.add(edge);
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

    // 能力塔（智慧神殿）光环旋转
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

    // 篝火灯光闪烁
    scene.traverse(function (obj) {
      // 篝火灯光
      if (obj.userData && obj.userData.isCampfireLight) {
        obj.intensity = 1.5 + Math.sin(elapsed * 5) * 0.3 + Math.sin(elapsed * 8) * 0.15;
      }
      // 热浪动画
      if (obj.userData && obj.userData.isHeatWave) {
        obj.position.y = 0.8 + Math.sin(elapsed * 0.8 + obj.userData.wavePhase) * 0.5;
        obj.material.opacity = 0.02 + Math.sin(elapsed * 1.2 + obj.userData.wavePhase) * 0.02;
      }
      // 火焰动画
      if (obj.userData && obj.userData.isFlame) {
        obj.scale.y = 0.8 + Math.sin(elapsed * 6 + obj.userData.flamePhase) * 0.3;
        obj.scale.x = 0.9 + Math.sin(elapsed * 4 + obj.userData.flamePhase) * 0.15;
      }
      // 知识连线脉冲
      if (obj.userData && obj.userData.isKnowledgeLine) {
        obj.material.opacity = 0.3 + Math.sin(elapsed * 2 + obj.id) * 0.15;
      }
      // 霓虹线脉冲
      if (obj.userData && obj.userData.isNeonLine) {
        obj.material.opacity = 0.3 + Math.sin(elapsed * 3 + obj.userData.neonPhase) * 0.5;
      }
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
