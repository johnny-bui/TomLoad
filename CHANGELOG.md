# Changelog

## 0.1.1 — 2026-10-25
- Mascots are larger by default: box 200 px (was 132), capped at 90% of the element (was 70%).
- Docs: Holiday set mascots at 220 px so they read well in screen recordings.

## 0.1.0 — 2026-10-25

First public release.

- `glyph()` controller: `reveal`, `hide`, `loading`, `update`, `destroy`, `state`.
- Content-shaped loading field — glyphs appear only where text, images and buttons will land.
- Mascot loading with `size`, `cell` and `offsetY` options (default box 132 px).
- `skeleton()` with 5 CSS-only variants, seed-stable for SSR.
- Presets: `ink`, `dither`, `spark`, `binary`.
- Mascots: Vietnam set (`phin`, `hat`, `lantern`) and Holiday set (`snowman`, `tree`, `gift`).
- TypeScript types (`dist/tomload.d.ts`).
- Docs site in `docs/` (GitHub Pages) with Open Graph preview image.
