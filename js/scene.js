/* Tinttex 场景页（scene.html）— 加载编排 + 返回
   示例路由页：进场全黑 loading（“正在准备场景”+ pulse-3 涟漪），
   资源就绪且不少于最短展示时长后给 <body> 加 scene-ready → loading 淡出、viewport 占位淡入。
   接入真实 3D 场景时：把下面的“就绪”判定换成场景引擎的首帧回调（其余转场逻辑不动）。 */
(function () {
  "use strict";

  /* 触屏检测与主页一致（本页不加载 main.js）：加 is-touch 后 CSS 的全局触屏约束生效
     （禁双击缩放/长按选中、按钮 hover 残留复位） */
  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
    document.documentElement.classList.add("is-touch");
  }

  /* 禁双指捏合缩放（JS 兜底）：iOS Safari 无视 viewport 的 user-scalable=no，CSS touch-action:none 之外再拦一道——
     gesture* 是 Safari 捏合专属事件；双指 touchmove 兜底覆盖其余内核。
     只拦多指：单指 tap/单指 pan（面板内滚动）完全不受影响 */
  if (document.documentElement.classList.contains("is-touch")) {
    var stopPinch = function (e) { e.preventDefault(); };
    document.addEventListener("gesturestart", stopPinch);
    document.addEventListener("gesturechange", stopPinch);
    document.addEventListener("gestureend", stopPinch);
    document.addEventListener("touchmove", function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  /* ======== loading 编排 ======== */
  var MIN_LOADING = 1200;   // ms：最短展示时长——资源已缓存时也不让 loading 一闪而过（看不清发生了什么）
  var MAX_LOADING = 4000;   // ms：兜底上限——慢网下 window load 迟迟不来也要放行，不把人永久关在黑屏
  var POLL = 120;           // ms：等待 load 的轮询间隔
  // 减弱动效：不留最短展示时长（就绪即放行），CSS 侧同时关掉淡出过渡与涟漪图标
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) MIN_LOADING = 0;

  var t0 = performance.now();
  var loaded = document.readyState === "complete";   // 脚本 defer 执行时 load 可能已经触发过
  window.addEventListener("load", function () { loaded = true; }, { once: true });

  var waitReady = function () {
    var waited = performance.now() - t0;
    if (waited < MIN_LOADING) { setTimeout(waitReady, MIN_LOADING - waited); return; }
    if (!loaded && waited < MAX_LOADING) { setTimeout(waitReady, POLL); return; }
    document.body.classList.add("scene-ready");
  };
  waitReady();

  /* ======== 场景 id ========
     来源页（index/explore）把点击卡片的图名带在 ?scene= 上；示例页只显示在占位标签里，
     真实场景按它加载对应的 splat 资源 */
  var idEl = document.getElementById("sceneId");
  var sceneId = new URLSearchParams(location.search).get("scene");
  if (idEl && sceneId) idEl.textContent = sceneId;

  /* ======== 返回 ========
     优先 history.back（回来源页并保留其滚动位置）；直接打开本页（无来源）时退回主页 */
  var backBtn = document.getElementById("sceneBack");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (history.length > 1) history.back();
      else location.assign("index.html");
    });
  }

  /* ======== AI agent 面板：入口钮 → body.agent-open（shape 展开/收起全在 CSS）========
     开：点右下入口钮；关：面板右上 × 或 Esc。
     关闭时若焦点还在面板里（键盘/读屏流），交还入口钮，焦点不落地丢。
     推荐项是入口级交互：点击把文案填进输入框并聚焦（用户可继续改字）；
     发送钮暂为空入口（无 handler），等 AI 客服接线后在这里接发送逻辑。 */
  var agentPanel = document.getElementById("agentPanel");
  var agentBtn = document.getElementById("sceneAi");
  var agentClose = document.getElementById("agentClose");
  var agentField = document.getElementById("agentField");

  var setAgent = function (open) {
    var wasOpen = document.body.classList.contains("agent-open");
    if (open === wasOpen) return;
    document.body.classList.toggle("agent-open", open);
    if (!open && agentPanel && agentPanel.contains(document.activeElement) && agentBtn) agentBtn.focus();
  };

  if (agentBtn) agentBtn.addEventListener("click", function () { setAgent(true); });
  if (agentClose) agentClose.addEventListener("click", function () { setAgent(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setAgent(false);
  });
  if (agentPanel) {
    agentPanel.addEventListener("click", function (e) {
      var sug = e.target.closest ? e.target.closest(".agent-sug") : null;
      if (!sug || !agentField) return;
      agentField.value = String(sug.textContent || "").replace(/\s+/g, " ").trim();
      agentField.focus();
    });
  }
})();
