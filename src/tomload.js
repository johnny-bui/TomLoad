/**
 * Feature : TomLoad — glyph-decode loading states for any DOM element
 * Version : 0.1.0
 * Author  : Tomdesign (Johnny Bui) — https://tomdesign.vn
 * License : MIT
 * Purpose : Text, images and canvases decode into place through a glyph grid.
 *           Loading states render as a glyph field or an animated ASCII mascot.
 *           Content never leaves the DOM: no layout shift, screen readers keep reading real text.
 *
 * API
 *   const g = glyph(element, options)
 *   await g.hide({ instant })       // scramble out (or hide instantly)
 *   g.loading(true, { mascot })     // glyph field or mascot while data loads
 *   await g.reveal({ origin, speed })
 *   g.destroy()
 *   skeleton({ lines, variant, widths, rows, seed }) → HTML string (pure CSS shimmer)
 */

/* =========================================================
   INIT — presets & defaults
   ========================================================= */
export const PRESETS = {
  /** Crisp letters and numbers, condenses through a density ramp first. */
  ink:    { ramp: ' .·:-=+*#@', glyphs: 'ABCDEFGHKLMNPRSTUVXYZ0123456789#+=/%', cell: 9,  tick: 55, char: [240, 520], accent: false },
  /** Shaded blocks. Media cells keep the source colors. */
  dither: { ramp: ' ░▒▓█',      glyphs: '░▒▓█',                                  cell: 8,  tick: 80, char: [260, 560], accent: false },
  /** Sparkles — good for festive or playful brands. */
  spark:  { ramp: ' .·*+✦',     glyphs: '*+·•✦✧×',                               cell: 9,  tick: 70, char: [280, 560], accent: true },
  /** Zeros and ones, accent colored. */
  binary: { ramp: ' .:01',      glyphs: '01',                                     cell: 8,  tick: 45, char: [220, 460], accent: true },
};

const DEFAULTS = {
  preset: 'ink',
  speed: 1,                 // wave speed multiplier (1 ≈ 1.1 px/ms)
  origin: 'top',            // 'top' | 'center' | 'pointer' | { x, y } (viewport px)
  accent: null,             // CSS color for scramble glyphs; defaults to --tl-accent or text color
  media: 'img, canvas, video, [data-tl="media"]',
  fades: 'button, svg, [data-tl="fade"]',
  font: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
};

const CSS = `
.tl-host{position:relative}
.tl-hide,.tl-hide *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}
.tl-layer{position:absolute;left:0;top:0;pointer-events:none;z-index:5}
.tls{display:block;font-family:var(--tl-font,ui-monospace,Menlo,monospace);font-size:var(--tl-size,12px);line-height:1.45;color:var(--tl-skeleton,#c3c7d6);user-select:none}
.tls-line,.tls-row{display:block;white-space:pre;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.32) 0 38%,#000 50%,rgba(0,0,0,.32) 62% 100%);mask-image:linear-gradient(90deg,rgba(0,0,0,.32) 0 38%,#000 50%,rgba(0,0,0,.32) 62% 100%);
  -webkit-mask-size:300% 100%;mask-size:300% 100%;animation:tls-sweep var(--tl-sweep,1.7s) linear infinite}
.tls-line+.tls-line{margin-top:.5em}
.tls-row{line-height:1}
@keyframes tls-sweep{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0 0;mask-position:0 0}}
@media (prefers-reduced-motion:reduce){.tls-line,.tls-row{animation:none}}`;

/* =========================================================
   HELPERS
   ========================================================= */
const isBrowser = typeof window !== 'undefined';
const reduced = () => isBrowser && matchMedia('(prefers-reduced-motion: reduce)').matches;
const dpr = () => Math.min(2, (isBrowser && devicePixelRatio) || 1);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** Deterministic 0..1 noise from three integers. */
function noise(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Seeded PRNG for skeleton patterns (same seed → same markup on server and client). */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5 | 0) >>> 0) / 4294967296;
}

let styled = false;
function injectCSS() {
  if (styled || !isBrowser) return;
  styled = true;
  const el = document.createElement('style');
  el.dataset.tomload = '';
  el.textContent = CSS;
  document.head.appendChild(el);
}

let pointer = null;
if (isBrowser) {
  const track = (e) => (pointer = { x: e.clientX, y: e.clientY });
  addEventListener('pointermove', track, { passive: true });
  addEventListener('pointerdown', track, { passive: true });
}

/* ---------- shared animation loop ---------- */
const jobs = new Set();
let raf = 0;
function frame(now) {
  for (const j of jobs) {
    let keep = false;
    try { keep = j(now) !== false; } catch (err) { console.warn('[tomload]', err); }
    if (!keep) jobs.delete(j);
  }
  raf = jobs.size ? requestAnimationFrame(frame) : 0;
}
function schedule(job) {
  jobs.add(job);
  if (!raf) raf = requestAnimationFrame(frame);
}

/** Draw an element's visible pixels (respecting object-fit) into a canvas of w×h. */
function rasterize(el, w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const cs = getComputedStyle(el);
  const pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
  const pr = parseFloat(cs.paddingRight) || 0, pb = parseFloat(cs.paddingBottom) || 0;
  const rect = el.getBoundingClientRect();
  const k = w / Math.max(1, rect.width);
  const bx = pl * k, by = pt * k, bw = w - (pl + pr) * k, bh = h - (pt + pb) * k;
  const iw = el.naturalWidth || el.videoWidth || el.width || bw;
  const ih = el.naturalHeight || el.videoHeight || el.height || bh;
  const fit = el.tagName === 'CANVAS' ? 'fill' : cs.objectFit || 'fill';
  let dw = bw, dh = bh;
  if (fit === 'contain' || fit === 'scale-down') { const s = Math.min(bw / iw, bh / ih); dw = iw * s; dh = ih * s; }
  if (fit === 'cover') { const s = Math.max(bw / iw, bh / ih); dw = iw * s; dh = ih * s; }
  try {
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.drawImage(el, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
    ctx.restore();
  } catch (_) { /* not decoded yet or cross-origin: fall back to empty */ }
  return c;
}

/* =========================================================
   COMPONENTS — measuring the scope
   ========================================================= */
function measure(scope, host, opts) {
  const H = host.getBoundingClientRect();
  const hid = scope.classList.contains('tl-hide');
  if (hid) scope.classList.remove('tl-hide');           // read real colors, then restore (same task, no paint)
  const chars = [], media = [], fades = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest('.tl-layer,script,style,.tls') ? 1 : 2),
  });
  const range = document.createRange();
  const styles = new Map();
  for (let n; (n = walker.nextNode());) {
    const p = n.parentElement;
    let st = styles.get(p);
    if (!st) {
      const cs = getComputedStyle(p);
      st = { font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, size: parseFloat(cs.fontSize), color: cs.color, upper: cs.textTransform === 'uppercase', visible: cs.visibility !== 'hidden' && cs.opacity !== '0' };
      styles.set(p, st);
    }
    if (!st.visible) continue;
    const text = n.nodeValue;
    for (let i = 0; i < text.length; i++) {
      let ch = text[i];
      const code = text.charCodeAt(i), pair = code >= 0xd800 && code <= 0xdbff;
      if (pair) ch = text.slice(i, i + 2);
      if (!/\s/.test(ch)) {
        range.setStart(n, i); range.setEnd(n, i + ch.length);
        const r = range.getClientRects()[0];
        if (r && r.width > 0) chars.push({ ch: st.upper ? ch.toUpperCase() : ch, x: r.left - H.left, y: r.top - H.top, w: r.width, h: r.height, font: st.font, size: st.size, color: st.color });
      }
      if (pair) i++;
    }
  }
  for (const el of scope.querySelectorAll(opts.media)) {
    if (el.closest('.tl-layer')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const parent = el.parentElement, pcs = getComputedStyle(parent);
    const clip = pcs.overflow === 'hidden' ? { r: parent.getBoundingClientRect(), rad: parseFloat(pcs.borderTopLeftRadius) || 0 } : null;
    media.push({ el, x: r.left - H.left, y: r.top - H.top, w: r.width, h: r.height,
      clip: clip && { x: clip.r.left - H.left, y: clip.r.top - H.top, w: clip.r.width, h: clip.r.height, rad: clip.rad } });
  }
  for (const el of scope.querySelectorAll(opts.fades)) {
    if (el.closest('.tl-layer') || el.parentElement.closest(opts.fades)) continue;
    const r = el.getBoundingClientRect();
    fades.push({ el, x: r.left - H.left + r.width / 2, y: r.top - H.top + r.height / 2 });
  }
  if (hid) scope.classList.add('tl-hide');
  return { H, chars, media, fades };
}

function makeLayer(host, H) {
  const c = document.createElement('canvas');
  c.className = 'tl-layer';
  const d = dpr();
  c.width = Math.round(H.width * d);
  c.height = Math.round(H.height * d);
  c.style.width = H.width + 'px';
  c.style.height = H.height + 'px';
  host.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(d, d);
  return { c, ctx };
}

/* =========================================================
   COMPONENTS — the controller
   ========================================================= */
export function glyph(scope, options = {}) {
  injectCSS();
  const opts = { ...DEFAULTS, ...options };
  const host = scope;
  if (getComputedStyle(host).position === 'static') host.classList.add('tl-host');
  let token = 0;           // cancels runs that were superseded
  let load = null;         // active loading layer
  let state = 'shown';

  const preset = () => (typeof opts.preset === 'string' ? PRESETS[opts.preset] || PRESETS.ink : opts.preset);
  const accentOf = () => opts.accent || getComputedStyle(host).getPropertyValue('--tl-accent').trim() || null;

  function setHidden(m, on) {
    scope.classList.toggle('tl-hide', on);
    for (const md of m.media) md.el.style.opacity = on ? '0' : '';
    for (const f of m.fades) { f.el.style.transition = ''; f.el.style.opacity = on ? '0' : ''; }
  }

  function originOf(o, H) {
    if (o && typeof o === 'object') return { x: o.x - H.left, y: o.y - H.top };
    if (o === 'pointer' && pointer) return { x: pointer.x - H.left, y: pointer.y - H.top };
    if (o === 'center') return { x: H.width / 2, y: H.height / 2 };
    return { x: H.width / 2, y: 0 };
  }

  /** One run: dir = 1 decodes in, -1 scrambles out. */
  function run(dir, o = {}) {
    const id = ++token;
    const P = preset();
    const m = measure(scope, host, opts);
    if (dir > 0 && reduced()) {
      setHidden(m, false); state = 'shown';
      scope.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
      return Promise.resolve();
    }
    if (o.instant) { setHidden(m, true); state = 'hidden'; return Promise.resolve(); }

    const { H } = m;
    if (H.width < 2 || H.height < 2) { setHidden(m, dir < 0); state = dir > 0 ? 'shown' : 'hidden'; return Promise.resolve(); }
    const org = originOf(o.origin ?? opts.origin, H);
    const vel = 1.1 * (o.speed ?? opts.speed);                         // px per ms
    const accent = accentOf();
    const rand = (i, k) => noise(i, k, id);
    const glyphFont = (size) => `500 ${Math.round(size * 0.92)}px ${opts.font}`;

    // timing
    let end = 0;
    for (const [i, c] of m.chars.entries()) {
      const d = Math.hypot(c.x + c.w / 2 - org.x, c.y + c.h / 2 - org.y);
      c.t0 = d / vel + rand(i, 1) * 140;
      c.dur = P.char[0] + rand(i, 2) * (P.char[1] - P.char[0]);
      end = Math.max(end, c.t0 + c.dur);
    }
    const cell = P.cell, cw = cell * 0.62;
    const cells = [];
    for (const [mi, md] of m.media.entries()) {
      const cols = Math.max(1, Math.floor(md.w / cw)), rows = Math.max(1, Math.floor(md.h / cell));
      const full = rasterize(md.el, md.w * dpr(), md.h * dpr());
      const small = rasterize(md.el, cols, rows);
      let px;
      try { px = small.getContext('2d').getImageData(0, 0, cols, rows).data; } catch (_) { px = null; }
      md.full = full; md.cols = cols; md.rows = rows;
      for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
        const k = (gy * cols + gx) * 4;
        const r = px ? px[k] : 128, g = px ? px[k + 1] : 128, b = px ? px[k + 2] : 128, a = px ? px[k + 3] / 255 : 1;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const dens = a * clamp((1 - lum) * 1.5);                 // near-white backgrounds stay quiet
        const x = md.x + gx * (md.w / cols), y = md.y + gy * (md.h / rows);
        const d = Math.hypot(x - org.x, y - org.y);
        const t0 = d / vel * 0.9 + rand(mi * 9973 + gy * cols + gx, 3) * 160;
        const dur = 220 + rand(gx, gy) * 380;
        cells.push({ md, x, y, w: md.w / cols, h: md.h / rows, gx, gy, dens, col: `rgb(${r},${g},${b})`, t0, dur, sx: gx / cols, sy: gy / rows });
        end = Math.max(end, t0 + dur);
      }
    }
    for (const f of m.fades) { f.t0 = Math.hypot(f.x - org.x, f.y - org.y) / vel; end = Math.max(end, f.t0 + 300); }

    if (dir < 0) { setHidden(m, true); }
    else { scope.classList.add('tl-hide'); for (const md of m.media) md.el.style.opacity = '0'; for (const f of m.fades) f.el.style.opacity = '0'; }
    state = dir > 0 ? 'revealing' : 'hiding';

    const { c: layer, ctx } = makeLayer(host, H);
    const ramp = P.ramp, R = ramp.length - 1, G = P.glyphs;
    const start = performance.now();
    // group chars by font so ctx.font changes rarely
    const groups = new Map();
    for (const c of m.chars) (groups.get(c.font) || groups.set(c.font, []).get(c.font)).push(c);
    const metrics = new Map();
    for (const f of groups.keys()) { ctx.font = f; const mm = ctx.measureText('Hg'); metrics.set(f, mm.fontBoundingBoxAscent ?? mm.actualBoundingBoxAscent); }

    return new Promise((resolve) => {
      const finish = () => {
        layer.remove();
        if (id !== token) return resolve();
        if (dir > 0) { setHidden(m, false); for (const f of m.fades) f.el.style.transition = ''; state = 'shown'; }
        else state = 'hidden';
        resolve();
      };
      schedule((now) => {
        if (id !== token) { finish(); return false; }
        const t = now - start, tick = Math.floor(t / P.tick);
        ctx.clearRect(0, 0, H.width, H.height);

        // fades (buttons, icons)
        for (const f of m.fades) {
          const on = dir > 0 ? t >= f.t0 : t < f.t0;
          const want = on ? '1' : '0';
          if (f.el.style.opacity !== want) { f.el.style.transition = 'opacity .32s ease'; f.el.style.opacity = want; }
        }

        // media: glyph phase, then image tiles
        for (const cl of cells) {
          let p = (t - cl.t0) / cl.dur;
          if (dir < 0) p = 1 - p;                                  // play backwards
          if (p <= 0) continue;
          const md = cl.md;
          if (md.clip) { ctx.save(); ctx.beginPath(); ctx.roundRect(md.clip.x, md.clip.y, md.clip.w, md.clip.h, md.clip.rad); ctx.clip(); }
          if (p >= 1) {
            const fw = md.full.width, fh = md.full.height;
            ctx.drawImage(md.full, cl.sx * fw, cl.sy * fh, fw / md.cols + 1, fh / md.rows + 1, cl.x, cl.y, cl.w + 0.5, cl.h + 0.5);
          } else if (cl.dens > 0.1) {
            const lvl = clamp(cl.dens * (0.4 + p * 0.8));
            let gch = ramp[Math.max(1, Math.round(lvl * R))];
            if (p > 0.55 && noise(cl.gx, cl.gy, tick) < 0.35) gch = G[Math.floor(noise(cl.gy, cl.gx, tick) * G.length)];
            ctx.font = `500 ${cell}px ${opts.font}`;
            ctx.fillStyle = P === PRESETS.binary && accent ? accent : cl.col;
            ctx.globalAlpha = 0.35 + 0.65 * p;
            ctx.fillText(gch, cl.x, cl.y + cell * 0.82);
            ctx.globalAlpha = 1;
          }
          if (md.clip) ctx.restore();
        }

        // text: settled chars per font group, then scrambling glyphs
        ctx.textBaseline = 'alphabetic';
        let last = '';
        for (const [font, list] of groups) {
          ctx.font = font;
          const asc = metrics.get(font);
          for (const c of list) {
            let p = (t - c.t0) / c.dur;
            if (dir < 0) p = 1 - p;
            if (p < 1) continue;
            if (c.color !== last) { ctx.fillStyle = last = c.color; }
            ctx.fillText(c.ch, c.x, c.y + asc);
          }
        }
        for (const c of m.chars) {
          let p = (t - c.t0) / c.dur;
          if (dir < 0) p = 1 - p;
          if (p <= 0 || p >= 1) continue;
          const i = c.x * 7 + c.y * 13 | 0;
          const g = p < 0.32 ? ramp[Math.max(1, Math.ceil(p / 0.32 * R))] : G[Math.floor(noise(i, tick, 7) * G.length)];
          ctx.font = glyphFont(c.size);
          ctx.fillStyle = P.accent && accent && p < 0.75 ? accent : c.color;
          ctx.globalAlpha = 0.55 + 0.45 * p;
          ctx.fillText(g, c.x + (c.w - c.size * 0.55) / 2, c.y + c.h * 0.78);
          ctx.globalAlpha = 1;
        }

        if (t > end + 30) { finish(); return false; }
        return true;
      });
    });
  }

  /* ---------- loading: glyph field or mascot ---------- */
  function loading(on, o = {}) {
    if (!on) {
      if (load) load.stopAt = performance.now();
      host.removeAttribute('aria-busy');
      return;
    }
    if (load) { load.stopAt = Infinity; return; }
    host.setAttribute('aria-busy', 'true');
    if (reduced()) return;
    const P = preset();
    const H = host.getBoundingClientRect();
    if (H.width < 8 || H.height < 8) return;                     // not rendered (display:none) → nothing to draw
    const { c: layer, ctx } = makeLayer(host, H);
    const cell = o.cell || 7, cw = cell * 0.62;
    const cols = Math.floor(H.width / cw), rows = Math.floor(H.height / cell);
    const ox = (H.width - cols * cw) / 2, oy = (H.height - rows * cell) / 2;
    const s = cw / 2;                                             // square sample pixels
    const off = document.createElement('canvas');
    off.width = Math.ceil(H.width / s); off.height = Math.ceil(H.height / s);
    const octx = off.getContext('2d', { willReadFrequently: true });
    const field = getComputedStyle(host).getPropertyValue('--tl-skeleton').trim() || '#c3c7d6';
    const ramp = P.ramp, R = ramp.length - 1;
    const t0 = performance.now();
    let lastDraw = 0;
    const L = { stopAt: Infinity };
    load = L;
    schedule((now) => {
      const t = now - t0;
      const fin = clamp(t / 320), fout = L.stopAt === Infinity ? 1 : 1 - clamp((now - L.stopAt) / 380);
      if (fout <= 0) { layer.remove(); if (load === L) load = null; return false; }
      if (now - lastDraw < 33) return true;
      lastDraw = now;
      ctx.clearRect(0, 0, H.width, H.height);
      ctx.font = `500 ${cell}px ${opts.font}`;
      ctx.textBaseline = 'top';
      const tick = Math.floor(t / 85);
      let data = null;
      if (o.mascot) {
        octx.clearRect(0, 0, off.width, off.height);
        octx.save(); o.mascot(octx, off.width, off.height, t / 1000); octx.restore();
        data = octx.getImageData(0, 0, off.width, off.height).data;
      }
      let lastFill = '';
      for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
        if (noise(gx, gy, 5) > fin || noise(gx, gy, 9) > fout) continue;
        let lvl, fill;
        if (data) {
          const px = Math.min(off.width - 1, Math.floor((ox + (gx + 0.5) * cw) / s));
          const py = Math.min(off.height - 1, Math.floor((oy + (gy + 0.5) * cell) / s));
          const k = (py * off.width + px) * 4, a = data[k + 3] / 255;
          if (a < 0.2) continue;
          lvl = a; fill = `rgb(${data[k] & 0xf8},${data[k + 1] & 0xf8},${data[k + 2] & 0xf8})`;
        } else {
          lvl = 0.5 + 0.5 * Math.sin(gx * 0.45 - t * 0.006 + gy * 1.3);
          if (lvl < 0.55) continue;
          fill = field;
        }
        if (noise(gx, gy, tick) < 0.1) lvl = clamp(lvl + (noise(gy, gx, tick) - 0.5) * 0.5);
        const ch = ramp[Math.max(1, Math.min(R, Math.round(lvl * R)))];
        if (fill !== lastFill) { ctx.fillStyle = lastFill = fill; }
        ctx.fillText(ch, ox + gx * cw, oy + gy * cell);
      }
      return true;
    });
  }

  return {
    reveal: (o) => run(1, o),
    hide: (o) => run(-1, o),
    loading,
    get state() { return state; },
    update(next) { Object.assign(opts, next); },
    destroy() {
      token++;
      if (load) load.stopAt = 0;
      scope.classList.remove('tl-hide');
      host.querySelectorAll(':scope > .tl-layer').forEach((c) => c.remove());
    },
  };
}

/* =========================================================
   COMPONENTS — skeleton (static HTML + CSS sweep, no JS needed)
   ========================================================= */
export const SKELETONS = {
  dots:    ' ··:·.:',
  blocks:  ' ░░▒▒▓',
  binary:  '0101 10',
  braille: '⠁⠃⠇⠏⠟⠿⡿⣿ ',
  plus:    ' +·+×·',
};

export function skeleton({ lines = 3, variant = 'dots', widths, rows, seed = 1, chars = 64 } = {}) {
  injectCSS();
  const set = SKELETONS[variant] || variant;
  const r = rng(seed);
  const row = (n) => Array.from({ length: n }, () => set[Math.floor(r() * set.length)]).join('');
  if (rows) {
    return `<span class="tls tls-${variant}" aria-hidden="true">${Array.from({ length: rows }, () => `<span class="tls-row">${row(chars)}</span>`).join('')}</span>`;
  }
  const w = widths || ['100%', '92%', '76%', '84%', '58%'];
  return `<span class="tls tls-${variant}" aria-hidden="true">${Array.from({ length: lines }, (_, i) =>
    `<span class="tls-line" style="width:${w[i % w.length]}">${row(chars)}</span>`).join('')}</span>`;
}

export default glyph;
