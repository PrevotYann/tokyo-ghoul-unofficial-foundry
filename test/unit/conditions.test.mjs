import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateRegenerationAmount,
  canActWhileGrappled,
  removeBleedingStacksByRegeneration,
  resolveBleedingStartTurn,
  resolveBurningStartTurn,
  resolveGrappleBreak
} from "../../src/rules/conditions.mjs";

test("regeneration amount follows normal and high-speed rules", () => {
  assert.equal(calculateRegenerationAmount({ type: "normal", end: 8, crl: 10 }), 8);
  assert.equal(calculateRegenerationAmount({ type: "normal", end: 8, damageWasRc: true }), 0);
  assert.equal(calculateRegenerationAmount({ type: "highSpeed", end: 8, crl: 10 }), 18);
  assert.equal(calculateRegenerationAmount({ type: "highSpeed", end: 8, crl: 10, damageWasRc: true }), 8);
  assert.equal(calculateRegenerationAmount({ type: "highSpeed", end: 8, crl: 10, suppressed: true }), 0);
});

test("regeneration removes bleeding stacks before bleeding damage", () => {
  assert.equal(removeBleedingStacksByRegeneration(3, "normal"), 2);
  assert.equal(removeBleedingStacksByRegeneration(3, "highSpeed"), 1);
  assert.deepEqual(resolveBleedingStartTurn({ stacks: 3, regenerationType: "normal" }), {
    remainingStacks: 2,
    vitalityDamage: 2
  });
});

test("burning clears on success or grows and deals damage on failure", () => {
  assert.deepEqual(resolveBurningStartTurn({ stacks: 2, endRollTotal: 18 }), {
    cleared: true,
    stacks: 0,
    vitalityDamage: 0,
    modifiedRoll: 16
  });
  assert.deepEqual(resolveBurningStartTurn({ stacks: 2, endRollTotal: 14 }), {
    cleared: false,
    stacks: 3,
    vitalityDamage: 6,
    modifiedRoll: 12
  });
});

test("grappled actors have restricted actions and opposed break checks", () => {
  assert.equal(canActWhileGrappled("move"), false);
  assert.equal(canActWhileGrappled("breather"), true);
  assert.deepEqual(resolveGrappleBreak({ grapplerTotal: 14, targetTotal: 15 }), { broken: true, margin: 1 });
  assert.deepEqual(resolveGrappleBreak({ grapplerTotal: 14, targetTotal: 14 }), { broken: false, margin: 0 });
});
