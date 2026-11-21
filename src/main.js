import './style.css';
import { makeStage, stages, dims, N, fmt } from './scene.js';
import north from './data/elev_north.svg?raw';
import south from './data/elev_south.svg?raw';
import east from './data/elev_east.svg?raw';
import west from './data/elev_west.svg?raw';
import planRaw from './data/plan.svg?raw';
/* ------------------------------------------------------------- hero */
const hero = makeStage(document.getElementById('hero-canvas'), { hero: true });
document.getElementById('hero-figs').innerHTML = [
  [fmt(dims.gray) + ' sq ft', 'Gray living area'],
  [fmt(dims.total) + ' sq ft', 'Entire platform'],
  [fmt(dims.l4) + ' ft', '4 in. × 4 in. tube'],
  [fmt(dims.l3) + ' ft', '3 in. × 2 in. tube'],
].map(([v, k]) => `<div><dd>${v}</dd><dt>${k}</dt></div>`).join('');

/* ------------------------------------------------------------- build */
const build = makeStage(document.getElementById('build-canvas'));
const steps = document.getElementById('steps');
const feet = (n) => n ? fmt(n) + ' ft' : '';
steps.innerHTML = stages.map((s, i) => `
  <li data-i="${i}"><div class="card">
    <div class="n">${i === 0 ? 'Start' : 'Step ' + String(i).padStart(2, '0') + ' of ' + (N - 1)}</div>
    <h3>${s.title}</h3><p>${s.note}</p>
    <div class="meta">
      ${s.l4 ? `<span class="chip t4">+${feet(s.l4)} 4 in. × 4 in.</span>` : ''}
      ${s.l3 ? `<span class="chip t3">+${feet(s.l3)} 3 in. × 2 in.</span>` : ''}
      ${s.id === 'floors' ? `<span class="chip">${fmt(dims.gray)} sq ft gray living area</span>` : ''}
      ${i > 0 ? `<span class="chip">Running total: ${fmt(s.cum4)} + ${fmt(s.cum3)} ft</span>` : ''}
    </div></div></li>`).join('');
const lis = [...steps.children];
const $ = (id) => document.getElementById(id);
$('hud-total').textContent = N - 1;
const scrub = $('scrub'); scrub.max = N - 1;
let shown = { c4: 0, c3: 0 }, cur = -1;
function setStageUI(i) {
  if (i === cur) return; cur = i;
  build.setStage(i); $('hud-num').textContent = i; scrub.value = i;
  lis.forEach((l, k) => l.classList.toggle('on', k === i));
  animateTo(stages[i].cum4, stages[i].cum3);
}
let raf = 0;
function animateTo(t4, t3) {
  cancelAnimationFrame(raf); const f4 = shown.c4, f3 = shown.c3, t0 = performance.now();
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / 900), e = 1 - Math.pow(1 - k, 3);
    shown.c4 = f4 + (t4 - f4) * e; shown.c3 = f3 + (t3 - f3) * e;
    $('c4').textContent = fmt(shown.c4); $('c3').textContent = fmt(shown.c3);
    if (k < 1) raf = requestAnimationFrame(tick);
  }; tick();
}
const mobile = () => matchMedia('(max-width:900px)').matches;
function scrollToStep(i, smooth = true) {
  const li = lis[i]; if (!li) return;
  const card = li.firstElementChild.getBoundingClientRect();
  const stick = mobile() ? innerHeight * .56 : 0;
  const y = scrollY + card.top - (stick + (innerHeight - stick - card.height) / 2);
  scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
}
const ioMargin = mobile() ? '-62% 0px -22% 0px' : '-42% 0px -42% 0px';
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setStageUI(+e.target.dataset.i); }, { rootMargin: ioMargin });
lis.forEach(l => io.observe(l));
setStageUI(0);
$('next').onclick = () => scrollToStep(Math.min(N - 1, cur + 1));
$('prev').onclick = () => scrollToStep(Math.max(0, cur - 1));
scrub.oninput = () => scrollToStep(+scrub.value, false);
let timer = 0;
$('play').onclick = () => {
  if (timer) { clearInterval(timer); timer = 0; $('play').textContent = '▶ Play'; return; }
  $('play').textContent = '❚❚ Pause';
  const sec = document.getElementById('build').getBoundingClientRect();
  if (cur >= N - 1) scrollToStep(0);
  timer = setInterval(() => {
    if (cur >= N - 1) { clearInterval(timer); timer = 0; $('play').textContent = '▶ Play'; return; }
    scrollToStep(cur + 1);
  }, 2200);
};
addEventListener('wheel', () => { if (timer) { clearInterval(timer); timer = 0; $('play').textContent = '▶ Play'; } }, { passive: true });
$('views').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('views').children].forEach(x => x.classList.toggle('on', x === b)); build.setView(b.dataset.v);
};

/* ------------------------------------------------------------- elevations */
$('elev-grid').innerHTML = [['North', north], ['South', south], ['East', east], ['West', west]]
  .map(([n, s]) => `<figure class="elev" style="margin:0"><h4>${n} elevation</h4><div class="svgbox">${s}</div></figure>`).join('');
$('rake-w').innerHTML = east; $('rake-s').innerHTML = south;

/* ------------------------------------------------------------- plan with dimensions */
const W = dims.xmax - dims.xmin, H = dims.ymax - dims.ymin;
const dimsSvg = `
 <g stroke="#14171a" stroke-width="1.4" fill="none"><line x1="0" y1="${H + 22}" x2="${W}" y2="${H + 22}"/><line x1="0" y1="${H + 14}" x2="0" y2="${H + 30}"/><line x1="${W}" y1="${H + 14}" x2="${W}" y2="${H + 30}"/>
 <line x1="${W + 22}" y1="0" x2="${W + 22}" y2="${H}"/><line x1="${W + 14}" y1="0" x2="${W + 30}" y2="0"/><line x1="${W + 14}" y1="${H}" x2="${W + 30}" y2="${H}"/></g>
 <g font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#14171a" text-anchor="middle">
 <text x="${W / 2}" y="${H + 20}" dy="-6" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">606 in. (50 ft 6 in.)</text>
 <text transform="translate(${W + 18},${H / 2}) rotate(-90)" dy="-4" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">396 in. (33 ft)</text>
 <text x="-10" y="-8" text-anchor="start" font-weight="700">N ↑</text></g>`;
// plan.svg viewBox is in model inches with x origin xmin, y 0..H
$('plan-svg').innerHTML = planRaw
  .replace(/viewBox="[^"]*"/, `viewBox="${dims.xmin - 30} -30 ${W + 90} ${H + 90}"`)
  .replace('</svg>', `<g transform="translate(${dims.xmin},0)">${dimsSvg}</g></svg>`);

/* ------------------------------------------------------------- numbers */
$('big-figs').innerHTML = [
  [fmt(dims.gray) + ' sq ft', 'Gray living area (12 cells)'],
  [fmt(dims.total) + ' sq ft', 'Entire platform incl. patio and border'],
  [fmt(dims.l4) + ' ft', '4 in. × 4 in. tube'],
  [fmt(dims.l3) + ' ft', '3 in. × 2 in. tube'],
  [fmt((dims.col - dims.deck) / 12, 0) + ' ft', 'Red tower above the deck'],
  ['54', 'Legs on 10 in. × 10 in. plates'],
  ['12 in.', 'Left block fall, north to south'],
  [fmt((dims.roofTower - dims.roofEast) / 12, 0) + ' ft', 'Right block fall, tower to east edge'],
].map(([v, k]) => `<div class="big"><b>${v}</b><span>${k}</span></div>`).join('');
const members = (s) => s.id === 'footings' ? 54 : s.id === 'floors' ? 15 : s.items.length;
$('stage-table').innerHTML = `<thead><tr><th>#</th><th>Assembly</th><th class="num">Members</th><th class="num">4 in. × 4 in. ft</th><th class="num">3 in. × 2 in. ft</th><th class="num">Running 4 in.</th><th class="num">Running 3×2</th></tr></thead><tbody>` +
  stages.slice(1).map((s, k) => `<tr><td>${k + 1}</td><td>${s.title}</td><td class="num">${members(s)}</td><td class="num">${s.l4 ? fmt(s.l4) : '—'}</td><td class="num">${s.l3 ? fmt(s.l3) : '—'}</td><td class="num">${fmt(s.cum4)}</td><td class="num">${fmt(s.cum3)}</td></tr>`).join('') +
  `<tr><td></td><td>Finished build</td><td class="num"></td><td class="num">${fmt(dims.l4)}</td><td class="num">${fmt(dims.l3)}</td><td class="num"></td><td class="num"></td></tr></tbody>`;
