/* ============================================================
   app.js — 入口：hash 路由 + 启动
   路由：#/home  #/doc/<id>  #/plan  #/quiz[/<week>]
         #/wrong  #/notes  #/stats  #/settings
   ============================================================ */
(function () {

  const NAV_ITEMS = [
    ['home', '🏠 首页'],
    ['plan', '📅 计划'],
    ['quiz', '✏️ 测验'],
    ['wrong', '📕 错题'],
    ['notes', '📒 笔记'],
    ['stats', '📊 统计'],
    ['settings', '⚙️ 设置']
  ];

  /** 解析 hash → {name, param} */
  function parseHash() {
    const raw = (location.hash || '#/home').replace(/^#\/?/, '');
    const [name, ...rest] = raw.split('/');
    return { name: name || 'home', param: rest.join('/') };
  }

  /** 渲染顶部导航 */
  function renderNav(active) {
    const nav = document.getElementById('nav-links');
    nav.innerHTML = NAV_ITEMS.map(([key, label]) =>
      `<a href="#/${key}" class="${key === active ? 'active' : ''}">${label}</a>`
    ).join('');
  }

  function route() {
    const { name, param } = parseHash();
    const view = App.views[name] || App.views.home;
    const navKey = App.views[name] ? name : 'home';
    renderNav(name === 'doc' ? 'plan' : navKey);   // 阅读页高亮「计划」
    const container = document.getElementById('app');
    window.scrollTo(0, 0);
    try {
      view.render(container, param);
    } catch (e) {
      console.error('[route] 渲染失败:', e);
      container.innerHTML = `<div class="empty-state"><div class="big">💥</div>页面渲染出错：${App.utils.esc(e.message)}</div>`;
    }
  }

  function boot() {
    // 数据完整性自检
    if (!window.__CONTENT__ || !window.__CONTENT__.length) {
      document.getElementById('app').innerHTML =
        '<div class="empty-state"><div class="big">⚠️</div>数据文件 data/content.js 加载失败，请检查文件是否齐全。</div>';
      return;
    }
    window.addEventListener('hashchange', route);
    App.time.start();           // 启动学习时长统计
    App.time.recordActivity();  // 打开即算活跃
    if (!location.hash) location.hash = '#/home';
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
