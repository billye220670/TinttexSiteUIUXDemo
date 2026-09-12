/* Tinttex — 轻量 i18n
   方案：HTML 元素打 data-i18n（textContent）/ data-i18n-placeholder / data-i18n-aria 标记，
   本文件维护 zh-CN / zh-TW / en 三语字典，setLang 时整页替换并写入 localStorage 记忆。
   zh-CN 为源语言：HTML 里的静态文案即简中，zh-CN 字典留空（键缺失时保留原文，不覆盖）。 */
(function () {
  "use strict";

  var DICT = {
    /* 简中为源语言，但字典必须写全：切回 zh-CN 时才能把英文/繁中文案换回来（apply 只替换字典里存在的键） */
    "zh-CN": {
      "nav.login": "登录",
      "nav.signup": "注册",
      "hero.title": "逛一逛，摆一摆。",
      "hero.sub": "佛山展厅一比一还原，沉浸逛展，线上搭配，AI客服全程陪跑。",
      "cta.more": "探索更多",
      "hero.tick1": "佛山展厅1:1还原",
      "hero.tick2": "沉浸逛展",
      "hero.tick3": "线上搭配",
      "hero.tick4": "AI客服全程陪跑",
      "aria.feed": "高斯泼溅场景瀑布流",

      /* 瀑布流顶部·功能导览板块（showcase） */
      "sc.title": "让心爱的灵感落地成真",
      "sc.sub": "在 Tinttex，用激发创造力的工具，发现更多空间灵感。",
      "sc.chatUser": "帮我找这把椅子",
      "sc.chatAi": "已找到 3 件同款",
      "sc.chatHint": "点击查看产品信息",
      "sc.product": "北欧布艺单人椅 · ¥899",
      "sc.drag": "拖拽摆放",
      "sc.plan": "我的客厅方案",
      "sc.planMeta": "28 件单品 · 秒出渲染",
      "sc.rend": "Tinttex 渲染",
      "sc.real": "到家实拍",
      "sc.order": "一键下单 · 直达家中",
      "sc.t1h": "先逛空间，再挑好物",
      "sc.t1p": "在 1:1 还原的真实场景里漫游，AI 导航边逛边聊，看中的家具随手即出产品信息。",
      "sc.t2h": "海量单品，摆上就能看",
      "sc.t2p": "问 AI 就能找到想要的货品，拖进场景摆好，秒出照片级渲染。",
      "sc.t3h": "所见即所得，一键到家",
      "sc.t3p": "渲染里什么样，家里就什么样——下单后真实货品直达家中一角。",
      "sc.cta": "了解更多",

      /* 瀑布流章节标语（state 3 落位点） */
      "fh.title": "每张图，都是能走进的展厅",
      "fh.sub": "精选场景 1:1 还原真实空间，点开任意一张，即可沉浸漫游。",

      "foot.app": "Get the app",
      "foot.quick": "Quick links",
      "foot.explore": "Explore",
      "foot.shop": "Shop",
      "foot.help": "Help Center",
      "foot.policies": "Policies",
      "foot.terms": "Terms of service",
      "foot.privacy": "Privacy policy",
      "foot.nonuser": "Non-user notice",

      "foot.copy": "© 2026 Tinttex · 保留所有权利",
      "foot.legal": "法律声明",
      "foot.cookie": "隐私与 Cookie 政策",
      "aria.wechat": "微信",
      "aria.bili": "哔哩哔哩",
      "aria.x": "X（推特）",
      "aria.mail": "邮件",

      "aria.close": "关闭",
      "aria.showPw": "显示密码",
      "common.or": "或",
      "common.google": "使用 Google 账号继续",
      "common.period": "。",
      "legal.terms": "服务条款",
      "legal.privacy": "隐私政策",

      "login.title": "欢迎来到 Tinttex",
      "login.sub": "登录，探索高斯泼溅带来的更多可能",
      "login.emailPh": "电子邮箱",
      "login.pwPh": "密码",
      "login.forgot": "忘记密码？",
      "login.submit": "登录",
      "login.metaPre": "还没有账户？",
      "login.metaLink": "免费注册",
      "login.legal1": "继续即表示你同意我们的",
      "login.legal2": "，并确认已阅读",
      "login.qr1": "或用手机扫码，",
      "login.qr2": "立即登录",

      "signup.title": "欢迎来到 Tinttex",
      "signup.sub": "免费注册，探索高斯泼溅带来的更多可能",
      "signup.emailPh": "输入你的电子邮箱",
      "signup.pwPh": "创建密码",
      "signup.hint": "请使用至少 8 个字符，包含字母、数字和符号",
      "signup.birthPh": "生日（mm/dd/yyyy）",
      "signup.submit": "继续",
      "signup.meta1Pre": "已有账户？",
      "signup.meta1Link": "登录",
      "signup.meta2Pre": "你是企业？",
      "signup.meta2Link": "从这里开始",
      "signup.legal1": "继续，即表示你同意我们的",
      "signup.legal2": "并确认已阅读"
    },

    "zh-TW": {
      /* 导航 & Hero & CTA */
      "nav.login": "登入",
      "nav.signup": "註冊",
      "card.cta": "立即進入",
      "hero.title": "逛一逛，擺一擺。",
      "hero.sub": "佛山展廳一比一還原，沉浸逛展，線上搭配，AI客服全程陪跑。",
      "cta.more": "探索更多",
      "hero.tick1": "佛山展廳1:1還原",
      "hero.tick2": "沉浸逛展",
      "hero.tick3": "線上搭配",
      "hero.tick4": "AI客服全程陪跑",
      "aria.feed": "高斯潑濺場景瀑布流",

      /* 瀑布流顶部·功能导览板块（showcase） */
      "sc.title": "讓心愛的靈感落地成真",
      "sc.sub": "在 Tinttex，用激發創造力的工具，發現更多空間靈感。",
      "sc.chatUser": "幫我找這把椅子",
      "sc.chatAi": "已找到 3 件同款",
      "sc.chatHint": "點擊查看產品資訊",
      "sc.product": "北歐布藝單人椅 · ¥899",
      "sc.drag": "拖曳擺放",
      "sc.plan": "我的客廳方案",
      "sc.planMeta": "28 件單品 · 秒出渲染",
      "sc.rend": "Tinttex 渲染",
      "sc.real": "到家實拍",
      "sc.order": "一鍵下單 · 直達家中",
      "sc.t1h": "先逛空間，再挑好物",
      "sc.t1p": "在 1:1 還原的真實場景裡漫遊，AI 導航邊逛邊聊，看中的傢俱隨手即出產品資訊。",
      "sc.t2h": "海量單品，擺上就能看",
      "sc.t2p": "問 AI 就能找到想要的貨品，拖進場景擺好，秒出照片級渲染。",
      "sc.t3h": "所見即所得，一鍵到家",
      "sc.t3p": "渲染裡什麼樣，家裡就什麼樣——下單後真實貨品直達家中一角。",
      "sc.cta": "了解更多",

      /* 瀑布流章节标语（state 3 落位点） */
      "fh.title": "每張圖，都是能走進的展廳",
      "fh.sub": "精選場景 1:1 還原真實空間，點開任意一張，即可沉浸漫遊。",

      /* 页脚链接区 */
      "foot.app": "取得應用程式",
      "foot.quick": "快速連結",
      "foot.explore": "探索",
      "foot.shop": "商店",
      "foot.help": "協助中心",
      "foot.policies": "政策",
      "foot.terms": "服務條款",
      "foot.privacy": "隱私權政策",
      "foot.nonuser": "非使用者通知",

      /* 页脚底栏 */
      "foot.copy": "© 2026 Tinttex · 保留所有權利",
      "foot.legal": "法律聲明",
      "foot.cookie": "隱私與 Cookie 政策",
      "aria.wechat": "微信",
      "aria.bili": "哔哩哔哩",
      "aria.x": "X（推特）",
      "aria.mail": "郵件",

      /* 通用（弹窗共用） */
      "aria.close": "關閉",
      "aria.showPw": "顯示密碼",
      "common.or": "或",
      "common.google": "使用 Google 帳號繼續",
      "common.period": "。",
      "legal.terms": "服務條款",
      "legal.privacy": "隱私政策",

      /* 登录弹窗 */
      "login.title": "歡迎來到 Tinttex",
      "login.sub": "登入，探索高斯潑濺帶來的更多可能",
      "login.emailPh": "電子郵件",
      "login.pwPh": "密碼",
      "login.forgot": "忘記密碼？",
      "login.submit": "登入",
      "login.metaPre": "還沒有帳戶？",
      "login.metaLink": "免費註冊",
      "login.legal1": "繼續即表示你同意我們的",
      "login.legal2": "，並確認已閱讀",
      "login.qr1": "或用手機掃碼，",
      "login.qr2": "立即登入",

      /* 注册弹窗 */
      "signup.title": "歡迎來到 Tinttex",
      "signup.sub": "免費註冊，探索高斯潑濺帶來的更多可能",
      "signup.emailPh": "輸入你的電子郵件",
      "signup.pwPh": "建立密碼",
      "signup.hint": "請使用至少 8 個字元，包含字母、數字和符號",
      "signup.birthPh": "生日（mm/dd/yyyy）",
      "signup.submit": "繼續",
      "signup.meta1Pre": "已有帳戶？",
      "signup.meta1Link": "登入",
      "signup.meta2Pre": "你是企業？",
      "signup.meta2Link": "從這裡開始",
      "signup.legal1": "繼續，即表示你同意我們的",
      "signup.legal2": "並確認已閱讀"
    },

    "ja": {
      /* 导航 & Hero & CTA */
      "nav.login": "ログイン",
      "nav.signup": "会員登録",
      "card.cta": "今すぐ見る",
      "hero.title": "見て回る、飾ってみる。",
      "hero.sub": "佛山のショールームを1:1で再現。没入感のあるショールーム体験、オンラインコーディネート、AIスタッフが最後まで伴走します",
      "cta.more": "もっと見る",
      "hero.tick1": "佛山ショールームを1:1再現",
      "hero.tick2": "没入型の展示体験",
      "hero.tick3": "オンラインでコーディネート",
      "hero.tick4": "AIスタッフが最後まで伴走",
      "aria.feed": "ガウシアンスプラッティングシーンギャラリー",

      /* 瀑布流顶部・機能案内セクション（showcase） */
      "sc.title": "お気に入りのアイデアを形にする",
      "sc.sub": "Tinttex で、創造力を刺激するツールを使い、空間のインスピレーションをもっと見つけましょう。",
      "sc.chatUser": "この椅子を探して",
      "sc.chatAi": "似た商品が3件見つかりました",
      "sc.chatHint": "タップで製品情報",
      "sc.product": "北欧ファブリックアームチェア · ¥899",
      "sc.drag": "ドラッグで配置",
      "sc.plan": "マイリビングプラン",
      "sc.planMeta": "28アイテム · すぐにレンダリング",
      "sc.rend": "Tinttex レンダリング",
      "sc.real": "届いた実物",
      "sc.order": "ワンタップ注文 · そのままお部屋へ",
      "sc.t1h": "まず空間を回遊、そのあとで選ぶ",
      "sc.t1p": "1:1で再現されたリアルな空間を歩き回り、AIナビと会話しながら、気になった家具の製品情報をすぐチェック。",
      "sc.t2h": "豊富な商品、置けばすぐ見える",
      "sc.t2p": "AIに聞けば欲しい商品が見つかり、ドラッグして配置すれば、瞬時にフォトリアルなレンダリングに。",
      "sc.t3h": "見たままが、そのまま届く",
      "sc.t3p": "レンダリング通りの仕上がり——注文すれば本物の商品が自宅の一角へ届きます。",
      "sc.cta": "詳しく見る",

      /* 瀑布流セクション見出し（state 3 着地点） */
      "fh.title": "どの一枚も、歩いて入れるショールーム",
      "fh.sub": "厳選シーンを1:1で再現。クリックするだけで、その空間を散策できます。",

      /* 页脚链接区 */
      "foot.app": "アプリを入手",
      "foot.quick": "クイックリンク",
      "foot.explore": "見つける",
      "foot.shop": "ショップ",
      "foot.help": "ヘルプセンター",
      "foot.policies": "ポリシー",
      "foot.terms": "利用規約",
      "foot.privacy": "プライバシーポリシー",
      "foot.nonuser": "非ユーザー向け通知",

      /* 页脚底栏 */
      "foot.copy": "© 2026 Tinttex · All rights reserved",
      "foot.legal": "法務情報",
      "foot.cookie": "プライバシーと Cookie ポリシー",
      "aria.wechat": "WeChat",
      "aria.bili": "ビリビリ",
      "aria.x": "X（Twitter）",
      "aria.mail": "メール",

      /* 通用（弹窗共用）。
         common.period 在日语里承担整句收尾（に同意したものとみなされます。），
         配合 legal1/legal2 拼出自然语序：「続行すると、当社の利用規約およびプライバシーポリシーに同意した…」 */
      "aria.close": "閉じる",
      "aria.showPw": "パスワードを表示",
      "common.or": "または",
      "common.google": "Google アカウントで続行",
      "common.period": "に同意したものとみなされます。",
      "legal.terms": "利用規約",
      "legal.privacy": "プライバシーポリシー",

      /* 登录弹窗 */
      "login.title": "Tinttex へようこそ",
      "login.sub": "ログインして、ガウシアンスプラッティングの新しい体験を。",
      "login.emailPh": "メールアドレス",
      "login.pwPh": "パスワード",
      "login.forgot": "パスワードをお忘れですか？",
      "login.submit": "ログイン",
      "login.metaPre": "アカウントをお持ちでない方は",
      "login.metaLink": "無料で登録",
      "login.legal1": "続行すると、当社の",
      "login.legal2": "および",
      "login.qr1": "スマホでコードをスキャンして",
      "login.qr2": "今すぐログイン",

      /* 注册弹窗 */
      "signup.title": "Tinttex へようこそ",
      "signup.sub": "無料登録で、ガウシアンスプラッティングの新しい体験を。",
      "signup.emailPh": "メールアドレスを入力",
      "signup.pwPh": "パスワードを作成",
      "signup.hint": "英字・数字・記号を含む8文字以上で設定してください",
      "signup.birthPh": "生年月日（mm/dd/yyyy）",
      "signup.submit": "続行",
      "signup.meta1Pre": "アカウントをお持ちの方は",
      "signup.meta1Link": "ログイン",
      "signup.meta2Pre": "法人のお客様は",
      "signup.meta2Link": "こちらから",
      "signup.legal1": "続行することで、当社の",
      "signup.legal2": "および"
    },

    "en": {
      /* Nav & Hero & CTA */
      "nav.login": "Log in",
      "nav.signup": "Sign up",
      "card.cta": "Step In",
      "hero.title": "Browse\u00A0it. Place\u00A0it.",   /* \u00A0 不换行空格：Browse it. / Place it. 各自锁一行，只在句子间断行 */
      "hero.sub": "From Foshan to your home: explore our showroom in true-to-life 3D, style it online, and shop with AI support every step of the way.",
      "cta.more": "Explore more",
      "hero.tick1": "Foshan showroom recreated 1:1",
      "hero.tick2": "Immersive showroom tours",
      "hero.tick3": "Style it online",
      "hero.tick4": "AI support every step of the way",
      "aria.feed": "Gaussian splat scene gallery",

      /* Showcase (top of feed) */
      "sc.title": "Bring your favorite ideas to life",
      "sc.sub": "With Tinttex, unlock tools that spark your creativity and help you find more inspiration.",
      "sc.chatUser": "Find this chair for me",
      "sc.chatAi": "Found 3 matching items",
      "sc.chatHint": "Tap for product info",
      "sc.product": "Nordic fabric armchair · $129",
      "sc.drag": "Drag & drop",
      "sc.plan": "My living room plan",
      "sc.planMeta": "28 items · instant render",
      "sc.rend": "Tinttex render",
      "sc.real": "At home",
      "sc.order": "One-tap order · straight to your home",
      "sc.t1h": "Walk the space first, then shop",
      "sc.t1p": "Roam a true-to-life 1:1 scene, chat with the AI guide, and get product info for any piece you like.",
      "sc.t2h": "A huge catalog, seen in place",
      "sc.t2p": "Ask the AI to find any item, drag it into your scene, and get a photo-real render in seconds.",
      "sc.t3h": "What you see is what arrives",
      "sc.t3p": "Your render is your room—order once and the real items land right at home.",
      "sc.cta": "Learn more",

      /* Feed section headline (state 3 anchor) */
      "fh.title": "Every image is a showroom you can walk into",
      "fh.sub": "Curated scenes rebuilt 1:1 in true-to-life 3D — click any of them to step inside.",

      /* Footer nav */
      "foot.app": "Get the app",
      "foot.quick": "Quick links",
      "foot.explore": "Explore",
      "foot.shop": "Shop",
      "foot.help": "Help Center",
      "foot.policies": "Policies",
      "foot.terms": "Terms of service",
      "foot.privacy": "Privacy policy",
      "foot.nonuser": "Non-user notice",

      /* Footer bar */
      "foot.copy": "© 2026 Tinttex · All rights reserved",
      "foot.legal": "Legal",
      "foot.cookie": "Privacy & Cookie Policy",
      "aria.wechat": "WeChat",
      "aria.bili": "Bilibili",
      "aria.x": "X (Twitter)",
      "aria.mail": "Email",

      /* Shared (modals) */
      "aria.close": "Close",
      "aria.showPw": "Show password",
      "common.or": "Or",
      "common.google": "Continue with Google",
      "common.period": ".",
      "legal.terms": "Terms of Service",
      "legal.privacy": "Privacy Policy",

      /* Login modal */
      "login.title": "Welcome to Tinttex",
      "login.sub": "Log in to see what Gaussian Splatting can do for you.",
      "login.emailPh": "Email address",
      "login.pwPh": "Password",
      "login.forgot": "Forgot your password?",
      "login.submit": "Log in",
      "login.metaPre": "Don\u2019t have an account?",
      "login.metaLink": "Sign up",
      "login.legal1": "By continuing, you agree to our",
      "login.legal2": " and confirm that you\u2019ve read our ",
      "login.qr1": "Or scan with your phone to ",
      "login.qr2": "log in instantly",

      /* Signup modal */
      "signup.title": "Welcome to Tinttex",
      "signup.sub": "Sign up for free to see what Gaussian Splatting can do for you.",
      "signup.emailPh": "Enter your email address",
      "signup.pwPh": "Create a password",
      "signup.hint": "Use at least 8 characters, including letters, numbers, and symbols.",
      "signup.birthPh": "Birthday (mm/dd/yyyy)",
      "signup.submit": "Continue",
      "signup.meta1Pre": "Already have an account?",
      "signup.meta1Link": "Log in",
      "signup.meta2Pre": "Are you a business?",
      "signup.meta2Link": "Get started here",
      "signup.legal1": "By continuing, you agree to our",
      "signup.legal2": "and confirm that you\u2019ve read our"
    }
  };

  var STORE_KEY = "tinttex-lang";

  /* 把字典套用到整页：文本 / placeholder / aria-label 三类标记 */
  function apply(lang) {
    var dict = DICT[lang] || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key in dict) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key in dict) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key in dict) el.setAttribute("aria-label", dict[key]);
    });
  }

  function setLang(lang) {
    if (!DICT[lang]) lang = "zh-CN";
    document.documentElement.lang = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* 隐私模式等场景忽略 */ }
    apply(lang);
    // 同步语言菜单选中态（aria-checked）
    document.querySelectorAll(".lang-opt").forEach(function (o) {
      o.setAttribute("aria-checked", String(o.getAttribute("data-lang") === lang));
    });
  }

  function detectInitial() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    if (saved && DICT[saved]) return saved;
    var nav = (navigator.language || "zh-CN").toLowerCase();
    if (nav.indexOf("zh") === 0) {
      return /tw|hk|mo|hant/.test(nav) ? "zh-TW" : "zh-CN";
    }
    if (nav.indexOf("ja") === 0) return "ja";
    return "en";
  }

  // 初始渲染即套用（defer 保证 DOM 已就绪）
  setLang(detectInitial());

  window.TinttexI18N = { setLang: setLang, apply: apply };
})();
