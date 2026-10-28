import assert from "node:assert/strict";
import test from "node:test";

import { equivalentRank, logCardHTML, pips, resourceBar, rollTone, statDelta } from "../../src/ui/sheet-view.mjs";

test("resource bars clamp percentages and flag low and critical values", () => {
  assert.deepEqual(resourceBar({ value: 30, max: 60 }), { value: 30, max: 60, pct: 50, low: false, critical: false });
  assert.equal(resourceBar({ value: 5, max: 60 }).critical, true);
  assert.equal(resourceBar({ value: 15, max: 60 }).low, true);
  assert.equal(resourceBar({ value: 90, max: 60 }).pct, 100);
  assert.equal(resourceBar({ value: 0, max: 0 }).pct, 0);
});

test("pips, stat deltas and roll tones describe sheet state", () => {
  assert.deepEqual(pips(1, 3).map(p => p.filled), [true, false, false]);
  assert.equal(pips(0, 0).length, 0);
  assert.equal(statDelta({ base: 10, total: 13 }), 3);
  assert.equal(rollTone(20), "critical");
  assert.equal(rollTone(1), "fumble");
  assert.equal(rollTone(12), "normal");
});

test("rank equivalence pairs Ghoul and CCG ranks both ways (p. 9)", () => {
  assert.equal(equivalentRank("S"), "firstClass");
  assert.equal(equivalentRank("specialClass"), "SSS");
  assert.equal(equivalentRank("unknown"), null);
});

test("log cards escape untrusted text", () => {
  assert.match(logCardHTML("<b>x</b>"), /&lt;b&gt;x&lt;\/b&gt;/);
});
