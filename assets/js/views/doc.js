/* ============================================================
   doc.js — #/doc/<id> 阅读器
   渲染正文 / 术语悬浮气泡 / 内部链接改写 / 已读标记 / 笔记自动保存
   ============================================================ */
App.views = App.views || {};

App.views.doc = (function () {
  const { esc, toast } = App.utils;
  let tooltipEl = null;

  /* ---------- 术语悬浮气泡（单例） ---------- */
  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'term-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(span) {
    const info = App.data.termInfo(span.dataset.term);
    if (!info) return;
    const tt = ensureTooltip();
    tt.innerHTML = `<div class="tt-zh">${esc(info.zh)}</div>
      <div class="tt-en">${esc(info.en)}</div>
      <div>${esc(info.desc)}</div>`;
    const r = span.getBoundingClientRect();
    tt.classList.add('show');
    // 先放到目标下方，溢出视口右侧时左移，下方空间不足时翻到上方
    let left = r.left + window.scrollX;
    let top = r.bottom + window.scrollY + 6;
    tt.style.left = '0px'; tt.style.top = '0px';
    const tw = tt.offsetWidth, th = tt.offsetHeight;
    if (left + tw > window.scrollX + window.innerWidth - 12) {
      left = window.scrollX + window.innerWidth - tw - 12;
    }
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (r.bottom + th + 12 > window.innerHeight && r.top - th - 12 > 0) {
      top = r.top + window.scrollY - th - 6;
    }
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
  }

  function bindTermEvents(container) {
    container.addEventListener('mouseover', e => {
      const t = e.target.closest('.term');
      if (t) showTooltip(t);
    });
    container.addEventListener('mouseout', e => {
      if (e.target.closest('.term')) hideTooltip();
    });
    // 触屏：点击术语切换气泡
    container.addEventListener('click', e => {
      const t = e.target.closest('.term');
      if (t) {
        e.preventDefault();
        const tt = ensureTooltip();
        if (tt.classList.contains('show')) hideTooltip(); else showTooltip(t);
      } else {
        hideTooltip();
      }
    });
  }

  /* ---------- 渲染 ---------- */
  function render(container, id) {
    id = decodeURIComponent(id || '');
    const doc = App.data.getDoc(id);
    hideTooltip();

    if (!doc) {
      container.innerHTML = `
        <a class="back-link" href="#/home">← 返回首页</a>
        <div class="empty-state"><div class="big">😵</div>找不到这篇文档：<code>${esc(id)}</code></div>`;
      return;
    }

    const week = App.data.getDocWeek(id);
    const read = App.db.isRead(id);
    const note = App.db.getNote(id);
    const bodyHtml = App.data.rewriteLinks(doc.html, doc.file);

    container.innerHTML = `
      <a class="back-link" href="#/${week ? 'plan' : 'home'}">← 返回${week ? '学习计划' : '首页'}</a>
      <div class="doc-head">
        <h1>${esc(doc.title)}</h1>
        <div class="doc-meta">
          <span class="tag">${esc(App.data.categoryName(doc.category))}</span>
          ${week ? `<span class="tag">第 ${week} 周</span>` : ''}
          ${doc.meta ? `<span>${esc(doc.meta)}</span>` : ''}
        </div>
      </div>

      <div class="article" id="article-body">${bodyHtml}</div>

      <div class="doc-footer">
        <div class="card">
          <div class="doc-actions">
            <button id="btn-read" class="btn ${read ? '' : 'btn-primary'}">
              ${read ? '✓ 取消已读标记' : '标记为已读'}
            </button>
            ${read ? '<span class="read-badge">已读 ✓</span>' : ''}
          </div>
          <label class="field-label" for="note-box">📒 我的笔记（自动保存）</label>
          <textarea id="note-box" rows="4" placeholder="读这篇有什么收获、疑问，随手记下来…">${esc(note ? note.text : '')}</textarea>
          <div class="text-soft mt-8" id="note-status">${note ? '上次保存：' + App.utils.fmtDateTime(note.updated) : ''}</div>
        </div>
      </div>
    `;

    const article = document.getElementById('article-body');

    // 术语包裹（渲染后执行）
    try { App.data.wrapTerms(article); } catch (e) { console.warn('术语包裹失败', e); }
    bindTermEvents(article);

    // 已读切换（重绘前先落盘当前笔记，防止防抖窗口内的内容丢失）
    document.getElementById('btn-read').addEventListener('click', () => {
      const boxEl = document.getElementById('note-box');
      if (boxEl) App.db.saveNote(id, boxEl.value);
      const nowRead = !App.db.isRead(id);
      App.db.markRead(id, nowRead);
      toast(nowRead ? '已标记为已读 🎉' : '已取消已读标记');
      render(container, id);
    });

    // 笔记自动保存（防抖 600ms）
    const box = document.getElementById('note-box');
    let saveTimer = null;
    box.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        App.db.saveNote(id, box.value);
        App.time.recordActivity();
        const n = App.db.getNote(id);
        document.getElementById('note-status').textContent =
          n ? '已自动保存 · ' + App.utils.fmtDateTime(n.updated) : '';
      }, 600);
    });
  }

  return { render };
})();
