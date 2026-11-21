import * as THREE from 'three';
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
      return { g, mat, lmat, base: new THREE.Color(color), a: 0, target: 0, start: 0, flat: it.c === 'floor' || it.c === 'patio', kind: it.c };
    });
    return { st, items };
  });
  return { root, per };
}


export { P3, hexGeo };
