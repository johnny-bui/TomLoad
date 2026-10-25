import test from 'node:test';
import assert from 'node:assert/strict';
import { skeleton, PRESETS, SKELETONS } from '../src/index.js';

test('public presets and skeleton variants are exported', () => {
  assert.deepEqual(Object.keys(PRESETS), ['ink', 'dither', 'spark', 'binary']);
  assert.deepEqual(Object.keys(SKELETONS), ['dots', 'blocks', 'binary', 'braille', 'plus']);
});

test('skeleton is deterministic for the same seed', () => {
  const a = skeleton({ variant: 'braille', seed: 42, lines: 4 });
  const b = skeleton({ variant: 'braille', seed: 42, lines: 4 });
  assert.equal(a, b);
});

test('custom glyphs escape HTML special characters', () => {
  const html = skeleton({ variant: '<', rows: 1, chars: 5 });
  assert.ok(html.includes('&lt;'));
  assert.ok(!html.includes('<<'));
});

test('malicious CSS width values cannot inject HTML attributes', () => {
  const html = skeleton({ widths: ['100%" onmouseover="alert(1)'], lines: 1 });
  assert.ok(html.includes('style="width:100%"'));
  assert.ok(!html.includes('onmouseover'));
});

test('variant cannot inject attributes into class', () => {
  const html = skeleton({ variant: 'x" onclick="alert(1)', lines: 1 });
  assert.ok(html.includes('class="tls tls-dots"'));
  assert.ok(!html.includes('onclick'));
});

test('invalid lengths and counts cannot produce unbounded markup', () => {
  const html = skeleton({ rows: 1e9, chars: 1e9 });
  assert.ok(html.length < 200000);
  assert.equal(skeleton({ lines: -1 }), '<span class="tls tls-dots" aria-hidden="true"></span>');
});
