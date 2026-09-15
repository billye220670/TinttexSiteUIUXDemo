# 9.15 版本改动交接文档

## 1. 如何拉取分支

```bash
# 先 fetch 远程分支列表
git fetch origin

# 切换到 9.15版本 分支
git checkout 9.15版本

# 如果远程尚无此分支（本地创建），需先推送：
git push origin 9.15版本
```

> 分支基于当前 main 最新提交创建，所有改动均未提交（unstaged），拉取后可直接 `git diff` 查看完整变更。

---

## 2. 完整改动清单

### 2.1 移除多语言切换按钮

| 文件 | 改动 |
|------|------|
| `index.html` | 删除导航栏内整个 `.lang-switch` 容器（地球图标按钮 + 四语言下拉面板） |
| `explore.html` | 同上，删除 `.lang-switch` 容器 |

- JS 侧 (`main.js`) 已有 `if (langSwitch && langToggle && langMenu)` 空值守卫，不会报错
- `i18n.js` 字典与切换逻辑保留（其他页面/未来可能复用），仅 UI 入口移除

### 2.2 登录弹窗改造

| 文件 | 改动 |
|------|------|
| `index.html` | 登录弹窗右侧：`.modal-qr`（占位二维码 + 文案）→ `.modal-video`（`<video src="loginVid.mp4" autoplay loop muted playsinline>`） |
| `index.html` | 登录弹窗左侧：删除 `.or-sep`（"或"分隔线）、`.oauth-google` 按钮、`.oauth-cn` 三图标容器 |
| `css/style.css` | `.modal-qr` 全部样式替换为 `.modal-video`（grid-column:2, margin:10px, overflow:hidden, border-radius:10px, 内部 video object-fit:cover 自适应裁剪填满） |
| `css/style.css` | 响应式 860px 断点：`.modal-qr { display:none }` → `.modal-video { display:none }` |
| `css/style.css` | 触屏 hover 复位规则中移除 `.modal-qr strong:hover` 引用 |
| `css/style.css` | `.link-inline:hover, .link-plain:hover, .modal-qr strong:hover` → 去掉 `.modal-qr strong:hover` |

**注意**：注册弹窗（signupModal）的"或"和 OAuth 按钮保留未动。

### 2.3 Showcase 功能卡片移除"了解更多"按钮

| 文件 | 改动 |
|------|------|
| `index.html` | 三段 `.showcase-row` 内的 `<button class="pill-btn sc-btn" data-modal-open="signupModal">了解更多</button>` 全部删除（共 3 处） |

- CSS `.sc-btn` 样式保留（`.feed-more` 的"探索更多"仍在用）

### 2.4 页脚精简

| 文件 | 改动 |
|------|------|
| `index.html` | 删除 `.footer-cols` 容器（含 "Get the app" 列：iOS/Android 链接 + "Quick links" 列：Explore/Shop/Help Center） |
| `index.html` | 删除 `.socials` 列表（微信/B站/X/邮件 四个圆圈图标按钮） |
| `css/style.css` | `.footer-bar` 从 `display:grid; grid-template-columns:1fr auto 1fr` 改为 `display:flex; justify-content:space-between`（两元素布局：版权 + 法律链接） |
| `css/style.css` | 768px 响应式：`.footer-bar { grid-template-columns:1fr; ... }` → `flex-direction:column; align-items:center` |

保留项：`.footer-word`（巨型 TINTTEX 字标）、`.footer-brand`（Tinttex® 字标链接）、`.footer-copy`（版权行）、`.footer-links`（法律声明 / 隐私与 Cookie 政策）。

### 2.5 导航按钮视觉权重互换 + 注册文案更新

| 文件 | 改动 |
|------|------|
| `index.html` | 登录按钮：`nav-auth--primary` → `nav-auth--ghost`（幽灵/细边框） |
| `index.html` | 注册按钮：`nav-auth--ghost` → `nav-auth--primary`（白底黑字实心 CTA） |
| `index.html` | 注册按钮文本：`注册` → `立即注册` |
| `js/i18n.js` | `nav.signup` 四语言更新：zh-CN "立即注册" / zh-TW "立即註冊" / ja "今すぐ登録" / en "Sign Up Now" |
| `css/style.css` | 新增 `.pill-btn.nav-auth--ghost:hover { background:rgba(255,255,255,0.15); color:#fff; border-color:rgba(255,255,255,0.8) }`（登录钮 hover：浅白半透明底） |
| `css/style.css` | 新增触屏复位 `html.is-touch .pill-btn.nav-auth--ghost:hover { background:none; color:#fff; border-color:rgba(255,255,255,0.65) }` |

### 2.6 瀑布流卡片放大（默认三列）

| 文件 | 改动 |
|------|------|
| `index.html` | `columns` 回调从阶梯式 (2→3→4→5→6) 简化为 `(single ? 1 : w < 560 ? 2 : 3)` |
| `explore.html` | 同上 |

- 竖屏移动端单列模式（`portraitSingleCol` 媒体查询门控）不受影响
- spacing 逻辑未变

---

## 3. 对接说明

如果你的版本中已经独立完成了上述某项改动（例如已经移除了语言切换按钮、或已经修改了页脚结构），则**该项无需重复操作**——只需核对最终效果一致即可。

需要关注的潜在冲突点：
- `css/style.css` 的 `.footer-bar` 布局方式（grid → flex）
- `index.html` 登录弹窗结构（`.modal-qr` → `.modal-video`）
- `js/i18n.js` 的 `nav.signup` 键值

建议合并时以文件为单位逐项 diff，而非整体覆盖。
