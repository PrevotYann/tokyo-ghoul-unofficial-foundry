import assert from "node:assert/strict";
import test from "node:test";

import { calculateMedkitUse, calculateQBulletAttack, getGrenadeProfile } from "../../src/rules/consumables.mjs";

test("medkits heal PER plus target END and remove bleeding or burning", () => {
  assert.deepEqual(calculateMedkitUse({ per: 8, targetEnd: 10 }), {
    healing: 18,
    removes: ["bleeding", "burning"]
  });
});

test("frag grenades use ACC * 3 damage and defense TNs", () => {
  assert.deepEqual(getGrenadeProfile("fragGrenade", { acc: 12 }), {
    type: "fragGrenade",
    range: "mid",
    area: "closeRadius",
    dodgeTargetNumber: 15,
    blockTargetNumber: 16,
    blockRestriction: "koukakuOnly",
    damage: 36,
    applies: []
  });
});

test("incendiary and RC limiter grenade profiles expose their special effects", () => {
  assert.deepEqual(getGrenadeProfile("incendiaryGrenade").applies, ["burning"]);
  assert.deepEqual(getGrenadeProfile("rcLimiterGrenade").suppresses, ["kagune", "kakuja", "regeneration"]);
});

test("Q bullets consume ammo and deal ACC damage only", () => {
  assert.deepEqual(calculateQBulletAttack({ acc: 12, ammo: 2 }), {
    canFire: true,
    damage: 12,
    rclDamage: 0,
    ammoAfterShot: 1
  });
  assert.equal(calculateQBulletAttack({ acc: 12, ammo: 0 }).canFire, false);
});
