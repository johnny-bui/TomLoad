/**
 * Feature : TomLoad mascots — animated loading characters drawn through the glyph grid
 * Version : 0.1.0
 * Author  : Tomdesign (Johnny Bui) — https://tomdesign.vn
 * License : MIT
 * Purpose : Pass any of these as glyph(el).loading(true, { mascot: mascots.phin }).
 *           Signature: (ctx, w, h, tSeconds) => void — draw in a w×h box with any colors.
 *           Vietnam: phin, hat, lantern · Holiday: snowman, tree, gift
 */

/* =========================================================
   HELPERS
   ========================================================= */
const TAU = Math.PI * 2;
const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rad = (ctx, x, y, r, stops) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

/* =========================================================
   COMPONENTS — mascots
   ========================================================= */
export const mascots = {
  phin(ctx, w, h, t) {
    const s = Math.min(w, h * 1.05), cx = w / 2, top = h * .14;
    ctx.fillStyle = '#3a2a20'; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = s * .025;
    ctx.fillRect(cx - s * .16, top, s * .32, s * .06);
    ctx.beginPath(); ctx.moveTo(cx - s * .2, top + s * .09); ctx.lineTo(cx + s * .2, top + s * .09); ctx.lineTo(cx + s * .15, top + s * .32); ctx.lineTo(cx - s * .15, top + s * .32); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - s * .27, top + s * .32, s * .54, s * .035);
    const gy = top + s * .4, gh = s * .42, f = .2 + .6 * ((t * .2) % 1);
    ctx.strokeStyle = '#9aa0b5'; ctx.beginPath(); ctx.moveTo(cx - s * .19, gy); ctx.lineTo(cx - s * .15, gy + gh); ctx.lineTo(cx + s * .15, gy + gh); ctx.lineTo(cx + s * .19, gy); ctx.stroke();
    ctx.fillStyle = '#8a4b22'; ctx.beginPath(); ctx.moveTo(cx - s * .15 - s * .04 * f, gy + gh * (1 - f)); ctx.lineTo(cx + s * .15 + s * .04 * f, gy + gh * (1 - f)); ctx.lineTo(cx + s * .15, gy + gh); ctx.lineTo(cx - s * .15, gy + gh); ctx.fill();
    ctx.fillStyle = '#c0703a'; for (let i = 0; i < 3; i++) { const p = (t * 1.3 + i / 3) % 1; ctx.beginPath(); ctx.arc(cx, top + s * .36 + p * (gh * (1 - f) + s * .04), s * .022, 0, TAU); ctx.fill(); }
  },
  hat(ctx, w, h, t) {
    const s = Math.min(w, h), cx = w / 2, by = h * .52 + Math.sin(t * 2.2) * h * .04;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#7fb069', '#5e9450', '#467a3c'][k]; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h * (.76 + k * .08) + Math.sin(x / (w * .12) + t * 2 + k) * h * .02); ctx.lineTo(w, h); ctx.fill(); }
    ctx.save(); ctx.translate(cx, by); ctx.rotate(Math.sin(t * 1.1) * .08);
    ctx.fillStyle = lin(ctx, -s * .4, 0, s * .4, 0, [[0, '#c99a4c'], [.5, '#f1d08a'], [1, '#b8873d']]);
    ctx.beginPath(); ctx.moveTo(0, -s * .34); ctx.lineTo(s * .42, s * .04); ctx.quadraticCurveTo(0, s * .12, -s * .42, s * .04); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  lantern(ctx, w, h, t) {
    const s = Math.min(w, h); ctx.save(); ctx.translate(w / 2, 0); ctx.rotate(Math.sin(t * 1.6) * .2);
    ctx.strokeStyle = '#5d6278'; ctx.lineWidth = s * .015; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h * .22); ctx.stroke();
    const cy = h * .52, rx = s * .26, ry = h * .26, g = .75 + .25 * Math.sin(t * 9) * Math.sin(t * 3.3);
    ctx.fillStyle = rad(ctx, 0, cy, rx * 1.1, [[0, `rgba(255,205,110,${g})`], [.6, '#ff7a3d'], [1, '#d23f2a']]); ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(-rx * .45, cy - ry - s * .04, rx * .9, s * .06); ctx.fillRect(-rx * .45, cy + ry - s * .02, rx * .9, s * .06);
    ctx.fillStyle = '#e0a83d'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * s * .03, cy + ry + s * .04, s * .012, s * .12 + Math.sin(t * 4 + i) * s * .02);
    ctx.restore();
  },
  snowman(ctx, w, h, t) {
    const s = Math.min(w, h), cx = w / 2, b = Math.abs(Math.sin(t * 2.4)) * h * .03;
    ctx.fillStyle = '#9fc4ef'; for (let i = 0; i < 26; i++) { const x = (i * 53.7) % w, y = ((i * 37 + t * 60 * (1 + i % 3)) % h); ctx.fillRect(x, y, s * .02, s * .02); }
    ctx.fillStyle = '#c9d6ea'; ctx.beginPath(); ctx.arc(cx, h * .76 - b, s * .2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d7e2f2'; ctx.beginPath(); ctx.arc(cx, h * .5 - b, s * .15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e3ebf7'; ctx.beginPath(); ctx.arc(cx, h * .3 - b, s * .11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e5484d'; ctx.fillRect(cx - s * .13, h * .38 - b, s * .26, s * .045); ctx.fillRect(cx + s * .05, h * .38 - b, s * .05, s * .14);
    ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(cx, h * .3 - b); ctx.lineTo(cx + s * .13, h * .32 - b); ctx.lineTo(cx, h * .335 - b); ctx.fill();
    ctx.fillStyle = '#1d2130'; ctx.fillRect(cx - s * .1, h * .17 - b, s * .2, s * .03); ctx.fillRect(cx - s * .06, h * .07 - b, s * .12, s * .11);
    ctx.beginPath(); ctx.arc(cx - s * .04, h * .28 - b, s * .012, 0, TAU); ctx.arc(cx + s * .04, h * .28 - b, s * .012, 0, TAU); ctx.fill();
  },
  tree(ctx, w, h, t) {
    const s = Math.min(w, h), cx = w / 2;
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(cx - s * .05, h * .8, s * .1, h * .12);
    for (let i = 0; i < 3; i++) { const y = h * (.18 + i * .2), ww = s * (.22 + i * .1); ctx.fillStyle = ['#3f9a63', '#2f7a4f', '#24613f'][i];
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + ww, y + h * .26); ctx.lineTo(cx - ww, y + h * .26); ctx.fill(); }
    const cols = ['#e5484d', '#f2c14e', '#6fb5ff', '#ff9cbc'];
    for (let i = 0; i < 14; i++) { const on = Math.sin(t * 5 + i * 1.7) > -.2; if (!on) continue; const yy = h * (.3 + (i % 7) * .08), xx = cx + Math.sin(i * 2.3) * s * (.06 + (i % 7) * .035);
      ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(xx, yy, s * .028, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(cx, h * .14); ctx.rotate(t); ctx.fillStyle = '#f2c14e'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .035 : s * .08, a = i * TAU / 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore();
  },
  gift(ctx, w, h, t) {
    const s = Math.min(w, h), cx = w / 2, hop = Math.max(0, Math.sin(t * 3)) * h * .08, base = h * .78;
    ctx.fillStyle = 'rgba(29,33,48,.15)'; ctx.beginPath(); ctx.ellipse(cx, base + s * .02, s * .3 - hop * .4, s * .04, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e5484d'; ctx.fillRect(cx - s * .26, base - s * .38, s * .52, s * .38);
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(cx - s * .04, base - s * .38, s * .08, s * .38);
    ctx.save(); ctx.translate(0, -hop); ctx.fillStyle = '#c93b40'; ctx.fillRect(cx - s * .3, base - s * .5, s * .6, s * .12);
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(cx - s * .04, base - s * .5, s * .08, s * .12);
    ctx.beginPath(); ctx.ellipse(cx - s * .09, base - s * .56, s * .09, s * .05, -.5, 0, TAU); ctx.ellipse(cx + s * .09, base - s * .56, s * .09, s * .05, .5, 0, TAU); ctx.fill(); ctx.restore();
  },
};

export default mascots;
