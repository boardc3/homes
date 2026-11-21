import * as THREE from 'three';
import { buildModel, stages, dims, N, fmt } from './scene.js';
const $ = (id) => document.getElementById(id);
$('fa').querySelector('b').textContent = fmt(dims.gray);
$('fb').querySelector('b').textContent = fmt(dims.total);
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setClearColor(0xf3f0e8);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(26, 16 / 9, 10, 9000);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a2, 1.05));
const sun = new THREE.DirectionalLight(0xffffff, 1.25); sun.position.set(-500, 900, 700); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, .35); fill.position.set(600, 300, -400); scene.add(fill);
const grid = new THREE.GridHelper(2400, 20, 0xb4af9f, 0xd7d2c4); grid.position.y = -.8; scene.add(grid);
const m = buildModel(); scene.add(m.root);

// exact site footprint (outer face of the border ring), staked out on bare ground
const W = dims.xmax - dims.xmin, D = dims.ymax - dims.ymin;
const fp = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-W / 2, .3, D / 2), new THREE.Vector3(W / 2, .3, D / 2), new THREE.Vector3(W / 2, .3, -D / 2), new THREE.Vector3(-W / 2, .3, -D / 2)]),
  new THREE.LineDashedMaterial({ color: 0x1f6f8b, dashSize: 14, gapSize: 9, transparent: true, opacity: 0 }));
fp.computeLineDistances(); scene.add(fp);

// timeline (seconds)
const INTRO = 1.8, DUR = 2.2, OUTRO = 5.4;
const start = (s) => INTRO + (s - 1) * DUR;            // stage s (1..N-1) starts here
const DONE = start(N - 1) + DUR;                        // last stage settles
const TOTAL = DONE + OUTRO;
const clamp = (k) => Math.min(1, Math.max(0, k));
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
$('bar').innerHTML = Array.from({ length: N - 1 }, () => '<s><u></u></s>').join('');
const segs = [...$('bar').querySelectorAll('u')];
window.__total = TOTAL;
window.__size = (w, h) => {
  renderer.setSize(w, h, false); cam.aspect = w / h;
  cam.setViewOffset(w, h, 0, -h * .075, w, h); cam.updateProjectionMatrix();
};
window.__film = (t) => {
  let cur = 0;
  m.per.forEach((p, si) => {
    if (si === 0) return;
    const t0 = start(si); if (t >= t0) cur = si;
    const n = p.items.length, spread = DUR * .55;
    p.items.forEach((it, k) => {
      const a = clamp((t - t0 - (n > 1 ? k * spread / (n - 1) : 0)) / .6), e = ease(a);
      it.g.visible = a > .002;
      it.mat.opacity = e; it.lmat.opacity = e * .9;
      it.g.position.y = it.flat ? 0 : (1 - e) * 60;
      const hi = si === cur && t < DONE && t - t0 < DUR;
      it.mat.emissive.set(hi ? 0x7a8a96 : 0x000000); it.mat.emissiveIntensity = hi ? .28 : 0;
    });
  });
  // footprint: in during intro, out as the platform lands
  fp.material.opacity = .85 * smooth(t / .8) * (1 - smooth((t - start(2) - .4) / 1.2));
  // camera: one slow, steady 3/4 arc from the south-east, gentle push-in
  const f = smooth(t / TOTAL);
  const th = THREE.MathUtils.degToRad(24 + 40 * f), el = THREE.MathUtils.degToRad(31 - 5 * f), r = 1720 - 230 * f;
  cam.position.set(Math.sin(th) * Math.cos(el) * r, 60 + Math.sin(el) * r, Math.cos(th) * Math.cos(el) * r);
  cam.lookAt(0, 60, 0);
  // counters
  let c4 = 0, c3 = 0;
  for (let i = 1; i < N; i++) {
    const k = ease((t - start(i)) / 1.2), p4 = stages[i - 1].cum4 || 0, p3 = stages[i - 1].cum3 || 0;
    if (t >= start(i)) { c4 = p4 + (stages[i].cum4 - p4) * k; c3 = p3 + (stages[i].cum3 - p3) * k; }
  }
  $('a').textContent = fmt(c4); $('d').textContent = fmt(c3);
  // titles
  const fin = t >= DONE;
  $('k').textContent = fin ? 'Complete' : cur === 0 ? 'Start' : 'Step ' + String(cur).padStart(2, '0') + ' of ' + (N - 1);
  $('t').textContent = fin ? 'Finished build' : cur === 0 ? 'Bare ground' : stages[cur].title;
  const xa = smooth((t - DONE) / .9);
  $('fa').style.opacity = xa; $('fb').style.opacity = xa;
  segs.forEach((u, i) => { u.style.width = (clamp((t - start(i + 1)) / DUR) * 100) + '%'; });
  renderer.render(scene, cam);
};
window.__ready = true;
