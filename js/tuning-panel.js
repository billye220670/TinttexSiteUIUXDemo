/* ============================================================
   Tinttex 调参面板（开发用，左上角固定）
   ------------------------------------------------------------
   · 依赖 main.js 先执行：读取 window.__TINTTEX_TUNE__（参数）、
     window.__TINTTEX_UPDATE__（改完重算一帧）、window.__TINTTEX_STATE__（实时状态）
   · 顶部 checkbox 切换「标题消隐 / 瀑布流盖上」的驱动模式：
       未勾 = interp（按滚动位置 smoothstep 插值）
       勾选 = state （Schmitt 阈值触发 + 时间补间，与滚动速度解耦）
     两种模式各自的参数都列出，切到哪个模式就调哪一组
   · 拖滑块 / 改数字 → 实时生效；布局类参数（HERO_H / FEED_MARGIN）写入元素 inline style
   · “复制全部参数”把当前值（含 MODE）拷到剪贴板，发给开发写回默认值即可锁定
   · 锁定后：删掉 index.html 里本脚本的 <script> 行 + 本文件，页面回到 CSS/JS 默认值
   ============================================================ */
(function () {
  "use strict";

  var TUNE = window.__TINTTEX_TUNE__;
  var update = window.__TINTTEX_UPDATE__;
  if (!TUNE || typeof update !== "function") return; // main.js 未就绪 / hero 缺失

  var hero = document.querySelector(".hero");
  var feed = document.querySelector(".feed");

  // 估算：整段视频机位下降的表观位移（屏数）。仅用于下方“背景速度”读数，不参与渲染。
  var DESCENT_SCREENS = 2.5;

  // 参数表：k=键, label=显示名, min/max/step=范围, css=写入 inline style 而非 TUNE 数值渲染
  // 分组按「共用 / 插值模式 / 状态模式」区分，方便对照当前 MODE 调对应那组
  var SCHEMA = [
    { g: "标题消隐 · 末态（两模式共用）" },
    { k: "TITLE_MAX_BLUR", label: "最大模糊px", min: 0, max: 60, step: 1 },
    { k: "TITLE_MAX_SCALE", label: "最大放大", min: 1, max: 2.5, step: 0.01 },

    { g: "标题消隐 · 插值模式 (interp)" },
    { k: "TITLE_START", label: "起始 p", min: 0, max: 1, step: 0.01 },
    { k: "TITLE_BLUR_RAMP", label: "模糊跨度", min: 0.02, max: 1, step: 0.01 },
    { k: "TITLE_OPACITY_RAMP", label: "淡出跨度", min: 0.02, max: 1, step: 0.01 },

    { g: "标题消隐 · 状态模式 (state)" },
    { k: "TITLE_ENTER", label: "触发 p", min: 0, max: 1, step: 0.01 },
    { k: "TITLE_EXIT", label: "回退 p", min: 0, max: 1, step: 0.01 },
    { k: "TITLE_SPEED", label: "补间速度/s", min: 0.2, max: 5, step: 0.1 },

    { g: "视频机位下降 (scrub)" },
    { k: "SCRUB_START", label: "起播 p", min: 0, max: 1, step: 0.01 },
    { k: "SCRUB_END", label: "定格 p", min: 0.05, max: 1, step: 0.01 },
    { k: "VIDEO_T0", label: "起播秒", min: 0, max: 12, step: 0.1 },
    { k: "VIDEO_T1", label: "停播秒", min: 0.1, max: 12, step: 0.1 },
    { k: "LERP", label: "跟随平滑", min: 0.02, max: 1, step: 0.01 },

    { g: "渐变黑幕" },
    { k: "VEIL_START", label: "淡入起 p", min: 0, max: 1, step: 0.01 },
    { k: "VEIL_END", label: "淡入止 p", min: 0.05, max: 1, step: 0.01 },
    { k: "VEIL_MAX", label: "最大不透明", min: 0, max: 1, step: 0.01 },

    { g: "定格后 recede（变暗变模糊）" },
    { k: "VIDEO_BLUR_START", label: "变暗起 p", min: 0, max: 1, step: 0.01 },
    { k: "VIDEO_BLUR_END", label: "变暗止 p", min: 0.05, max: 1, step: 0.01 },
    { k: "VIDEO_MAX_BLUR", label: "最大模糊px", min: 0, max: 60, step: 1 },
    { k: "VIDEO_MIN_BRIGHT", label: "末态亮度", min: 0, max: 1, step: 0.01 },

    { g: "瀑布流盖上 · 共用" },
    { k: "FEED_COVER", label: "盖上行程vh", min: 0, max: 160, step: 1 },

    { g: "瀑布流盖上 · 插值模式 (interp)" },
    { k: "FEED_START", label: "起升 p", min: 0, max: 1, step: 0.01 },
    { k: "FEED_RAMP", label: "到位跨度", min: 0.02, max: 1, step: 0.01 },

    { g: "瀑布流盖上 · 状态模式 (state)" },
    { k: "FEED_ENTER", label: "触发 p", min: 0, max: 1, step: 0.01 },
    { k: "FEED_EXIT", label: "回退 p", min: 0, max: 1, step: 0.01 },
    { k: "FEED_SPEED", label: "补间速度/s", min: 0.2, max: 5, step: 0.1 },

    { g: "布局 (vh)" },
    { k: "HERO_H", label: "hero 高", min: 120, max: 400, step: 1, css: true },
    { k: "FEED_MARGIN", label: "feed 上移", min: -120, max: 0, step: 1, css: true }
  ];

  /* -------- 注入面板样式（自包含，删脚本即无痕） -------- */
  var style = document.createElement("style");
  style.textContent = [
    ".tp{position:fixed;top:10px;left:10px;z-index:99999;width:272px;max-height:calc(100vh - 20px);",
    "display:flex;flex-direction:column;background:rgba(16,16,18,.95);color:#e8e8e8;",
    "border:1px solid rgba(255,255,255,.16);border-radius:10px;box-shadow:0 10px 34px rgba(0,0,0,.55);",
    "font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;backdrop-filter:blur(7px)}",
    ".tp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;",
    "font-weight:700;letter-spacing:.05em;border-bottom:1px solid rgba(255,255,255,.12);",
    "position:sticky;top:0;background:rgba(16,16,18,.98);border-radius:10px 10px 0 0;cursor:move}",
    ".tp-head b{color:#6ee787}",
    ".tp-x{color:#e8e8e8;font:inherit;line-height:1;padding:2px 7px;border:1px solid rgba(255,255,255,.22);border-radius:5px;cursor:pointer}",
    ".tp-x:hover{background:rgba(255,255,255,.12)}",
    ".tp-body{padding:8px 9px 10px;overflow-y:auto}",
    ".tp-read{padding:6px 8px;margin-bottom:8px;background:rgba(255,255,255,.055);border-radius:7px;white-space:nowrap}",
    ".tp-read b{color:#fff}.tp-read .ok{color:#6ee787}.tp-read .bad{color:#ff7b72}",
    ".tp-mode{display:flex;align-items:center;gap:7px;margin:2px 0 9px;padding:7px 8px;cursor:pointer;",
    "background:rgba(110,231,135,.1);border:1px solid rgba(110,231,135,.32);border-radius:7px;color:#d6ffe0;font-weight:700}",
    ".tp-mode input{accent-color:#6ee787;width:14px;height:14px;cursor:pointer}",
    ".tp-mode small{display:block;font-weight:400;color:#9aa0a6;margin-top:1px}",
    ".tp-g{margin:10px 0 4px;font-size:10px;letter-spacing:.09em;color:#9aa0a6;text-transform:uppercase;",
    "border-bottom:1px dashed rgba(255,255,255,.14);padding-bottom:2px}",
    ".tp-r{display:grid;grid-template-columns:76px 1fr 48px;align-items:center;gap:6px;margin:3px 0}",
    ".tp-n{color:#cfcfcf;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tp-range{width:100%;accent-color:#6ee787;cursor:pointer}",
    ".tp-num{width:48px;font:inherit;color:#fff;background:rgba(255,255,255,.09);",
    "border:1px solid rgba(255,255,255,.16);border-radius:4px;padding:1px 3px}",
    ".tp-copy{margin-top:11px;width:100%;padding:8px;font:inherit;font-weight:700;color:#0a0a0a;",
    "background:#e8e8e8;border:0;border-radius:7px;cursor:pointer}",
    ".tp-copy:hover{background:#fff}",
    ".tp-hint{margin-top:6px;color:#8b9096;font-size:10px;line-height:1.5}"
  ].join("");
  document.head.appendChild(style);

  /* -------- 构建面板 -------- */
  var panel = document.createElement("div");
  panel.className = "tp";
  panel.innerHTML =
    '<div class="tp-head"><span>Tinttex 调参 <b>●</b></span>' +
    '<button class="tp-x" type="button" title="折叠/展开">–</button></div>' +
    '<div class="tp-body"></div>';
  document.body.appendChild(panel);

  var head = panel.querySelector(".tp-head");
  var body = panel.querySelector(".tp-body");
  var toggleBtn = panel.querySelector(".tp-x");

  // 实时读数
  var read = document.createElement("div");
  read.className = "tp-read";
  body.appendChild(read);

  // 模式切换 checkbox：state(状态触发) / interp(插值)
  var modeRow = document.createElement("label");
  modeRow.className = "tp-mode";
  modeRow.innerHTML =
    '<input type="checkbox" class="tp-mode-cb">' +
    '<span>状态触发 (state)<small>未勾 = 插值 (interp)；影响「标题消隐 / 瀑布流盖上」</small></span>';
  body.appendChild(modeRow);
  var modeCb = modeRow.querySelector(".tp-mode-cb");
  modeCb.checked = TUNE.MODE === "state";
  modeCb.addEventListener("change", function () {
    TUNE.MODE = modeCb.checked ? "state" : "interp";
    update();
  });

  // 布局参数写入 inline style（覆盖媒体查询，所见即所得）
  function applyCss() {
    if (hero) hero.style.height = TUNE.HERO_H + "vh";
    if (feed) feed.style.marginTop = TUNE.FEED_MARGIN + "vh";
  }

  // 逐行构建控件
  SCHEMA.forEach(function (item) {
    if (item.g) {
      var g = document.createElement("div");
      g.className = "tp-g";
      g.textContent = item.g;
      body.appendChild(g);
      return;
    }
    var row = document.createElement("div");
    row.className = "tp-r";
    row.innerHTML =
      '<span class="tp-n" title="' + item.k + '">' + item.label + "</span>" +
      '<input class="tp-range" type="range" min="' + item.min + '" max="' + item.max +
      '" step="' + item.step + '" value="' + TUNE[item.k] + '">' +
      '<input class="tp-num" type="number" min="' + item.min + '" max="' + item.max +
      '" step="' + item.step + '" value="' + TUNE[item.k] + '">';
    body.appendChild(row);

    var range = row.querySelector(".tp-range");
    var num = row.querySelector(".tp-num");

    function apply(raw, from) {
      var v = parseFloat(raw);
      if (isNaN(v)) return;
      TUNE[item.k] = v;
      if (item.css) applyCss();
      update();
      if (from !== "range") range.value = v;
      if (from !== "num") num.value = v;
    }
    range.addEventListener("input", function () { apply(range.value, "range"); });
    num.addEventListener("input", function () { apply(num.value, "num"); });
    num.addEventListener("blur", function () { num.value = TUNE[item.k]; });
  });

  // 复制全部参数
  var copy = document.createElement("button");
  copy.className = "tp-copy";
  copy.type = "button";
  copy.textContent = "复制全部参数";
  body.appendChild(copy);

  var hint = document.createElement("div");
  hint.className = "tp-hint";
  hint.textContent = "调完点上面按钮复制，把结果粘给开发写回默认值即可锁定。读数里“背景速度”=视频机位下降表观速度÷前景（估算整段下降≈2.5屏，仅供理解快慢）。瀑布流盖上：FEED_COVER=0 关闭；≈100+FEED_MARGIN 时末态正好顶到视口顶（到顶），state 模式触发后直接盖上去。";
  body.appendChild(hint);

  copy.addEventListener("click", function () {
    var text = "MODE = " + TUNE.MODE + "\n" + SCHEMA.filter(function (i) { return i.k; })
      .map(function (i) { return i.k + " = " + TUNE[i.k]; })
      .join("\n");
    function done(ok) {
      copy.textContent = ok ? "已复制 ✓" : "复制失败(见控制台)";
      if (!ok) console.log(text);
      setTimeout(function () { copy.textContent = "复制全部参数"; }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  });

  // 折叠 / 展开
  toggleBtn.addEventListener("click", function () {
    var hidden = body.style.display === "none";
    body.style.display = hidden ? "" : "none";
    toggleBtn.textContent = hidden ? "–" : "+";
  });

  // 拖拽移动面板（按住标题栏）
  (function () {
    var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    head.addEventListener("mousedown", function (e) {
      if (e.target === toggleBtn) return;
      dragging = true;
      var r = panel.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      panel.style.transition = "none";
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      panel.style.left = Math.max(0, ox + e.clientX - sx) + "px";
      panel.style.top = Math.max(0, oy + e.clientY - sy) + "px";
      panel.style.right = "auto";
    });
    window.addEventListener("mouseup", function () { dragging = false; });
  })();

  /* -------- 实时读数循环 -------- */
  function loop() {
    var s = window.__TINTTEX_STATE__ || {};
    var pinScreens = Math.max(0.0001, (TUNE.HERO_H - 100) / 100);
    var span = (TUNE.SCRUB_END - TUNE.SCRUB_START) * pinScreens; // scrub 覆盖的滚动屏数
    var vdur = s.duration || 1;
    var ratio = span > 0 ? (DESCENT_SCREENS * (TUNE.VIDEO_T1 - TUNE.VIDEO_T0) / vdur) / span : 0;
    var cls = ratio <= 1 ? "ok" : "bad";
    read.innerHTML =
      "p <b>" + (s.p != null ? s.p.toFixed(3) : "–") + "</b> · " +
      "y <b>" + Math.round(s.scrollY || 0) + "</b><br>" +
      "模式 <b>" + (s.mode === "state" ? "state" : "interp") + "</b> · " +
      "标题 <b>" + (s.title != null ? s.title.toFixed(2) : "–") + "</b> · " +
      "瀑布 <b>" + (s.feed != null ? s.feed.toFixed(2) : "–") + "</b><br>" +
      "视频 <b>" + (s.currentTime != null ? s.currentTime.toFixed(2) : "0.00") + "s</b> / " +
      (s.duration ? s.duration.toFixed(2) : "–") + "s · " +
      '背景速度 <b class="' + cls + '">' + ratio.toFixed(2) + "× 前景</b>";
    requestAnimationFrame(loop);
  }

  // 初始化：把默认布局写进 inline style，重算一帧，启动读数
  applyCss();
  update();
  requestAnimationFrame(loop);
})();
