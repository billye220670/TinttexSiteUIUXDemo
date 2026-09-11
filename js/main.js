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
    heroVideo.pause();
    var holdFirstFrame = function () {
      try { heroVideo.currentTime = 0; } catch (e) {}
      heroVideo.pause();
    };
    if (heroVideo.readyState >= 1) holdFirstFrame();
    else heroVideo.addEventListener("loadedmetadata", holdFirstFrame);
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
  var feedCta = document.querySelector(".feed-cta");
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
      CTA_MAX_BLUR: 28,         // “探索更多”CTA 末态模糊 px
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
      FEED_MARGIN: 0            // .feed margin-top vh（负=瀑布流提前上升与 hero 重叠）
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

    // 用 rAF 把 currentTime 平滑 lerp 到目标，避免每次 scroll 直接 seek 造成跳动
    var tickVideo = function () {
      videoRafId = null;
      var dur = heroVideo.duration;
      if (!dur || isNaN(dur)) return;
      var cur = heroVideo.currentTime;
      var diff = videoTargetTime - cur;
      if (Math.abs(diff) < 0.008) {
        if (cur !== videoTargetTime) heroVideo.currentTime = videoTargetTime;
        return;
      }
      heroVideo.currentTime = cur + diff * TUNE.LERP;
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
        // 整个标题组（主标题+副标题）同节奏模糊渐隐/放大
        heroCopy.style.transform = "translate(-50%, 0) scale(" + (1 + (TUNE.TITLE_MAX_SCALE - 1) * blurT).toFixed(3) + ")";
        heroCopy.style.filter = "blur(" + (TUNE.TITLE_MAX_BLUR * blurT).toFixed(2) + "px)";
        heroCopy.style.opacity = (1 - opacT).toFixed(3);
        // “探索更多” CTA 与标题同节奏；完全消失后 visibility:hidden 断掉 fixed 元素的点击
        if (feedCta) {
          feedCta.style.filter = "blur(" + (TUNE.CTA_MAX_BLUR * blurT).toFixed(2) + "px)";
          feedCta.style.opacity = (1 - opacT).toFixed(3);
          feedCta.style.visibility = opacT >= 1 ? "hidden" : "visible";
        }
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

      // 供左上角调参面板读取的实时状态
      window.__TINTTEX_STATE__ = { p: p, scrollY: y, pinDistance: pinDistance, currentTime: heroVideo.currentTime, duration: dur || 0, mode: TUNE.MODE, title: isState ? titleS : blurT, feed: sF };
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
})();
