/* ==========================================================
   Tinttex Hero — Three.js 3D 卡片场景
   ----------------------------------------------------------
   状态化驱动（与 main.js 各自监听 scroll）：
     p = scrollY / (hero.offsetHeight - viewportH)   ∈ [0, 1]

     卡片 stage 是“状态”而非滚动线性映射（Schmitt trigger + 时间补间）：
       p >= STAGE_ENTER(0.15)  → 进入 stage，stageProgress 以时间驱动正向播放到 1（动画自动播完）
       p <= STAGE_EXIT(0.05)   → 退出 stage，stageProgress 反向播放回 0
       两者之间（滞后带）      → 保持当前状态，避免临界抖动
     6 张卡片在 stageProgress [0,1] 内错峰浮出（stagger 0.10，每张 0.50）
     就位后持续微妙漂浮 + 鼠标近距离磁吸倾斜

   有机排布原则：
     - 大小变化（1.4 ~ 2.8 单位宽）建立视觉层级
     - 深度变化（z ∈ [-1.0, 0.7]）制造透视层次
     - 微妙旋转（各轴 < 12°）避免机械对齐感
     - 非对称平衡 + 充分散开：焦点卡偏左，右侧两张垂直呼应，底部横卡锚定构图
   ========================================================== */

import * as THREE from "https://esm.sh/three@0.160.0";

const canvas = document.getElementById("heroCanvas");
const hero = document.querySelector(".hero");
const heroPin = document.querySelector(".hero-pin");

if (!canvas || !hero || !heroPin) {
  // 元素缺失（比如 reduced-motion 降级移除了 canvas），静默退出
} else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // 尊重减少动态偏好：不初始化 3D 场景，CSS 已把 canvas display:none
} else {
  initHeroScene();
}

function initHeroScene() {
  /* -------- Renderer / Scene / Camera -------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,                 // 透明背景，让下方 video/shade 透出
    powerPreference: "high-performance",
  });
  const isMobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);   // z=8 配合 45° FOV：z=0 平面可见宽 ≈ 6.6 单位、高 ≈ 3.7 单位（16:9）

  /* -------- 卡片配置：有机排布 -------- */
  // pos: 就位后的目标位置 [x, y, z]
  // rot: 就位后的基准旋转 [x, y, z]（弧度）
  // w/h: PlaneGeometry 尺寸（世界单位）
  const CARDS = [
    // 0 — 焦点大卡：偏左、最近镜头（构图重心）
    { src: "assets/img/scene-01.jpg",    w: 2.8, h: 3.6, pos: [-1.9, -0.2,  0.7], rot: [-0.02,  0.10, -0.015] },
    // 1 — 右上中卡：更远右上、反向倾斜
    { src: "assets/img/service-01.webp", w: 2.0, h: 2.6, pos: [ 3.0,  1.5, -0.3], rot: [ 0.05, -0.16,  0.035] },
    // 2 — 右下小卡：压住右下角、更靠外
    { src: "assets/img/scene-02.jpg",    w: 1.6, h: 2.0, pos: [ 3.5, -1.6,  0.3], rot: [-0.07,  0.08, -0.05 ] },
    // 3 — 左远中卡：更深更远左、大角度侧倾
    { src: "assets/img/service-02.webp", w: 1.8, h: 2.4, pos: [-4.0, -1.1, -0.6], rot: [ 0.03,  0.20,  0.07 ] },
    // 4 — 顶部小卡：更高、最深
    { src: "assets/img/scene-03.jpg",    w: 1.4, h: 1.8, pos: [ 0.9,  2.4, -1.0], rot: [-0.10, -0.06,  0.025] },
    // 5 — 底部横卡：更低、锚定构图下沿
    { src: "assets/img/service-03.jpg",  w: 2.3, h: 1.7, pos: [-0.5, -2.3,  0.1], rot: [ 0.06,  0.03, -0.03 ] },
  ];

  /* -------- 出场节奏（状态化 + 时间驱动）-------- */
  // 卡片 stage 是“状态”而非滚动线性映射：
  //   p >= STAGE_ENTER → 进入 stage，stageProgress 以时间驱动正向播放到 1（动画自动播完，与滚动位置解耦）
  //   p <= STAGE_EXIT  → 退出 stage，stageProgress 反向播放回 0
  //   两者之间（滞后带）保持当前状态，避免临界抖动
  const STAGE_ENTER   = 0.15;   // 进入阈值（比之前的 0.32 早很多 → “浮出时机早些”）
  const STAGE_EXIT    = 0.05;   // 退出阈值（滚回顶部附近才反向播放）
  const STAGE_SPEED   = 0.95;   // stageProgress 每秒变化量 → 约 1.05 秒播完整个错峰序列

  // 每张卡在 stageProgress [0,1] 内的错峰子窗口
  const CARD_STAGGER  = 0.10;   // 相邻卡片启动间隔（stage 进度单位）
  const CARD_DURATION = 0.50;   // 单张卡片浮出时长（stage 进度单位）
  // → 卡 0: 0.0→0.5   卡 5: 0.5→1.0   全部就位于 stageProgress=1

  const RISE_DISTANCE = 9;      // 卡片初始位置在目标下方多远（世界单位，散开后略加大）

  /* -------- 构建卡片 mesh -------- */
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const meshes = [];

  CARDS.forEach((card, i) => {
    const texture = loader.load(card.src);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;   // 无 mipmap，避免平面卡片缩放时模糊
    texture.generateMipmaps = false;

    const geometry = new THREE.PlaneGeometry(card.w, card.h);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const startY = card.pos[1] - RISE_DISTANCE;
    mesh.position.set(card.pos[0], startY, card.pos[2]);

    // 每张卡独特的入场翻转量（不规则，避免整齐划一）：
    // 初始姿态 = baseRot + entryRot，浮出过程中 entryRot 衰减到 0，最终停在 baseRot（不规则但大体面向镜头）
    const entryRot = new THREE.Vector3(
      0.30 + (i % 3) * 0.09,                          // x 前倾：0.30 / 0.39 / 0.48 循环
      ((i % 2) ? -1 : 1) * (0.16 + (i % 3) * 0.07),   // y 侧转：正负交替 + 幅度递变
      0.13 + ((i + 1) % 3) * 0.08                     // z 翻滚：错相位变化
    );
    mesh.rotation.set(
      card.rot[0] + entryRot.x,
      card.rot[1] + entryRot.y,
      card.rot[2] + entryRot.z
    );

    mesh.userData = {
      index: i,
      targetPos: new THREE.Vector3(card.pos[0], card.pos[1], card.pos[2]),
      baseRot:   new THREE.Vector3(card.rot[0], card.rot[1], card.rot[2]),
      entryRot,
      startY,
      start: i * CARD_STAGGER,
      end:   i * CARD_STAGGER + CARD_DURATION,
      // 就位后的漂浮相位偏移（每张卡不同步，避免整齐划一的机械感）
      floatPhase: i * 1.1,
      // 鼠标近距离旋转的平滑状态（每帧 lerp 逼近目标，鼠标移开后缓缓归位）
      mouseRotX: 0, mouseRotY: 0, mouseRotZ: 0,
    };

    scene.add(mesh);
    meshes.push(mesh);
  });

  /* -------- 尺寸自适应：相机距离随 aspect 调整，保证卡片构图完整入画 -------- */
  // 内容边界（散开后）：横向 span ≈ [-4.9, 4.3]（卡 3 左缘 → 卡 2 右缘），纵向 span ≈ [-3.15, 3.3]
  // 取 halfW=5.2 / halfH=3.5 留出安全边距（含透视放大）；窄屏（移动端竖屏）相机拉远，
  // 透视会 flattening 但构图完整、卡片等比缩小——这是可接受的移动端权衡。
  const CONTENT_HALF_W = 5.2;
  const CONTENT_HALF_H = 3.5;
  function resize() {
    const w = heroPin.offsetWidth;
    const h = heroPin.offsetHeight;
    if (w <= 0 || h <= 0) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    const vFov = camera.fov * Math.PI / 180;
    const tanHalf = Math.tan(vFov / 2);
    const distH = CONTENT_HALF_H / tanHalf;            // 纵向 fitting 所需距离
    const distW = CONTENT_HALF_W / (tanHalf * aspect); // 横向 fitting 所需距离
    camera.position.z = Math.max(distH, distW);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();          // 相机静态，提前算好 matrixWorldInverse 供卡片投影用
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* -------- 鼠标追踪（驱动每张卡片的近距离旋转响应） -------- */
  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let hasMouse = false;                  // 触摸设备无鼠标，不施加近距离旋转
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMouse = true;
  }, { passive: true });

  /* -------- 缓动 + 复用的投影向量 + stage 状态 -------- */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const projVec = new THREE.Vector3();   // 每帧复用，避免 GC
  let stageTarget = 0;                   // 目标状态：0 收起 / 1 展开
  let stageProgress = 0;                 // 当前动画进度 [0,1]，时间驱动
  let lastTime = 0;                      // 上一帧时间戳，用于算 dt

  /* -------- 主动画循环 -------- */
  function animate(time) {
    requestAnimationFrame(animate);

    const y = window.scrollY || window.pageYOffset || 0;
    const heroH = hero.offsetHeight;
    const pinDistance = Math.max(1, heroH - window.innerHeight);

    // hero 完全滚出视口后跳过渲染（canvas 随 hero-pin 滚走，不可见）
    if (y > heroH) return;

    const p = Math.max(0, Math.min(1, y / pinDistance));

    // dt（秒），上限 0.1 防止标签页切回时的大跳变
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0.016;
    lastTime = time;

    // ---- 状态机：根据 p 决定 stage 目标（带滞后，避免临界抖动）----
    if (p >= STAGE_ENTER) stageTarget = 1;
    else if (p <= STAGE_EXIT) stageTarget = 0;
    // (STAGE_EXIT, STAGE_ENTER) 之间保持 stageTarget 不变

    // ---- stageProgress 以时间驱动向 target 逼近（与滚动位置解耦：进入后自动播完）----
    if (stageProgress !== stageTarget) {
      const step = STAGE_SPEED * dt;
      if (stageProgress < stageTarget) stageProgress = Math.min(stageTarget, stageProgress + step);
      else stageProgress = Math.max(stageTarget, stageProgress - step);
    }

    // 鼠标 NDC（屏幕中心为原点，x 向右、y 向上为正）
    const mouseNDCx = (mouseX / window.innerWidth) * 2 - 1;
    const mouseNDCy = -(mouseY / window.innerHeight) * 2 + 1;

    /* --- 更新每张卡片 --- */
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const ud = mesh.userData;

      // 局部进度 [0,1]：卡片在 stageProgress 里的错峰子窗口
      const localP = Math.max(0, Math.min(1, (stageProgress - ud.start) / (ud.end - ud.start)));
      const eased = easeOutCubic(localP);
      const settled = localP >= 1;

      // ---- 位置：从底部浮出到 targetPos.y；就位后叠加微妙 sin 漂浮 ----
      const baseY = ud.startY + (ud.targetPos.y - ud.startY) * eased;
      const floatY = settled ? Math.sin(time * 0.0006 + ud.floatPhase) * 0.045 : 0;
      const floatX = settled ? Math.cos(time * 0.0005 + ud.floatPhase * 0.9) * 0.025 : 0;
      mesh.position.x = ud.targetPos.x + floatX;
      mesh.position.y = baseY + floatY;
      mesh.position.z = ud.targetPos.z;

      // ---- 鼠标近距离旋转响应（磁吸式倾斜）----
      // 把卡片中心投影到屏幕 NDC，算鼠标到卡片的距离；越近影响越强（smoothstep 柔和衰减）
      let targetRotX = 0, targetRotY = 0, targetRotZ = 0;
      if (hasMouse && eased > 0.01) {
        projVec.copy(mesh.position).project(camera);   // 卡片中心的 NDC
        const dx = mouseNDCx - projVec.x;              // 鼠标在卡片右侧 → dx > 0
        const dy = mouseNDCy - projVec.y;              // 鼠标在卡片上方 → dy > 0
        const dist = Math.sqrt(dx * dx + dy * dy);
        const INFLUENCE_R = 1.1;                       // NDC 影响半径（略大于半屏宽，鼠标掠过时会带动邻近几张卡依次响应）
        let infl = Math.max(0, 1 - dist / INFLUENCE_R);
        infl = infl * infl * (3 - 2 * infl);           // smoothstep，边缘更柔和
        infl *= eased;                                 // 入场未完成时按比例减弱
        // 注意：实际峰值倾角 ≈ 0.26 × TILT（dx 与 infl 此消彼长），TILT=0.6 → 峰值 ~9°，“轻微”但可见
        const TILT = 0.60;
        // 卡片“看向”鼠标：鼠标在右→右转(rotation.y +)，鼠标在上→上仰(rotation.x −)；
        // 鼠标正好在卡片中心时 dx=dy=0 → 不倾斜（正面朝向鼠标本就是无倾斜）
        targetRotY =  dx * infl * TILT;
        targetRotX = -dy * infl * TILT;
        targetRotZ = -dx * infl * TILT * 0.18;         // 轻微 roll（峰值 ~1.6°），增加有机感
      }
      // 平滑逼近（lerp 0.12，约 8 帧收敛）：鼠标靠近时缓缓倾斜、移开时缓缓归位
      ud.mouseRotX += (targetRotX - ud.mouseRotX) * 0.12;
      ud.mouseRotY += (targetRotY - ud.mouseRotY) * 0.12;
      ud.mouseRotZ += (targetRotZ - ud.mouseRotZ) * 0.12;

      // ---- 旋转合成：基准(不规则但面向镜头) + 入场翻滚归位 + 漂浮摆动 + 鼠标响应 ----
      const f = ud.floatPhase;
      const floatRotX = settled ? Math.sin(time * 0.0004 + f * 1.3) * 0.012 : 0;
      const floatRotY = settled ? Math.sin(time * 0.00035 + f * 0.9) * 0.016 : 0;
      const floatRotZ = settled ? Math.cos(time * 0.0003 + f * 1.1) * 0.010 : 0;
      const entryDecay = 1 - eased;                    // 入场翻滚量随浮出衰减到 0
      mesh.rotation.x = ud.baseRot.x + ud.entryRot.x * entryDecay + floatRotX + ud.mouseRotX;
      mesh.rotation.y = ud.baseRot.y + ud.entryRot.y * entryDecay + floatRotY + ud.mouseRotY;
      mesh.rotation.z = ud.baseRot.z + ud.entryRot.z * entryDecay + floatRotZ + ud.mouseRotZ;

      // ---- 透明度：跟随 eased ----
      mesh.material.opacity = eased;
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
  // 页面隐藏时浏览器自动暂停 rAF，恢复时自动继续——无需额外 visibilitychange 处理
}
