# TomLoad

**Loading states that decode into place.** Skeletons made of glyphs, animated ASCII mascots while data loads, and a decode-in reveal for text, images and canvases — on any DOM element, with zero dependencies.

<p><img src="docs/assets/tomdesign.svg" alt="Tomdesign" height="14"></p>

Built by [Tomdesign](https://tomdesign.vn) · MIT · ~7 KB gzipped · **[Live demo & docs →](https://johnny-bui.github.io/TomLoad/)**

```js
import { glyph, skeleton, mascots } from 'tomload';

card.innerHTML = skeleton({ variant: 'braille', lines: 4 });   // 1. paints instantly, no JS loop

const g = glyph(card);                                          // 2. data arrives
card.innerHTML = renderProduct(data);
g.hide({ instant: true });
g.loading(true, { mascot: mascots.phin });

g.loading(false);                                               // 3. decode in
await g.reveal({ origin: 'top' });
```

---

## Why

- **No layout shift.** Real content stays in the DOM, in its real position. The animation is drawn on one canvas above it.
- **Works on anything.** Text nodes, `<img>`, `<canvas>` and `<video>` inside the element all take part. Buttons and icons fade in on the wave.
- **Accessible.** Screen readers read the real text the whole time. `aria-busy` is set while loading. `prefers-reduced-motion` turns every reveal into a short fade and stops skeleton sweeps.
- **Brandable loading.** Pass any draw function as a mascot — it is rendered as living ASCII art in the card's own space.

## Install

```bash
npm i github:johnny-bui/TomLoad
```

Or drop the browser build in a page:

```html
<script src="https://cdn.jsdelivr.net/gh/johnny-bui/TomLoad@main/dist/tomload.iife.js"></script>
<script>
  const { glyph, skeleton, mascots } = TomLoad;
</script>
```

## API

### `glyph(element, options?) → controller`

| Option | Default | Notes |
|---|---|---|
| `preset` | `'ink'` | `'ink'` · `'dither'` · `'spark'` · `'binary'`, or your own preset object |
| `speed` | `1` | Wave speed multiplier (1 ≈ 1.1 px/ms). `0.5` for hero moments |
| `origin` | `'top'` | `'top'` · `'center'` · `'pointer'` · `{ x, y }` in viewport px |
| `accent` | `--tl-accent` | Color of scramble glyphs for presets with `accent: true` |
| `media` | `img, canvas, video, [data-tl="media"]` | Elements decoded through the glyph grid |
| `fades` | `button, svg, [data-tl="fade"]` | Elements that fade in when the wave reaches them |

| Method | |
|---|---|
| `reveal({ origin, speed })` | Decode content in. Resolves when everything has landed |
| `hide({ instant, origin, speed })` | Scramble content out (or hide immediately). It stays hidden until `reveal()` |
| `loading(on, { mascot, cell })` | Glyph field — or a mascot — over the element while data loads |
| `update(options)` | Change options, e.g. switch preset |
| `destroy()` | Stop everything and restore the element |

### `skeleton({ lines, variant, widths, rows, seed }) → HTML string`

Static glyph rows with a pure-CSS shimmer sweep — paints on the first frame and renders on the server. Variants: `dots`, `blocks`, `binary`, `braille`, `plus`. The same `seed` always produces the same markup.

### Presets

| Preset | Look | Best for |
|---|---|---|
| `ink` | Condenses `.:-=+*#@`, then letters & digits | Product UI, dashboards |
| `dither` | Shaded blocks `░▒▓█`, media keep source colors | Image-heavy cards |
| `spark` | `* + ✦ ✧`, accent colored | Festive, playful brands |
| `binary` | `0` and `1`, accent colored | Dev tools, fintech |

Custom preset:

```js
glyph(el, { preset: { ramp: ' .:oO@', glyphs: 'OoO0', cell: 9, tick: 60, char: [240, 520], accent: true } });
```

### Mascots

`mascots.phin`, `mascots.hat`, `mascots.lantern` (Vietnam set) and `mascots.snowman`, `mascots.tree`, `mascots.gift` (Holiday set).
A mascot is just `(ctx, width, height, seconds) => void` — draw anything with any colors:

```js
const pulse = (ctx, w, h, t) => {
  ctx.fillStyle = '#7b6cff';
  ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * (0.25 + 0.05 * Math.sin(t * 4)), 0, Math.PI * 2); ctx.fill();
};
g.loading(true, { mascot: pulse });
```

### CSS hooks

| Variable | Used for |
|---|---|
| `--tl-accent` | Scramble glyph color |
| `--tl-skeleton` | Skeleton and glyph-field color |
| `--tl-size` | Skeleton glyph size |
| `--tl-sweep` | Skeleton sweep duration |

## Demo & docs

- **[johnny-bui.github.io/TomLoad](https://johnny-bui.github.io/TomLoad/)** — every set has a **Load** button that runs its real loading state (`docs/index.html`).
- `examples/basic.html` — the smallest working setup.

## Project structure

```
src/        tomload.js (engine) · mascots.js · index.js
dist/       tomload.js (ESM) · tomload.iife.js (global `TomLoad`)
docs/       GitHub Pages site
examples/   basic.html
```

## Develop

```bash
npm install
npm run build     # builds dist/ and copies the browser build into docs/
npm run dev       # serves docs/ locally
```

## Notes

- Images must be same-origin (or CORS-enabled) to be sampled into glyphs; otherwise they simply fade in.
- One canvas per running element; one shared animation loop for all instances.

## License

MIT © 2026 Tomdesign (Johnny Bui)
