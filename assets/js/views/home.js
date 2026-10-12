/* ============================================================
   home.js — #/home 仪表盘
   总进度环 / 8 周卡片 / streak / 时长 / 错题待复习 / 最近笔记
   ============================================================ */
App.views = App.views || {};

App.views.home = (function () {
  const { esc, fmtDuration, toast } = App.utils;

  /** 当前周 = 第一个未全部读完的周；全部读完则为第 8 周 */
  function currentWeek() {
    const read = App.db.getRead();
    const weeks = App.data.getWeeks();
    for (const w of weeks) {
      const total = (w.docs || []).length;
      const done = (w.docs || []).filter(id => read[id]).length;
      if (done < total) return w.week;
    }
    return weeks.length ? weeks[weeks.length - 1].week : 1;
  }

  function render(container) {
    const read = App.db.getRead();
    const planned = App.data.plannedDocIds();
    const readPlanned = planned.filter(id => read[id]).length;
    const pct = planned.length ? Math.round(readPlanned / planned.length * 100) : 0;
    const cur = currentWeek();
    const streak = App.time.getStreak();
    const todaySec = App.time.getTodaySec();
    const totalSec = App.time.getTotalSec();
    const pendingWrong = App.db.pendingWrongCount();

    // 进度环 SVG 参数
    const R = 58, CIRC = 2 * Math.PI * R;
    const offset = CIRC * (1 - pct / 100);

    // 8 周卡片
    const weekCards = App.data.getWeeks().map(w => {
      const total = (w.docs || []).length;
      const done = (w.docs || []).filter(id => read[id]).length;
      const wpct = total ? Math.round(done / total * 100) : 0;
      const isCur = w.week === cur;
      return `
        <div class="week-card ${isCur ? 'current' : ''}">
          <div class="week-title">${esc(w.title)}${isCur ? '<span class="week-badge">当前周</span>' : ''}</div>
          <div class="progress-bar"><div class="fill ${wpct === 100 ? 'done' : ''}" style="width:${wpct}%"></div></div>
          <div class="week-frac">已读 ${done} / ${total} 篇（${wpct}%）</div>
          <div class="week-actions">
            <a class="btn btn-sm" href="#/plan">查看清单</a>
            <a class="btn btn-sm" href="#/quiz/${w.week}">本周测验</a>
          </div>
        </div>`;
    }).join('');

    // 最近笔记（最多 3 条）
    const notes = App.db.getNotes();
    const noteItems = Object.keys(notes)
      .map(id => ({ id, ...notes[id] }))
      .sort((a, b) => b.updated - a.updated)
      .slice(0, 3)
      .map(n => {
        const doc = App.data.getDoc(n.id);
        const title = doc ? doc.title : n.id;
        return `
          <div class="note-item">
            <div class="n-title"><a href="#/doc/${encodeURIComponent(n.id)}">${esc(title)}</a></div>
            <div class="n-excerpt">${esc(n.text.slice(0, 120))}</div>
            <div class="n-time">${App.utils.fmtDateTime(n.updated)}</div>
          </div>`;
      }).join('');

    container.innerHTML = `
      <h1 class="page-title">你好，木头 👋</h1>
      <p class="page-sub">多模态机器学习 · 8 周自学之旅</p>

      <div class="card">
        <div class="dash-hero">
          <div class="progress-ring">
            <svg width="140" height="140">
              <circle class="ring-bg" cx="70" cy="70" r="${R}" fill="none" stroke-width="11"/>
              <circle class="ring-fg" cx="70" cy="70" r="${R}" fill="none" stroke-width="11"
                stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
            </svg>
            <div class="ring-text">
              <div class="ring-pct">${pct}%</div>
              <div class="ring-label">总进度 ${readPlanned}/${planned.length}</div>
            </div>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="num"><span class="streak-flame">🔥</span> ${streak}<span class="unit">天</span></div>
              <div class="label">连续学习</div>
            </div>
            <div class="hero-stat">
              <div class="num">${fmtDuration(todaySec)}</div>
              <div class="label">今日学习时长</div>
            </div>
            <div class="hero-stat">
              <div class="num">${fmtDuration(totalSec)}</div>
              <div class="label">累计学习时长</div>
            </div>
            <div class="hero-stat">
              <div class="num">${pendingWrong}<span class="unit">题</span></div>
              <div class="label">错题待复习</div>
            </div>
          </div>
        </div>
      </div>

      <h3 style="margin:8px 0 12px;color:var(--primary-dark)">📅 八周学习计划</h3>
      <div class="grid grid-4 mb-16">${weekCards}</div>

      <div class="card">
        <h3>📝 最近笔记</h3>
        ${noteItems || '<div class="empty-state" style="padding:20px">还没有笔记，去<a href="#/plan">学习计划</a>挑一篇开始读吧</div>'}
        ${noteItems ? '<div class="mt-8"><a href="#/notes">查看全部笔记 →</a></div>' : ''}
      </div>
    `;
  }

  return { render };
})();
