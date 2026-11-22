import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/400.css';
import './style.css';
import { stages, dims, N, fmt } from './scene.js';
import { initStory } from './story.js';
import { initViewer } from './viewer.js';
import { initMore } from './more.js';
import north from './data/elev_north.svg?raw';
import south from './data/elev_south.svg?raw';
import east from './data/elev_east.svg?raw';
import west from './data/elev_west.svg?raw';
import planRaw from './data/plan.svg?raw';
const $ = (id) => document.getElementById(id);

initStory();
initViewer();
initMore();

/* renderings */
const SETS = {
  laguna: [
    ['laguna-hero', 'Above Laguna Beach', 'Golden hour · Pacific beyond', 'wide'],
    ['laguna-hero-dusk', 'Sunset over the Pacific', 'Same camera · interior lit', ''],
    ['laguna-patio', 'Patio, living room and the coast', 'North-west · Catalina on the horizon', ''],
    ['laguna-approach', 'The approach', 'South-west · canyon hills', ''],
    ['laguna-aerial', 'From above', 'Drone · the Laguna coastline', ''],
    ['int-living', 'Living room', 'Facing the ocean · sunset', ''],
    ['int-kitchen', 'Kitchen on the Corten spine', 'Morning', ''],
    ['int-bedroom', 'Front bedroom', 'First light', 'wide'],
  ],
  suburb: [
    ['suburb-street', 'On a suburban street', 'Infill lot · golden hour', 'wide'],
    ['suburb-street-dusk', 'Evening on the block', 'Infill lot · blue hour', ''],
    ['suburb-backyard', 'The backyard', 'Fenced lot · golden hour', ''],
    ['suburb-aerial', 'In the neighborhood', 'From above', 'wide'],
  ],
  lake: [
    ['wild-lake', 'From the lake shore', 'Golden hour · north-east', 'wide'],
    ['wild-lake-dusk', 'Evening at the lake', 'Blue hour · same camera', ''],
    ['wild-bedroom', 'The front bedroom', 'Deeper block · lake side', ''],
    ['wild-patio', 'Patio and living room', 'North-west · wider block', ''],
    ['wild-approach', 'The approach', 'South-west · living room glass', ''],
    ['wild-aerial', 'From above', 'Drone · south · lake beyond', 'wide'],
  ],
};
function gallery(set) {
  $('gallery').innerHTML = SETS[set].map(([f, t, s, c]) => `<figure class="${c}"><img src="/media/${f}-1280.jpg" srcset="/media/${f}-1280.jpg 1280w, /media/${f}.jpg 2400w" sizes="${c ? '100vw' : '(max-width:900px) 100vw, 50vw'}" alt="Conceptual rendering: ${t.toLowerCase()}" loading="lazy" decoding="async"><figcaption><b>${t}</b><span>${s} · conceptual rendering</span></figcaption></figure>`).join('');
}
gallery('laguna');
$('gal-tabs').addEventListener('click', (ev) => {
  const b = ev.target.closest('button'); if (!b) return;
  [...$('gal-tabs').children].forEach((x) => x.setAttribute('aria-pressed', x === b)); gallery(b.dataset.set);
});

/* film plays only while on screen */
const vid = $('film-video');
new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); } }, { threshold: .35 }).observe(vid);

/* elevations */
$('elev-grid').innerHTML = [['North', north], ['South', south], ['East', east], ['West', west]]
  .map(([n, s]) => `<figure class="elev"><h4>${n} elevation</h4><div class="svgbox">${s}</div></figure>`).join('');
$('rake-w').innerHTML = east; $('rake-s').innerHTML = south;

/* plan with dimensions */
const W = dims.xmax - dims.xmin, H = dims.ymax - dims.ymin;
const dimsSvg = `
 <g stroke="#14171a" stroke-width="1.4" fill="none"><line x1="0" y1="${H + 22}" x2="${W}" y2="${H + 22}"/><line x1="0" y1="${H + 14}" x2="0" y2="${H + 30}"/><line x1="${W}" y1="${H + 14}" x2="${W}" y2="${H + 30}"/>
 <line x1="${W + 22}" y1="0" x2="${W + 22}" y2="${H}"/><line x1="${W + 14}" y1="0" x2="${W + 30}" y2="0"/><line x1="${W + 14}" y1="${H}" x2="${W + 30}" y2="${H}"/></g>
 <g font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#14171a" text-anchor="middle">
 <text x="${W / 2}" y="${H + 20}" dy="-6" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">606 in. (50 ft 6 in.)</text>
 <text transform="translate(${W + 18},${H / 2}) rotate(-90)" dy="-4" paint-order="stroke" stroke="#fbfaf6" stroke-width="6">396 in. (33 ft)</text>
 <text x="-10" y="-8" text-anchor="start" font-weight="700">N ↑</text></g>`;
$('plan-svg').innerHTML = planRaw
  .replace(/viewBox="[^"]*"/, `viewBox="${dims.xmin - 30} -30 ${W + 90} ${H + 90}"`)
  .replace('</svg>', `<g transform="translate(${dims.xmin},0)">${dimsSvg}</g></svg>`);

/* numbers */
$('big-figs').innerHTML = [
  [fmt(dims.gray) + ' sq ft', 'Gray living area (12 cells)'],
  [fmt(dims.total) + ' sq ft', 'Entire platform incl. patio and border'],
  [fmt(dims.l4) + ' ft', '4 in. × 4 in. tube'],
  [fmt(dims.l3) + ' ft', '3 in. × 2 in. tube'],
  [fmt((dims.col - dims.deck) / 12, 0) + ' ft', 'Red tower above the deck'],
  ['54', 'Legs, 10 in., on 10 in. × 10 in. plates'],
  ['12 in.', 'Left block fall, north to south'],
  [fmt((dims.roofTower - dims.roofEast) / 12, 0) + ' ft', 'Right block fall, tower to east edge'],
].map(([v, k]) => `<div class="big"><b>${v}</b><span>${k}</span></div>`).join('');
const members = (s) => s.id === 'footings' ? 54 : s.id === 'floors' ? 15 : s.items.length;
$('stage-table').innerHTML = `<thead><tr><th>#</th><th>Assembly</th><th class="num">Members</th><th class="num">4 in. × 4 in. ft</th><th class="num">3 in. × 2 in. ft</th><th class="num">Running 4 in.</th><th class="num">Running 3×2</th></tr></thead><tbody>` +
  stages.slice(1).map((s, k) => `<tr><td>${k + 1}</td><td>${s.title}</td><td class="num">${members(s)}</td><td class="num">${s.l4 ? fmt(s.l4) : '—'}</td><td class="num">${s.l3 ? fmt(s.l3) : '—'}</td><td class="num">${fmt(s.cum4)}</td><td class="num">${fmt(s.cum3)}</td></tr>`).join('') +
  `<tr><td></td><td>Finished frame</td><td class="num"></td><td class="num">${fmt(dims.l4)}</td><td class="num">${fmt(dims.l3)}</td><td class="num"></td><td class="num"></td></tr></tbody>`;
