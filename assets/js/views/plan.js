/* ============================================================
   plan.js — #/plan 学习计划（8 周手风琴）
   勾选 = 已读，与阅读器实时同步
   ============================================================ */
App.views = App.views || {};

App.views.plan = (function () {
  const { esc, toast } = App.utils;

  function render(container) {
    const read = App.db.getRead();
    const weeks = App.data.getWeeks();
    const cur = currentWeek(weeks, read);

    container.innerHTML = `
      <h1 class="page-title">📅 学习计划</h1>
      <p class="page-sub">8 周从零入门多模态机器学习。勾选表示已读，与阅读器自动同步。</p>
      ${weeks.map(w => weekHtml(w, read, w.week === cur)).join('')}
    `;

    // 手风琴开合
    container.querySelectorAll('.accordion-head').forEach(head => {
      head.addEventListener('click', () => head.parentElement.classList.toggle('open'));
    });

    // 勾选已读
    container.querySelectorAll('input[data-doc]').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.doc;
        App.db.markRead(id, cb.checked);
        toast(cb.checked ? '已标记为已读 🎉' : '已取消已读');
        // 重绘以更新进度条（保持手风琴展开状态）
        const openWeeks = new Set();
        container.querySelectorAll('.accordion-item.open').forEach(el => openWeeks.add(el.dataset.week));
        render(container);
        container.querySelectorAll('.accordion-item').forEach(el => {
          if (openWeeks.has(el.dataset.week)) el.classList.add('open');
        });
      });
    });
  }

  function currentWeek(weeks, read) {
    for (const w of weeks) {
      if ((w.docs || []).some(id => !read[id])) return w.week;
    }
    return weeks.length ? weeks[weeks.length - 1].week : 1;
  }

  function weekHtml(w, read, isCur) {
    const total = (w.docs || []).length;
    const done = (w.docs || []).filter(id => read[id]).length;
    const pct = total ? Math.round(done / total * 100) : 0;

    const rows = (w.docs || []).map(id => {
      const doc = App.data.getDoc(id);
      if (!doc) return '';
      const isRead = !!read[id];
      return `
        <div class="doc-row">
          <input type="checkbox" data-doc="${esc(id)}" ${isRead ? 'checked' : ''} aria-label="标记已读">
          <a class="doc-link ${isRead ? 'is-read' : ''}" href="#/doc/${encodeURIComponent(id)}">${esc(doc.title)}</a>
          <span class="doc-cat">${esc(App.data.categoryName(doc.category))}</span>
        </div>`;
    }).join('');

    return `
      <div class="accordion-item ${isCur ? 'open' : ''}" data-week="${w.week}">
        <button class="accordion-head">
          <span class="chev">▶</span>
          <span class="acc-title">${esc(w.title)}${isCur ? '<span class="week-badge">当前周</span>' : ''}</span>
          <span class="acc-bar"><span class="progress-bar"><span class="fill ${pct === 100 ? 'done' : ''}" style="display:block;width:${pct}%"></span></span></span>
          <span class="acc-frac">${done}/${total}</span>
        </button>
        <div class="accordion-body">
          ${rows}
          <div class="plan-quiz-entry">
            <a class="btn btn-sm btn-primary" href="#/quiz/${w.week}">✏️ 本周测验（24 题）</a>
          </div>
        </div>
      </div>`;
  }

  return { render };
})();
