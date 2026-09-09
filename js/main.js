/* Tinttex Landing Page — 交互脚本 */
(function () {
  "use strict";

  /* ======== 全屏菜单 ======== */
  var menuToggle = document.getElementById("menuToggle");
  var menu = document.getElementById("menu");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!document.body.classList.contains("menu-open"));
  });

  // 点击菜单链接：先关闭菜单再滚动
  menu.querySelectorAll("[data-menu-link]").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ======== Hero 视频自动播放兜底 ======== */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    var tryPlay = function () { heroVideo.play().catch(function () {}); };
    tryPlay();
    heroVideo.addEventListener("canplay", tryPlay);
    // 被浏览器拦截时，首次触摸页面即尝试播放
    document.addEventListener("touchstart", tryPlay, { once: true });
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
