/* ============================================================
   server.js — 零依赖静态文件服务器（node:http）
   用法：node server.js [端口]
   端口优先级：argv[2] > 环境变量 PORT > 默认 7100
   ============================================================ */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;

// 端口解析：CLI 参数需是纯数字
let port = 7100;
const argvPort = process.argv[2];
if (argvPort && /^\d+$/.test(argvPort)) port = Number(argvPort);
else if (process.env.PORT && /^\d+$/.test(process.env.PORT)) port = Number(process.env.PORT);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // 去掉查询串，解码，防目录穿越
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400); res.end('Bad Request'); return;
  }
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';   // 目录 → index.html
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`✅ 多模态学习站已启动: http://localhost:${port}/`);
  console.log('   按 Ctrl+C 停止');
});

// CLI host/port 转发说明：若用 npm run dev -- --port 8080，npm 会把参数追加到命令尾部，上面的 argv 解析即可接住。
