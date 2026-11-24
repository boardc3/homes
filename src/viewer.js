// "Explore the model": one 3D model, two looks — Beams (the steel frame as drawn) and Realistic (built out, in its setting).
// Drag to turn it; no zoom, so the page keeps scrolling normally.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildModel, P3, dims, fmt } from './scene.js';
import bo from './data/buildout.json';

const TRI = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
function geoUV(v, tile = 48) {                       // box geometry with planar UVs in model inches
  const pos = [], uv = [];
  for (const t of TRI) {
    const a = v[t[0]], b = v[t[1]], c = v[t[2]];
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(b[0]-a[0], b[1]-a[1], b[2]-a[2]), new THREE.Vector3(c[0]-a[0], c[1]-a[1], c[2]-a[2]));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (const p of [a, b, c]) {
      pos.push(...P3(p));
      if (az >= ax && az >= ay) uv.push(p[0] / tile, p[1] / tile);      // top/bottom: x,y
      else if (ax >= ay) uv.push(p[1] / tile, p[2] / tile);             // faces east/west: y,z
      else uv.push(p[0] / tile, p[2] / tile);                           // faces north/south: x,z
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}
function tex(draw, size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); draw(x, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
function boards(x, s, base, dark, n, vertical) {
  x.fillStyle = base; x.fillRect(0, 0, s, s);
  const w = s / n;
  for (let i = 0; i < n; i++) {
    const l = (rnd() - .5) * 26; x.fillStyle = `rgba(${l > 0 ? '255,240,220' : '0,0,0'},${Math.abs(l) / 140})`;
    if (vertical) x.fillRect(i * w, 0, w, s); else x.fillRect(0, i * w, s, w);
    for (let k = 0; k < 40; k++) {                     // grain
      x.strokeStyle = `rgba(0,0,0,${.03 + rnd() * .05})`; x.lineWidth = 1; x.beginPath();
      if (vertical) { const gx = i * w + rnd() * w; x.moveTo(gx, 0); x.lineTo(gx + (rnd() - .5) * 6, s); }
      else { const gy = i * w + rnd() * w; x.moveTo(0, gy); x.lineTo(s, gy + (rnd() - .5) * 6); }
      x.stroke();
    }
    x.fillStyle = dark; if (vertical) x.fillRect(i * w, 0, 2.5, s); else x.fillRect(0, i * w, s, 2.5);
  }
}
const TEX = {
  deck: () => tex((x, s) => boards(x, s, '#9b6a43', 'rgba(40,22,10,.75)', 9, false)),
  cedar: () => tex((x, s) => boards(x, s, '#2b2420', 'rgba(0,0,0,.85)', 8, true)),
  roof: () => tex((x, s) => { x.fillStyle = '#3c4044'; x.fillRect(0, 0, s, s); for (let i = 0; i < 3; i++) { x.fillStyle = '#26292c'; x.fillRect(i * s / 3, 0, 5, s); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(i * s / 3 + 5, 0, 3, s); } }),
  spine: () => tex((x, s) => {
    x.fillStyle = '#8a3f1e'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) { const r = rnd(); x.fillStyle = `rgba(${r > .5 ? '170,85,40' : '70,28,12'},${.08 + rnd() * .18})`; const z = 2 + rnd() * 14; x.fillRect(rnd() * s, rnd() * s, z, z * (.4 + rnd())); }
    x.fillStyle = 'rgba(30,12,5,.35)'; for (let i = 0; i < 4; i++) x.fillRect(0, i * s / 4, s, 2);
  }),
  floor: () => tex((x, s) => { x.fillStyle = '#c8c2b6'; x.fillRect(0, 0, s, s); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * .04})`; x.fillRect(rnd() * s, rnd() * s, 3, 3); } }),
  meadow: () => tex((x, s) => {
    x.fillStyle = '#5f6d38'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const g = rnd(); x.fillStyle = g > .6 ? `rgba(160,150,80,${.25 * rnd()})` : `rgba(40,60,25,${.3 * rnd()})`; x.fillRect(rnd() * s, rnd() * s, 1.5, 3 + rnd() * 5); }
  }, 1024),
};

export function initViewer() {
  const canvas = document.getElementById('viewer-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 10, 30000);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8b2a2, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.4); sun.position.set(-700, 900, 500); scene.add(sun);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 700, bottom: -700, near: 100, far: 3000 }); sun.shadow.bias = -.0004;
  const fill = new THREE.DirectionalLight(0xffffff, .3); fill.position.set(600, 300, -400); scene.add(fill);

  /* ---- BEAMS: the frame exactly as drawn */
  const beams = buildModel();
  beams.per.forEach((p) => p.items.forEach((it) => { it.g.visible = true; it.mat.opacity = 1; it.lmat.opacity = .9; it.mat.transparent = true; it.g.children[0].castShadow = true; }));
  scene.add(beams.root);
  const grid = new THREE.GridHelper(4000, 34, 0xb4af9f, 0xd7d2c4); grid.position.y = -.8; grid.material.transparent = true; scene.add(grid);

  /* ---- REALISTIC: built out, with materials and a setting */
  const real = new THREE.Group(); scene.add(real);
  const T = Object.fromEntries(Object.entries(TEX).map(([k, f]) => [k, f()]));
  const M = {
    deck: new THREE.MeshStandardMaterial({ map: T.deck, roughness: .62, metalness: 0 }),
    floor: new THREE.MeshStandardMaterial({ map: T.floor, roughness: .5 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: .5, metalness: .5, envMap: env, envMapIntensity: .45 }),
    leg: new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: .6, metalness: .4, envMap: env }),
    spine: new THREE.MeshStandardMaterial({ map: T.spine, roughness: .85, metalness: .15 }),
    roof: new THREE.MeshStandardMaterial({ map: T.roof, roughness: .62, metalness: .25, envMap: env, envMapIntensity: .35 }),
    cedar: new THREE.MeshStandardMaterial({ map: T.cedar, roughness: .8 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: .9 }),
    rug: new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 1 }), sofa: new THREE.MeshStandardMaterial({ color: 0xb9b3a6, roughness: .95 }),
    table: new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: .6 }), cab: new THREE.MeshStandardMaterial({ color: 0xc9a36d, roughness: .6 }),
    bed: new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: .9 }), night: new THREE.MeshStandardMaterial({ color: 0xa0794f, roughness: .7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x24323a, roughness: .04, metalness: .7, envMap: env, envMapIntensity: .55, transparent: true, opacity: .62, depthWrite: false }),
  };
  const realMats = new Set();
  for (const it of bo) {
    const m = M[it.c].clone(); m.transparent = true; m.userData.full = M[it.c].opacity ?? 1; realMats.add(m);
    const mesh = new THREE.Mesh(geoUV(it.v, it.c === 'deck' ? 60 : it.c === 'cedar' ? 48 : it.c === 'roof' ? 48 : 96), m);
    mesh.castShadow = it.c !== 'glass'; mesh.receiveShadow = true; real.add(mesh);
  }
  // warm interior glow seen through the glass
  const glow = new THREE.MeshBasicMaterial({ color: 0xf1d9b0, transparent: true, opacity: 0 }); realMats.add(glow); glow.userData.full = .55;
  // the glow fills each room up to the gable: top 6 in. under the roof line, split at the ridge
  const TP = Math.tan(dims.roofPitch * Math.PI / 180), G = (x) => dims.ridge - Math.abs(x - dims.ridgeX) * TP - 6;
  const glowBox = (x0, x1, y0, y1) => [[x0, y0, 15.5], [x1, y0, 15.5], [x1, y1, 15.5], [x0, y1, 15.5], [x0, y0, G(x0)], [x1, y0, G(x1)], [x1, y1, G(x1)], [x0, y1, G(x0)]];
  for (const v of [glowBox(6, dims.ridgeX, 6, 192), glowBox(dims.ridgeX, 289, 6, 192), glowBox(313, 499, 6, 289)]) real.add(new THREE.Mesh(geoUV(v, 96), glow));
  // setting: meadow and a lake to the north (the patio side)
  const meadow = new THREE.Mesh(new THREE.CircleGeometry(5200, 96), new THREE.MeshStandardMaterial({ map: T.meadow, roughness: 1, transparent: true }));
  T.meadow.repeat.set(26, 26); meadow.rotation.x = -Math.PI / 2; meadow.position.y = -1.2; meadow.receiveShadow = true; real.add(meadow); realMats.add(meadow.material); meadow.material.userData.full = 1;
  const NS = (dims.ymax - (dims.ymin + dims.ymax) / 2) + 270;                 // shoreline ~22 ft north of the deck edge
  const shore = new THREE.Shape(); shore.moveTo(-6000, NS + 5000); shore.lineTo(6000, NS + 5000);
  for (let x = 6000; x >= -6000; x -= 200) shore.lineTo(x, NS + Math.sin(x / 700) * 80 + Math.sin(x / 230) * 22);
  const lake = new THREE.Mesh(new THREE.ShapeGeometry(shore), new THREE.MeshStandardMaterial({ color: 0x2c6474, roughness: .12, metalness: .35, envMap: env, envMapIntensity: .6, transparent: true }));
  lake.rotation.x = -Math.PI / 2; lake.position.y = -.4; real.add(lake); realMats.add(lake.material); lake.material.userData.full = 1;
  // shoreline stones
  const stoneGeo = new THREE.DodecahedronGeometry(1, 0), stones = new THREE.InstancedMesh(stoneGeo, new THREE.MeshStandardMaterial({ color: 0x9a978f, roughness: .9, transparent: true }), 420);
  { const o = new THREE.Object3D(); for (let i = 0; i < 420; i++) { const x = -3000 + rnd() * 6000, z = -(NS + Math.sin(x / 700) * 80 + Math.sin(x / 230) * 22) + (rnd() - .5) * 40, r = 4 + rnd() * 14;
      o.position.set(x, r * .25, z); o.scale.set(r, r * .55, r * (.7 + rnd() * .5)); o.rotation.set(rnd(), rnd() * 6, rnd()); o.updateMatrix(); stones.setMatrixAt(i, o.matrix); } }
  stones.receiveShadow = true; real.add(stones); realMats.add(stones.material); stones.material.userData.full = 1;
  // forest: a ring of firs around the clearing, open to the lake
  const firN = 260, cone = new THREE.ConeGeometry(1, 1, 7), trunk = new THREE.CylinderGeometry(.08, .1, 1, 6);
  const firs = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: 0x1f3a26, roughness: .95, flatShading: true, transparent: true }), firN * 2);
  const trunks = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1, transparent: true }), firN);
  { const o = new THREE.Object3D(); let n = 0;
    for (let i = 0; i < firN; i++) {
      let x, z; do { const a = rnd() * Math.PI * 2, r = 2700 + rnd() * 3800; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (z < -(NS - 60));
      const h = 520 + rnd() * 700, w = h * (.2 + rnd() * .06);
      for (const [f, yy, ww] of [[.62, .55, 1], [.5, .8, .72]]) { o.position.set(x, h * yy, z); o.scale.set(w * ww, h * f, w * ww); o.rotation.set(0, rnd() * 6, 0); o.updateMatrix(); firs.setMatrixAt(n++, o.matrix); }
      o.position.set(x, h * .14, z); o.scale.set(w * .9, h * .3, w * .9); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
    } }
  firs.castShadow = true; real.add(firs); real.add(trunks);
  for (const mm of [firs.material, trunks.material]) { realMats.add(mm); mm.userData.full = 1; }
  // far shore forest band across the lake
  const far = new THREE.InstancedMesh(cone, firs.material, 220);
  { const o = new THREE.Object3D(); for (let i = 0; i < 220; i++) { const x = -7000 + rnd() * 14000, z = -(NS + 3400 + rnd() * 1400), h = 600 + rnd() * 800;
      o.position.set(x, h * .5, z); o.scale.set(h * .22, h, h * .22); o.updateMatrix(); far.setMatrixAt(i, o.matrix); } }
  real.add(far);
  const sky = (() => { const c = document.createElement('canvas'); c.width = 2; c.height = 512; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#6f9cc4'); g.addColorStop(.62, '#cfe0ea'); g.addColorStop(1, '#f2e6cf'); x.fillStyle = g; x.fillRect(0, 0, 2, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, transparent: true, depthWrite: false }));
  real.add(skyDome); realMats.add(skyDome.material); skyDome.material.userData.full = 1;

  /* ---- mode switching (crossfade) */
  let mode = 'beams', k = 0, kTarget = 0;                // k: 0 = beams, 1 = realistic
  function apply() {
    const e = k * k * (3 - 2 * k);
    beams.per.forEach((p) => p.items.forEach((it) => { it.mat.opacity = 1 - e; it.lmat.opacity = .9 * (1 - e); it.g.visible = e < .999; }));
    grid.material.opacity = 1 - e; grid.visible = e < .999;
    for (const m of realMats) { m.opacity = m.userData.full * e; m.depthWrite = e > .98 && m.userData.full >= 1 && m !== skyDome.material; }
    real.visible = e > .001;
    hemi.intensity = 1 - .25 * e;
    renderer.toneMappingExposure = 1 + .1 * e;
    document.getElementById('viewer').classList.toggle('is-real', e > .5);
  }
  const NOTE = {
    real: 'Finished: glass on every wall, ipe deck, Corten spine, and one standing-seam gable roof pitched 26° each way. Living wing behind the patio, two bedrooms on the east side.',
    beams: `The frame as drawn: <b>${fmt(dims.l4)} ft</b> of 4 in. tube and <b>${fmt(dims.l3)} ft</b> of 3 × 2 in. tube on 54 legs.`,
  };
  const setNote = () => { document.getElementById('viewer-note').innerHTML = NOTE[mode]; };
  const seg = document.getElementById('look');
  seg.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    mode = b.dataset.look; kTarget = mode === 'real' ? 1 : 0;
    [...seg.children].forEach((x) => x.setAttribute('aria-pressed', x === b));
    setNote();
    wake();
  });

  /* ---- camera: drag to turn, preset views, no zoom */
  const controls = new OrbitControls(cam, canvas);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minPolarAngle = .15; controls.maxPolarAngle = Math.PI / 2 - .04; controls.rotateSpeed = .6;
  controls.target.set(0, 70, 0); canvas.style.touchAction = 'pan-y';
  controls.autoRotate = true; controls.autoRotateSpeed = .45;
  const VIEWS = {
    iso: [1150, 900, 1250, 0, 70, 0], lake: [760, 120, -880, -10, 95, 0],
    north: [0, 120, -1900, 0, 95, 0], south: [0, 120, 1900, 0, 95, 0], east: [1900, 120, 0, 0, 95, 0], west: [-1900, 120, 0, 0, 95, 0],
    top: [0, 2300, 1, 0, 0, 0],
  };
  cam.position.set(...VIEWS.iso.slice(0, 3));
  let tween = null;
  document.getElementById('views').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return; const v = VIEWS[b.dataset.v];
    [...b.parentElement.children].forEach((x) => x.setAttribute('aria-pressed', x === b));
    controls.autoRotate = false;
    tween = { t0: performance.now(), p0: cam.position.clone(), q0: controls.target.clone(), p1: new THREE.Vector3(v[0], v[1], v[2]), q1: new THREE.Vector3(v[3], v[4], v[5]) };
    wake();
  });
  controls.addEventListener('start', () => { controls.autoRotate = false; tween = null; wake(); });

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 44 : 30; cam.updateProjectionMatrix(); wake();
  }
  new ResizeObserver(size).observe(canvas);
  let onScreen = false, running = false, idle = 0;
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) wake(); }, { rootMargin: '100px' }).observe(canvas);
  function wake() { idle = 0; if (!running && onScreen) { running = true; requestAnimationFrame(frame); } }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .25); last = now;
    if (k !== kTarget) { k += Math.sign(kTarget - k) * dt / .7; k = Math.min(1, Math.max(0, k)); apply(); idle = 0; }
    if (tween) {
      let t = Math.min(1, (now - tween.t0) / 1100); t = t * t * (3 - 2 * t);
      cam.position.lerpVectors(tween.p0, tween.p1, t); controls.target.lerpVectors(tween.q0, tween.q1, t); if (t >= 1) tween = null; idle = 0;
    }
    controls.update(); renderer.render(scene, cam);
    if (!controls.autoRotate && !tween && k === kTarget) idle++;
    if (!onScreen || idle > 90) { running = false; return; }
    requestAnimationFrame(frame);
  }
  controls.addEventListener('change', wake);
  apply(); size(); setNote();
}
