/* Tinttex Landing Page — 交互脚本 */
(function () {
  "use strict";

  /* ======== 语言切换浮动面板：点击地球钮开合，选项沿用 pill-btn；选外部/Esc 收起 ======== */
  var langSwitch = document.getElementById("langSwitch");
  var langToggle = document.getElementById("langToggle");
  var langMenu = document.getElementById("langMenu");

  if (langSwitch && langToggle && langMenu) {
    var setLangOpen = function (open) {
      langSwitch.classList.toggle("open", open);
      langToggle.setAttribute("aria-expanded", String(open));
    };

    langToggle.addEventListener("click", function () {
      setLangOpen(!langSwitch.classList.contains("open"));
    });

    // 选择语言：交给 i18n（字典替换 + localStorage 记忆 + aria-checked 同步）后收起面板
    var langOpts = langMenu.querySelectorAll(".lang-opt");
    langOpts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        var lang = opt.getAttribute("data-lang") || "zh-CN";
        if (window.TinttexI18N) window.TinttexI18N.setLang(lang);
        else document.documentElement.lang = lang;   // i18n.js 未加载时仅同步 lang 属性
        setLangOpen(false);
      });
    });

    // 点击面板外部收起（地球钮与选项都在 langSwitch 内，其点击不会误关）
    document.addEventListener("click", function (e) {
      if (!langSwitch.contains(e.target)) setLangOpen(false);
    });

    // Esc 收起
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setLangOpen(false);
    });
  }

  /* ======== 登录 / 注册弹窗：打开时 body.modal-open 锁滚动 + 遮罩压暗；X / 遮罩 / Esc 关闭 ======== */
  var modals = document.querySelectorAll(".modal");

  var syncModalLock = function () {
    // 任一弹窗开着时锁住 body 滚动（滚轮无响应）；全关后恢复
    document.body.classList.toggle("modal-open", document.querySelector(".modal.show") !== null);
  };

  var setModal = function (modal, open) {
    if (!modal) return;
    modal.classList.toggle("show", open);
    modal.setAttribute("aria-hidden", String(!open));
    syncModalLock();
  };

  // 导航登录/注册钮 → 打开对应弹窗
  document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setModal(document.getElementById(btn.getAttribute("data-modal-open")), true);
    });
  });

  // X / 遮罩点击关闭（卡片本身不冒泡到遮罩，点卡片内部不会误关）
  document.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      setModal(el.closest(".modal"), false);
    });
  });

  // 弹窗间切换（登录↔注册底部互跳链接）
  document.querySelectorAll("[data-modal-switch]").forEach(function (el) {
    el.addEventListener("click", function () {
      setModal(el.closest(".modal"), false);
      setModal(document.getElementById(el.getAttribute("data-modal-switch")), true);
    });
  });

  // Esc 关闭所有弹窗
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") modals.forEach(function (m) { setModal(m, false); });
  });

  // 密码可见性切换（eye 按钮：password ↔ text，同时换图标）
  document.querySelectorAll("[data-pw-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.querySelector(btn.getAttribute("data-pw-toggle"));
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.classList.toggle("is-off", show);
      btn.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
    });
  });

  /* ======== Hero 视频：静止在第一帧，播放进度由滚动 scrub 驱动 ======== */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    // 不自动播放：确保暂停并归零，静止在第一帧（等待滚动 scrub）
    heroVideo.muted = true;   // 属性 + property 双保险（个别移动端只认 property，静音是免手势播放的前提）
    heroVideo.pause();
    var holdFirstFrame = function () {
      try { heroVideo.currentTime = 0; } catch (e) {}
      heroVideo.pause();
    };
    if (heroVideo.readyState >= 1) holdFirstFrame();
    else heroVideo.addEventListener("loadedmetadata", holdFirstFrame);

    // —— 移动端首帧解码“踢”：iOS/Android 上从未播放过的 paused 视频不渲染任何画面（黑屏），
    //    且移动端可能忽略 preload="auto"（不主动加载数据）。
    //    注意必须立即踢、不能等 loadeddata：数据不加载 → loadeddata 永不触发 → play 永不被调 → 死锁。
    //    muted+playsinline 视频允许无手势自动播放，play() 本身会触发数据加载，
    //    promise resolve 后立即 pause 归零，交还 scrub 控制。
    //    低电量模式等 play() 被拒时，退回首次触摸手势再试（kicked 未置位，可重入）。
    var kicked = false;
    var kickDecode = function () {
      if (kicked) return;
      var pr = heroVideo.play();
      if (pr && pr.then) {
        pr.then(function () {
          kicked = true;
          heroVideo.pause();
          holdFirstFrame();   // 归零回第一帧，交还 scrub 控制
        }).catch(function () {});   // 被拦截：静默失败，等触摸手势再试
      }
    };
    kickDecode();                                                              // 立即踢
    heroVideo.addEventListener("loadedmetadata", kickDecode);   // 元数据就绪再补踢（部分设备先拒后准）
    heroVideo.addEventListener("canplay", kickDecode);              // 数据可播再补踢
    document.addEventListener("touchstart", kickDecode, { passive: true });   // 手势兑底（play 被拒后用户一碰屏幕即重试）
  }

  /* ======== Hero 滚动钉住 + 分阶段动效（标题消隐 / 瀑布流盖上 支持两种驱动模式）========
   * .hero 高 HERO_H(默认173vh)，.hero-pin sticky 钉住 100vh，吞掉 (HERO_H-100)vh 滚动；p = scrollY / pinDistance ∈ [0,1]。
   * MODE 切换「标题消隐」与「瀑布流盖上」的驱动方式（左上角面板 checkbox）：
   *   · "interp" 插值：进度 = smoothstep((p - START)/RAMP)，直接跟随滚动位置（带缓动，比线性更平滑）
   *   · "state"  状态：Schmitt 触发（p≥ENTER→目标1，p≤EXIT→目标0，中间滞回保持）+ 时间补间（SPEED/秒，easeOutCubic），
   *              与滚动速度解耦——越过阈值后动画自动播完，快速滚动也不跳变（同被注释的 3D 卡片 stage）
   * 视频 scrub / 黑幕 / recede 仍按 p 插值驱动；视频是 position:fixed 常驻背景，永不上滚、不淡出。
   */
  var hero = document.querySelector(".hero");
  var heroPin = document.querySelector(".hero-pin");
  var heroCopy = document.querySelector(".hero-copy");
  var heroVeil = document.querySelector(".hero-veil");
  var navEl = document.querySelector(".nav");
  if (hero && heroVideo) {
    // 所有可调参数集中到 TUNE，并挂到 window 供左上角调参面板（js/tuning-panel.js）实时读写。
    // 面板调好后：把最终值写回这里 + css，删掉 index.html 里 tuning-panel.js 的 <script> 即可锁定。
    var TUNE = window.__TINTTEX_TUNE__ = {
      // —— 驱动模式：'interp'=按滚动位置平滑插值 | 'state'=Schmitt 阈值触发+时间补间（与滚动速度解耦）——
      MODE: "state",
      // —— 标题消隐：末态（两模式共用）——
      TITLE_MAX_BLUR: 32,       // 末态模糊半径 px
      TITLE_MAX_SCALE: 1.62,    // 末态放大倍率（模拟向镜头移近）
      // —— 标题消隐：插值模式（interp）——
      TITLE_START: 0,           // 开始模糊的 p
      TITLE_BLUR_RAMP: 0.22,    // 模糊/放大拉满的 p 跨度
      TITLE_OPACITY_RAMP: 0.25, // 完全淡出的 p 跨度
      // —— 标题消隐：状态模式（state）——
      TITLE_ENTER: 0.12,        // p≥此值触发消隐（时间补间到末态）
      TITLE_EXIT: 0.03,         // p≤此值触发恢复（反向补间）；(EXIT,ENTER) 之间滞回保持
      TITLE_SPEED: 1.8,         // 补间速度（进度/秒；1.8≈0.56s 播完）
      // —— 视频 scrub（机位下降，按 p 插值）——
      SCRUB_START: 0,           // 起播 p
      SCRUB_END: 1,             // 定格 p
      VIDEO_T0: 4,              // scrub 起点对应的视频时间（秒）
      VIDEO_T1: 9,              // scrub 终点对应的视频时间（秒）
      LERP: 0.04,               // currentTime 平滑跟随系数（大=跟手，小=顺滑）
      // —— 渐变黑幕（按 p 插值）——
      VEIL_START: 0.82,         // 黑幕开始淡入的 p
      VEIL_END: 1,              // 黑幕到达最大不透明度的 p
      VEIL_MAX: 1,              // 黑幕最大不透明度 0..1
      // —— 视频定格后 recede（按 p 插值）：fixed 常驻背景变模糊变暗到 VIDEO_MIN_BRIGHT，不淡出、不上滚 ——
      VIDEO_BLUR_START: 0.65,   // 开始变暗变模糊的 p
      VIDEO_BLUR_END: 1,        // 变暗变模糊完成的 p
      VIDEO_MAX_BLUR: 10,       // 最大模糊 px
      VIDEO_MIN_BRIGHT: 0.53,   // 末态亮度 0..1（作为常驻背景的暗度）
      // —— 瀑布流盖上：feed 用 translateY 向上滑 sF*FEED_COVER 盖住视频（sF=1→到顶）；footer 同步 -FEED_COVER 负 margin 补掉底部空隙。FEED_COVER=0 关闭 ——
      FEED_COVER: 95,           // 盖上行程 vh（越大盖得越高；≈100+FEED_MARGIN 时末态正好顶到视口顶）
      FEED_START: 0.28,         // 插值模式：开始上升的 p
      FEED_RAMP: 0.28,          // 插值模式：上升到位的 p 跨度
      FEED_ENTER: 0.92,         // 状态模式：p≥此值触发上升（时间补间，直接盖到顶）
      FEED_EXIT: 0.92,          // 状态模式：p≤此值触发回落
      FEED_SPEED: 0.7,          // 状态模式：补间速度（进度/秒）
      // —— 布局（面板写入元素 inline style，实时生效）——
      HERO_H: 200,              // .hero 高度 vh（pin 可钉距离 = HERO_H - 100）
      FEED_MARGIN: 0,           // .feed margin-top vh（负=瀑布流提前上升与 hero 重叠）
      // —— State 2↔3 边界吸附（卡片介绍区 ↔ 瀑布流）：滚轮触发平滑滚动动画 ——
      SNAP_ZONE: 0.6,           // 距瀑布流标语顶多少 vh 内的滚轮触发吸附
      SNAP_DUR: 0.5             // 吸附动画基准时长（秒/屏），实际钳制在 0.55–1.1s
    };

    var heroRafPending = false;
    var videoTargetTime = 0;    // scrub 目标时间（秒）
    var videoRafId = null;
    var feedEl = document.querySelector(".feed");     // 瀑布流 section，用 translateY 向上“盖上”
    var footerEl = document.querySelector(".footer"); // footer：同步负 margin 补掉 feed 上移后与 footer 间的底部空隙
    var lastFooterUp = null;                          // 缓存 footer 当前上移量，仅变化时才写 margin（避免无谓 reflow）
    // 状态机（state 模式）运行时进度与目标；interp 模式下也同步这些值 → 切换模式无跳变
    var titleS = 0, titleTarget = 0, feedS = 0, feedTarget = 0;
    // 瀑布流 state 模式分段补间：方向反转时以当前视觉值 feedFrom 为起点重开一段（feedSeg 0→1）→ 连续无跳变，且上升/下撤都 ease-out
    var feedFrom = 0, feedSeg = 1, feedDir = 0;
    var lastNow = 0;            // 上一帧时间戳（算 dt）
    var stagesTweening = false; // state 模式下是否仍有 stage 在补间（决定 rAF 是否续帧）
    // 缓动
    var clamp01 = function (t) { return t < 0 ? 0 : (t > 1 ? 1 : t); };
    var smoothstep = function (t) { t = clamp01(t); return t * t * (3 - 2 * t); };
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

    // 用 rAF 把 currentTime 平滑 lerp 到目标，避免每次 scroll 直接 seek 造成跳动。
    // 移动端关键差异：seek 是异步且慢的，若每帧都写 currentTime，新赋值会不断取消上一
    // 个尚未完成的 seek → seek 永远不完成、画面永远不刷新（看起来“滚动不驱动视频”）。
    // 因此用 seeking 标志串行化：等 seeked 事件确认上次 seek 落帧后再发起下一次；
    // 桌面端 seek 极快（全关键帧），行为与之前基本一致。
    var seeking = false;
    var doSeek = function (t) {
      seeking = true;
      heroVideo.currentTime = t;
    };
    heroVideo.addEventListener("seeked", function () {
      seeking = false;
      // seek 期间目标又前进了较多 → 继续追帧（下次滚动/补间会 scheduleVideo，这里兜底补一帧）
      if (Math.abs(videoTargetTime - heroVideo.currentTime) > 0.05) scheduleVideo();
    });
    var tickVideo = function () {
      videoRafId = null;
      var dur = heroVideo.duration;
      if (!dur || isNaN(dur)) return;
      if (seeking) { videoRafId = requestAnimationFrame(tickVideo); return; }   // 上次 seek 未完成，等 seeked
      var cur = heroVideo.currentTime;
      var diff = videoTargetTime - cur;
      if (Math.abs(diff) < 0.008) {
        if (cur !== videoTargetTime) doSeek(videoTargetTime);
        return;
      }
      doSeek(cur + diff * TUNE.LERP);
      videoRafId = requestAnimationFrame(tickVideo);
    };
    var scheduleVideo = function () {
      if (videoRafId == null) videoRafId = requestAnimationFrame(tickVideo);
    };

    var updateHero = function (now) {
      heroRafPending = false;
      var heroH = hero.offsetHeight;
      if (heroH <= 0) return;
      // sticky 可钉距离 = hero 总高 - 视口高；reduced-motion 降级时 hero=100vh，pinDistance≈0，需兼容
      var pinDistance = Math.max(1, heroH - window.innerHeight);
      var y = window.scrollY || window.pageYOffset || 0;
      var p = y >= pinDistance ? 1 : (y < 0 ? 0 : y / pinDistance);
      var isState = TUNE.MODE === "state";
      var dt = (now && lastNow) ? Math.min((now - lastNow) / 1000, 0.1) : 0.016;
      if (now) lastNow = now;

      /* ---- 标题消隐：blurT(模糊/放大) + opacT(淡出)，两种模式 ---- */
      var blurT, opacT;
      if (isState) {
        // Schmitt 触发 + 时间补间：越阈值后自动播完，与滚动速度解耦
        if (p >= TUNE.TITLE_ENTER) titleTarget = 1;
        else if (p <= TUNE.TITLE_EXIT) titleTarget = 0;
        if (titleS !== titleTarget) {
          var tstep = TUNE.TITLE_SPEED * dt;
          titleS = titleS < titleTarget ? Math.min(titleTarget, titleS + tstep) : Math.max(titleTarget, titleS - tstep);
        }
        blurT = opacT = easeOutCubic(titleS);
      } else {
        // 插值：smoothstep 缓动（比线性更平滑）；模糊/放大用 blurT，淡出用更慢的 opacT
        var pt = p - TUNE.TITLE_START;
        blurT = pt <= 0 ? 0 : smoothstep(pt / Math.max(0.0001, TUNE.TITLE_BLUR_RAMP));
        opacT = pt <= 0 ? 0 : smoothstep(pt / Math.max(0.0001, TUNE.TITLE_OPACITY_RAMP));
        titleS = blurT; titleTarget = blurT > 0.5 ? 1 : 0;   // 同步，切到 state 时无跳变
      }
      if (heroCopy) {
        // 整个标题组（主标题+副标题）同节奏模糊渐隐/放大；居中由 CSS 布局保证，这里只写 scale
        heroCopy.style.transform = "scale(" + (1 + (TUNE.TITLE_MAX_SCALE - 1) * blurT).toFixed(3) + ")";
        heroCopy.style.filter = "blur(" + (TUNE.TITLE_MAX_BLUR * blurT).toFixed(2) + "px)";
        heroCopy.style.opacity = (1 - opacT).toFixed(3);
        // 完全淡出后 visibility:hidden 断掉标题组内轮播胶囊的点击（不可见但仍会命中）
        heroCopy.style.visibility = opacT >= 1 ? "hidden" : "visible";
      }

      /* ---- 瀑布流盖上：sF → translateY(-sF*FEED_COVER) 向上盖到顶，两种模式末态一致 ---- */
      var sF;
      if (isState) {
        if (p >= TUNE.FEED_ENTER) feedTarget = 1;
        else if (p <= TUNE.FEED_EXIT) feedTarget = 0;
        // 方向反转 → 以当前视觉值为起点重开一段补间（连续、无跳变）
        if (feedTarget !== feedDir) { feedDir = feedTarget; feedFrom = feedS; feedSeg = 0; }
        if (feedSeg < 1) feedSeg = Math.min(1, feedSeg + TUNE.FEED_SPEED * dt);
        // 上升/下撤都用 easeOutCubic(段进度)：进入目标时减速落位 → 下撤也是“先快后慢”，不再 ease-in（起步迟滞）
        sF = feedSeg >= 1 ? feedTarget : feedFrom + (feedTarget - feedFrom) * easeOutCubic(feedSeg);
        feedS = sF;
      } else {
        sF = smoothstep((p - TUNE.FEED_START) / Math.max(0.0001, TUNE.FEED_RAMP));
        // 同步 state 变量：feedDir 设为浮点 sF，切到 state 时首帧必然触发重开一段（从当前值起，无跳变）
        feedS = sF; feedFrom = sF; feedTarget = sF; feedDir = sF; feedSeg = 1;
      }
      // 向上 translateY 盖住视频：sF=1 → 上移 FEED_COVER（到顶）
      if (feedEl) {
        var up = sF * TUNE.FEED_COVER;
        feedEl.style.transform = up > 0.01 ? "translateY(-" + up.toFixed(3) + "vh)" : "";
      }
      // 导航栏下方黑色渐变随瀑布流盖上进度 sF 同步淡入（透明度写进 CSS 变量，由 .nav::before 消费）
      if (navEl) {
        navEl.style.setProperty("--nav-shade", sF.toFixed(3));
      }
      // footer 与 feed 同幅上移（-sF*FEED_COVER）：盖上时闭合 feed 上移留出的底部空隙；
      // 未盖上（sF<1）时 footer 留在原位，不会提前缩到瀑布流背后被遮住
      if (footerEl) {
        var fUp = sF * TUNE.FEED_COVER;
        if (fUp !== lastFooterUp) {
          footerEl.style.marginTop = fUp > 0.01 ? (-fUp).toFixed(3) + "vh" : "";
          lastFooterUp = fUp;
        }
      }
      // state 模式下若仍有 stage 未到位，保持 rAF 续帧（滚动停下后动画也能自动播完）
      stagesTweening = isState && (titleS !== titleTarget || feedSeg < 1);

      /* ---- 渐变黑幕（按 p 插值）---- */
      if (heroVeil) {
        var pv = clamp01((p - TUNE.VEIL_START) / Math.max(0.0001, TUNE.VEIL_END - TUNE.VEIL_START));
        heroVeil.style.opacity = (pv * TUNE.VEIL_MAX).toFixed(3);
      }

      /* ---- 视频 recede（按 p 插值）：变模糊变暗，fixed 常驻不淡出、不上滚 ---- */
      var pr = clamp01((p - TUNE.VIDEO_BLUR_START) / Math.max(0.0001, TUNE.VIDEO_BLUR_END - TUNE.VIDEO_BLUR_START));
      if (pr <= 0) {
        if (heroVideo.style.filter) heroVideo.style.filter = "";
      } else {
        heroVideo.style.filter = "blur(" + (TUNE.VIDEO_MAX_BLUR * pr).toFixed(2) + "px) brightness(" + (1 - (1 - TUNE.VIDEO_MIN_BRIGHT) * pr).toFixed(3) + ")";
      }
      if (heroVideo.style.opacity !== "") heroVideo.style.opacity = "";
      if (heroPin && heroPin.style.opacity !== "") heroPin.style.opacity = "";

      /* ---- 视频 scrub（按 p 插值）：p ∈ [SCRUB_START, SCRUB_END] 映射视频时间 [VIDEO_T0, VIDEO_T1] ---- */
      var pScrub = clamp01((p - TUNE.SCRUB_START) / Math.max(0.0001, TUNE.SCRUB_END - TUNE.SCRUB_START));
      var dur = heroVideo.duration;
      if (dur && !isNaN(dur)) {
        videoTargetTime = TUNE.VIDEO_T0 + pScrub * (TUNE.VIDEO_T1 - TUNE.VIDEO_T0);
        scheduleVideo();
      }

      // 供左上角调参面板 / 移动端诊断浮层读取的实时状态
      window.__TINTTEX_STATE__ = { p: p, scrollY: y, pinDistance: pinDistance, currentTime: heroVideo.currentTime, videoTarget: videoTargetTime, duration: dur || 0, mode: TUNE.MODE, title: isState ? titleS : blurT, feed: sF };
    };

    // 统一 rAF 驱动：interp 模式仅滚动时算一帧；state 模式补间未结束时自动续帧（滚动停下也能播完）
    var tickHero = function (now) {
      heroRafPending = false;
      updateHero(now);
      if (stagesTweening) requestUpdate();
    };
    var requestUpdate = function () {
      if (!heroRafPending) { heroRafPending = true; requestAnimationFrame(tickHero); }
    };

    // 暴露给调参面板：改完参数后立即重算（并启动 rAF；state 模式下让补间跑起来）
    window.__TINTTEX_UPDATE__ = function () { requestUpdate(); };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    // duration 就绪后才能 scrub，元数据加载完再算一次
    heroVideo.addEventListener("loadedmetadata", function () { requestUpdate(); });
    requestUpdate();
  }

  /* ======== State 2↔3 边界吸附：卡片介绍区(showcase) ↔ 瀑布流(feed-head/photo wall) ========
   * 页面共三个 state：1=hero（scrub 连续滚动）、2=卡片介绍区、3=瀑布流。
   * state 2→3：showcase 尾边一进入视口，下一次向下滚轮即触发整屏 easeInOutCubic 滚动动画，
   *   平滑滚到瀑布流顶部（标语贴视口顶）；state 3→2 反向同理滚回卡片尾。
   * 锚点按 offsetTop 版式位置 - FEED_COVER（盖上末态）计算，与覆盖补间进度解耦，快速甩滚落点也不漂；
   * 动画期间吞掉滚轮防抖动，结束后恢复。触屏（无 wheel）不吸附，保持原生滚动。 */
  var feedHeadEl = document.querySelector(".feed-head");
  var showcaseEl = document.querySelector(".showcase");
  if (feedEl && feedHeadEl && showcaseEl) {
    var snapRaf = null, snapFrom = 0, snapTo = 0, snapT0 = 0, snapDur = 0;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var coverPx = function () { return ((window.__TINTTEX_TUNE__ && window.__TINTTEX_TUNE__.FEED_COVER) || 95) / 100 * window.innerHeight; };

    // 吸附锚点：版式位（offsetTop 不受 translateY 影响）按“盖上完成”末态换算成滚动位
    var wallAnchorY = function () {   // state 3：瀑布流标语顶贴视口顶
      return Math.max(0, feedHeadEl.offsetTop + feedEl.offsetTop - coverPx());
    };
    var showcaseHeadEl = document.querySelector(".showcase-head");
    // state 2 停点：showcase 标题“让心爱的灵感落地成真”落在 nav 黑色底衬下方 40px 处（不贴边、不被遮）。
    // 标题版式位 = feedEl.offsetTop + head.offsetTop（head 的 offsetParent 是 position:relative 的 .feed）；
    // 视觉位需再减 coverPx（覆盖补间完成时 feed 已上移 coverPx，锚点与补间进度解耦，快速甩滚落点不漂）
    var CARDS_ANCHOR_GAP = 40;   // nav 底衬下方留白：标题顶边距黑条底边的距离
    var cardsAnchorY = function () {   // state 2：showcase 标题贴视口顶部区域
      var headTop = showcaseHeadEl
        ? feedEl.offsetTop + showcaseHeadEl.offsetTop
        : showcaseEl.offsetTop + feedEl.offsetTop;   // 兜底：head 缺失时退回 showcase 顶
      return Math.max(0, headTop - coverPx() - (navEl ? navEl.offsetHeight : 68) - CARDS_ANCHOR_GAP);
    };

    var stepSnap = function (now) {
      var t = snapDur <= 0 ? 1 : Math.min(1, (now - snapT0) / (snapDur * 1000));
      window.scrollTo(0, snapFrom + (snapTo - snapFrom) * easeInOutCubic(t));
      if (t < 1) {
        snapRaf = requestAnimationFrame(stepSnap);
      } else {
        snapRaf = null;
        document.documentElement.style.scrollBehavior = "";   // 恢复 html 的 scroll-behavior:smooth
      }
    };
    var startSnap = function (toY) {
      snapFrom = window.scrollY;
      snapTo = toY;
      snapDur = Math.min(1.1, Math.max(0.55, Math.abs(toY - snapFrom) / window.innerHeight * ((window.__TINTTEX_TUNE__ && window.__TINTTEX_TUNE__.SNAP_DUR) || 0.5)));
      snapT0 = performance.now();
      // html 的 scroll-behavior:smooth 会让逐帧 scrollTo 互相打架，动画期间临时改回 auto
      document.documentElement.style.scrollBehavior = "auto";
      if (snapRaf == null) snapRaf = requestAnimationFrame(stepSnap);
    };

    // 卡片介绍区（stage1）→ 瀑布流（stage2）之间不做吸附/接管处理：自由滚动。
    // 强制停点只剩「页顶 ↔ showcase 标题贴顶」这一段（触屏在 touchend 里处理）。

    // —— 轮播胶囊点击：接替原「探索更多」CTA 的跳转（精准定位到瀑布流标语，feed-head 贴视口顶）——
    // 复用吸附动画滚到 wallAnchorY（与 state 3 的落点完全一致），所有端一致；
    // 动画期间再点击由 startSnap 重入（从当前位置重开一段）。
    var tickerBtn = document.querySelector(".hero-ticker");
    if (tickerBtn) {
      tickerBtn.addEventListener("click", function () {
        if (reduceMotion) { window.scrollTo(0, wallAnchorY()); return; }
        startSnap(wallAnchorY());
      });
    }

    // —— 触屏 stage 机制——
    // 设计：
    //   · 手指按住拖动：原生滚动跟手，hero 段的视频 scrub / 覆盖动画照常随位置驱动；
    //   · 松手（touchend）接管惯性，只约束「页顶 ↔ showcase 标题」这一段，
    //     不允许停在 hero 半路：
    //       - 轻扫（fling，速度超阈值）：向下 → 直接进 showcase 标题停点；向上 → 直接动画到顶；
    //       - 慢拖后松手：按当前位置吸附到最近允许停点（0 / showcase 标题贴顶）；
    //   · showcase 标题停点以下（卡片区 → 瀑布流之间及瀑布流内部）为自由浏览区，
    //     不做吸附、不接管惯性，用户可任意位置停留；
    //   · 程序化 scrollTo 会取消原生惯性滚动（iOS Safari / Chrome Android 均如此），
    //     且补间每帧覆写 scrollY → 大力甩进停点后不会有残余惯性继续下滚；
    //   · 补间进行中再触屏 → 立即取消补间交还手指，松手后重新吸附。
    var touchTrack = null;
    window.addEventListener("touchstart", function (e) {
      if (snapRaf != null) {   // 动画中触摸：交还控制权
        cancelAnimationFrame(snapRaf);
        snapRaf = null;
        document.documentElement.style.scrollBehavior = "";
      }
      if (e.touches.length !== 1) { touchTrack = null; return; }   // 多指（捏合缩放）不跟踪
      touchTrack = { x0: e.touches[0].clientX, y0: e.touches[0].clientY, t0: performance.now(), y: e.touches[0].clientY, t: performance.now() };
    }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (!touchTrack || e.touches.length !== 1) return;
      touchTrack.y = e.touches[0].clientY;
      touchTrack.t = performance.now();
    }, { passive: true });
    window.addEventListener("touchend", function (e) {
      if (!touchTrack) return;
      var dy = touchTrack.y0 - touchTrack.y;                     // >0 上滑 → 页面向下滚
      var dt = Math.max(1, touchTrack.t - touchTrack.t0);
      var v = dy / dt;                                           // px/ms，正 = 意图向下滚
      var dx = Math.abs(e.changedTouches[0].clientX - touchTrack.x0);
      touchTrack = null;
      // 横向意图（轮播类手势）或触点在交互元素上（按钮/卡片/弹窗）不劫持；reduced-motion 不接管
      if (Math.abs(dy) < 24 || dx > Math.abs(dy)) return;
      if (reduceMotion) return;
      if (e.target.closest && e.target.closest("a, button, input, .react-photo-album--photo, .modal")) return;
      var a2 = cardsAnchorY();
      var y = window.scrollY;
      if (y >= a2 - 2) return;                                   // showcase 标题停点以下（含卡片区→瀑布流之间）自由浏览
      var target;
      if (v > 0.45) {                                            // fling 向下 → 直接进 showcase 标题停点
        target = a2;
      } else if (v < -0.45) {                                    // fling 向上 → 直接动画到顶
        target = 0;
      } else {                                                   // 慢拖松手 → 最近允许停点（hero 段中点为界）
        target = y < a2 / 2 ? 0 : a2;
      }
      if (Math.abs(target - y) < 2) return;
      startSnap(target);
    }, { passive: true });
  }

  /* ======== 照片墙卡片：裁切窗口内图片视差 ======== */
  // 卡片作为“窗口”本身不动，hover 时内部图片放大 + 根据鼠标位置反向平移（--tx/--ty），
  // 制造“透过窗口看一张更大的图”的裁切视差错觉。
  // HOVER_DELAY：鼠标停留多久后才开始更新 --tx/--ty（0 = 无延迟，进入即响应）。
  // 事件委托到 feedWall，React 动态挂载的卡片自动生效。
  var feedWall = document.getElementById("feedWall");
  if (feedWall) {
    var MAX_SHIFT = 14;     // px，图片单向最大反向位移（实际范围 -14..+14，需小于卡片短边 × (scale-1)/2）
    var HOVER_DELAY = 0;    // ms，0 = 无延迟

    var findCard = function (target) {
      return target && target.closest ? target.closest(".react-photo-album--photo") : null;
    };

    var resetCard = function (card) {
      card.style.setProperty("--tx", "0px");
      card.style.setProperty("--ty", "0px");
    };

    var activeCard = null;
    var tracking = false;
    var hoverTimer = null;

    feedWall.addEventListener("mouseover", function (e) {
      var card = findCard(e.target);
      if (!card || card === activeCard) return;
      // 切换到新卡片：先复位上一张
      if (activeCard) resetCard(activeCard);
      clearTimeout(hoverTimer);
      activeCard = card;
      tracking = false;
      hoverTimer = setTimeout(function () { tracking = true; }, HOVER_DELAY);
    });

    feedWall.addEventListener("mouseout", function (e) {
      var card = findCard(e.target);
      if (!card) return;
      // 卡片内部子元素间切换不算离开，只有真正移出卡片才复位
      if (e.relatedTarget && card.contains(e.relatedTarget)) return;
      clearTimeout(hoverTimer);
      if (card === activeCard) {
        resetCard(card);
        activeCard = null;
        tracking = false;
      }
    });

    feedWall.addEventListener("mousemove", function (e) {
      // 只在已激活（停留超过 HOVER_DELAY）的卡片上更新，避免快速划过时抢跑
      if (!tracking || !activeCard) return;
      var card = findCard(e.target);
      if (card !== activeCard) return;
      var rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      var nx = (e.clientX - rect.left) / rect.width;   // 0..1
      var ny = (e.clientY - rect.top) / rect.height;   // 0..1
      // 图片反向位移：鼠标靠右→图片向左移，制造“视线看向右侧时看到画的更右边部分”的透视错觉
      var tx = (0.5 - nx) * (MAX_SHIFT * 2);
      var ty = (0.5 - ny) * (MAX_SHIFT * 2);
      card.style.setProperty("--tx", tx.toFixed(2) + "px");
      card.style.setProperty("--ty", ty.toFixed(2) + "px");
    });
  }

  /* ======== 触屏设备：点击卡片展开/收起信息条（hover 交互已在 CSS 按 (hover:hover) 门控）========
   * 检测 (hover:none)+(pointer:coarse)（手机/平板触屏；带鼠标的触屏笔记本不会命中）。
   * <html> 加 is-touch 后 CSS 才启用信息条；点击卡片 toggle expanded：
   * 展开时同屏其余展开卡片收起（单开互斥）；点在信息条内部（如“立刻进入”）不切换。 */
  var isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (isTouchDevice) {
    document.documentElement.classList.add("is-touch");
    if (feedWall) {
      // 单列模式（与 index.html 照片墙的判断保持一致）：展开后做“卡片入画”滚动修正
      var portraitSingle = window.matchMedia("(max-width: 560px) and (orientation: portrait)");
      var CARD_INFO_H = 68;   // 与 css .card-info 展开高度一致（新增的信息条不占当前 rect，需手动计入）
      feedWall.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest(".card-info")) return;
        var card = e.target.closest(".react-photo-album--photo");
        if (!card || !feedWall.contains(card)) return;
        var wasOpen = card.classList.contains("expanded");
        feedWall.querySelectorAll(".react-photo-album--photo.expanded").forEach(function (el) {
          el.classList.remove("expanded");
        });
        if (!wasOpen) {
          card.classList.add("expanded");
          // 单列模式：若卡片（含即将展开的信息条）有部分被视口裁剪 → 平滑滚动到合适位置
          if (portraitSingle.matches) {
            requestAnimationFrame(function () {
              var rect = card.getBoundingClientRect();
              var margin = 16;   // 期望的安全边距
              var delta = 0;
              if (rect.top < margin) {
                delta = rect.top - margin;   // 顶部被裁 → 上滚露出顶部
              } else if (rect.bottom + CARD_INFO_H > window.innerHeight - margin) {
                // 底部（含展开后的信息条）将超出 → 下滚让完整卡片入画
                delta = rect.bottom + CARD_INFO_H - window.innerHeight + margin;
              }
              if (delta) {
                if ("scrollBehavior" in document.documentElement.style) {
                  window.scrollBy({ top: delta, behavior: "smooth" });
                } else {
                  window.scrollBy(0, delta);   // 老设备兜底：瞬时滚动
                }
              }
            });
          }
        }
      });
    }
  }

  /* ======== 路由转场：点开瀑布流卡片 → 整页淡出 → 场景页（scene.html）========
   * 「进入场景」入口两端一致，但触发点按各自既有交互分工：
   *   · 桌面（hover+fine）：点卡片任意处即进入（hover 浮层「立刻进入」是伪元素，点击目标仍是卡片本身）；
   *   · 触屏：点卡片仍是展开/收起信息条（见上方 is-touch 区块），点信息条里的「立刻进入」才进入场景。
   * 遮罩是动态创建的 .route-veil（纯黑，与场景页底色同色 → 跳转瞬间不闪白，直接接上“正在准备场景”黑屏）；
   * 淡出由 rAF 逐帧写 opacity（不依赖 CSS transition 是否生效 / transitionend 是否触发）：
   * 本站整页本来就偏黑，时长太短 + 起步就快的缓动会让淡出“看不出来就跳了”，所以用
   * FADE_DUR(520ms) + easeInOutSine（两头慢，中段才推黑）+ FADE_HOLD(140ms) 全黑停留后才跳转；
   * 淡出期间锁滚动 + 吞掉重复点击；reduced-motion 跳过淡出直接跳转；
   * bfcache 返回（pageshow.persisted）时把遮罩淡回透明，否则整页会停在全黑。 */
  var SCENE_HREF = "scene.html";
  var FADE_DUR = 520;      // ms：整页淡出时长
  var FADE_HOLD = 140;     // ms：全黑停留，让黑帧落地再跳转 → 与场景页黑屏无缝
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var routeVeil = null;
  var routeHref = null;
  var veilRaf = null;
  var leaving = false;    // 转场中：连点两张卡片只跳一次
  var navFired = false;   // 跳转已执行：让尚未到点的兜底定时器失效（bfcache 恢复后定时器会继续跑）

  // 两头慢中段快的正弦缓动：比本站默认的 --ease（强 ease-out，起步就把黑幕推上来）更能看清“淡出”过程
  var easeInOutSine = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };

  // 卡片 → 场景 id：取图名去扩展名（scene-01 / service-02…），带在 ?scene= 上给场景页取用
  var sceneHrefOf = function (card) {
    var img = card && card.querySelector ? card.querySelector("img") : null;
    var name = img ? String(img.getAttribute("src") || "").split("/").pop() : "";
    var id = name.replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
    return SCENE_HREF + (id ? "?scene=" + encodeURIComponent(id) : "");
  };

  var gotoRoute = function () {
    if (navFired || !routeHref) return;
    navFired = true;
    location.assign(routeHref);
  };

  // 遮罩只创建一次（常驻 body 末尾，opacity 由下面的补间逐帧写 inline style）
  var ensureVeil = function () {
    if (routeVeil) return routeVeil;
    routeVeil = document.createElement("div");
    routeVeil.className = "route-veil";
    routeVeil.setAttribute("aria-hidden", "true");
    document.body.appendChild(routeVeil);
    return routeVeil;
  };

  // 遮罩透明度补间：淡出用于转场，淡入用于 bfcache 返回时把页面“显影”回来
  var tweenVeil = function (from, to, dur, done) {
    if (veilRaf != null) { cancelAnimationFrame(veilRaf); veilRaf = null; }
    var veil = ensureVeil();
    var t0 = performance.now();
    var step = function (now) {
      var t = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur);
      veil.style.opacity = (from + (to - from) * easeInOutSine(t)).toFixed(3);
      if (t < 1) { veilRaf = requestAnimationFrame(step); return; }
      veilRaf = null;
      if (done) done();
    };
    veilRaf = requestAnimationFrame(step);
  };

  var openScene = function (card) {
    if (leaving) return;
    leaving = true;
    routeHref = sceneHrefOf(card);
    navFired = false;
    if (prefersReducedMotion) { gotoRoute(); return; }
    var veil = ensureVeil();
    document.body.classList.add("route-leaving");   // 锁滚动：淡出期间页面不再跟滚轮/惯性动
    // 兜底：rAF 被挂起（切后台/低电量节流）时也要能跳走
    setTimeout(gotoRoute, FADE_DUR + FADE_HOLD + 800);
    tweenVeil(0, 1, FADE_DUR, function () {
      veil.style.pointerEvents = "auto";   // 全黑后接管点击，跳转前不再误触底下内容
      setTimeout(gotoRoute, FADE_HOLD);
    });
  };

  // bfcache 恢复：把遮罩淡回透明并解掉滚动锁，同时作废仍在排队的兜底定时器（否则一回到页面就又被跳走）
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    leaving = false;
    navFired = true;
    document.body.classList.remove("route-leaving");
    if (!routeVeil) return;
    var from = parseFloat(routeVeil.style.opacity || "0") || 0;
    routeVeil.style.pointerEvents = "";
    if (prefersReducedMotion || from <= 0.01) { routeVeil.style.opacity = "0"; return; }
    tweenVeil(from, 0, 320);
  });

  if (feedWall) {
    feedWall.addEventListener("click", function (e) {
      var find = e.target.closest ? e.target.closest.bind(e.target) : null;
      if (!find) return;
      // 信息条里的「立刻进入」：两端都直接进场景（上方 is-touch 区块对 .card-info 内的点击已提前 return，不会同时触发展开）
      var cta = find(".card-info-cta");
      if (cta) { openScene(cta.closest(".react-photo-album--photo")); return; }
      // 触屏点卡片本体 = 展开信息条，不直接进场景
      if (isTouchDevice || find(".card-info")) return;
      // .feed-item = CDN 不可用时的静态兜底格子，一并支持
      var card = find(".react-photo-album--photo, .feed-item");
      if (card) openScene(card);
    });
  }

  /* ======== Showreel 播放 / 暂停 ======== */
  var reelVideo = document.getElementById("reelVideo");
  var reelToggle = document.getElementById("reelToggle");

  if (reelVideo && reelToggle) {
    reelToggle.addEventListener("click", function () {
      if (reelVideo.paused) {
        reelVideo.muted = false;
        reelVideo.play().catch(function () {
          // 自动带声播放被拦截时退回静音播放
          reelVideo.muted = true;
          reelVideo.play().catch(function () {});
        });
      } else {
        reelVideo.pause();
      }
    });

    var syncReelBtn = function () {
      reelToggle.classList.toggle("is-playing", !reelVideo.paused);
      reelToggle.setAttribute("aria-label", reelVideo.paused ? "播放视频" : "暂停视频");
    };
    reelVideo.addEventListener("play", syncReelBtn);
    reelVideo.addEventListener("pause", syncReelBtn);
  }

  /* ======== 进场动画 ======== */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ======== 移动端视频诊断浮层（仅 ?debug=1 时启用）========
   * 手机上无法开 devtools；URL 带 ?debug=1 时在左下角常驻显示视频加载/seek 状态，
   * 用于远程定位“scrub 不动”类问题。不加参数零影响，无痕可删。 */
  if (location.search.indexOf("debug=1") !== -1) {
    var dbg = document.createElement("div");
    dbg.setAttribute("aria-hidden", "true");
    dbg.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;background:rgba(0,0,0,.78);color:#4f4;font:11px/1.55 monospace;padding:8px 10px;border-radius:6px;white-space:pre;pointer-events:none;";
    document.body.appendChild(dbg);
    setInterval(function () {
      var v = document.querySelector(".hero-video");
      var st = window.__TINTTEX_STATE__ || {};
      if (!v) { dbg.textContent = "no .hero-video element"; return; }
      dbg.textContent = [
        "readyState=" + v.readyState + " (0=NOTHING 1=META 2=DATA 3=FUTURE 4=ENOUGH)",
        "networkState=" + v.networkState + " (0=EMPTY 1=IDLE 2=LOADING 3=NO_SOURCE)",
        "duration=" + (isNaN(v.duration) ? "NaN" : v.duration.toFixed(2)),
        "currentTime=" + v.currentTime.toFixed(3),
        "targetTime=" + ((window.__TINTTEX_STATE__ && st.videoTarget) || 0).toFixed(3),
        "seeking=" + v.seeking + " paused=" + v.paused,
        "videoWxH=" + v.videoWidth + "x" + v.videoHeight,
        "error=" + (v.error ? v.error.code : "0"),
        "scrollY=" + Math.round(st.scrollY || 0) + " p=" + (st.p != null ? st.p.toFixed(3) : "-")
      ].join("\n");
    }, 200);
  }
})();
