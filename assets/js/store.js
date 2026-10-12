/* ============================================================
   store.js — localStorage 持久化层
   所有键统一前缀 mmstudy_
   ============================================================ */
window.App = window.App || {};

App.store = (function () {
  const PREFIX = 'mmstudy_';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[store] 读取失败:', key, e);
      return fallback;
    }
  }

  function write(key, val) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('[store] 写入失败:', key, e);
    }
  }

  function remove(key) { localStorage.removeItem(PREFIX + key); }

  /** 列出所有带前缀的键（去掉前缀） */
  function keys() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  }

  /** 导出全部数据为一个对象（用于备份/云同步） */
  function exportAll() {
    const data = {};
    keys().forEach(k => { data[k] = read(k, null); });
    return { __app: 'mmstudy', __version: 1, __exportedAt: new Date().toISOString(), data };
  }

  /** 从备份对象导入（覆盖本地） */
  function importAll(payload) {
    if (!payload || payload.__app !== 'mmstudy' || typeof payload.data !== 'object') {
      throw new Error('备份文件格式不正确');
    }
    clearAll();
    Object.keys(payload.data).forEach(k => write(k, payload.data[k]));
  }

  /** 清空全部本地数据 */
  function clearAll() { keys().forEach(remove); }

  return { PREFIX, read, write, remove, keys, exportAll, importAll, clearAll };
})();

/* ---------- 业务数据存取（基于 store 的一层封装） ---------- */
App.db = (function () {
  const S = App.store;

  /* 已读文档：{docId: 时间戳} */
  function getRead() { return S.read('read', {}); }
  function isRead(id) { return !!getRead()[id]; }
  function markRead(id, on) {
    const r = getRead();
    if (on) r[id] = Date.now(); else delete r[id];
    S.write('read', r);
    App.time.recordActivity();
  }

  /* 笔记：{docId: {text, updated}} */
  function getNotes() { return S.read('notes', {}); }
  function getNote(id) { return getNotes()[id] || null; }
  function saveNote(id, text) {
    const n = getNotes();
    if (text && text.trim()) n[id] = { text: text.trim(), updated: Date.now() };
    else delete n[id];
    S.write('notes', n);
  }

  /* 测验历史：[{week, correct, total, pct, time}] */
  function getQuizHistory() { return S.read('quiz_history', []); }
  function addQuizHistory(rec) {
    const h = getQuizHistory();
    h.push(rec);
    S.write('quiz_history', h);
    App.time.recordActivity();
  }

  /* 错题本：{questionId: {week, addedAt, mastered}} */
  function getWrong() { return S.read('wrong', {}); }
  function addWrong(qid, week) {
    const w = getWrong();
    w[qid] = { week, addedAt: Date.now(), mastered: false };
    S.write('wrong', w);
  }
  function setWrongMastered(qid, mastered) {
    const w = getWrong();
    if (w[qid]) { w[qid].mastered = mastered; S.write('wrong', w); }
  }
  function removeWrong(qid) {
    const w = getWrong();
    delete w[qid];
    S.write('wrong', w);
  }
  function clearMasteredWrong() {
    const w = getWrong();
    Object.keys(w).forEach(k => { if (w[k].mastered) delete w[k]; });
    S.write('wrong', w);
  }
  function pendingWrongCount() {
    return Object.values(getWrong()).filter(x => !x.mastered).length;
  }

  return {
    getRead, isRead, markRead,
    getNotes, getNote, saveNote,
    getQuizHistory, addQuizHistory,
    getWrong, addWrong, setWrongMastered, removeWrong, clearMasteredWrong, pendingWrongCount
  };
})();

/* ============================================================
   utils.js — 通用小工具
   ============================================================ */
App.utils = (function () {

  /** HTML 转义 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** 日期 → "YYYY-MM-DD"（本地时区） */
  function dayKey(d) {
    d = d || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /** 秒数 → "X 小时 Y 分钟" / "Y 分钟" */
  function fmtDuration(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + ' 秒';
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h > 0) return h + ' 小时 ' + m + ' 分钟';
    return m + ' 分钟';
  }

  /** 秒数 → 小时（一位小数） */
  function fmtHours(sec) { return (sec / 3600).toFixed(1); }

  /** 时间戳 → "2026-02-09 14:30" */
  function fmtDateTime(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /** Toast 轻提示 */
  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /** 触发浏览器下载一个文本文件 */
  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  return { esc, dayKey, fmtDuration, fmtHours, fmtDateTime, toast, downloadText };
})();
