/* ============================================================
   settings.js — #/settings 设置与同步
   GitHub Gist 云同步 / JSON 备份导入导出 / 每日提醒说明 / 危险区
   ============================================================ */
App.views = App.views || {};

App.views.settings = (function () {
  const { esc, toast, downloadText, fmtDateTime } = App.utils;
  const GIST_FILE = 'mmstudy_progress.json';
  const GIST_DESC = '多模态学习网站进度备份 (mmstudy)';

  /* ---------- GitHub Gist API ---------- */
  function getToken() { return App.store.read('gh_token', ''); }
  function getGistId() { return App.store.read('gist_id', ''); }

  function api(path, opts) {
    const token = getToken();
    if (!token) return Promise.reject(new Error('请先填写 Personal Access Token'));
    return fetch('https://api.github.com' + path, {
      ...opts,
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(opts && opts.headers || {})
      }
    }).then(async res => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || ('HTTP ' + res.status));
      return body;
    });
  }

  function setStatus(msg, cls) {
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = msg; el.className = 'sync-status ' + (cls || ''); }
  }

  /** 上传：无 gist id 则创建 private gist，否则覆盖更新 */
  async function upload() {
    setStatus('正在上传…');
    try {
      const content = JSON.stringify(App.store.exportAll(), null, 2);
      let gistId = getGistId();
      if (!gistId) {
        const gist = await api('/gists', {
          method: 'POST',
          body: JSON.stringify({
            description: GIST_DESC,
            public: false,
            files: { [GIST_FILE]: { content } }
          })
        });
        gistId = gist.id;
        App.store.write('gist_id', gistId);
        setStatus('已创建云端备份并上传成功 ✓ Gist ID：' + gistId, 'ok');
      } else {
        await api('/gists/' + gistId, {
          method: 'PATCH',
          body: JSON.stringify({ files: { [GIST_FILE]: { content } } })
        });
        setStatus('上传成功，云端已全量覆盖 ✓ ' + fmtDateTime(Date.now()), 'ok');
      }
      refreshGistLabel();
      toast('已上传到云端 ☁️');
    } catch (e) {
      setStatus('上传失败：' + e.message + '（请检查 Token 是否有 gist 权限、网络是否正常）', 'err');
    }
  }

  /** 下载：云端内容覆盖本地（先确认） */
  async function download() {
    const gistId = getGistId();
    if (!gistId) { setStatus('还没有云端备份，请先「上传到云端」。', 'err'); return; }
    if (!confirm('下载会用云端数据【覆盖】本地全部学习数据，确定继续吗？')) return;
    setStatus('正在下载…');
    try {
      const gist = await api('/gists/' + gistId);
      const file = gist.files && gist.files[GIST_FILE];
      if (!file) throw new Error('云端 gist 里找不到 ' + GIST_FILE);
      App.store.importAll(JSON.parse(file.content));
      setStatus('下载恢复成功，本地已被云端覆盖 ✓ ' + fmtDateTime(Date.now()), 'ok');
      toast('已从云端恢复 ✅');
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setStatus('下载失败：' + e.message, 'err');
    }
  }

  function refreshGistLabel() {
    const el = document.getElementById('gist-id-label');
    if (el) el.textContent = getGistId() || '（尚未创建）';
  }

  /* ---------- 本地备份 ---------- */
  function exportBackup() {
    downloadText(`mmstudy_备份_${App.utils.dayKey()}.json`,
      JSON.stringify(App.store.exportAll(), null, 2), 'application/json');
    toast('备份文件已下载 📥');
  }

  function importBackup(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!confirm('导入会【覆盖】本地全部学习数据，确定继续吗？')) { fileInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        App.store.importAll(JSON.parse(reader.result));
        toast('导入成功 ✅');
        setTimeout(() => location.reload(), 800);
      } catch (e) {
        alert('导入失败：' + e.message);
        fileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  /* ---------- 渲染 ---------- */
  function render(container) {
    const token = getToken();
    const gistId = getGistId();

    container.innerHTML = `
      <h1 class="page-title">⚙️ 设置与同步</h1>
      <p class="page-sub">所有数据默认保存在浏览器本地（localStorage），这里可以云同步或手动备份。</p>

      <div class="card">
        <h3>☁️ GitHub Gist 云同步</h3>
        <p class="text-soft">
          在 GitHub → Settings → Developer settings → Personal access tokens 生成一个 Token，
          <strong>只需勾选 <code>gist</code> 权限</strong>。Token 只保存在你自己的浏览器里。
          首次上传会自动创建一个私密 Gist（文件名 <code>${GIST_FILE}</code>）。
        </p>
        <label class="field-label" for="gh-token">Personal Access Token</label>
        <input type="password" id="gh-token" placeholder="ghp_xxxxxxxxxxxx" value="${esc(token)}">
        <div class="text-soft mt-8">云端 Gist ID：<code id="gist-id-label">${esc(gistId) || '（尚未创建）'}</code></div>
        <div class="btn-row">
          <button class="btn" id="btn-save-token">保存 Token</button>
          <button class="btn btn-primary" id="btn-upload">⬆️ 上传到云端（覆盖云端）</button>
          <button class="btn" id="btn-download">⬇️ 下载恢复（覆盖本地）</button>
        </div>
        <div class="sync-status" id="sync-status"></div>
      </div>

      <div class="card">
        <h3>💾 本地备份</h3>
        <p class="text-soft">导出为一个 JSON 文件随身携带；换电脑、换浏览器后再导入即可恢复。</p>
        <div class="btn-row">
          <button class="btn" id="btn-export">⬇️ 导出备份 JSON</button>
          <label class="btn" for="import-file" style="cursor:pointer">📂 从 JSON 文件导入</label>
          <input type="file" id="import-file" accept=".json,application/json" style="display:none">
        </div>
      </div>

      <div class="card">
        <h3>⏰ 每日提醒</h3>
        <div class="info-card">
          网页无法主动提醒你学习——浏览器关掉后它就睡着了。<br>
          想要每天定时提醒（比如晚上 8 点提醒你打卡），请配合 <strong>OpenClaw（龙虾）</strong> 使用，
          让它每天定时唤起这个页面或推送提醒。配置说明见仓库
          <a href="../openclaw/README.md" target="_blank" rel="noopener">openclaw/README.md</a>。
        </div>
      </div>

      <div class="card danger-zone">
        <h3>⚠️ 危险区</h3>
        <p class="text-soft">清空浏览器里保存的全部学习数据（已读记录、笔记、测验成绩、错题、时长统计）。建议先导出备份。</p>
        <div class="btn-row">
          <button class="btn btn-danger" id="btn-wipe">🗑️ 清空全部本地数据</button>
        </div>
      </div>
    `;

    document.getElementById('btn-save-token').addEventListener('click', () => {
      App.store.write('gh_token', document.getElementById('gh-token').value.trim());
      toast('Token 已保存（仅存于本浏览器）');
    });
    document.getElementById('btn-upload').addEventListener('click', () => {
      // 上传前先保存当前输入的 Token
      App.store.write('gh_token', document.getElementById('gh-token').value.trim());
      upload();
    });
    document.getElementById('btn-download').addEventListener('click', download);
    document.getElementById('btn-export').addEventListener('click', exportBackup);
    document.getElementById('import-file').addEventListener('change', e => importBackup(e.target));
    document.getElementById('btn-wipe').addEventListener('click', () => {
      if (!confirm('⚠️ 确定清空全部本地学习数据吗？此操作不可撤销！')) return;
      if (!confirm('再确认一次：已读记录、笔记、成绩、错题、时长将全部删除。确定？')) return;
      App.store.clearAll();
      toast('已清空全部本地数据');
      setTimeout(() => location.reload(), 800);
    });
  }

  return { render };
})();
