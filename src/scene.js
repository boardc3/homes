import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import model from './data/model.json';
export const { stages, dims } = model;
export const N = stages.length;                       // 0 = bare ground … N-1 = finished
export const fmt = (n, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const CX = (dims.xmin + dims.xmax) / 2, CY = (dims.ymin + dims.ymax) / 2;
const P3 = ([x, y, z]) => [x - CX, z, -(y - CY)];   // model (x east, y north, z up) -> three (x, y up, -z north)

const BASE = { plate: '#0a5fb4', leg: '#ff5a00', plat: '#3a3d43', bridge: '#e0a030', floor: '#9e9e9e', patio: '#ffffff', col: '#c0392b', cap: '#7b241c' };
const STAGE_COLOR = { left: '#1f6f8b', right: '#1f6f8b', edge: '#165068', canopy_sw: '#59a9c4', canopy_patio: '#59a9c4', canopy_right: '#59a9c4' };
const TRI = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];

function hexGeo(v) {
  const pos = [];
  for (const t of TRI) for (const i of t) pos.push(...P3(v[i]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function buildModel() {
  const root = new THREE.Group();
  const per = stages.map((st, si) => {
    const items = st.items.map((it, k) => {
      const color = BASE[it.c] || STAGE_COLOR[st.id] || '#1f6f8b';
      const geo = hexGeo(it.v);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: .62, metalness: .12, side: THREE.DoubleSide, transparent: true, opacity: 0, flatShading: true });
      const lmat = new THREE.LineBasicMaterial({ color: 0x14171a, transparent: true, opacity: 0 });
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, mat));
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), lmat));
      g.visible = false;
      root.add(g);
      return { g, mat, lmat, a: 0, target: 0, start: 0, flat: it.c === 'floor' || it.c === 'patio' };
    });
    return { st, items };
  });
  return { root, per };
}

export function makeStage(canvas, { hero = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, 10, 9000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a2, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 1.25); sun.position.set(-500, 900, 700); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, .35); fill.position.set(600, 300, -400); scene.add(fill);
  const grid = new THREE.GridHelper(2400, 20, 0xb4af9f, 0xd7d2c4); grid.position.y = -.8; scene.add(grid);
  const m = buildModel(); scene.add(m.root);
  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = Math.PI / 2 - .01; controls.minDistance = 300; controls.maxDistance = 3600;
  controls.target.set(0, 70, 0);
  const VIEWS = {
    iso: [1060, 820, 1180, 0, 70, 0],
    south: [0, 150, 2300, 0, 110, 0],
    east: [2300, 150, 0, 0, 110, 0],
    plan: [0, 2200, 1, 0, 0, 0],
  };
  let tween = null;
  function setView(k) {
    const v = VIEWS[k]; if (!v) return;
    tween = { t0: performance.now(), dur: 900, p0: cam.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(v[0], v[1], v[2]), t1: new THREE.Vector3(v[3], v[4], v[5]) };
  }
  cam.position.set(...VIEWS.iso.slice(0, 3));
  let stage = 0;
  function setStage(s, now = performance.now() / 1000) {
    stage = s;
    m.per.forEach((p, si) => p.items.forEach((it, k) => {
      const on = si <= s;
      if (on && it.target === 0) { it.start = now + (hero ? 0 : k * .014); }
      it.target = on ? 1 : 0;
      const hi = !hero && si === s && si > 0;
      it.mat.emissive.set(hi ? 0x7a8a96 : 0x000000); it.mat.emissiveIntensity = hi ? .30 : 0;
    }));
  }
  if (hero) { m.per.forEach(p => p.items.forEach(it => { it.a = 1; it.target = 1; })); controls.autoRotate = true; controls.autoRotateSpeed = .55; }
  let last = performance.now() / 1000;
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = w / h < .9 ? 40 : 28;
    if (hero && w > 900) cam.setViewOffset(w, h, -w * .2, h * .04, w, h); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(canvas); size();
  controls.addEventListener('start', () => { controls.autoRotate = false; tween = null; });
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { rootMargin: '200px' }).observe(canvas);
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const now = performance.now() / 1000, dt = Math.min(now - last, .05); last = now;
    for (const p of m.per) for (const it of p.items) {
      if (it.target === 1) { if (now >= it.start) it.a = Math.min(1, it.a + dt / .55); }
      else it.a = Math.max(0, it.a - dt / .22);
      const e = 1 - Math.pow(1 - it.a, 3);
      it.g.visible = it.a > .004;
      if (it.g.visible) { it.mat.opacity = e; it.lmat.opacity = e * .9; it.g.position.y = it.flat ? 0 : (1 - e) * 70; }
    }
    if (tween) {
      let k = Math.min(1, (performance.now() - tween.t0) / tween.dur); k = k * k * (3 - 2 * k);
      cam.position.lerpVectors(tween.p0, tween.p1, k); controls.target.lerpVectors(tween.t0v, tween.t1, k);
      if (k >= 1) tween = null;
    }
    controls.update(); renderer.render(scene, cam);
  }
  frame();
  return { setStage, setView, get stage() { return stage; } };
}

