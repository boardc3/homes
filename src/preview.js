// iMessage / social preview: a seamless loop. Laguna at sunset -> the house lifts away to bare hillside ->
// the steel frame draws itself on the real site (camera matched to the photograph) -> the finished house
// resolves in place -> the same house on a suburban street, inside, by a mountain lake -> back to Laguna.
import '@fontsource/fraunces/600.css';
import * as THREE from 'three';
import { buildModel, N } from './scene.js';
const $ = (id) => document.getElementById(id);
const clamp = (k) => Math.min(1, Math.max(0, k));
const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);

const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.1));
const CAM_A = { pos: [760, 120, -880], tgt: [-10, 95, 0], fov: 40 };     // the camera the Laguna renderings were made from
const cam = new THREE.PerspectiveCamera(CAM_A.fov, 16 / 9, 2, 9000);
cam.position.set(...CAM_A.pos); cam.lookAt(...CAM_A.tgt);
const m = buildModel(); scene.add(m.root);
// luminous drawing: warm white steel, Corten-light spine, faint floors
const LINE = new THREE.Color('#fff1e2'), SPINE = new THREE.Color('#f0a878');
m.per.forEach((p) => p.items.forEach((it) => {
  const spine = it.kind === 'col' || it.kind === 'cap', floor = it.flat;
  it.mat = new THREE.MeshBasicMaterial({ color: spine ? SPINE : LINE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  it.g.children[0].material = it.mat;
  it.lmat.color.copy(spine ? SPINE : LINE); it.lmat.depthWrite = false;
  it.fill = floor ? .16 : spine ? .55 : .3; it.line = floor ? .55 : 1;
}));

const W = 1280, H = 720;
window.__size = (w, h) => {
  renderer.setSize(w, h, false);
  // cover-fit the 16:9 camera frame exactly like the photographs (object-fit: cover)
  const fw = Math.max(w, h * 16 / 9), fh = fw * 9 / 16;
  cam.aspect = 16 / 9; cam.setViewOffset(fw, fh, (fw - w) / 2, (fh - h) / 2, w, h); cam.updateProjectionMatrix();
};
window.__size(W, H);

// timeline, seconds
const T = 12.5;
const HERO_OUT = [1.5, 2.3];                 // house lifts away
const B0 = 2.2, STEP = .4;                   // stage s (1..N-1) starts at B0 + (s-1)*STEP
const BUILT = B0 + (N - 2) * STEP + .6;
const HERO_IN = [BUILT + .15, BUILT + 1.15]; // the finished house resolves in place
const LINES_OUT = [BUILT + .5, BUILT + 1.5];
const L = [7.9, 9.05, 10.2], LX = .4, LHOLD = 1.15;
const END = [11.25, 11.8];                   // back to Laguna
window.__ptotal = T;
window.__pv = (t) => {
  // stage drift: slow push in, eased back out to frame 0 for a seamless loop
  const s = t <= T - 1.25 ? 1 + .045 * smooth(t / 7.6) : 1.045 - .045 * smooth((t - (T - 1.25)) / 1.25);
  $('stage').style.transform = `scale(${s})`;
  const heroA = t < HERO_IN[0] ? 1 - smooth((t - HERO_OUT[0]) / (HERO_OUT[1] - HERO_OUT[0])) : smooth((t - HERO_IN[0]) / (HERO_IN[1] - HERO_IN[0]));
  $('hero').style.opacity = heroA;
  $('plate').style.opacity = t < HERO_OUT[0] - .05 ? 0 : 1;
  $('plate').style.filter = `brightness(${1 - .2 * smooth((t - HERO_OUT[0]) / 1.2)})`;
  // the frame, stage by stage
  const lineA = 1 - smooth((t - LINES_OUT[0]) / (LINES_OUT[1] - LINES_OUT[0]));
  m.per.forEach((p, si) => {
    if (si === 0) return;
    const t0 = B0 + (si - 1) * STEP, n = p.items.length, spread = STEP * .7;
    p.items.forEach((it, k) => {
      const a = clamp((t - t0 - (n > 1 ? k * spread / (n - 1) : 0)) / .35), e = ease(a);
      it.g.visible = a > .002 && lineA > .002;
      it.mat.opacity = e * it.fill * lineA; it.lmat.opacity = e * it.line * lineA;
      it.g.position.y = it.flat ? 0 : (1 - e) * 40;
    });
  });
  // the house in other places
  L.forEach((l0, i) => {
    const el = $('l' + i), k = clamp((t - l0) / (LHOLD + LX));
    let a = smooth((t - l0) / LX);
    if (i < L.length - 1) a *= t < L[i + 1] + LX ? 1 : 0; else a *= 1 - smooth((t - END[0]) / (END[1] - END[0]));
    el.style.opacity = a;
    el.style.transform = `scale(${1.02 + .06 * k}) translateX(${(i % 2 ? -1 : 1) * 1.2 * k}%)`;
  });
  renderer.render(scene, cam);
};
Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]).then(() => { window.__pv(0); window.__ready = true; });
