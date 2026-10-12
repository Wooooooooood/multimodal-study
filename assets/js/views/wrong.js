/* ============================================================
   wrong.js — #/wrong 错题本
   按周分组 / 重新作答（答对标记为已掌握）/ 清空已掌握
   ============================================================ */
App.views = App.views || {};

App.views.wrong = (function () {
  const { esc, toast } = App.utils;

  /** 从测验数据里找回题目对象 */
  function findQuestion(qid, week) {
    const quiz = App.data.getQuiz(week);
    return quiz ? quiz.questions.find(q => q.id === qid) : null;
  }

  function render(container) {
    const wrong = App.db.getWrong();
    const entries = Object.keys(wrong).map(qid => ({ qid, ...wrong[qid] }));
    const active = entries.filter(e => !e.mastered).sort((a, b) => a.week - b.week || a.addedAt - b.addedAt);
    const mastered = entries.filter(e => e.mastered).sort((a, b) => a.week - b.week);

    if (!entries.length) {
      container.innerHTML = `
        <h1 class="page-title">📕 错题本</h1>
        <p class="page-sub">测验中答错的题会自动收集到这里。</p>
        <div class="empty-state"><div class="big">🎉</div>错题本空空如也，去<a href="#/quiz">考核中心</a>测一圈吧</div>`;
      return;
    }

    // 按周分组
    const byWeek = {};
    active.forEach(e => { (byWeek[e.week] = byWeek[e.week] || []).push(e); });

    const groups = Object.keys(byWeek).sort((a, b) => a - b).map(wk => {
      const items = byWeek[wk].map(e => {
        const q = findQuestion(e.qid, e.week);
        if (!q) return '';
        return `
          <div class="quiz-q" data-qid="${esc(q.id)}" data-week="${wk}">
            <div class="q-head">
              <span class="q-no">${esc(q.id)}</span>
              <span class="q-type t-${q.type}">${App.views.quiz.TYPE_NAMES[q.type]}</span>
            </div>
            <div class="q-text">${esc(q.question)}</div>
            <div class="q-opts">
              ${q.options.map((opt, i) => `
                <label class="opt" data-opt="${i}">
                  <input type="${q.type === 'multiple' ? 'checkbox' : 'radio'}" name="wq_${esc(q.id)}" value="${i}">
                  <span>${esc(opt)}</span>
                </label>`).join('')}
            </div>
            <div class="btn-row">
              <button class="btn btn-sm btn-primary btn-answer" data-qid="${esc(q.id)}">重新作答</button>
              <button class="btn btn-sm btn-remove" data-qid="${esc(q.id)}">直接移出</button>
            </div>
          </div>`;
      }).join('');
      return `<div class="card"><h3>第 ${wk} 周（${byWeek[wk].length} 题待复习）</h3>${items}</div>`;
    }).join('');

    const masteredHtml = mastered.length ? `
      <div class="card">
        <h3>✅ 已掌握（${mastered.length} 题）</h3>
        ${mastered.map(e => {
          const q = findQuestion(e.qid, e.week);
          return `<div class="history-row">
            <span class="h-week">第 ${e.week} 周</span>
            <span class="h-time">${q ? esc(q.question.slice(0, 40)) : esc(e.qid)}</span>
            <button class="btn btn-sm btn-unmaster" data-qid="${esc(e.qid)}">移回复习</button>
          </div>`;
        }).join('')}
        <div class="btn-row"><button class="btn btn-danger" id="btn-clear-mastered">清空已掌握</button></div>
      </div>` : '';

    container.innerHTML = `
      <h1 class="page-title">📕 错题本</h1>
      <p class="page-sub">待复习 ${active.length} 题 · 已掌握 ${mastered.length} 题。重新作答正确后会自动标记为已掌握。</p>
      ${groups || '<div class="empty-state" style="padding:24px"><div class="big">👏</div>待复习错题已清零</div>'}
      ${masteredHtml}
    `;

    App.views.quiz.bindOptHighlight(container);

    // 重新作答 → 判分
    container.querySelectorAll('.btn-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const qEl = container.querySelector(`.quiz-q[data-qid="${CSS.escape(qid)}"]`);
        const wk = Number(qEl.dataset.week);
        const q = findQuestion(qid, wk);
        if (!q) return;
        if (qEl.dataset.graded) { toast('这题已经判过分了'); return; }

        const picked = [...qEl.querySelectorAll(`input[name="wq_${CSS.escape(qid)}"]:checked`)]
          .map(el => Number(el.value)).sort((a, b) => a - b);
        if (!picked.length) { toast('先选择答案再提交'); return; }

        qEl.dataset.graded = '1';
        const ok = App.views.quiz.renderResult(q, picked, qEl);
        btn.disabled = true;
        if (ok) {
          App.db.setWrongMastered(qid, true);
          App.time.recordActivity();
          toast('答对了，已标记为已掌握 ✅');
        } else {
          toast('还是不对，再想想解析吧');
        }
      });
    });

    // 直接移出
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('确定把这道题移出错题本吗？')) return;
        App.db.removeWrong(btn.dataset.qid);
        toast('已移出');
        render(container);
      });
    });

    // 移回复习
    container.querySelectorAll('.btn-unmaster').forEach(btn => {
      btn.addEventListener('click', () => {
        App.db.setWrongMastered(btn.dataset.qid, false);
        render(container);
      });
    });

    // 清空已掌握
    const clearBtn = document.getElementById('btn-clear-mastered');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('确定清空所有「已掌握」的错题吗？此操作不可撤销。')) return;
        App.db.clearMasteredWrong();
        toast('已清空');
        render(container);
      });
    }
  }

  return { render };
})();
