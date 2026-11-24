// Scroll-driven story: bare ground → steel frame → enclosure → a real place in the wild.
// Everything is a pure function of scroll progress, so scrolling up un-builds just as smoothly.
import * as THREE from 'three';
import { buildModel, hexGeo, stages, dims, N, fmt } from './scene.js';
import bo from './data/buildout.json';

const clamp = (k) => Math.min(1, Math.max(0, k));
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;

/* ---------------------------------------------------------------- timeline (progress 0..1) */
const P_FRAME0 = .06, P_FRAME1 = .60, P_ENC1 = .80, P_CAM = .88, P_REAL0 = .86, P_REAL1 = .93, P_DUSK0 = .955, P_DUSK1 = .99;
const SPAN = (P_FRAME1 - P_FRAME0) / (N - 1);
const stageStart = (s) => P_FRAME0 + (s - 1) * SPAN;
const ENC = [                         // enclosure layers, in build order
  { key: 'deck',  kinds: ['deck', 'floor'], t: 'Deck', n: 'A deck all the way round: 1,666.5 sq ft of platform, 720.8 of it indoors.' },
  { key: 'walls', kinds: ['cedar', 'glass', 'wall'], t: 'Glass', n: 'Every outside wall is glass, because daylight is the one finish that costs nothing. One wall splits the bedroom wing into two 16 by 12 ft rooms.' },
  { key: 'roofs', kinds: ['roof'], t: 'Roofs', n: 'One gable roof over everything, 26° each way to a ridge down the middle, with deep overhangs to keep the sun off the glass.' },
  { key: 'spine', kinds: ['spine'], t: 'Corten spine', n: 'The columns that carry it all, wrapped in weathering steel that only looks better with age.' },
];
const ENC_SPAN = (P_ENC1 - P_FRAME1) / ENC.length;

/* ---------------------------------------------------------------- camera keyframes */
// spherical around a target (three coords): th = azimuth from south (+z) toward east (+x)
const CAM_A = { pos: [760, 120, -880], tgt: [-10, 95, 0], fov: 40 };    // = refs/A_lake_ne (photoreal hero)
const aRel = [CAM_A.pos[0] - CAM_A.tgt[0], CAM_A.pos[1] - CAM_A.tgt[1], CAM_A.pos[2] - CAM_A.tgt[2]];
const A_R = Math.hypot(...aRel), A_TH = Math.atan2(aRel[0], aRel[2]) / D2R, A_EL = Math.asin(aRel[1] / A_R) / D2R;
const KEYS = [
  { p: 0,        th: 18,   el: 40,   r: 1950, tx: 0,   ty: 30, fov: 30 },
  { p: P_FRAME0, th: 26,   el: 34,   r: 1760, tx: 0,   ty: 45, fov: 30 },
  { p: P_FRAME1, th: 92,   el: 27,   r: 1560, tx: 0,   ty: 70, fov: 31 },
  { p: P_ENC1,   th: 122,  el: 13,   r: 1380, tx: -5,  ty: 85, fov: 36 },
  { p: P_CAM,    th: A_TH, el: A_EL, r: A_R,  tx: -10, ty: 95, fov: 40 },
  { p: 1,        th: A_TH, el: A_EL, r: A_R,  tx: -10, ty: 95, fov: 40 },
];
function camAt(p) {
  let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i], b = KEYS[i + 1], k = smooth((p - a.p) / (b.p - a.p));
  const o = {}; for (const key of ['th', 'el', 'r', 'tx', 'ty', 'fov']) o[key] = lerp(a[key], b[key], k);
  return o;
}

export function initStory() {
  const sec = document.getElementById('story');
  const box = document.getElementById('stage-box');
  const canvas = document.getElementById('story-canvas');
  const PLACES = { laguna: ['laguna-day', 'laguna-dusk'], lake: ['lake-day', 'lake-dusk'] };
  let place = 'laguna';
  const imgs = Object.fromEntries(Object.entries(PLACES).map(([k, [d, n]]) => [k, [document.getElementById(d), document.getElementById(n)]]));
  const placeSeg = document.getElementById('place');
  placeSeg.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return; place = b.dataset.place;
    [...placeSeg.children].forEach((x) => x.setAttribute('aria-pressed', x === b)); lastKey = ''; dirty = true;
  });
  const $ = (id) => document.getElementById(id);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 10, 20000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a2, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 1.25); sun.position.set(-500, 900, 700); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, .35); fill.position.set(600, 300, -400); scene.add(fill);
  const grid = new THREE.GridHelper(4000, 34, 0xb4af9f, 0xd7d2c4); grid.position.y = -.8; scene.add(grid);
  const m = buildModel(); scene.add(m.root);

  // footprint stake-out
  const W = dims.xmax - dims.xmin, D = dims.ymax - dims.ymin;
  const fp = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-W / 2, .3, D / 2), new THREE.Vector3(W / 2, .3, D / 2), new THREE.Vector3(W / 2, .3, -D / 2), new THREE.Vector3(-W / 2, .3, -D / 2)]),
    new THREE.LineDashedMaterial({ color: 0x1f6f8b, dashSize: 14, gapSize: 9, transparent: true, opacity: 0 }));
  fp.computeLineDistances(); scene.add(fp);

  // enclosure layers (same geometry as the photoreal references)
  const ENC_COL = { wall: '#e9e4da', deck: '#b98a5e', floor: '#c9c6bf', spine: '#9c4a26', roof: '#4f5357', cedar: '#5b4230', glass: '#9fc4d6' };
  const layers = ENC.map(() => []);
  for (const it of bo) {
    const li = ENC.findIndex((L) => L.kinds.includes(it.c)); if (li < 0) continue;
    const geo = hexGeo(it.v), glass = it.c === 'glass';
    const mat = new THREE.MeshStandardMaterial({ color: ENC_COL[it.c], roughness: .7, metalness: .05, transparent: true, opacity: 0, flatShading: true, side: THREE.DoubleSide, depthWrite: !glass });
    const lmat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0 });
    const g = new THREE.Group(); g.add(new THREE.Mesh(geo, mat)); g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), lmat));
    g.visible = false; scene.add(g);
    layers[li].push({ g, mat, lmat, glass, drop: it.c === 'roof' || it.c === 'spine' });
  }
  const STEEL = new THREE.Color('#1b1d20');
  const tmp = new THREE.Color();

  /* ---------- sizing: one virtual 16:9 frame, cover-fit on wide screens, banded on tall ones */
  let fw = 16, fh = 9, ox = 0, oy = 0, bw = 16, bh = 9;
  function layout() {
    const vw = innerWidth, vh = innerHeight, wide = vw / vh >= 1.15;
    document.documentElement.classList.toggle('tall', !wide);
    if (wide) { bw = vw; bh = vh; } else { bw = vw; bh = Math.round(Math.min(vw * 9 / 16 * 1.5, vh * .46)); }
    box.style.width = bw + 'px'; box.style.height = bh + 'px';
    document.documentElement.style.setProperty('--bh', bh + 'px');
    if (bw / bh > 16 / 9) { fw = bw; fh = bw * 9 / 16; ox = 0; oy = (fh - bh) / 2; }
    else { fh = bh; fw = bh * 16 / 9; oy = 0; ox = (fw - bw) / 2; }
    renderer.setSize(bw, bh, false);
    cam.aspect = fw / fh; cam.setViewOffset(fw, fh, ox, oy, bw, bh); cam.updateProjectionMatrix();
    dirty = true;
  }

  /* ---------- captions */
  const rail = $('rail'), chapters = [...rail.querySelectorAll('button')];
  const CH = [0, P_FRAME0, P_FRAME1, P_REAL0];
  chapters.forEach((b, i) => b.onclick = () => scrollToP(CH[i] + (i === 0 ? 0 : .012)));
  function scrollToP(p) {
    const top = sec.offsetTop + p * (sec.offsetHeight - innerHeight);
    scrollTo({ top, behavior: 'smooth' });
  }
  let lastKey = '';
  function caption(p) {
    let kick, title, note, chips = [];
    const two = (n) => String(n).padStart(2, '0');
    if (p < P_FRAME0) { kick = '01 Ground'; title = stages[0].title; note = stages[0].note; }
    else if (p < P_FRAME1) {
      const s = Math.min(N - 1, 1 + Math.floor((p - P_FRAME0) / SPAN)), st = stages[s];
      kick = `02 Frame · ${two(s)} of ${N - 1}`; title = st.title; note = st.note;
      if (st.l4) chips.push(`+${fmt(st.l4)} ft of 4 in. tube`); if (st.l3) chips.push(`+${fmt(st.l3)} ft of 3 × 2 in. tube`);
    } else if (p < P_REAL0) {
      const e = Math.min(ENC.length - 1, Math.floor((p - P_FRAME1) / ENC_SPAN));
      kick = `03 Enclosure · ${two(e + 1)} of ${two(ENC.length)}`; title = ENC[e].t; note = ENC[e].n;
    } else {
      const d = p >= P_DUSK0, L = place === 'laguna';
      kick = '04 Place'; title = L ? 'Laguna Beach' : 'Mountain lake';
      note = 'Same house, same $100,000. ' + (L ? 'This time on a coastal hillside, Catalina on the horizon.' : 'This time in a clearing by the water.');
    }
    const key = kick + title + place + note;
    if (key === lastKey) return; lastKey = key;
    $('cap-k').textContent = kick; $('cap-t').textContent = title; $('cap-n').textContent = note;
    $('cap-c').innerHTML = chips.map((c) => `<span>${c}</span>`).join('');
    const cap = $('cap'); cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    const ci = p < P_FRAME0 ? 0 : p < P_FRAME1 ? 1 : p < P_REAL0 ? 2 : 3;
    chapters.forEach((b, i) => { b.classList.toggle('on', i === ci); b.classList.toggle('done', i < ci); });
  }

  /* ---------- the frame for a given progress */
  let target = 0, shown = -1, dirty = true;
  function draw(p) {
    const encK = smooth((p - P_FRAME1) / (P_ENC1 - P_FRAME1));            // 0 → 1 across the enclosure
    // steel: build-up per stage, then diagram colours turn to black steel
    m.per.forEach((pp, si) => {
      if (si === 0) return;
      const t0 = stageStart(si), n = pp.items.length;
      pp.items.forEach((it, k) => {
        const a = clamp(((p - t0) / SPAN - (n > 1 ? k / (n - 1) * .55 : 0)) / .45), e = ease(a);
        it.g.visible = a > .002;
        if (!it.g.visible) return;
        it.mat.opacity = e; it.lmat.opacity = e * .9 * (1 - .6 * encK);
        it.g.position.y = it.flat ? 0 : (1 - e) * 60;
        const keepCol = it.kind === 'floor' || it.kind === 'patio';
        tmp.copy(it.base); if (!keepCol) tmp.lerp(STEEL, encK); it.mat.color.copy(tmp);
        const live = p < P_FRAME1 && Math.min(N - 1, 1 + Math.floor((p - P_FRAME0) / SPAN)) === si;
        it.mat.emissive.set(live ? 0x7a8a96 : 0x000000); it.mat.emissiveIntensity = live ? .26 : 0;
      });
    });
    // enclosure layers
    layers.forEach((L, li) => {
      const t0 = P_FRAME1 + li * ENC_SPAN, n = L.length;
      L.forEach((o, k) => {
        const a = clamp(((p - t0) / ENC_SPAN - (n > 1 ? k / (n - 1) * .4 : 0)) / .6), e = ease(a);
        o.g.visible = a > .002; if (!o.g.visible) return;
        o.mat.opacity = e * (o.glass ? .5 : 1); o.lmat.opacity = e * (o.glass ? .25 : .55);
        o.g.position.y = o.drop ? (1 - e) * 50 : 0;
      });
    });
    fp.material.opacity = .85 * smooth(p / .02) * (1 - smooth((p - stageStart(2)) / SPAN));
    grid.material.opacity = 1;
    // camera
    const c = camAt(p), th = c.th * D2R, el = c.el * D2R;
    cam.position.set(c.tx + Math.sin(th) * Math.cos(el) * c.r, c.ty + Math.sin(el) * c.r, Math.cos(th) * Math.cos(el) * c.r);
    cam.lookAt(c.tx, c.ty, 0);
    if (cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    renderer.render(scene, cam);
    // photoreal
    const rk = smooth((p - P_REAL0) / (P_REAL1 - P_REAL0)), dk = smooth((p - P_DUSK0) / (P_DUSK1 - P_DUSK0));
    for (const [k, [d, n]] of Object.entries(imgs)) { d.style.opacity = k === place ? rk : 0; n.style.opacity = k === place ? dk : 0; }
    placeSeg.classList.toggle('show', p > P_REAL0 + .02);
    // counters
    let c4 = 0, c3 = 0;
    for (let i = 1; i < N; i++) {
      const k = ease((p - stageStart(i)) / SPAN), p4 = stages[i - 1].cum4 || 0, p3 = stages[i - 1].cum3 || 0;
      if (p >= stageStart(i)) { c4 = p4 + (stages[i].cum4 - p4) * k; c3 = p3 + (stages[i].cum3 - p3) * k; }
    }
    $('k4').textContent = fmt(c4); $('k3').textContent = fmt(c3);
    const fl = smooth((p - stageStart(3)) / SPAN);
    $('ka').textContent = fmt(dims.gray * fl);
    $('intro').style.opacity = 1 - smooth(p / .035);
    $('cap').style.opacity = smooth((p - .03) / .02);
    $('cue').style.opacity = 1 - smooth(p / .02);
    $('bar').style.transform = `scaleX(${p})`;
    caption(p);
  }

  function progress() {
    const r = sec.getBoundingClientRect(), len = sec.offsetHeight - innerHeight;
    return clamp(-r.top / len);
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick() {
    requestAnimationFrame(tick);
    target = progress();
    if (shown < 0 || reduce) shown = target;
    else shown += (target - shown) * .2;
    if (Math.abs(target - shown) < .0004) shown = target;
    if (shown !== tick.last || dirty) { draw(shown); tick.last = shown; dirty = false; }
  }
  addEventListener('resize', layout);
  layout(); tick();
}
