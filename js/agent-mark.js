/* Tinttex — AI agent mark 组件（agent-mark.js）
   自包含组件：向任意 [data-agent-mark] 宿主注入花形 SVG，并驱动四层动效——
     1) 辉光：宿主 ::before 光晕呼吸（纯 CSS，见 style.css 的 .agent-mark 区块）；
     2) 自转：花瓣组整体缓慢顺时针转（渐变是 userSpaceOnUse，随组绕行一圈，转才看得见）；
     3)  blob：每瓣圆按 JS 注入的各自周期/振幅/相位做轻微 scale+translate → 整朵花不规则地扩散收缩；
     4)  双眼：随机间隔眨眼（scaleY 模拟）+ 时不时整体左右看（眼组 translateX）。
   复用方式：放置处写 <span class="agent-mark" data-agent-mark></span> 即可，尺寸由外部 .agent-mark 的宽高控制；
   同一页多实例互不干扰（渐变 id 带随机后缀、每实例独立随机种子）。
   reduced-motion：CSS 侧停掉全部动画，JS 侧不起眼部调度器，留一朵静态花。 */
(function () {
  "use strict";

  /* 六瓣 + 圆心坐标（viewBox 0 0 64 64）；双眼间距拉开：中心 x = 25.6 / 38.4（再远一档，脸更“呆萌”） */
  var PETALS = [[32, 18], [44.1, 25], [44.1, 39], [32, 46], [19.9, 39], [19.9, 25]];
  var CORE = [32, 32, 15];
  var LOOK_PX = 2;     // 左右看的位移量：瞳孔只挪一点点，读作“瞟一眼”而不是平移整脸

  var rand = function (min, max) { return min + Math.random() * (max - min); };

  var markTpl = function (uid) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + uid + '" gradientUnits="userSpaceOnUse" x1="14" y1="8" x2="52" y2="58">' +
      '<stop offset="0" stop-color="#38bdf8"/><stop offset="0.35" stop-color="#8b5cf6"/>' +
      '<stop offset="0.68" stop-color="#ec4899"/><stop offset="1" stop-color="#fb923c"/>' +
      '</linearGradient></defs>' +
      '<g class="am-spin" fill="url(#' + uid + ')">' +
      PETALS.map(function (p) {
        return '<circle class="am-petal" cx="' + p[0] + '" cy="' + p[1] + '" r="12"/>';
      }).join("") +
      '<circle class="am-petal" cx="' + CORE[0] + '" cy="' + CORE[1] + '" r="' + CORE[2] + '"/>' +
      '</g>' +
      '<g class="am-eyes">' +
      '<rect class="am-eye" x="23.3" y="25" width="4.6" height="10" rx="2.3" fill="#fff"/>' +
      '<rect class="am-eye" x="36.1" y="25" width="4.6" height="10" rx="2.3" fill="#fff"/>' +
      '</g></svg>';
  };

  /* ======== 眼部调度：眨眼 + 左右看 ========
     全部走 CSS 变量（--am-sy / --am-look），过渡曲线在 style.css → JS 只负责“什么时候动一下” */
  var startEyes = function (svg) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var eyes = svg.querySelector(".am-eyes");
    if (!eyes) return;

    var blink = function () {
      svg.style.setProperty("--am-sy", "0.12");   // 垂直压扁 = 闭眼
      setTimeout(function () { svg.style.setProperty("--am-sy", "1"); }, 90);
      // 两成概率连眨第二次（双眨更像活物）
      if (Math.random() < 0.22) {
        setTimeout(function () {
          svg.style.setProperty("--am-sy", "0.12");
          setTimeout(function () { svg.style.setProperty("--am-sy", "1"); }, 90);
        }, 210);
      }
    };
    var scheduleBlink = function () {
      setTimeout(function () {
        if (!document.hidden) blink();   // 后台标签页不眨眼，回来看到的是自然状态
        scheduleBlink();
      }, rand(2200, 5200));
    };

    var scheduleLook = function () {
      setTimeout(function () {
        if (!document.hidden) {
          var dir = Math.random() < 0.5 ? -1 : 1;
          eyes.style.setProperty("--am-look", (dir * LOOK_PX).toFixed(1) + "px");
          // 看一会儿：多数情况收回正中，少数停在那儿等下一次调度再换边
          setTimeout(function () {
            if (Math.random() < 0.65) eyes.style.setProperty("--am-look", "0px");
          }, rand(600, 1500));
        }
        scheduleLook();
      }, rand(1800, 4600));
    };

    scheduleBlink();
    scheduleLook();
  };

  var mount = function (host) {
    if (host.__amMounted) return;
    host.__amMounted = true;
    var uid = "amg" + Math.random().toString(36).slice(2, 8);
    host.innerHTML = markTpl(uid);
    var svg = host.querySelector("svg");
    if (!svg) return;
    // 每瓣独立周期/振幅/相位/位移：同一套 keyframes 读不同变量 → 呼吸错拍，shape 不规则扩散收缩
    svg.querySelectorAll(".am-petal").forEach(function (p) {
      p.style.setProperty("--am-amp", rand(0.92, 1.28).toFixed(3));   // 区间跨过 1：有的瓣缩有的瓣胀，瓣间大小差才读得出来
      p.style.setProperty("--am-dx", rand(-2, 2).toFixed(2) + "px");
      p.style.setProperty("--am-dy", rand(-2, 2).toFixed(2) + "px");
      p.style.setProperty("--am-dur", rand(2.4, 4.2).toFixed(2) + "s");
      p.style.setProperty("--am-delay", (-rand(0, 4)).toFixed(2) + "s");   // 负延迟：进场即处于呼吸中段，不同步起步
    });
    startEyes(svg);
  };

  document.querySelectorAll("[data-agent-mark]").forEach(mount);
})();
