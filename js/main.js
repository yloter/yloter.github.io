/* =========================================================
   Everett 的笔记 · 全站脚本
   功能：
   1. 日间 / 夜间切换（记住选择）
   2. 文章页：自动生成目录、滚动时高亮当前小节
   3. 文章页：估算阅读时长
   4. 代码块：复制按钮
   5. 回到顶部按钮
   6. 页脚年份
   7. 访问统计（Cloudflare Web Analytics）
   8. 评论区（Giscus）
   ========================================================= */

// ---------- 网站配置：统计和评论都在这里开关 ----------
// 下面几项留空 = 功能关闭；填上对应的值 = 自动开启，不用改任何 HTML
const SITE_CONFIG = {
  // Cloudflare Web Analytics 的 token（在 Cloudflare 后台添加网站后获得）
  cloudflareToken: '12b29a644b774e6b8cc2069507ef6474',

  // Giscus 评论：在 https://giscus.app 填好仓库后，页面下方会生成这几项
  giscus: {
    repo: 'yloter/yloter.github.io',
    repoId: 'R_kgDOVS-TJg',
    category: 'Announcements',
    categoryId: 'DIC_kwDOVS-TJs4DJ4fr',
  },
};

// ---------- 1. 日间 / 夜间切换 ----------
// 页面加载时用哪个主题，已经在每个页面 <head> 里的小脚本决定了（防止闪一下白屏）。
// 这里只负责：点击按钮切换，并把选择存进浏览器（localStorage）。
const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');

function updateToggleIcon() {
  if (!toggle) return;
  const dark = root.dataset.theme === 'dark';
  toggle.textContent = dark ? '☀' : '☾';
  toggle.title = dark ? '切换到日间模式' : '切换到夜间模式';
}

if (toggle) {
  updateToggleIcon();
  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* 无痕模式等情况可能存不了，忽略 */ }
    updateToggleIcon();
  });
}

// ---------- 2 & 3. 文章页功能 ----------
const prose = document.querySelector('.prose');

if (prose) {
  // 3. 阅读时长：中文按每分钟约 400 字估算
  const readingTime = document.querySelector('#reading-time');
  if (readingTime) {
    const chars = prose.innerText.replace(/\s/g, '').length;
    const minutes = Math.max(1, Math.round(chars / 400));
    readingTime.textContent = `约 ${minutes} 分钟`;
  }

  // 2. 目录：找出正文里所有 h2，生成链接放进 #toc-list
  const tocList = document.querySelector('#toc-list');
  const headings = prose.querySelectorAll('h2');

  if (tocList && headings.length > 0) {
    headings.forEach((h, i) => {
      if (!h.id) h.id = `section-${i + 1}`;   // 没有 id 就自动编一个，作为跳转锚点
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });

    // 滚动高亮：哪个标题进入屏幕上方区域，就高亮对应的目录项
    const links = tocList.querySelectorAll('a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.hash === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });   // 只看屏幕上方 30% 的区域

    headings.forEach((h) => observer.observe(h));
  } else if (tocList) {
    // 文章没有小标题，就把整个目录藏起来
    document.querySelector('.toc')?.remove();
  }

  // 4. 代码块复制按钮
  prose.querySelectorAll('pre').forEach((pre) => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = '已复制';
      } catch (e) {
        btn.textContent = '复制失败';
      }
      setTimeout(() => { btn.textContent = '复制'; }, 1500);
    });
    pre.appendChild(btn);
  });
}

// ---------- 5. 回到顶部 ----------
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0 }));
}

// ---------- 6. 页脚年份自动更新 ----------
document.querySelectorAll('.year').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ---------- 7. 访问统计 ----------
// Cloudflare Web Analytics 不使用 cookie，不记录访客个人信息，只统计访问量、来源、页面
if (SITE_CONFIG.cloudflareToken) {
  const beacon = document.createElement('script');
  beacon.type = 'module';   // 和 Cloudflare 官方代码保持一致
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: SITE_CONFIG.cloudflareToken });
  document.body.appendChild(beacon);
}

// ---------- 8. 评论区 ----------
// Giscus 把每篇文章的评论存成 GitHub 仓库里的一个 Discussion，访客用 GitHub 账号登录后评论
const commentsSection = document.querySelector('.comments');
const g = SITE_CONFIG.giscus;

// 日间 / 夜间分别用哪个 Giscus 主题（gruvbox 是暖色系，和网站风格接近）
function giscusTheme() {
  return root.dataset.theme === 'dark' ? 'gruvbox_dark' : 'gruvbox_light';
}

if (commentsSection && g.repoId && g.categoryId) {
  commentsSection.hidden = false;
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  const attrs = {
    'data-repo': g.repo,
    'data-repo-id': g.repoId,
    'data-category': g.category,
    'data-category-id': g.categoryId,
    'data-mapping': 'pathname',        // 按网址路径区分文章：一篇文章对应一个讨论
    'data-strict': '0',
    'data-reactions-enabled': '1',     // 允许点表情
    'data-emit-metadata': '0',
    'data-input-position': 'top',      // 输入框在评论列表上方
    'data-theme': giscusTheme(),
    'data-lang': 'zh-CN',
    'data-loading': 'lazy',            // 滚动到评论区附近才加载，不拖慢页面
  };
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  commentsSection.querySelector('.giscus').appendChild(s);

  // 切换日间 / 夜间时，通知评论区一起换主题
  toggle?.addEventListener('click', () => {
    const frame = document.querySelector('iframe.giscus-frame');
    frame?.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme() } } },
      'https://giscus.app'
    );
  });
}
