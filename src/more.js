// "Keep going →": after the story's final shot, vertical scroll pans RIGHT through the finished house
// in other spaces, light and places. Desktop: pinned track driven by scroll (+ trackpad sideways swipes,
// arrow keys, buttons, settle-to-nearest). Phones: a native swipe carousel with snap.
// [image, title, subtitle, camera]  — cameras are the exact model cameras each rendering was made from
const CAM = {
  A: [[1012.5, 1027.5], [242.5, 147.5], 66], B: [[-507.5, -672.5], [262.5, 177.5], 66], C: [[372.5, -902.5], [252.5, 207.5], 66],
  D: [[-367.5, 847.5], [232.5, 207.5], 66], I1: [[252, 165], [2, 88], 87], I2: [[38, 165], [291, 62], 87], I3: [[495, 158], [311, 245], 87],
};
const SLIDES = [
  ['laguna-hero-dusk', 'Laguna Beach', 'Sunset', 'A', 'The view is the luxury. The house is $100,000.'],
  ['laguna-night', 'Laguna Beach', 'Night', 'A', 'Lit from within, it reads like a lantern on the hill.'],
  ['laguna-morning', 'Laguna Beach', 'Morning fog', 'A', 'With glass on every wall, the weather is part of the decor.'],
  ['int-living', 'Living room', 'Laguna Beach · Sunset', 'I1', 'One open room with glass on three sides.'],
  ['int-kitchen', 'Kitchen and dining', 'Laguna Beach · Morning', 'I2', 'A full kitchen along the steel spine, a long table between the columns.'],
  ['int-bedroom', 'Bedroom', 'Laguna Beach · First light', 'I3', 'Both bedrooms get glass on two sides. Mornings arrive early.'],
  ['laguna-patio-dusk', 'Covered patio', 'Laguna Beach · Blue hour', 'D', 'A second living room, outdoors, under its own steel canopy.'],
  ['suburb-street', 'Suburban street', 'Golden hour', 'B', 'It fits an ordinary lot on an ordinary street.'],
  ['suburb-street-dusk', 'Suburban street', 'Evening', 'B', 'Lights on, curtains open. A house that looks like it costs far more.'],
  ['suburb-backyard', 'Backyard', 'Suburban lot · Golden hour', 'D', 'Set it behind the house you have: room for a parent, a grown kid, a tenant.'],
  ['suburb-aerial', 'The neighborhood', 'Suburban lot · From above', 'C', 'One more household, on land that was already there.'],
  ['wild-lake-dusk', 'Mountain lake', 'Blue hour', 'A', 'Or go far from everything. It stands on its own legs.'],
];
// key plan: the house in plan (north up) with the camera position and its field of view
function keyPlan(k) {
  const [[ex, ey], [tx, ty], fov] = CAM[k], cx = 252.5, cy = 147.5, inside = k[0] === 'I';
  let px = ex, py = ey;
  if (!inside) { const dx = ex - cx, dy = ey - cy, d = Math.hypot(dx, dy); px = cx + dx / d * 430; py = cy + dy / d * 430; }
  const a = Math.atan2(ty - py, tx - px), h = fov / 2 * Math.PI / 180, L = inside ? 150 : 190;
  const p1 = [px + Math.cos(a - h) * L, py + Math.sin(a - h) * L], p2 = [px + Math.cos(a + h) * L, py + Math.sin(a + h) * L];
  const R = (x0, y0, x1, y1, c) => `<rect x="${x0}" y="${-y1}" width="${x1 - x0}" height="${y1 - y0}" class="${c}"/>`;
  return `<svg viewBox="-280 -660 1065 1020" aria-hidden="true">
    ${R(-50.5, -50.5, 555.5, 345.5, 'kp-deck')}${R(2, 2, 291, 196, 'kp-room')}${R(311, 2, 503, 293, 'kp-room')}${R(311, 146, 503, 149, 'kp-wall')}
    ${R(2, 198, 291, 291, 'kp-patio')}${R(291, -50.5, 311, 345.5, 'kp-spine')}
    <path d="M${px} ${-py} L${p1[0]} ${-p1[1]} A${L} ${L} 0 0 1 ${p2[0]} ${-p2[1]} Z" class="kp-cone"/>
    <circle cx="${px}" cy="${-py}" r="${inside ? 16 : 22}" class="kp-cam"/>
    <text x="-250" y="-600" class="kp-n">N ↑</text></svg>`;
}
export function initMore() {
  const sec = document.getElementById('more'), track = document.getElementById('mtrack');
  const N = SLIDES.length, $ = (id) => document.getElementById(id);
  track.innerHTML = SLIDES.map(([f, t, sub, cam, line], i) => `
    <figure class="mslide">
      <img src="/media/${f}-1280.webp" srcset="/media/${f}-1280.webp 1280w, /media/${f}.webp 2400w" sizes="100vw" alt="${t}, ${sub.toLowerCase()} (conceptual rendering)" ${i < 2 ? '' : 'loading="lazy"'} decoding="async">
      <figcaption><span class="mk">${String(i + 1).padStart(2, '0')} / ${N}</span><b>${t}</b><span class="ml">${line}</span><span class="ms">${sub}</span></figcaption>
      <div class="kp" title="Camera position">${keyPlan(cam)}</div>
    </figure>`).join('');
  sec.style.setProperty('--n', N);
  const slides = [...track.children], imgs = slides.map((s) => s.querySelector('img'));
  const tall = () => document.documentElement.classList.contains('tall');
  const len = () => sec.offsetHeight - innerHeight;
  const prog = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / len()));
  const goSlide = (i) => {
    i = Math.max(0, Math.min(N - 1, i));
    if (tall()) { track.scrollTo({ left: slides[i].offsetLeft - (track.clientWidth - slides[i].clientWidth) / 2, behavior: 'smooth' }); return; }
    scrollTo({ top: sec.offsetTop + (i / (N - 1)) * len(), behavior: 'smooth' });
  };
  let cur = 0;
  const setCur = (i) => { if (i === cur) return; cur = i; $('mcount').textContent = `${String(i + 1).padStart(2, '0')} / ${N}`; };
  $('mprev').onclick = () => goSlide(cur - 1); $('mnext').onclick = () => goSlide(cur + 1);
  $('mcount').textContent = `01 / ${N}`;
  let shown = 0, settle = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (tall()) { track.style.transform = ''; return; }
    const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const t = prog() * (N - 1); shown += (t - shown) * .18; if (Math.abs(t - shown) < .001) shown = t;
    track.style.transform = `translate3d(${-shown * innerWidth}px,0,0)`;
    imgs.forEach((im, i) => { const d = i - shown; if (Math.abs(d) < 1.5) im.style.transform = `translate3d(${d * -12}%,0,0) scale(1.12)`; });
    setCur(Math.round(shown));
    $('mbar').style.transform = `scaleX(${prog()})`;
    $('mhint').style.opacity = shown < .25 ? 1 : 0;
  }
  frame();
  // settle on the nearest slide when scrolling stops inside the section
  addEventListener('scroll', () => {
    if (tall()) return; clearTimeout(settle);
    settle = setTimeout(() => {
      const r = sec.getBoundingClientRect(); if (r.top > 0 || r.bottom < innerHeight) return;
      const t = prog() * (N - 1), i = Math.round(t); if (Math.abs(t - i) > .02) goSlide(i);
    }, 180);
  }, { passive: true });
  // sideways trackpad swipes / shift+wheel move the track too
  sec.addEventListener('wheel', (e) => {
    if (tall()) return; const dx = e.shiftKey ? e.deltaY : e.deltaX;
    if (Math.abs(dx) > Math.abs(e.deltaY) || e.shiftKey) { e.preventDefault(); scrollBy(0, dx * 1.4); }
  }, { passive: false });
  addEventListener('keydown', (e) => {
    const r = sec.getBoundingClientRect(); if (r.top > 1 || r.bottom < innerHeight - 1) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goSlide(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); goSlide(cur - 1); }
  });
  track.addEventListener('scroll', () => { if (!tall()) return; const i = Math.round(track.scrollLeft / slides[0].clientWidth); setCur(Math.max(0, Math.min(N - 1, i))); $('mbar').style.transform = `scaleX(${track.scrollLeft / (track.scrollWidth - track.clientWidth)})`; }, { passive: true });
}
