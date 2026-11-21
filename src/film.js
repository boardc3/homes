import * as THREE from 'three';
import { buildModel, stages, dims, N, fmt } from './scene.js';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setClearColor(0xf3f0e8);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(28, 16 / 9, 10, 9000);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a2, 1.05));
const sun = new THREE.DirectionalLight(0xffffff, 1.25); sun.position.set(-500, 900, 700); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, .35); fill.position.set(600, 300, -400); scene.add(fill);
const grid = new THREE.GridHelper(2400, 20, 0xb4af9f, 0xd7d2c4); grid.position.y = -.8; scene.add(grid);
const m = buildModel(); scene.add(m.root);
// timeline (seconds)
const T0 = 1.4, DUR = 2.0, HOLD = 4.2;
const start = (s) => s === 0 ? 0 : T0 + (s - 1) * DUR;
const TOTAL = start(N - 1) + DUR + HOLD;
const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
window.__total = TOTAL;
window.__size = (w, h) => { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
window.__film = (t) => {
  let cur = 0;
  m.per.forEach((p, si) => {
    const t0 = start(si);
    if (t >= t0 && si > 0) cur = si;
    p.items.forEach((it, k) => {
      const a = si === 0 ? 1 : ease((t - t0 - k * (DUR * .5 / Math.max(1, p.items.length))) / .6);
      const e = ease(a);
      it.g.visible = a > .003;
      it.mat.opacity = e; it.lmat.opacity = e * .9;
      it.g.position.y = it.flat ? 0 : (1 - e) * 70;
      const hi = si === cur && si > 0 && t - t0 < DUR;
      it.mat.emissive.set(hi ? 0x7a8a96 : 0x000000); it.mat.emissiveIntensity = hi ? .30 : 0;
    });
  });
  const f = t / TOTAL, th = THREE.MathUtils.degToRad(35 + f * 115), el = THREE.MathUtils.degToRad(30 + 5 * Math.sin(f * Math.PI));
  const r = 1480 - 120 * Math.sin(f * Math.PI);
  cam.position.set(Math.sin(th) * Math.cos(el) * r, 70 + Math.sin(el) * r, Math.cos(th) * Math.cos(el) * r);
  cam.lookAt(0, 55, 0);
  // counters
  let c4 = 0, c3 = 0, pc4 = 0, pc3 = 0;
  for (let i = 1; i < N; i++) { if (t >= start(i)) { pc4 = i > 1 ? stages[i - 1].cum4 : 0; pc3 = i > 1 ? stages[i - 1].cum3 : 0; c4 = stages[i].cum4; c3 = stages[i].cum3; var ii = i, tt = ease((t - start(i)) / 1.1); } }
  const s4 = ii ? pc4 + (c4 - pc4) * tt : 0, s3 = ii ? pc3 + (c3 - pc3) * tt : 0;
  document.getElementById('a').textContent = fmt(s4); document.getElementById('d').textContent = fmt(s3);
  document.getElementById('k').textContent = cur === 0 ? 'Start' : 'Step ' + String(cur).padStart(2, '0') + ' of ' + (N - 1);
  document.getElementById('t').textContent = cur === 0 ? 'Bare ground' : stages[cur].title;
  document.getElementById('p').style.width = (f * 100) + '%';
  renderer.render(scene, cam);
};
window.__ready = true;
