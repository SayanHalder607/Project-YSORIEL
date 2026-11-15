(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => Math.round(n).toLocaleString('en-US');

/* ---------- Game data ---------- */
const M = [
 {id:0,dist:'700 km altitude',lt:'<0.01 s',name:'Earth Climate Watch',desc:'Sun-synchronous orbit monitoring ice, clouds and aerosols.',budget:260,f:.85,dv:200,sun:1,link:1,target:55,ops:15,
  w:{cam:1.2,rad:1,spec:.8,mag:.2,lid:1.2,dust:.3},dest:{x:300,r:30,c:'#3aa0ff',l:'SSO · 700 km'}},
 {id:1,dist:'384,400 km',lt:'1.3 s',name:'Lunar Polar Prospector',desc:'Map water ice and magnetic fields from lunar polar orbit.',budget:340,f:.4,dv:950,sun:1,link:.45,target:55,ops:20,
  w:{cam:1,rad:1.1,spec:1.4,mag:.8,lid:.2,dust:.6},dest:{x:700,r:24,c:'#b9bfc9',l:'Lunar orbit'}},
 {id:2,dist:'≈225 million km (mean)',lt:'≈12.5 min',name:'Mars Atmosphere Orbiter',desc:'Study dust, climate and atmosphere from Mars orbit.',budget:480,f:.28,dv:2100,sun:.43,link:.2,target:48,ops:30,
  w:{cam:.9,rad:.5,spec:1.2,mag:.7,lid:1.4,dust:1.3},dest:{x:790,r:30,c:'#d9694a',l:'Mars orbit'}}
];
const L = [
 {name:'Kestrel-L (light)',kg:500,$:25,rel:.90},
 {name:'Aquila-M (medium)',kg:2500,$:70,rel:.95},
 {name:'Vanguard-H (heavy)',kg:8000,$:150,rel:.97}
];
const B = [
 {name:'Micro bus',kg:120,w:80,$:20,rel:.90},
 {name:'Standard bus',kg:350,w:150,$:45,rel:.95},
 {name:'Robust bus',kg:700,w:250,$:90,rel:.98}
];
const P = [
 {name:'Chemical thruster',isp:310,kg:40,tank:.10,w:20,$:8,dvm:1,note:'High thrust, heavy propellant'},
 {name:'Ion engine',isp:1800,kg:90,tank:.05,w:450,$:30,dvm:1.4,note:'Very efficient, needs power, slow spiral (+40% Δv)'}
];
const C = [
 {name:'UHF patch antenna',kg:5,w:20,$:3,gb:2},
 {name:'X-band antenna',kg:20,w:60,$:10,gb:20},
 {name:'Ka-band high-gain dish',kg:60,w:140,$:28,gb:120}
];
const I = [
 {id:'cam',name:'Multispectral imager',kg:45,w:60,$:22,sci:22,gb:30},
 {id:'rad',name:'Synthetic aperture radar',kg:120,w:280,$:48,sci:30,gb:80},
 {id:'spec',name:'Infrared spectrometer',kg:30,w:40,$:18,sci:18,gb:12},
 {id:'mag',name:'Magnetometer',kg:6,w:8,$:5,sci:8,gb:1},
 {id:'lid',name:'Atmospheric lidar',kg:70,w:110,$:34,sci:24,gb:18},
 {id:'dust',name:'Particle analyzer',kg:15,w:20,$:9,sci:10,gb:2}
];
const S = {m:0,l:1,b:1,p:0,c:2,i:new Set(['cam','lid','spec']),solar:5,prop:100};

/* ---------- Engineering model ---------- */
function calc() {
 const m = M[S.m], l = L[S.l], b = B[S.b], p = P[S.p], c = C[S.c];
 const ins = I.filter(x => S.i.has(x.id));
 const sum = k => ins.reduce((a, x) => a + x[k], 0);
 const solarW = S.solar * 140 * m.sun;
 const load = b.w + p.w + c.w + sum('w');
 const dry = b.kg + p.kg + c.kg + sum('kg') + S.solar * 6 + S.prop * p.tank;
 const wet = dry + S.prop;
 const dv = p.isp * 9.80665 * Math.log(wet / dry);
 const need = m.dv * p.dvm;
 const cap = l.kg * m.f;
 const cost = l.$ + b.$ + p.$ + c.$ + sum('$') + S.solar * .6 + S.prop * .01 + m.ops;
 const down = c.gb * m.link, prod = sum('gb');
 const df = prod ? Math.min(1, down / prod) : 0;
 const raw = ins.reduce((a, x) => a + x.sci * m.w[x.id], 0);
 const sci = raw * df;
 return {m,l,b,p,c,ins,solarW,load,dry,wet,dv,need,cap,cost,down,prod,df,raw,sci,
  pm:(solarW - load) / load, mm:(cap - wet) / cap, dm:(dv - need) / need};
}
function probs(d) {
 const pL = d.l.rel - (d.mm < .1 ? .02 : 0), pI = .97 - (d.dm < .15 ? .07 : 0);
 const pC = d.b.rel - .01 * Math.max(0, d.ins.length - 3) - (d.pm < .15 ? .05 : 0);
 const pa = (1 - d.b.rel) * .6 + (d.pm < .15 ? .03 : 0);
 let y = 0; for (let k = 1; k <= 6; k++) y += Math.pow(1 - .15 * pa, k);
 return {ops:clamp(pL * pI * pC, 0, 1), yield:y / 6};
}
function checks(d) {
 const r = [];
 r.push({n:'Budget',v:`$${fmt(d.cost)}M / $${d.m.budget}M`,ok:d.cost <= d.m.budget,warn:d.cost > d.m.budget * .92,pct:d.cost / d.m.budget});
 r.push({n:'Launch mass',v:`${fmt(d.wet)} / ${fmt(d.cap)} kg`,ok:d.wet <= d.cap,warn:d.mm < .1,pct:d.wet / d.cap});
 r.push({n:'Power',v:`${fmt(d.load)} / ${fmt(d.solarW)} W`,ok:d.solarW >= d.load,warn:d.pm < .15,pct:d.load / d.solarW});
 r.push({n:'Delta-v',v:`${fmt(d.need)} needed / ${fmt(d.dv)} m/s`,ok:d.dv >= d.need,warn:d.dm < .15,pct:d.need / d.dv});
 r.push({n:'Science return',v:`${d.sci.toFixed(0)} / ${d.m.target} pts`,ok:d.sci >= d.m.target,warn:d.df < .7 && d.prod > 0,pct:d.sci / d.m.target});
 r.push({n:'Data downlink',v:`${d.down.toFixed(1)} / ${d.prod} Gb/day`,ok:true,warn:d.df < .7,pct:d.prod ? d.prod / Math.max(d.down, .01) : 0,soft:true});
 return r;
}

/* ---------- Design UI ---------- */
const G = [
 {k:'m',t:'Mission objective',d:'Sets destination, budget, Δv requirement and science goal.',a:M,h:x=>`<b>${x.name}</b><span>${x.desc}</span><em>Budget $${x.budget}M · Δv ${fmt(x.dv)} m/s · Target ${x.target} pts</em><em style="color:var(--muted)">Range ${x.dist} · one-way light time ${x.lt}</em>`},
 {k:'l',t:'Launch vehicle',d:'Capacity depends on how far the mission must go.',a:L,h:x=>`<b>${x.name}</b><span>${fmt(x.kg * M[S.m].f)} kg to destination</span><em>$${x.$}M · ${Math.round(x.rel * 100)}% reliable</em>`},
 {k:'b',t:'Spacecraft bus',d:'The platform: structure, computer, thermal control, attitude control.',a:B,h:x=>`<b>${x.name}</b><span>${x.kg} kg · ${x.w} W baseline load</span><em>$${x.$}M · ${Math.round(x.rel * 100)}% reliable</em>`},
 {k:'p',t:'Propulsion',d:'Trade propellant mass against power and cost.',a:P,h:x=>`<b>${x.name}</b><span>${x.note}</span><em>Isp ${x.isp} s · ${x.kg} kg · ${x.w} W · $${x.$}M</em>`,extra:`<div class="slider"><label for="prop">Propellant load</label><output id="propO"></output><input type="range" id="prop" name="prop" min="0" max="1500" step="10"></div>`},
 {k:'c',t:'Communications',d:'Downlink shrinks with distance. Data you cannot send is science lost.',a:C,h:x=>`<b>${x.name}</b><span>${x.kg} kg · ${x.w} W</span><em>${(x.gb * M[S.m].link).toFixed(1)} Gb/day at destination · $${x.$}M</em>`},
 {k:'i',t:'Science instruments',d:'Choose payloads. Relevance varies by mission. More data needs more downlink.',a:I,multi:true,h:x=>`<b>${x.name}</b><span>${x.kg} kg · ${x.w} W · ${x.gb} Gb/day</span><em>Science ${(x.sci * M[S.m].w[x.id]).toFixed(0)} pts · $${x.$}M</em>`},
 {k:'s',t:'Power system',d:'Solar flux falls with distance from the Sun (Mars receives about 43% of Earth’s). Output shown is end-of-life, after packing and pointing losses (≈140 W/m² at Earth).',slider:true}
];
function cardsHTML(g) {
 return g.a.map((x, i) => {
  const val = g.multi ? x.id : i;
  const chk = g.multi ? S.i.has(x.id) : S[g.k] === i;
  return `<label><input type="${g.multi ? 'checkbox' : 'radio'}" name="${g.k}" value="${val}"${chk ? ' checked' : ''}><span class="card">${g.h(x)}</span></label>`;
 }).join('');
}
function setStep(n) { document.querySelectorAll('#steps li').forEach((li, i) => { li.className = i < n ? 'past' : i === n ? 'on' : ''; }); $('#hero').hidden = n > 1; }
function build() {
 $('#left').innerHTML = G.map((g, n) => `<section class="sec"><h2><span>${String(n + 1).padStart(2, '0')}</span>${g.t}</h2><p>${g.d}</p>` +
  (g.slider ? `<div class="slider"><label for="solar">Solar array area</label><output id="solarO"></output><input type="range" id="solar" name="solar" min="1" max="40" step=".5"></div>`
   : `<div class="cards" id="g-${g.k}">${cardsHTML(g)}</div>${g.extra || ''}`) + `</section>`).join('');
 $('#prop').value = S.prop; $('#solar').value = S.solar;
}
function rerender(keys) { G.filter(g => keys.includes(g.k)).forEach(g => { $('#g-' + g.k).innerHTML = cardsHTML(g); }); }
function refresh() {
 const d = calc(), r = checks(d);
 $('#propO').textContent = `${fmt(S.prop)} kg`;
 $('#solarO').textContent = `${S.solar} m² · ${fmt(d.solarW)} W`;
 $('#mTitle').textContent = d.m.name + ' · ' + d.m.dest.l + ' · one-way light time ' + d.m.lt;
 const pr = probs(d);
 $('#rel').innerHTML = `<div class="relrow"><span>Probability of reaching science operations</span><b>${Math.round(pr.ops * 100)}%</b></div><div class="relrow"><span>Expected science yield once operating</span><b>${Math.round(pr.yield * 100)}%</b></div>`;
 $('#checks').innerHTML = r.map(x => {
  const cls = !x.ok ? 'bad' : x.warn ? 'warn' : 'ok';
  const ic = !x.ok ? '✕' : x.warn ? '!' : '✓';
  return `<div class="row ${cls}"><span class="ic">${ic}</span><span class="nm">${x.n}</span><span class="vl">${x.v}</span><div class="bar"><i style="width:${clamp(x.pct * 100, 0, 100)}%"></i></div></div>`;
 }).join('');
 const fails = r.filter(x => !x.ok).length;
 $('#launchBtn').disabled = fails > 0;
 if (!$('#designView').hidden) setStep(fails ? 0 : 1);
 $('#gate').textContent = fails ? `${fails} requirement${fails > 1 ? 's' : ''} must pass before launch.` : 'All requirements met. Ready for launch.';
 let best = null; try { best = localStorage.getItem('ysoriel-best-' + S.m); } catch (e) {}
 $('#best').textContent = best ? `Best score on this mission: ${best}` : 'No flight recorded for this mission yet.';
}
$('#left').addEventListener('input', e => {
 const t = e.target;
 if (t.id === 'prop') S.prop = +t.value;
 else if (t.id === 'solar') S.solar = +t.value;
 else if (t.type === 'radio') { S[t.name] = +t.value; if (t.name === 'm') rerender(['l', 'c', 'i']); }
 else if (t.type === 'checkbox') { t.checked ? S.i.add(t.value) : S.i.delete(t.value); }
 refresh();
});

/* ---------- Flight simulation ---------- */
const cv = $('#cv'), ctx = cv.getContext('2d');
let token = 0, raf = 0, lastSeed = 0;
const F = {p:0, target:0, ang:0, fail:null, d:null};
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const start = {x:110, y:170}, ctrl = x => ({x:(110 + x) / 2, y:40});
function pos(p, dest) {
 if (p >= 1) { const a = F.ang; return {x:dest.x + Math.cos(a) * dest.r * 1.7, y:170 + Math.sin(a) * dest.r * 1.1}; }
 const c = ctrl(dest.x), u = 1 - p;
 return {x:u * u * start.x + 2 * u * p * c.x + p * p * dest.x, y:u * u * start.y + 2 * u * p * c.y + p * p * 170};
}
function frame() {
 if ($('#flightView').hidden) { raf = 0; return; }
 const dest = F.d.m.dest;
 ctx.clearRect(0, 0, 900, 340);
 ctx.fillStyle = '#04070e'; ctx.fillRect(0, 0, 900, 340);
 for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(190,220,255,${.2 + (i % 4) * .15})`; ctx.fillRect((i * 211 + 17) % 900, (i * 97 + 31) % 340, 1.5, 1.5); }
 const g = ctx.createRadialGradient(95, 150, 5, 110, 170, 52); g.addColorStop(0, '#6fe0ff'); g.addColorStop(.5, '#1769a3'); g.addColorStop(1, '#081c45');
 ctx.beginPath(); ctx.arc(110, 170, 50, 0, 7); ctx.fillStyle = g; ctx.fill();
 ctx.setLineDash([5, 6]); ctx.strokeStyle = '#3b5686'; ctx.beginPath(); const c = ctrl(dest.x);
 ctx.moveTo(start.x, start.y); ctx.quadraticCurveTo(c.x, c.y, dest.x, 170); ctx.stroke(); ctx.setLineDash([]);
 if (F.d.m.id === 0) { ctx.setLineDash([4, 4]); ctx.strokeStyle = dest.c; ctx.beginPath(); ctx.arc(dest.x, 170, dest.r * 1.7, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
 else { ctx.beginPath(); ctx.arc(dest.x, 170, dest.r, 0, 7); ctx.fillStyle = dest.c; ctx.fill(); }
 ctx.fillStyle = '#b6c8e6'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
 ctx.fillText('Earth', 110, 245); ctx.fillText(dest.l, dest.x, 170 + dest.r * 1.7 + 24);
 ctx.textAlign = 'left'; ctx.font = '600 12px ui-monospace,Consolas,monospace';
 ctx.fillStyle = '#5fd8ff'; ctx.fillText('PHASE ' + (F.i + 1) + '/' + F.n + ' · ' + F.phase.toUpperCase(), 18, 26);
 ctx.fillStyle = '#9aabc7'; ctx.fillText('RANGE ' + F.d.m.dist.toUpperCase() + ' · LIGHT TIME ' + F.d.m.lt, 18, 46); ctx.textAlign = 'center';
 F.p += (F.target - F.p) * .035; if (F.target >= 1 && F.p > .995) F.p = 1;
 if (F.p >= 1) F.ang += .04;
 const q = pos(F.p, dest);
 if (F.fail) { ctx.fillStyle = '#ff6b7a55'; ctx.beginPath(); ctx.arc(F.fail.x, F.fail.y, 22 + 4 * Math.sin(Date.now() / 120), 0, 7); ctx.fill(); ctx.fillStyle = '#ff6b7a'; ctx.beginPath(); ctx.arc(F.fail.x, F.fail.y, 5, 0, 7); ctx.fill(); }
 else { ctx.fillStyle = '#ffd16655'; ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 7); ctx.fill(); }
 raf = requestAnimationFrame(frame);
}
function roll(seed, d) {
 const r = rng(seed), b = d.b;
 const out = [];
 const pL = d.l.rel - (d.mm < .1 ? .02 : 0);
 const pI = .97 - (d.dm < .15 ? .07 : 0);
 const pC = b.rel - .01 * Math.max(0, d.ins.length - 3) - (d.pm < .15 ? .05 : 0);
 const pa = (1 - b.rel) * .6 + (d.pm < .15 ? .03 : 0);
 out.push({n:'Launch', ok:r() < pL, p:pL, good:'Liftoff nominal. Vehicle delivers spacecraft to departure trajectory.', bad:'Launch vehicle anomaly. Spacecraft lost.', at:.12, failAt:.06});
 out.push({n:'Cruise', ok:true, p:1, good:'Trajectory correction maneuvers complete.', at:.8});
 out.push({n:'Orbit insertion', ok:r() < pI, p:pI, good:'Orbit insertion burn successful.', bad:'Insertion burn failed. Spacecraft missed its target orbit.', at:1, failAt:.85});
 out.push({n:'Commissioning', ok:r() < pC, p:pC, good:'Spacecraft and instruments commissioned.', bad:'Critical fault during commissioning. Spacecraft lost.', at:1});
 let f = 1, tot = 0;
 for (let k = 1; k <= 6; k++) {
  const an = r() < pa; if (an) f *= .85; tot += f;
  out.push({n:`Science month ${k}`, ok:true, p:1 - pa, good:an ? 'Anomaly. Safe mode entered, science output reduced 15%.' : 'Nominal science operations.', warn:an, at:1});
 }
 return {out, yield:tot / 6, pL, pI, pC, pa};
}
function score(d, res, lost) {
 if (lost) return {total:0, sciPts:0, budPts:0, marPts:0, fin:0};
 const fin = d.sci * res.yield;
 const sciPts = clamp(fin / d.m.target * 55, 0, 70);
 const budPts = clamp((d.m.budget - d.cost) / d.m.budget, 0, .3) / .3 * 15;
 const marPts = (d.pm >= .15 ? 5 : 0) + (d.mm >= .1 ? 5 : 0) + (d.dm >= .15 ? 5 : 0);
 return {total:Math.round(sciPts + budPts + marPts), sciPts, budPts, marPts, fin};
}
async function fly(seed) {
 const my = ++token; lastSeed = seed;
 const d = calc(), res = roll(seed, d);
 F.d = d; F.p = 0; F.target = 0; F.ang = 0; F.fail = null; F.n = res.out.length; F.i = 0; F.phase = 'Pre-launch';
 $('#designView').hidden = true; $('#flightView').hidden = false; setStep(2); $('#result').hidden = true;
 $('#seedTxt').textContent = `${d.m.name} · simulation seed ${seed}`;
 $('#stages').innerHTML = res.out.map(s => `<li><b>○</b><span>${s.n}<br><small>Success chance ${Math.round(s.p * 100)}%</small></span></li>`).join('');
 window.scrollTo({top:0});
 if (!raf) raf = requestAnimationFrame(frame);
 const lis = [...document.querySelectorAll('#stages li')];
 let lost = false, lostAt = '';
 for (let i = 0; i < res.out.length; i++) {
  const s = res.out[i];
  lis[i].className = 'live'; lis[i].firstChild.textContent = '◐'; F.phase = s.n; F.i = i;
  await sleep(900); if (my !== token) return;
  if (!s.ok) {
   lost = true; lostAt = s.n; F.target = s.failAt || F.target || .9;
   if (s.failAt) { F.target = s.failAt; }
   await sleep(700); if (my !== token) return;
   const q = pos(F.p, d.m.dest); F.fail = {x:q.x, y:q.y};
   lis[i].className = 'fail'; lis[i].firstChild.textContent = '✕';
   lis[i].lastChild.innerHTML = `${s.n}<br><small>${s.bad}</small>`;
   break;
  }
  F.target = s.at;
  lis[i].className = 'done'; lis[i].firstChild.textContent = s.warn ? '!' : '✓';
  lis[i].lastChild.innerHTML = `${s.n}<br><small>${s.good}</small>`;
 }
 await sleep(900); if (my !== token) return;
 report(d, res, lost, lostAt);
}
function postScore(d, sc) {
 if (!sc.total) return;
 try {
  fetch('/api/scores', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({game:'studio', mission:d.m.name, score:sc.total})}).catch(() => {});
 } catch (e) {}
}
function report(d, res, lost, lostAt) {
 const sc = score(d, res, lost);
 const grade = lost ? 'F' : sc.total >= 85 ? 'A' : sc.total >= 70 ? 'B' : sc.total >= 55 ? 'C' : 'D';
 const tips = [];
 if (lost) tips.push(`Mission lost during <b>${lostAt}</b>. Even good designs carry risk. Try a more reliable vehicle or bus and keep generous margins.`);
 if (d.df < .7 && d.prod > 0) tips.push(`Downlink limited science: only ${Math.round(d.df * 100)}% of collected data could be returned. Upgrade communications or trim data-hungry instruments.`);
 if (d.pm < .15) tips.push('Power margin was thin, which raised fault risk. Add array area.');
 if (d.mm < .1) tips.push('Little launch mass margin. A heavier vehicle or lighter design adds safety.');
 if (d.dm < .15) tips.push('Δv margin was thin, which made orbit insertion riskier. Carry more propellant.');
 if (d.cost > d.m.budget * .9) tips.push('Almost no budget reserve remained. Cheaper choices earn efficiency points.');
 if (!lost && res.yield < .95) tips.push('Anomalies cut science output. A more reliable bus reduces this risk.');
 if (!tips.length) tips.push('Healthy margins and balanced data flow. Try a different mission or a cheaper design.');
 let best = 0; try { best = +localStorage.getItem('ysoriel-best-' + S.m) || 0; if (sc.total > best) { best = sc.total; localStorage.setItem('ysoriel-best-' + S.m, best); } } catch (e) {}
 postScore(d, sc);
 const el = $('#result');
 el.innerHTML = `<h3>${lost ? 'Mission lost' : 'Mission complete'}</h3><div class="score">${sc.total}<span class="grade">${grade}</span></div>
  <table><tr><td>Science delivered</td><td>${sc.fin.toFixed(0)} / ${d.m.target} pts → ${sc.sciPts.toFixed(0)} pts</td></tr>
  <tr><td>Budget efficiency</td><td>$${fmt(d.cost)}M of $${d.m.budget}M → ${sc.budPts.toFixed(0)} pts</td></tr>
  <tr><td>Engineering margins</td><td>${sc.marPts} / 15 pts</td></tr>
  <tr><td>Best score (this mission)</td><td>${best}</td></tr></table>
  <ul class="lessons">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
  <div class="btns"><button class="btn" id="redesign">Back to design</button><button class="btn primary" id="again" style="width:auto">Fly again (new seed)</button></div>`;
 el.hidden = false; setStep(3);
 $('#redesign').onclick = back;
 $('#again').onclick = () => fly(Math.floor(Math.random() * 1e6));
 el.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function back() { token++; $('#flightView').hidden = true; $('#designView').hidden = false; refresh(); window.scrollTo({top:0}); }

/* ---------- Wiring ---------- */
$('#launchBtn').addEventListener('click', () => fly(Math.floor(Math.random() * 1e6)));
const dlg = $('#help');
$('#helpBtn').addEventListener('click', () => dlg.showModal());
$('#helpClose').addEventListener('click', () => dlg.close());
build(); refresh();
})();
