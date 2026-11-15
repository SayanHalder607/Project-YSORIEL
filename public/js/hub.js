(() => {
'use strict';
const VIEWS = ['overview', 'studio', 'guardian'];
const SRC = {studio:'studio/index.html', guardian:'guardian/index.html'};
const TITLES = {studio:'Mission Design Studio', guardian:'Orbital Guardian'};
const loaded = {};

function show(v) {
 if (!VIEWS.includes(v)) v = 'overview';
 VIEWS.forEach(k => {
  document.getElementById(k).hidden = k !== v;
  document.getElementById('t-' + k).setAttribute('aria-selected', String(k === v));
 });
 if (v !== 'overview' && !loaded[v]) {
  const f = document.createElement('iframe');
  f.title = TITLES[v];
  f.src = SRC[v];
  document.getElementById(v).appendChild(f);
  loaded[v] = true;
 }
 if (v === 'overview') loadBoard();
 window.scrollTo({top:0});
}
function go(v) { if (location.hash.slice(1) === v) show(v); else location.hash = v; }

async function loadBoard() {
 const box = document.getElementById('board');
 try {
  const r = await fetch('/api/scores', {cache:'no-store'});
  if (!r.ok) throw new Error('unavailable');
  const rows = await r.json();
  const body = document.querySelector('#boardTable tbody');
  body.textContent = '';
  rows.slice(0, 10).forEach((s, i) => {
   const tr = document.createElement('tr');
   [i + 1, s.mission, s.score, new Date(s.at).toLocaleDateString()].forEach(v => {
    const td = document.createElement('td'); td.textContent = String(v); tr.appendChild(td);
   });
   body.appendChild(tr);
  });
  document.getElementById('boardTable').hidden = rows.length === 0;
  document.getElementById('boardEmpty').hidden = rows.length > 0;
  box.hidden = false;
 } catch (e) { box.hidden = true; }
}

document.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => go(b.dataset.v)));
document.getElementById('home').addEventListener('click', () => go('overview'));
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1));
})();
