'use strict';
/**
 * Project Ysoriel — zero-dependency static server + scores API.
 * Run: node server.js   (PORT, HOST, EMBED_ORIGINS are optional env vars)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'scores.json');
const EMBED = (process.env.EMBED_ORIGINS || '').trim(); // e.g. "https://sites.google.com https://*.googleusercontent.com"
const MAX_BODY = 2048;
const MISSIONS = ['Earth Climate Watch', 'Lunar Polar Prospector', 'Mars Atmosphere Orbiter'];

const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8'
};
const SECURITY = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors " + (EMBED ? "'self' " + EMBED : "'self'")
};

fs.mkdirSync(DATA_DIR, {recursive:true});
let scores = [];
try { scores = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); if (!Array.isArray(scores)) scores = []; } catch (e) { scores = []; }

function persist() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(scores, null, 2), err => { if (!err) fs.rename(tmp, DATA_FILE, () => {}); });
}
function send(res, code, body, type, extra) {
  res.writeHead(code, Object.assign({'Content-Type':type || 'text/plain; charset=utf-8'}, SECURITY, extra || {}));
  res.end(body);
}
function json(res, code, obj) { send(res, code, JSON.stringify(obj), MIME['.json'], {'Cache-Control':'no-store'}); }

function handleApi(req, res, pathname) {
  if (pathname === '/api/health') return json(res, 200, {status:'ok', uptime:Math.round(process.uptime())});
  if (pathname !== '/api/scores') return json(res, 404, {error:'Not found'});
  if (req.method === 'GET') return json(res, 200, scores.slice().sort((a, b) => b.score - a.score).slice(0, 25));
  if (req.method !== 'POST') return json(res, 405, {error:'Method not allowed'});
  let size = 0; const chunks = [];
  req.on('data', c => {
    size += c.length;
    if (size > MAX_BODY) { json(res, 413, {error:'Payload too large'}); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    let b;
    try { b = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return json(res, 400, {error:'Invalid JSON'}); }
    const score = Number(b && b.score);
    if (!b || b.game !== 'studio' || !MISSIONS.includes(b.mission) || !Number.isInteger(score) || score < 0 || score > 100) {
      return json(res, 422, {error:'Invalid score payload'});
    }
    const entry = {game:'studio', mission:b.mission, score, at:new Date().toISOString()};
    scores.push(entry);
    scores = scores.sort((a, c) => c.score - a.score).slice(0, 100);
    persist();
    json(res, 201, entry);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch (e) { return send(res, 400, 'Bad request'); }
  if (pathname.includes('\0')) return send(res, 400, 'Bad request');
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', null, {Allow:'GET, HEAD'});

  let file = path.normalize(path.join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (e, buf) => {
      if (e) return send(res, 404, 'Not found');
      const ext = path.extname(file).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';
      send(res, 200, req.method === 'HEAD' ? '' : buf, type, {'Cache-Control':cache});
    });
  });
});

server.listen(PORT, HOST, () => console.log(`Project Ysoriel running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`));
function stop() { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500).unref(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
