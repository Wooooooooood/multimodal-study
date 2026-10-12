/* ============================================================
   quiz.js — #/quiz 考核中心
   选周 → 答题 → 判分（得分 + 逐题解析 + 出处链接）→ 错题入库 → 历史成绩
   ============================================================ */
App.views = App.views || {};

App.views.quiz = (function () {
  const { esc, toast } = App.utils;

  const TYPE_NAMES = { single: '单选', multiple: '多选', judge: '判断' };

  /* ---------- 判分工具 ---------- */
  function isCorrect(q, picked) {
    // picked：下标数组（已排序）
    const ans = Array.isArray(q.answer) ? [...q.answer].sort((a, b) => a - b) : [q.answer];
    if (picked.length !== ans.length) return false;
    return picked.every((v, i) => v === ans[i]);
  }

  /** 组装一道题的答题交互 HTML */
  function questionHtml(q, idx) {
    const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
    const opts = q.options.map((opt, i) => `
      <label class="opt" data-opt="${i}">
        <input type="${inputType}" name="q_${q.id}" value="${i}">
        <span>${esc(opt)}</span>
      </label>`).join('');
    return `
      <div class="quiz-q" data-qid="${esc(q.id)}">
        <div class="q-head">
          <span class="q-no">第 ${idx + 1} 题</span>
          <span class="q-type t-${q.type}">${TYPE_NAMES[q.type]}</span>
        </div>
        <div class="q-text">${esc(q.question)}</div>
        <div class="q-opts">${opts}</div>
      </div>`;
  }

  /** 收集某题的已选下标（排序） */
  function collectPicked(q) {
    return [...document.querySelectorAll(`input[name="q_${CSS.escape(q.id)}"]:checked`)]
      .map(el => Number(el.value)).sort((a, b) => a - b);
  }

  /** 选项高亮选中态 */
  function bindOptHighlight(container) {
    container.querySelectorAll('.q-opts').forEach(box => {
      box.addEventListener('change', () => {
        box.querySelectorAll('.opt').forEach(l => {
          const inp = l.querySelector('input');
          l.classList.toggle('selected', inp.checked);
        });
      });
    });
  }

  /** 判分后渲染每题结果（对错 + 解析 + 出处） */
  function renderResult(q, picked, qEl) {
    const ok = isCorrect(q, picked);
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    qEl.classList.add(ok ? 'correct' : 'wrong');

    qEl.querySelectorAll('.opt').forEach(l => {
      const i = Number(l.dataset.opt);
      const inp = l.querySelector('input');
      inp.disabled = true;
      if (ans.includes(i)) l.classList.add('opt-correct');
      else if (picked.includes(i)) l.classList.add('opt-wrong');
    });

    const srcId = App.data.sourceToDocId(q.source);
    const srcDoc = srcId ? App.data.getDoc(srcId) : null;
    const sourceHtml = srcDoc
      ? `<a href="#/doc/${encodeURIComponent(srcId)}">📖 ${esc(srcDoc.title)}</a>`
      : esc(q.source || '');

    const ex = document.createElement('div');
    ex.className = 'q-explain';
    ex.innerHTML = `
      <span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✓ 回答正确' : '✗ 回答错误'}</span>
      <span>正确答案：${ans.map(i => q.options[i]).join('、')}</span>
      <div class="mt-8">${esc(q.explanation)}</div>
      ${sourceHtml ? `<span class="q-source">出处：${sourceHtml}</span>` : ''}`;
    qEl.appendChild(ex);
    return ok;
  }

  /* ---------- #/quiz 首页：选周 + 历史 ---------- */
  function renderHome(container) {
    const history = App.db.getQuizHistory();
    const weeks = App.data.getWeeks();
    const wrong = App.db.getWrong();

    const weekRows = weeks.map(w => {
      const quiz = App.data.getQuiz(w.week);
      const total = quiz ? quiz.questions.length : 0;
      const best = history.filter(h => h.week === w.week).reduce((m, h) => Math.max(m, h.pct), -1);
      const wrongCnt = Object.values(wrong).filter(x => x.week === w.week && !x.mastered).length;
      return `
        <div class="week-card">
          <div class="week-title">第 ${w.week} 周 · ${esc(quiz ? quiz.title : '')}</div>
          <div class="week-frac">${total} 题${best >= 0 ? ` · 最好成绩 ${best} 分` : ' · 尚未测验'}${wrongCnt ? ` · 错题 ${wrongCnt} 题` : ''}</div>
          <div class="week-actions"><a class="btn btn-sm btn-primary" href="#/quiz/${w.week}">开始测验</a></div>
        </div>`;
    }).join('');

    const historyRows = history.slice().reverse().map(h => {
      const cls = h.pct >= 80 ? 'good' : h.pct >= 60 ? 'mid' : 'bad';
      return `
        <div class="history-row">
          <span class="h-week">第 ${h.week} 周</span>
          <span class="h-time">${App.utils.fmtDateTime(h.time)}</span>
          <span class="h-score ${cls}">${h.correct}/${h.total}（${h.pct} 分）</span>
        </div>`;
    }).join('');

    container.innerHTML = `
      <h1 class="page-title">✏️ 考核中心</h1>
      <p class="page-sub">每周 24 题：单选、多选、判断。提交后立即判分，错题自动进入错题本。</p>
      <div class="grid grid-4 mb-16">${weekRows}</div>
      <div class="card">
        <h3>📜 历史成绩</h3>
        ${historyRows || '<div class="empty-state" style="padding:20px">还没有测验记录</div>'}
      </div>
    `;
  }

  /* ---------- #/quiz/<week> 答题页 ---------- */
  function renderQuiz(container, week) {
    const quiz = App.data.getQuiz(week);
    if (!quiz) {
      container.innerHTML = `<a class="back-link" href="#/quiz">← 返回考核中心</a>
        <div class="empty-state"><div class="big">😵</div>第 ${esc(week)} 周的测验不存在</div>`;
      return;
    }

    container.innerHTML = `
      <a class="back-link" href="#/quiz">← 返回考核中心</a>
      <h1 class="page-title">第 ${quiz.week} 周测验 · ${esc(quiz.title)}</h1>
      <p class="page-sub">共 ${quiz.questions.length} 题（单选 / 多选 / 判断），答完点击底部「提交判分」。</p>
      <div id="quiz-body">${quiz.questions.map((q, i) => questionHtml(q, i)).join('')}</div>
      <div class="card" style="text-align:center">
        <button id="btn-submit" class="btn btn-primary" style="padding:10px 40px;font-size:16px">提交判分</button>
      </div>
    `;

    bindOptHighlight(container);

    document.getElementById('btn-submit').addEventListener('click', () => {
      // 未答完先确认
      const unanswered = quiz.questions.filter(q => collectPicked(q).length === 0).length;
      if (unanswered > 0 && !confirm(`还有 ${unanswered} 题未作答，确定提交吗？`)) return;

      let correctCnt = 0;
      quiz.questions.forEach(q => {
        const qEl = container.querySelector(`[data-qid="${q.id}"]`);
        const picked = collectPicked(q);
        const ok = renderResult(q, picked, qEl);
        if (ok) correctCnt++;
        else App.db.addWrong(q.id, quiz.week);   // 错题自动进错题本
      });

      const pct = Math.round(correctCnt / quiz.questions.length * 100);
      App.db.addQuizHistory({ week: quiz.week, correct: correctCnt, total: quiz.questions.length, pct, time: Date.now() });

      // 顶部插入成绩横幅并滚动回去
      const banner = document.createElement('div');
      banner.className = 'card score-banner';
      const cls = pct >= 80 ? 'good' : pct >= 60 ? '' : 'bad';
      banner.innerHTML = `
        <div class="score-num ${cls}">${pct} 分</div>
        <div class="score-sub">答对 ${correctCnt} / ${quiz.questions.length} 题${pct < 100 ? ' · 错题已加入<a href="#/wrong">错题本</a>' : ' · 满分，太棒了 🎉'}</div>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="btn-retry">再测一次</button>
          <a class="btn btn-primary" href="#/wrong">去复习错题</a>
        </div>`;
      container.insertBefore(banner, container.children[1]);
      banner.querySelector('#btn-retry').addEventListener('click', () => renderQuiz(container, week));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast(`本次得分 ${pct} 分`);
    });
  }

  function render(container, param) {
    if (param) renderQuiz(container, param);
    else renderHome(container);
  }

  return { render, isCorrect, collectPicked, renderResult, questionHtml, bindOptHighlight, TYPE_NAMES };
})();
