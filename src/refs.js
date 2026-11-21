import * as THREE from 'three';
import bo from './data/buildout.json';
import model from './data/model.json';
const { dims } = model;
const CX = (dims.xmin + dims.xmax) / 2, CY = (dims.ymin + dims.ymax) / 2;
const P3 = ([x, y, z]) => [x - CX, z, -(y - CY)];
const TRI = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
const MAT = {
  deck: ['#b98a5e', 1], floor: ['#c9c6bf', 1], steel: ['#1b1d20', 1], leg: ['#2a2c30', 1],
  spine: ['#9c4a26', 1], roof: ['#5b5f63', 1], cedar: ['#6e5038', 1], glass: ['#9fc4d6', .55],
};
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setClearColor(0xffffff);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0xbdb8aa, 1.15));
const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(-600, 900, 500); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0xeeeeea }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -.5; scene.add(ground);
for (const it of bo) {
  const pos = []; for (const t of TRI) for (const i of t) pos.push(...P3(it.v[i]));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  const [col, op] = MAT[it.c];
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: .7, metalness: .05, transparent: op < 1, opacity: op, flatShading: true, side: THREE.DoubleSide, depthWrite: op >= 1 }));
  scene.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: it.c === 'glass' ? .35 : .8 }));
  scene.add(e);
}
const cam = new THREE.PerspectiveCamera(30, 16 / 9, 10, 20000);
// eye height 66 in. ; positions in model inches relative to centre (x east, y north)
window.__shot = (w, h, ex, ny, ez, tx, ty, tz, fov) => {
  renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = fov; cam.updateProjectionMatrix();
  cam.position.set(ex, ez, -ny); cam.lookAt(tx, tz, -ty); renderer.render(scene, cam);
};
window.__ready = true;
