import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import './style.css';
import { stages, dims, fmt } from './scene.js';
import { initStory } from './story.js';
import { initMore } from './more.js';
import bo from './data/buildout.json';
import north from './data/elev_north.svg?raw';
import south from './data/elev_south.svg?raw';
import east from './data/elev_east.svg?raw';
import west from './data/elev_west.svg?raw';
import planRaw from './data/plan.svg?raw';
const $ = (id) => document.getElementById(id);

initStory();
initMore();

/* 3D model: load three.js extras only when the section is near */
let viewerLoaded = false;
new IntersectionObserver((es, io) => {
  if (viewerLoaded || !es.some((e) => e.isIntersecting)) return;
  viewerLoaded = true; io.disconnect();
  import('./viewer.js').then((m) => m.initViewer());
}, { rootMargin: '600px' }).observe($('viewer'));

/* film plays only while on screen */
const vid = $('film-video');
new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); } }, { threshold: .35 }).observe(vid);

/* elevations + drainage */
$('elev-grid').innerHTML = [['North', north], ['South', south], ['East', east], ['West', west]]
  .map(([n, s]) => `<figure class="elev"><h4>${n} elevation</h4><div class="svgbox">${s}</div></figure>`).join('');
$('rake-w').innerHTML = east; $('rake-s').innerHTML = south;

/* plan: dimensions, furniture to scale, room names */
const W = dims.xmax - dims.xmin, H = dims.ymax - dims.ymin, Y = (y) => dims.ymax - y;
const FURN = new Set(['rug', 'sofa', 'table', 'cab', 'bed', 'night']);
const furn = bo.filter((it) => FURN.has(it.c) && !(it.c === 'table' && Math.abs(it.v[0][2] - it.v[4][2]) > 20 && it.v[4][2] - it.v[0][2] > 20 && false))
  .map((it) => {
    const xs = it.v.map((p) => p[0]), ys = it.v.map((p) => p[1]), z = Math.max(...it.v.map((p) => p[2]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (it.c === 'table' && x1 - x0 < 6) return '';                       // table legs: not drawn in plan
    return `<rect x="${x0}" y="${Y(y1)}" width="${x1 - x0}" height="${y1 - y0}" class="pf pf-${it.c}"/>`;
  }).join('');
const LABELS = [['LIVING', 56, 172], ['DINING', 147, 64], ['KITCHEN', 236, 172], ['BEDROOM', 448, 236], ['BEDROOM', 448, 92], ['PATIO', 147, 244], ['SPINE', 301, 318]];
const labels = LABELS.map(([t, x, y]) => `<text x="${x}" y="${Y(y)}" class="pl${t === 'SPINE' ? ' pl-s' : ''}">${t}</text>`).join('');
const dimsSvg = `
 <g stroke="#14171a" stroke-width="1.4" fill="none"><line x1="0" y1="${H + 22}" x2="${W}" y2="${H + 22}"/><line x1="0" y1="${H + 14}" x2="0" y2="${H + 30}"/><line x1="${W}" y1="${H + 14}" x2="${W}" y2="${H + 30}"/>
 <line x1="${W + 22}" y1="0" x2="${W + 22}" y2="${H}"/><line x1="${W + 14}" y1="0" x2="${W + 30}" y2="0"/><line x1="${W + 14}" y1="${H}" x2="${W + 30}" y2="${H}"/></g>
 <g font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#14171a" text-anchor="middle">
 <text x="${W / 2}" y="${H + 20}" dy="-6" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">50 ft 6 in.</text>
 <text transform="translate(${W + 18},${H / 2}) rotate(-90)" dy="-4" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">33 ft</text>
 <text x="-10" y="-8" text-anchor="start" font-weight="700">N ↑</text></g>`;
$('plan-svg').innerHTML = planRaw
  .replace(/viewBox="[^"]*"/, `viewBox="${dims.xmin - 30} -30 ${W + 90} ${H + 90}"`)
  .replace('</svg>', `<g class="pfur">${furn}</g><g>${labels}</g><g transform="translate(${dims.xmin},0)">${dimsSvg}</g></svg>`);

/* price: what the $100,000 is, all from the model */
$('price-list').innerHTML = [
  ['2 bedrooms', '16 by 12 ft each, glass on two sides'],
  ['Living, dining, kitchen', 'One 24 by 16 ft room behind the patio'],
  [fmt(dims.gray) + ' sq ft', 'indoors'],
  [fmt(dims.total) + ' sq ft', 'of platform, covered patio and deck'],
  ['Glass everywhere', 'Floor-to-ceiling on every outside wall'],
  ['54 steel legs', 'It stands on its own frame and sets down on your lot'],
].map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('');

/* numbers */
$('big-figs').innerHTML = [
  [fmt(dims.gray) + ' sq ft', 'Indoors (12 floor cells)'],
  [fmt(dims.total) + ' sq ft', 'Platform, patio and deck included'],
  [fmt(dims.l4) + ' ft', '4 in. square tube'],
  [fmt(dims.l3) + ' ft', '3 × 2 in. tube'],
  [fmt((dims.col - dims.deck) / 12, 0) + ' ft', 'Spine above the deck'],
  ['54', 'Legs on 10 in. plates'],
  ['12 in.', 'Living-wing roof fall'],
  [fmt((dims.roofTower - dims.roofEast) / 12, 0) + ' ft', 'Bedroom-wing roof fall'],
].map(([v, k]) => `<div class="big"><b>${v}</b><span>${k}</span></div>`).join('');
const members = (s) => s.id === 'footings' ? 54 : s.id === 'floors' ? 15 : s.items.length;
$('stage-table').innerHTML = `<thead><tr><th>#</th><th>Assembly</th><th class="num">Members</th><th class="num">4 in. tube, ft</th><th class="num">3 × 2 tube, ft</th><th class="num">Running 4 in.</th><th class="num">Running 3 × 2</th></tr></thead><tbody>` +
  stages.slice(1).map((s, k) => `<tr><td>${k + 1}</td><td>${s.title}</td><td class="num">${members(s)}</td><td class="num">${s.l4 ? fmt(s.l4) : '—'}</td><td class="num">${s.l3 ? fmt(s.l3) : '—'}</td><td class="num">${fmt(s.cum4)}</td><td class="num">${fmt(s.cum3)}</td></tr>`).join('') +
  `<tr><td></td><td>Total</td><td class="num"></td><td class="num">${fmt(dims.l4)}</td><td class="num">${fmt(dims.l3)}</td><td class="num"></td><td class="num"></td></tr></tbody>`;
