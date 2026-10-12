/* ============================================================
   notes.js — #/notes 笔记本
   列表 / 全文搜索 / 按周筛选 / 导出 Markdown
   ============================================================ */
App.views = App.views || {};

App.views.notes = (function () {
  const { esc, toast, downloadText, fmtDateTime } = App.utils;

  /** 当前筛选状态（会话内保持）；week: '' 全部 / '1'..'8' / 'none' 未归入周 */
  let filter = { kw: '', week: '' };

  function getFiltered() {
    const notes = App.db.getNotes();
    let list = Object.keys(notes).map(id => {
      const doc = App.data.getDoc(id);
      return {
        id,
        ...notes[id],
        title: doc ? doc.title : id,
        week: App.data.getDocWeek(id)
      };
    }).sort((a, b) => b.updated - a.updated);

    if (filter.week === 'none') list = list.filter(n => n.week == null);
    else if (filter.week) list = list.filter(n => String(n.week) === filter.week);

    if (filter.kw) {
      const kw = filter.kw.toLowerCase();
      list = list.filter(n =>
        n.text.toLowerCase().includes(kw) || n.title.toLowerCase().includes(kw));
    }
    return list;
  }

  function exportMarkdown() {
    const list = getFiltered();
    if (!list.length) { toast('没有可导出的笔记'); return; }
    const lines = ['# 多模态学习笔记', '', `> 导出于 ${fmtDateTime(Date.now())}，共 ${list.length} 条`, ''];
    list.forEach(n => {
      lines.push(`## ${n.title}`);
      lines.push(`- 文档 ID：\`${n.id}\``);
      if (n.week) lines.push(`- 所属周：第 ${n.week} 周`);
      lines.push(`- 更新时间：${fmtDateTime(n.updated)}`);
      lines.push('', n.text, '', '---', '');
    });
    downloadText(`mmstudy_笔记_${App.utils.dayKey()}.md`, lines.join('\n'), 'text/markdown');
    toast('笔记已导出 📥');
  }

  function render(container) {
    const list = getFiltered();
    const total = Object.keys(App.db.getNotes()).length;

    const items = list.map(n => `
      <div class="note-item">
        <div class="n-title">
          <a href="#/doc/${encodeURIComponent(n.id)}">${esc(n.title)}</a>
          ${n.week ? `<span class="doc-cat" style="margin-left:6px">第 ${n.week} 周</span>` : ''}
        </div>
        <div class="n-excerpt">${esc(n.text.slice(0, 200))}</div>
        <div class="n-time">${fmtDateTime(n.updated)}</div>
      </div>`).join('');

    container.innerHTML = `
      <h1 class="page-title">📒 笔记本</h1>
      <p class="page-sub">共 ${total} 条笔记，在阅读器底部随手记录，这里统一查阅。</p>
      <div class="filter-bar">
        <input type="search" id="note-kw" placeholder="🔍 搜索笔记内容或文档标题…" value="${esc(filter.kw)}">
        <select id="note-week">
          <option value="">全部周</option>
          ${[1, 2, 3, 4, 5, 6, 7, 8].map(w => `<option value="${w}" ${filter.week === String(w) ? 'selected' : ''}>第 ${w} 周</option>`).join('')}
          <option value="none" ${filter.week === 'none' ? 'selected' : ''}>未归入周</option>
        </select>
        <button class="btn" id="btn-export">⬇️ 导出 Markdown</button>
      </div>
      <div class="card">
        ${items || '<div class="empty-state" style="padding:24px"><div class="big">📝</div>' +
          (total ? '没有匹配的笔记，换个关键词试试' : '还没有笔记，去<a href="#/plan">学习计划</a>挑一篇开始读吧') + '</div>'}
      </div>
    `;

    // 搜索（防抖 300ms，重绘后恢复焦点与光标）
    let t = null;
    document.getElementById('note-kw').addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => {
        filter.kw = e.target.value.trim();
        render(container);
        const box = document.getElementById('note-kw');
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }, 300);
    });

    document.getElementById('note-week').addEventListener('change', e => {
      filter.week = e.target.value;
      render(container);
    });

    document.getElementById('btn-export').addEventListener('click', exportMarkdown);
  }

  return { render };
})();
