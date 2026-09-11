/* auth modal (light theme) */
var CSS = `
.auth{--bg:#fff;--bg-deep:#0a0a0a;--text:#0a0a0a;--text-dim:#5a5a5a;--line:#e2e2e2;--line-soft:#ededed;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans SC",sans-serif;-webkit-font-smoothing:antialiased;box-sizing:border-box}.auth *,.auth *::before,.auth *::after{box-sizing:inherit}
.auth button,.auth input{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0}
.auth button{cursor:pointer}
.auth a{color:inherit;text-decoration:none}.auth :focus-visible{outline:2px solid var(--text);outline-offset:2px}
.modal{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:20px}
.modal-card{position:relative;width:min(920px,100%);max-height:min(640px,100%);background:var(--bg);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex}.modal-close{position:absolute;top:14px;right:14px;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;color:var(--text)}
.modal-close:hover{background:var(--line-soft)}
.modal-close svg{width:18px;height:18px}
.modal-logo{width:44px;height:44px;border-radius:12px;background:var(--line-soft);display:grid;place-items:center;color:var(--text)}
.modal-logo svg{width:24px;height:24px}.modal-main{flex:1;padding:44px 48px;overflow-y:auto;min-width:0}
.modal-title{margin-top:22px;font-size:28px;font-weight:700;letter-spacing:-.01em}
.modal-sub{margin-top:6px;font-size:13px;color:var(--text-dim)}
.modal-form{margin-top:26px;display:flex;flex-direction:column;gap:14px}
.field input{width:100%;height:48px;padding:0 44px 0 16px;border:1px solid var(--line);border-radius:10px;font-size:14px}.field input:focus{outline:none;border-color:var(--text)}
.field input::placeholder{color:var(--text-dim)}
.field-eye{position:absolute;top:0;right:0;width:44px;height:48px;display:grid;place-items:center;color:var(--text-dim)}
.field-eye svg{width:18px;height:18px}
.field-hint{margin-top:-8px;font-size:11.5px;color:var(--text-dim)}.forgot{align-self:flex-start;font-size:12.5px;color:var(--text);text-decoration:underline;text-underline-offset:3px}
.btn-primary{width:100%;height:48px;border-radius:10px;background:var(--bg-deep);color:var(--bg);font-size:14px;font-weight:600}
.btn-primary:hover{opacity:.9}
.modal-or{display:flex;align-items:center;gap:12px;color:var(--text-dim);font-size:12px}.modal-or::before,.modal-or::after{content:"";flex:1;height:1px;background:var(--line)}
.btn-oauth{width:100%;height:48px;border-radius:10px;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;font-weight:500}
.btn-oauth:hover{background:var(--line-soft)}
.oauth-g{width:18px;height:18px}.modal-switch{margin-top:18px;font-size:13px;color:var(--text-dim)}
.modal-switch .modal-link{color:var(--text);text-decoration:underline;text-underline-offset:3px}
.modal-legal{margin-top:14px;font-size:11px;line-height:1.6;color:var(--text-dim)}
.modal-side{width:340px;flex:none;background:var(--line-soft);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px}.modal-qr{width:150px;height:150px;padding:12px;background:var(--bg);border-radius:12px}
.modal-qr svg{width:100%;height:100%}
.modal-side-text{font-size:13px;color:var(--text-dim);text-align:center}
.modal-side-text strong{color:var(--text)}
@media(max-width:820px){.modal-side{display:none}}
@media(max-width:480px){.modal-main{padding:32px 22px}}
`;document.head.appendChild(Object.assign(document.createElement("style"),{textContent:CSS}));
var ICON={
eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/></svg>',
info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>',
google:'<svg class="oauth-g" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4"/><text x="12" y="16" text-anchor="middle" font-size="12" fill="#fff" font-family="Arial">G</text></svg>',qr:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM5 5v4h4V5zM13 3h8v8h-8zM15 5v4h4V5zM3 13h8v8H3zM5 15v4h4v-4zM13 13h2v2h-2zM17 13h4v2h-4zM13 17h2v4h-2zM17 17h2v2h-2zM19 19h2v2h-2z"/></svg>'
};var NAVCSS = `
.nav-auth{height:46px;padding:0 22px;border-radius:8px;font-size:13px;font-weight:600;transition:opacity .2s,background .2s}
.nav-auth--login{background:#0a0a0a;color:#fff;border:1px solid rgba(255,255,255,.4)}
.nav-auth--login:hover{opacity:.85}.nav-auth--signup{background:#f0f0f0;color:#0a0a0a;border:1px solid #f0f0f0}
.nav-auth--signup:hover{background:#e4e4e4}
@media(max-width:480px){.nav-auth{height:38px;padding:0 14px;font-size:12px}}
`;
document.head.appendChild(Object.assign(document.createElement("style"),{textContent:NAVCSS}));var VIEWS={};
VIEWS.login = `
<div class="modal-main">
  <div class="modal-logo" style="font-size:20px;font-weight:700">T</div>
  <h2 class="modal-title">欢迎回到 Tinttex</h2>
  <p class="modal-sub">登录以发现更多为你准备的高斯泼溅场景</p>
  <form class="modal-form" novalidate>
    <label class="field"><input type="email" placeholder="邮箱" autocomplete="email"></label>    <label class="field"><input type="password" placeholder="密码" autocomplete="current-password"><button class="field-eye" type="button" data-eye aria-label="显示或隐藏">${ICON.eye}</button></label>
    <a class="forgot" href="#">忘记密码？</a>
    <button class="btn-primary" type="submit">登录</button>
    <div class="modal-or"><span>或</span></div>
    <button class="btn-oauth" type="button">${ICON.google}使用 Google 继续</button>
  </form>  <p class="modal-switch">还没有账号？<button class="modal-link" type="button" data-open="signup">立即注册</button></p>
  <p class="modal-legal">继续即表示你同意我们的服务条款与隐私政策。</p>
</div>
<div class="modal-side">
  <div class="modal-qr">${ICON.qr}</div>
  <p class="modal-side-text">使用手机扫码<strong>下载 Tinttex</strong></p>
</div>`;VIEWS.signup = `
<div class="modal-main">
  <div class="modal-logo" style="font-size:20px;font-weight:700">T</div>
  <h2 class="modal-title">加入 Tinttex</h2>
  <p class="modal-sub">免费注册，发现更多高斯泼溅场景</p>
  <form class="modal-form" novalidate>
    <label class="field"><input type="email" placeholder="输入你的邮箱" autocomplete="email"></label>    <label class="field"><input type="password" placeholder="创建密码" autocomplete="new-password"><button class="field-eye" type="button" data-eye aria-label="显示或隐藏">${ICON.eye}</button></label>
    <p class="field-hint">使用 8 位或以上字母、数字与符号</p>
    <label class="field"><input type="text" placeholder="生日（mm/dd/yyyy）"></label>    <button class="btn-primary" type="submit">继续</button>
    <div class="modal-or"><span>或</span></div>
    <button class="btn-oauth" type="button">${ICON.google}使用 Google 继续</button>
  </form>  <p class="modal-switch">已有账号？<button class="modal-link" type="button" data-open="login">登录</button></p>
  <p class="modal-switch">你是企业用户？<button class="modal-link" type="button">立即开通</button></p>
  <p class="modal-legal">继续即表示你同意 Tinttex 的服务条款并确认已阅读隐私政策。</p>
</div>`;var root=document.createElement("div");
root.className="auth";root.hidden=true;
root.innerHTML='<div class="modal" role="dialog" aria-modal="true"><div class="modal-card"></div></div>';
document.body.appendChild(root);
var modal=root.querySelector(".modal"),card=root.querySelector(".modal-card");function render(v){card.innerHTML='<button class="modal-close" data-close aria-label="关闭">'+ICON.close+'</button>'+(VIEWS[v]||VIEWS.login);}
function open(v){render(v);root.hidden=false;document.body.style.overflow="hidden";}
function close(){root.hidden=true;document.body.style.overflow="";}root.addEventListener("click",function(e){
  if(e.target.closest("[data-close]")||e.target===modal){close();return;}
  var sw=e.target.closest("[data-open]");if(sw){open(sw.getAttribute("data-open"));return;}
  var eye=e.target.closest("[data-eye]");if(eye){var i=eye.parentNode.querySelector("input");i.type=i.type==="password"?"text":"password";}
});