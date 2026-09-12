# Tinttex 落地页 — 后端对接交接文档

> 本文件是给**后端同学 + 其 AI Agent**看的对接交接说明。前端已把可对接的锚点准备好，
> 但**后端契约（数据类型、字段格式、认证方式、端点）从前端这边无法确定**——需由接手的 Agent **先调查后端代码库自答、再就剩下的决策项与开发者澄清**（完整工作流见 §0）。

---

## 快速开始 · 拉取代码（含国内 Git 镜像加速）

> **仓库是公开的（Public），clone 无需任何账号/凭据。** 下面命令可直接跑；国内网络慢就选带镜像的那条。

**仓库地址（canonical）**

```
https://github.com/billye220670/TinttexSiteUIUXDemo.git
```

**① 网络正常 → 直接拉**

```bash
git clone https://github.com/billye220670/TinttexSiteUIUXDemo.git
cd TinttexSiteUIUXDemo
```

**② 国内加速（三选一，任选一条能通的即可）**

- **A. 一次性全局换源（推荐；之后所有 github clone 自动加速）**
  ```bash
  git config --global url."https://gitclone.com/".insteadOf "https://github.com/"
  git clone https://github.com/billye220670/TinttexSiteUIUXDemo.git   # 自动走镜像
  # 用完想还原：
  git config --global --unset url."https://gitclone.com/".insteadOf
  ```
- **B. 单次用镜像域名（不改全局配置）**
  ```bash
  git clone https://gitclone.com/github.com/billye220670/TinttexSiteUIUXDemo.git
  # 或： git clone https://kkgithub.com/billye220670/TinttexSiteUIUXDemo.git
  ```
- **C. URL 前缀代理（ghproxy 系）**
  ```bash
  git clone https://mirror.ghproxy.com/https://github.com/billye220670/TinttexSiteUIUXDemo.git
  # 若该域名失效，换： https://gh-proxy.com/  或  https://ghproxy.net/  或  https://ghfast.top/
  ```

> ⚠️ **镜像注意事项**
> - 这些都是**社区公益代理、非 GitHub 官方**，域名可能随时调整或下线；一条不通就换下一条，或退回 ① 直连。可先 `curl -I <镜像域名>` 探测连通性。
> - 本仓库是公开的，走镜像安全。但**通用铁律**：**私有仓库 / 带 token 的请求绝不要走第三方镜像**（凭据可能泄露）——本项目不涉及，仅提醒。

**③ 拉下来之后（可选：跑起前端看效果）**

```bash
npm install          # 国内慢可先换源： npm config set registry https://registry.npmmirror.com
npm run dev          # Vite，默认 http://localhost:5173
```
> 照片墙依赖 CDN（esm.sh）联网加载 React；国内若 esm.sh 慢，照片墙可能退回静态兜底网格，属正常现象，不影响对接工作。

**④ Agent 从这里接手**
代码拉到本地后，接手的 AI Agent 请**从下面的 §0 开始**，按「读懂前端 → 先调查你自己的后端库 → 只就剩余项澄清 → 实现」四阶段推进。本文档 `BACKEND_HANDOVER.md` 就在仓库根目录。

---

## 0. 给接手的 AI Agent 的工作指令（请先读这一段）

你（AI Agent）正在协助开发者为这个纯前端落地页对接后端。**请严格按下面 4 个阶段推进；不要跳步，阶段 3 未落定前不要写任何业务代码。**

### 阶段 1 · 读懂前端要什么
通读本文档，重点：前端现状（§1–§2）、**已就绪的对接锚点**（§3）、必须遵守的**前端约束与陷阱**（§6）。弄清前端这边「已经准备好什么、还缺什么」。

### 阶段 2 · 先调查你自己的后端代码库（关键，别跳过、别急着问人）
在打扰开发者之前，**先自行勘察本项目的后端仓库**，把 §5 清单里「能从代码/配置查到」的项**自己答掉**。至少调查：
- 用的什么**框架 / 语言 / 目录结构**（决定端点与代码放哪）；
- **是否已有认证体系**：JWT？session？现成的 `login`/`register` 路由？鉴权中间件？
- **数据库 / ORM 与 User 表 schema**：字段名、类型、主键类型、时间字段格式；
- 现有 **API 约定**：路径前缀/版本、请求响应格式、camelCase vs snake_case、统一错误体、状态码习惯；
- 是否已接过 **OAuth / 第三方登录**，有无相关配置（client_id/appid、回调）；
- **环境变量 / 配置注入方式**、部署形态（同域还是跨域）。

对每条自答项，**在 §5「答复」栏写下结论 + 证据来源（文件路径/代码位置）**，标 `[已核实]`；查不到、或属于「需人拍板的产品/架构决策」（而非客观事实）的，标 `[待定]` 留到阶段 3。

### 阶段 3 · 只就「剩下的」与开发者澄清
带着阶段 2 的结果找开发者：**优先只问标了 `[待定]` 的项**（外加请他确认你 `[已核实]` 的调查结论是否正确）。
- **禁止对 `[待定]` 项假设默认值、禁止跳过**；这些没澄清完就不要开工。
- 把开发者的答复补进 §5「答复」栏，标 `[已确认]`。

### 阶段 4 · 实现
§5 全部落定后，按 **§3 锚点** + **§4 建议接线方式**实现，契约以 §5 答复为准；全程遵守 **§6 约束与陷阱**，不破坏现有纯前端交互（i18n、弹窗、hero 滚动、照片墙）。需要新增前端没有的 UI（错误条、加载态、扫码状态等）时**先与开发者确认**位置/样式/文案，多语言文案按 §6.1 接入 i18n 字典、别硬编码单语言。完成后对照 **§8 DoD** 自检。

---

## 1. 项目速览

- **是什么**：Tinttex（三维高斯泼溅场景展示）的营销落地页 + 登录/注册弹窗。**目前没有任何后端**。
- **技术栈**：
  - 原生 HTML / CSS / JavaScript（ES5 IIFE 风格，非 TypeScript、非框架）。
  - **Vite** 作 dev server 与构建工具（`package.json` 里唯一的 devDependency）。
  - 照片墙用 **React 18 + react-photo-album**，全部通过 **CDN（esm.sh）动态 import**，**没有 npm 运行时依赖**。
- **目录结构**：
  ```
  index.html          # 单页；所有结构 + 内联的照片墙 React 模块都在这
  css/style.css       # 全部样式（含 i18n 的 html[lang] 门控、弹窗、hero、照片墙）
  js/i18n.js          # 轻量 i18n：data-i18n 字典替换 + localStorage 记忆语言
  js/main.js          # 交互：语言面板、弹窗开关、密码显隐、hero 滚动 scrub、照片墙触屏卡片
  js/hero-scene.js    # 3D 场景（当前在 index.html 里被注释停用，未加载）
  js/tuning-panel.js  # 开发调参面板（当前被注释停用，未加载）
  assets/img/         # 照片墙图片素材
  hero-scrub.mp4 等   # hero 滚动 scrub 用的视频/首帧图
  ```
- **运行方式**：
  ```bash
  npm install
  npm run dev      # Vite dev server（默认 http://localhost:5173）
  npm run build    # 构建
  npm run preview  # 预览构建产物
  ```
  > 注意：照片墙依赖 CDN（esm.sh）联网加载 React；离线时照片墙会退回 `index.html` 里的静态兜底网格 `<ul class="feed-grid">`。
- **关键现状**：**没有环境变量、没有 API 调用、没有 fetch**。所有数据（照片墙、showcase 文案、二维码）都是硬编码的静态内容。
  登录/注册/忘记密码/OAuth 按钮**点击后无任何网络行为**——它们在等你接线。

---

## 2. 哪些是"活"的，哪些等你接线

**已实现（纯前端交互，不需要后端）**：语言切换、弹窗打开/关闭/互跳、密码显示/隐藏、hero 滚动视频 scrub、照片墙排版、触屏卡片点击展开。

**等你接线（当前无 handler、无网络请求）**：

| 功能 | 控件 | 状态 |
|---|---|---|
| 邮箱密码登录 | `#loginModal` 内的 `[data-action="submit-login"]` | 无 handler |
| 邮箱密码注册 | `#signupModal` 内的 `[data-action="submit-signup"]` | 无 handler |
| 忘记密码 | `[data-action="forgot-password"]` | 无 handler |
| 第三方登录 Google / 微信 / 支付宝 / 抖音 | `[data-oauth="..."]` | 无 handler |
| 扫码登录 | `#loginModal` 里的 `.qr-box` SVG | **占位图**，非真实二维码 |
| （可选）照片墙场景数据 | `index.html` 内联模块的 `photos` 数组 | 硬编码，待定是否改后端提供 |
| （可选）showcase 内容数据 | `index.html` 的 `.showcase` + i18n 字典 | 硬编码，待定 |

---

## 3. 前端已就绪的对接锚点（接线时请用这些选择器）

> 下面这些 `data-action` / `data-oauth` / `name` 是**本次专门为对接新增的稳定钩子**。
> 请用它们，**不要**依赖会随样式变动的 `class`，也**不要**依赖会被 i18n 覆盖的 `aria-label` 或按钮文字（见 §6.3）。

### 登录弹窗 `#loginModal`
| 元素 | 选择器 / 属性 | 备注 |
|---|---|---|
| 邮箱输入 | `#loginEmail`（`name="email"`, `type="email"`） | |
| 密码输入 | `#loginPw`（`name="password"`, `type="password"`） | |
| 登录提交 | `[data-action="submit-login"]` | `type="button"` |
| 忘记密码 | `[data-action="forgot-password"]` | `type="button"` |
| Google | `[data-oauth="google"]` | 仅 en/ja 显示（CSS 门控） |
| 微信 | `[data-oauth="wechat"]` | 仅中文显示 |
| 支付宝 | `[data-oauth="alipay"]` | 仅中文显示 |
| 抖音 | `[data-oauth="douyin"]` | 仅中文显示 |
| 二维码 | `.qr-box`（`#loginModal` 内） | 占位 SVG |

### 注册弹窗 `#signupModal`
| 元素 | 选择器 / 属性 | 备注 |
|---|---|---|
| 邮箱输入 | `#signupEmail`（`name="email"`） | |
| 密码输入 | `#signupPw`（`name="password"`） | |
| 注册提交 | `[data-action="submit-signup"]` | `type="button"` |
| OAuth | `[data-oauth="google|wechat|alipay|douyin"]` | 与登录同一套（页面共 8 个 `[data-oauth]`） |

### 已实现的弹窗机制（接线时会用到，供参考）
- 打开：`[data-modal-open="loginModal|signupModal"]`（`main.js` 已绑）
- 关闭：`[data-modal-close]`（X 按钮 / 遮罩）；或 `Esc`
- 互跳：`[data-modal-switch="..."]`
- 显隐原理：`main.js` 给 `.modal` 加/去 `.show` class + 同步 `aria-hidden`，并给 `<body>` 加/去 `.modal-open` 锁滚动。
  **登录成功后要关弹窗，请复用这套机制**（去掉 `.show`），不要直接改 `display`（见 §6.6）。

> **关于 `<form>`**：弹窗目前是 `<div class="modal-form">`，提交按钮是 `type="button"`（不会触发原生 submit）。你有两种选择：
> - **(a) 直接绑 click**：给 `[data-action="submit-login"]` 等绑事件，用 `document.getElementById('loginEmail').value` 取值。**改动最小，推荐。**
> - **(b) 改用 `<form>` + FormData**：需要把 `.modal-form` 的 `<div>` 改成 `<form>`。**改前务必与前端确认**——CSS 选择器 `.modal-form` 依赖这个 class，改成 `<form>` 时必须保留 `class="modal-form"`，否则样式全丢。

---

## 4. 建议的接线方式（不强制，供参考）

一个低耦合、易移除的方案：

1. 新建 `js/api.js`：集中放 **API base URL**、请求封装、**token 存取**（按 §5-B 的澄清结果）。
2. 新建 `js/auth.js`：绑 `[data-action]` / `[data-oauth]` 事件，调用 `api.js`，处理成功/失败反馈。
3. 在 `index.html` 末尾、`main.js` 之后引入：`<script src="js/auth.js" defer></script>`（同为 `defer`，DOM 就绪后执行）。

**最小骨架示例**（⚠️ 端点、字段名、响应结构、token 方案**一律以 §5 澄清结果为准**，下面仅示意接线位置）：

```js
// js/auth.js（示意）
(function () {
  "use strict";
  var API = window.__TINTTEX_API__ || { base: "" }; // base URL 按澄清结果注入

  function onSubmitLogin() {
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPw").value;
    // TODO: 前端校验（是否必填/格式）——规则按 §5-D 澄清
    fetch(API.base + "/auth/login", {                 // 路径按澄清
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }) // 字段名按澄清
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok) {
          // TODO: 按 §5-B 存 token；关闭弹窗（复用 .modal 的 .show 机制）
        } else {
          // TODO: 按 §5-I 展示错误（当前弹窗无错误 UI，需与前端确认新增位置/文案）
        }
      })
      .catch(function (err) { /* TODO: 网络错误反馈 */ });
  }

  var loginBtn = document.querySelector('[data-action="submit-login"]');
  if (loginBtn) loginBtn.addEventListener("click", onSubmitLogin);

  // OAuth：用 data-oauth 区分 provider，别用文字/aria-label
  document.querySelectorAll("[data-oauth]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var provider = btn.getAttribute("data-oauth"); // google|wechat|alipay|douyin
      // TODO: 按 §5-F 澄清的流程跳转/发起授权
    });
  });
})();
```

---

## 5. 待澄清清单（**先自答、再澄清**；全部落定才开工）

> **怎么用这张清单（配合 §0 阶段 2/3）**：
> 1. **先自查**：对每一条，先在**你自己的后端代码库**里找答案（框架、已有 auth、DB schema、现有端点、团队约定）。查到的，在「答复」栏写结论 **+ 证据来源（文件/路径）**，标 `[已核实]`。
> 2. **再问人**：查不到的、或属于**产品/架构决策**（不是客观事实、必须人拍板）的，标 `[待定]` 拿去问开发者；拿到答复后改标 `[已确认]`。
> 3. **禁止**对 `[待定]` 项假设默认值或跳过——未落定就不要写业务代码。
>
> **经验法则**：`A/B/C/D/E` 里的**事实类**项（现有端点、字段名、User schema、错误体格式、状态码习惯）大多能在后端库直接查到 → **优先自答**；`F`（OAuth 流程/账号打通）、`G`（扫码登录）、`H3/I4/J/K`（金额格式、文案本地化策略、内容数据归属、部署形态）多为**决策项** → 通常要问人。

### A. API 基础
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| A1 | dev / staging / prod 的 **Base URL** 各是什么？ | fetch 目标 | ____ |
| A2 | 前端与 API 是否**同域**部署？ | 决定是否要处理 CORS、cookie SameSite/凭据 | ____ |
| A3 | 是否有**路径前缀 / 版本号**（如 `/api/v1`）？ | 拼 URL | ____ |
| A4 | 请求/响应用 **JSON**？字段命名 **camelCase 还是 snake_case**？ | 序列化约定 | ____ |

### B. 认证与会话（最关键）
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| B1 | 登录成功返回什么：**JWT(access+refresh) / session cookie / 其他**？ | 决定前端如何处理凭据 | ____ |
| B2 | token **存哪**：localStorage / httpOnly cookie / 内存？ | 存储与 XSS/CSRF 权衡 | ____ |
| B3 | 后续受保护请求**怎么带凭据**：`Authorization: Bearer` / cookie 自动？ | 请求头封装 | ____ |
| B4 | 是否有 **refresh 机制**？过期怎么处理？ | 续期逻辑 | ____ |
| B5 | 是否有**登出**端点？前端要不要清本地状态？ | 登出流程 | ____ |
| B6 | 登录后前端要不要**持久化"已登录"状态**（刷新后仍登录）？ | 是否需要初始化时校验 token | ____ |

### C. 登录端点
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| C1 | **method + path**？ | 调用 | ____ |
| C2 | 请求字段**确切名字**（`email`/`password`？还是别的）？ | body 组装 | ____ |
| C3 | **成功响应结构**？（token 字段名 + 是否带 user 对象；user 有哪些字段/类型） | 解析与存储 | ____ |
| C4 | **失败响应结构 + HTTP 状态码**约定？（邮箱不存在 vs 密码错是否区分） | 错误处理 | ____ |
| C5 | 是否有**登录频率限制 / 图形验证码 / 滑块**？ | 可能要加 UI | ____ |

### D. 注册端点
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| D1 | **method + path**？ | 调用 | ____ |
| D2 | 请求字段？（除 email/password 外是否还要昵称/手机号等） | body 组装 | ____ |
| D3 | **密码强度规则**由谁校验？后端强制规则是什么？ | 前端 hint 现写"≥8 位含字母、数字、符号"，需确认后端是否一致 | ____ |
| D4 | 注册成功后**是否自动登录**？是否需要**邮箱验证**？ | 后续流程 | ____ |
| D5 | 成功/失败响应结构？ | 处理 | ____ |

### E. 忘记密码
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| E1 | 流程是什么（发重置邮件 / 短信 / 跳转重置页）？ | 决定前端交互 | ____ |
| E2 | **method + path + 字段**？ | 调用 | ____ |
| E3 | 前端点击后期望的反馈（提示"已发送"？打开新页？）？ | UI 行为 | ____ |

### F. 第三方 OAuth（Google / 微信 / 支付宝 / 抖音）
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| F1 | 这 4 个**都要实现吗**？还是分期（先做哪个）？ | 排期 | ____ |
| F2 | 采用哪种流程：**前端跳转授权页 / 后端返回授权 URL / 后端全权回调后回传**？ | 前端职责边界 | ____ |
| F3 | 授权**回调落在哪**（前端某路由 / 后端回调）？回调后**如何把会话交回前端**（重定向带 token / postMessage / 种 cookie）？ | 打通闭环 | ____ |
| F4 | 各 provider 的 **client_id / appid** 谁配、配在哪？前端要不要持有？ | 发起授权 | ____ |
| F5 | **账号打通策略**：同邮箱的 OAuth 账号与密码账号是否合并？ | 用户体系 | ____ |

### G. 扫码登录
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| G1 | 是否要实现（当前是**占位图**）？ | 排期 | ____ |
| G2 | 若做：二维码**内容来源**（后端生成登录 token/URL）？ | 前端渲染真实 QR | ____ |
| G3 | 扫码状态确认机制：**轮询 / WebSocket / SSE**？二维码**过期与刷新**策略？ | 实时确认登录 | ____ |

### H. 数据结构与格式（"数据类型/格式"重点）
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| H1 | **User 对象**字段清单与类型（id 是 string 还是 number？email、昵称、头像 URL、注册时间…）？ | 前端消费用户信息 | ____ |
| H2 | **时间格式**：ISO 8601 字符串 / Unix 秒 / 毫秒？ | 解析与展示 | ____ |
| H3 | **金额格式**（showcase 出现 `¥899`）：数字还是字符串？元还是分？有无币种字段？ | 若涉及价格展示 | ____ |
| H4 | 若**照片墙/showcase 改后端提供**：场景对象、产品对象的**字段结构与类型**？图片 URL 规格（尺寸/格式/CDN）？ | 见 §5-J | ____ |
| H5 | 列表接口是否有**分页 / 排序**约定？ | 拉取列表 | ____ |

### I. 错误处理契约
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| I1 | **统一错误响应体**结构（如 `{ code, message, details }`）？ | 解析错误 | ____ |
| I2 | **HTTP 状态码**使用约定（401/403/422/429…）？ | 分支处理 | ____ |
| I3 | 校验错误是**字段级还是整体级**？字段级时结构如何？ | 决定错误展示粒度 | ____ |
| I4 | 面向用户的错误文案**本地化策略**：后端返回 **i18n key**（推荐，前端有字典）还是返回**已本地化文本**（则前端需传 `Accept-Language` / lang）？ | 多语言一致性，见 §6.1 | ____ |
| I5 | 前端**目前没有错误展示 UI**（弹窗内无错误条/toast）。需要新增时，放哪、什么样式、文案 key 叫什么？ | 需与前端确认，见 §6.1 | ____ |

### J. 内容数据归属（照片墙 / showcase）
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| J1 | 照片墙 `photos` 数组、触屏卡片标题 `TOUCH_TITLES` 目前是**硬编码的静态营销内容**（在 `index.html` 内联 React 模块里）。是否需要改为**后端 API 提供**？ | 若否，后端**无需处理**这块 | ____ |
| J2 | showcase 板块的文案/产品示例（如 `¥899`）是否要接后端？ | 同上 | ____ |

### K. 环境与交付
| # | 问题 | 为什么需要 | 答复 |
|---|---|---|---|
| K1 | **配置注入方式**：Vite 环境变量是 `import.meta.env.VITE_*`（仅对**模块打包**生效）。当前脚本是普通 `<script>`（非打包模块），若要用 env 需走 Vite 构建或运行时配置对象（如示例里的 `window.__TINTTEX_API__`）。你倾向哪种？ | 决定 base URL 怎么进前端 | ____ |
| K2 | **部署形态**：纯静态托管？还是同域网关反代 API？ | 影响 A1/A2 | ____ |

---

## 6. 前端约束与陷阱（实现时务必遵守，别踩）

**6.1 i18n 会覆盖 `textContent` —— 最容易踩的坑**
`js/i18n.js` 在**初始化**和**每次切换语言**时，会用字典把每个带标记的元素整个替换：
- `[data-i18n]` → 替换 `textContent`
- `[data-i18n-placeholder]` → 替换 `placeholder`
- `[data-i18n-aria]` → 替换 `aria-label`

因此：
- **不要**把后端返回的动态文案写进带 `data-i18n` 的元素——切语言时会被字典值抹掉。
- 若要新增**多语言**文案（如错误提示）：把 key 加进 `i18n.js` 的 **4 个字典**（`zh-CN` / `zh-TW` / `en` / `ja`），元素打上 `data-i18n`。
- **动态新增的 DOM 节点不会被自动翻译**：插入后需手动调用 `window.TinttexI18N.apply(document.documentElement.lang)` 让新节点套用当前语言。
- 全局暴露：`window.TinttexI18N = { setLang, apply }`。

**6.2 当前语言从哪读**
存在 `localStorage` 键 **`"tinttex-lang"`**，同时反映在 `<html lang="...">`。取值：`zh-CN` / `zh-TW` / `en` / `ja`。若要给后端传语言（如 `Accept-Language`），从这两处读。

**6.3 不要靠文字/aria-label 区分按钮**
OAuth 按钮的 `aria-label` 会被 i18n 改、文字会变、SVG 无法程序化区分。**一律用 `data-oauth` 属性**区分 provider。提交按钮同理用 `data-action`。

**6.4 照片墙是 React + CDN**
`index.html` 末尾的 `<script type="module">` 从 `esm.sh` 动态 import React / react-dom / react-photo-album。
- 需要联网；**Vite 构建不会打包这些 CDN import**（它们是运行时远程加载）。
- 改照片墙数据要动内联模块里的 `photos` 数组和 `TOUCH_TITLES` 映射。

**6.5 hero 滚动动画别乱碰**
`main.js` 有一整套滚动驱动逻辑（`TUNE` 参数、state/interp 模式、视频 seek 串行化）。对接登录一般不需要动它。
但若你改动 `<body>` 的样式或新增全屏滚动容器，注意别干扰 `.modal-open` 锁滚动机制。

**6.6 弹窗显隐机制**
`main.js` 用 `.modal.show` class + `aria-hidden` 控制显隐，打开时给 `<body>` 加 `.modal-open` 锁滚动。
**登录成功后关弹窗，请复用这套机制**（移除目标 `.modal` 的 `.show`，或触发其 `[data-modal-close]`），**不要**直接写 `style.display`。

**6.7 移动端**
`viewport` 已禁用捏合/双击缩放；触屏有专门的卡片点击展开逻辑。新增 UI（错误条、加载态、扫码状态）要考虑窄屏——CSS 已有 `@media` 断点，弹窗 `.modal-card` 在窄屏有适配（`max-width:820px` 隐藏二维码侧栏，`max-width:480px` 收窄内边距）。

**6.8 脚本加载顺序**
`i18n.js`、`main.js` 都是 `defer`。你新增的 auth/api 脚本**也用 `defer`**，并放在它们**之后**，确保 DOM 与现有逻辑已就绪。

---

## 7. 本次为对接已做的改动（知悉即可）

1. **删除了 `js/auth-modal.js`**：那是一套早期、**未接入**、且与线上弹窗**不一致**的登录/注册实现（残留已废弃的"生日"字段、只有 Google 登录），全库 **0 引用**。删除以免对接时误读到错误的 DOM 结构。文件仍保留在 **git 历史**中，需要可找回。
2. **给线上登录/注册表单加了稳定钩子**（`index.html`）：
   - `data-action`：`submit-login` / `submit-signup` / `forgot-password`
   - `data-oauth`：`google` / `wechat` / `alipay` / `douyin`（登录+注册各一套，共 8 个）
   - 输入框 `name`：`email` / `password`
   纯附加属性，**无行为/样式变化**。
3. `index.html` 登录弹窗上方加了一行 HTML 注释，指向本文件与这些锚点。

---

## 8. 完成定义（DoD 建议）

- [ ] §5 澄清清单全部有明确答复，实现严格遵循这些契约。
- [ ] 登录 / 注册 / 忘记密码 / 各 OAuth，按澄清范围接通，**成功与失败路径都有前端反馈**。
- [ ] token 按 B 的方案存取，受保护请求正确携带凭据。
- [ ] 错误与加载态有 UI 反馈；若要求多语言，文案走 i18n 字典（§6.1），不硬编码单语言。
- [ ] 不破坏现有纯前端交互：语言切换、弹窗开关、密码显隐、hero 滚动、照片墙。
- [ ] 窄屏（移动端）可用。

---

_最后更新：随前端本次"对接友好化"改动一并生成。若前端结构后续变化，请同步更新 §3 锚点与 §7 记录。_
