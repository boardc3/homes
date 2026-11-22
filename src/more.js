// "Keep going →": after the story's final shot, vertical scroll pans RIGHT through the finished house
// in other spaces, light and places. Desktop: pinned track driven by scroll (+ trackpad sideways swipes,
// arrow keys, buttons, settle-to-nearest). Phones: a native swipe carousel with snap.
const SLIDES = [
  ['laguna-hero-dusk', 'Sunset over the Pacific', 'Laguna Beach', 'Exterior · sunset'],
  ['laguna-night', 'Moon on the water', 'Laguna Beach', 'Exterior · night'],
  ['laguna-morning', 'Marine layer', 'Laguna Beach', 'Exterior · early morning'],
  ['int-living', 'Living room, facing the ocean', 'Laguna Beach', 'Living area · sunset'],
  ['int-kitchen', 'Kitchen on the Corten spine', 'Laguna Beach', 'Living area · morning'],
  ['int-bedroom', 'The front bedroom', 'Laguna Beach', 'Bedroom block · first light'],
  ['laguna-patio-dusk', 'The covered patio', 'Laguna Beach', 'Patio · blue hour'],
  ['suburb-street', 'On a suburban street', 'Suburban infill', 'Street · golden hour'],
  ['suburb-street-dusk', 'Evening on the block', 'Suburban infill', 'Street · blue hour'],
  ['suburb-backyard', 'The backyard', 'Suburban infill', 'Backyard · golden hour'],
  ['suburb-aerial', 'In the neighborhood', 'Suburban infill', 'From above · golden hour'],
  ['wild-lake-dusk', 'Or somewhere wild', 'Mountain lake', 'Exterior · blue hour'],
];
export function initMore() {
  const sec = document.getElementById('more'), track = document.getElementById('mtrack');
  const N = SLIDES.length, $ = (id) => document.getElementById(id);
  track.innerHTML = SLIDES.map(([f, t, place, sub], i) => `
    <figure class="mslide">
      <img src="/media/${f}-1280.jpg" srcset="/media/${f}-1280.jpg 1280w, /media/${f}.jpg 2400w" sizes="100vw" alt="Conceptual rendering: ${t.toLowerCase()}, ${place}" ${i < 2 ? '' : 'loading="lazy"'} decoding="async">
      <figcaption><span class="mk">${String(i + 1).padStart(2, '0')} / ${N} · ${place}</span><b>${t}</b><span class="ms">${sub} · conceptual rendering</span></figcaption>
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
