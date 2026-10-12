/* ============================================================
   data.js — 静态数据访问层
   读取 data/*.js 注入的 window.__CONTENT__ / __GLOSSARY__ / __PLAN__ / __WEEK1__…__WEEK8__
   ============================================================ */
App.data = (function () {

  const docs = window.__CONTENT__ || [];
  const byId = {};
  docs.forEach(d => { byId[d.id] = d; });

  const plan = window.__PLAN__ || {};
  const glossary = window.__GLOSSARY__ || {};

  /* 文档 → 所属周（来自学习计划；weekly 文档自身带 week 字段） */
  const docWeekMap = {};
  Object.values(plan).forEach(w => (w.docs || []).forEach(id => { docWeekMap[id] = w.week; }));
  docs.forEach(d => { if (d.week != null && docWeekMap[d.id] == null) docWeekMap[d.id] = d.week; });

  const CATEGORY_NAMES = {
    guide: '入门导读', review: '主题综述', note: '论文精读',
    plan: '学习计划', glossary: '术语词典', weekly: '周学习文档', readme: '说明'
  };

  /* ---------- 基础访问 ---------- */
  function getDoc(id) { return byId[id] || null; }
  function getDocWeek(id) { return docWeekMap[id] || null; }
  function getWeeks() {
    return Object.keys(plan).map(k => plan[k]).sort((a, b) => a.week - b.week);
  }
  function getQuiz(week) { return window['__WEEK' + week + '__'] || null; }
  function categoryName(cat) { return CATEGORY_NAMES[cat] || cat; }

  /** 计划内文档总数（去重） */
  function plannedDocIds() {
    const set = new Set();
    Object.values(plan).forEach(w => (w.docs || []).forEach(id => set.add(id)));
    return [...set];
  }

  /* ---------- id / 链接解析 ----------
     id 规则：相对路径去掉 .md 后，除「Unicode 字母 / 数字 / 点 / 连字符」外的字符替换为下划线 */
  function normalizePath(p) {
    return p.replace(/\.md$/i, '').replace(/[^\p{L}\p{N}.\-]/gu, '_');
  }

  /** 把文档正文中的相对链接解析成文档 id；解析不到返回 null */
  function resolveDocId(fromFile, href) {
    let p;
    try { p = decodeURIComponent(href); } catch (e) { p = href; }
    if (!p || p.endsWith('/')) return null;           // 目录链接不处理
    // 以当前文档所在目录为基准解析 ./ ../
    const dir = fromFile ? fromFile.split('/').slice(0, -1) : [];
    p.split('/').forEach(part => {
      if (part === '..') dir.pop();
      else if (part === '.' || part === '') { /* skip */ }
      else dir.push(part);
    });
    const id = normalizePath(dir.join('/'));
    return byId[id] ? id : null;
  }

  /** 改写正文 HTML 中指向其他文档的相对链接为 #/doc/<id> */
  function rewriteLinks(html, fromFile) {
    return html.replace(/href="([^"]*)"/g, (m, url) => {
      if (/^(https?:|mailto:|#|javascript:)/i.test(url)) return m;
      const id = resolveDocId(fromFile, url);
      if (id) return 'href="#/doc/' + encodeURIComponent(id) + '"';
      // 无法解析的相对链接：禁用跳转，避免跳出 SPA
      return 'href="javascript:void(0)" class="dead-link" title="此链接指向的内容不在本站内"';
    });
  }

  /* ---------- 术语表 ---------- */
  let termListCache = null;
  function getTerms() {
    if (!termListCache) {
      // 按长度降序，保证长术语优先匹配
      termListCache = Object.keys(glossary)
        .map(en => ({ en, zh: glossary[en].zh, desc: glossary[en].desc }))
        .sort((a, b) => b.en.length - a.en.length);
    }
    return termListCache;
  }

  function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  let termRegexCache = null;
  /** 所有术语合成一个大正则；ASCII 字母数字边界处加环视，避免误伤单词内部 */
  function getTermRegex() {
    if (!termRegexCache) {
      const parts = getTerms().map(t => {
        let pat = escRegex(t.en);
        if (/^[A-Za-z0-9]/.test(t.en)) pat = '(?<![A-Za-z0-9])' + pat;
        if (/[A-Za-z0-9]$/.test(t.en)) pat = pat + '(?![A-Za-z0-9])';
        return pat;
      });
      termRegexCache = new RegExp('(' + parts.join('|') + ')', 'g');
    }
    return termRegexCache;
  }

  const termByLower = {};
  getTerms().forEach(t => { termByLower[t.en.toLowerCase()] = t; });

  /**
   * 在容器元素内给术语包 <span class="term">（每个术语每篇最多 3 处）。
   * 跳过 pre/code/a/script/style/h1-h4 内部，避免破坏结构。
   */
  function wrapTerms(container) {
    const regex = getTermRegex();
    const SKIP = new Set(['PRE', 'CODE', 'A', 'SCRIPT', 'STYLE', 'H1', 'H2', 'H3', 'H4', 'TEXTAREA']);
    const counts = {};   // 每个术语已包裹次数
    const MAX = 3;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let p = node.parentElement;
        while (p && p !== container) {
          if (SKIP.has(p.tagName) || p.classList.contains('term')) return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
      const text = node.nodeValue;
      regex.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = regex.exec(text)) !== null) {
        const term = termByLower[m[0].toLowerCase()];
        if (!term) continue;
        const key = term.en;
        if ((counts[key] || 0) >= MAX) continue;
        if (!frag) frag = document.createDocumentFragment();
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'term';
        span.textContent = m[0];
        span.dataset.term = term.en;
        frag.appendChild(span);
        counts[key] = (counts[key] || 0) + 1;
        last = m.index + m[0].length;
      }
      if (frag) {
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  /** 查找术语详情 */
  function termInfo(en) { return termByLower[en.toLowerCase()] || null; }

  /** 测验出处 "00_入门导读/01_什么是多模态学习.md" → 文档 id */
  function sourceToDocId(source) {
    if (!source) return null;
    const id = normalizePath(source);
    return byId[id] ? id : null;
  }

  return {
    docs, getDoc, getDocWeek, getWeeks, getQuiz, categoryName, plannedDocIds,
    resolveDocId, rewriteLinks,
    getTerms, wrapTerms, termInfo, sourceToDocId
  };
})();

/* ============================================================
   time.js — 学习时长与活跃天数统计
   页面可见时每 30 秒累加一次；visibilitychange 时暂停
   ============================================================ */
App.time = (function () {
  const S = App.store;
  const TICK = 30 * 1000;   // 30 秒
  let timer = null;

  function getTimeMap() { return S.read('time', {}); }           // {"YYYY-MM-DD": 秒}
  function getActiveDays() { return S.read('active_days', []); } // ["YYYY-MM-DD", ...]

  /** 记录今天为活跃日（任何学习行为都调用） */
  function recordActivity() {
    const days = getActiveDays();
    const today = App.utils.dayKey();
    if (days[days.length - 1] !== today) {
      days.push(today);
      S.write('active_days', days);
    }
  }

  function tick() {
    if (document.visibilityState !== 'visible') return;
    const map = getTimeMap();
    const today = App.utils.dayKey();
    map[today] = (map[today] || 0) + TICK / 1000;
    S.write('time', map);
    recordActivity();
  }

  function start() {
    if (timer) return;
    timer = setInterval(tick, TICK);
    document.addEventListener('visibilitychange', () => {
      // 重新可见时立即补一次心跳之外的记录由 interval 自行处理，无需特殊操作
    });
  }

  function getTodaySec() { return getTimeMap()[App.utils.dayKey()] || 0; }
  function getTotalSec() {
    return Object.values(getTimeMap()).reduce((a, b) => a + b, 0);
  }

  /** 最近 n 天 [{day, label, sec}] */
  function getLastDays(n) {
    const map = getTimeMap();
    const out = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = App.utils.dayKey(d);
      out.push({
        day: key,
        label: (d.getMonth() + 1) + '/' + d.getDate(),
        sec: map[key] || 0
      });
    }
    return out;
  }

  /** 连续学习天数（以今天或昨天为终点向前数） */
  function getStreak() {
    const days = new Set(getActiveDays());
    let cursor = new Date();
    if (!days.has(App.utils.dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);   // 今天还没学，允许从昨天起算
      if (!days.has(App.utils.dayKey(cursor))) return 0;
    }
    let streak = 0;
    while (days.has(App.utils.dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  return { start, recordActivity, getTodaySec, getTotalSec, getLastDays, getStreak };
})();
