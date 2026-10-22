/* =========================================================
   Everett 的笔记 · 全站脚本
   功能：
   1. 日间 / 夜间切换（记住选择）
   2. 文章页：自动生成目录、滚动时高亮当前小节
   3. 文章页：估算阅读时长
   4. 代码块：复制按钮
   5. 回到顶部按钮
   6. 页脚年份
   ========================================================= */

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
