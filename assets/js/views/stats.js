/* ============================================================
   stats.js — #/stats 学习统计
   最近 14 天时长柱状图（纯 CSS）+ 汇总卡片
   ============================================================ */
App.views = App.views || {};

App.views.stats = (function () {
  const { esc, fmtDuration, fmtHours } = App.utils;

  function render(container) {
    const days = App.time.getLastDays(14);
    const maxSec = Math.max(60, ...days.map(d => d.sec));
    const totalSec = App.time.getTotalSec();
    const todaySec = App.time.getTodaySec();
    const activeDays = days.filter(d => d.sec > 0).length;
    const avgSec = activeDays ? days.reduce((a, d) => a + d.sec, 0) / activeDays : 0;
    const todayKey = App.utils.dayKey();

    // 已读 / 测验 / 错题统计
    const read = App.db.getRead();
    const planned = App.data.plannedDocIds();
    const readTotal = Object.keys(read).length;
    const readPlanned = planned.filter(id => read[id]).length;
    const history = App.db.getQuizHistory();
    const quizCnt = history.length;
    const bestPct = quizCnt ? Math.max(...history.map(h => h.pct)) : null;
    const wrong = Object.values(App.db.getWrong());
    const wrongActive = wrong.filter(w => !w.mastered).length;
    const wrongMastered = wrong.length - wrongActive;

    const bars = days.map(d => {
      const h = Math.max(2, Math.round(d.sec / maxSec * 150));
      const val = d.sec > 0 ? Math.round(d.sec / 60) + 'm' : '';
      return `
        <div class="bar-col" title="${d.day}：${fmtDuration(d.sec)}">
          <div class="bar-val">${val}</div>
          <div class="bar ${d.day === todayKey ? 'today' : ''}" style="height:${h}px"></div>
          <div class="bar-label">${d.label}</div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <h1 class="page-title">📊 学习统计</h1>
      <p class="page-sub">页面打开期间每 30 秒自动累计一次时长，切到后台自动暂停。</p>

      <div class="card">
        <h3>⏱️ 最近 14 天学习时长</h3>
        <div class="bar-chart">${bars}</div>
        <div class="text-soft mt-8" style="text-align:center">橙色为今天 · 悬停查看具体时长</div>
      </div>

      <div class="grid grid-4 mb-16">
        <div class="stat-card"><div class="num">${fmtDuration(todaySec)}</div><div class="label">今日时长</div></div>
        <div class="stat-card"><div class="num">${fmtHours(totalSec)}<small style="font-size:14px"> 小时</small></div><div class="label">累计时长</div></div>
        <div class="stat-card"><div class="num">${fmtDuration(avgSec)}</div><div class="label">活跃日日均（近 14 天）</div></div>
        <div class="stat-card"><div class="num">🔥 ${App.time.getStreak()} 天</div><div class="label">连续学习</div></div>
      </div>

      <div class="grid grid-3">
        <div class="stat-card">
          <div class="num">${readPlanned} / ${planned.length}</div>
          <div class="label">计划内文档已读（全部已读 ${readTotal} 篇）</div>
        </div>
        <div class="stat-card">
          <div class="num">${quizCnt} 次</div>
          <div class="label">测验次数${bestPct !== null ? ` · 最好成绩 ${bestPct} 分` : ''}</div>
        </div>
        <div class="stat-card">
          <div class="num">${wrongActive} / ${wrong.length}</div>
          <div class="label">错题待复习 / 累计（已掌握 ${wrongMastered} 题）</div>
        </div>
      </div>
    `;
  }

  return { render };
})();
