import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceKakujaMastery,
  calculateKakujaArmorDamageReduction,
  calculateKakujaArmorParasiticDamage,
  calculateKakujaUpkeep,
  calculateKakujaWeaponEdgeSlots,
  calculateQuinxKaguneCostUnderArmor,
  canFullKakuja,
  getKakujaArmorTypeEffect,
  getKakujaBonusOptions,
  getKakujaEligibility,
  getMasteryRequirement
} from "../../src/rules/kakuja.mjs";

test("Kakuja eligibility requires class, RCL, Cannibalistic, and half mastery for full", () => {
  assert.deepEqual(getKakujaEligibility({ actorClass: "ghoul", rcl: 50, edges: ["Cannibalistic"] }), {
    canHalf: true,
    canFull: false
  });
  assert.deepEqual(getKakujaEligibility({ actorClass: "ghoul", rcl: 150, edges: ["Cannibalistic"], masteredHalf: true }), {
    canHalf: true,
    canFull: true
  });
  assert.equal(getKakujaEligibility({ actorClass: "quinx", rcl: 150, edges: ["Cannibalistic"], masteredHalf: true }).canFull, false);
});

test("Quinx cannot full Kakuja", () => {
  assert.equal(canFullKakuja({ system: { identity: { class: "quinx" } } }), false);
  assert.equal(canFullKakuja({ system: { identity: { class: "ghoul" } } }), true);
});

test("Kakuja bonus options follow type and stage", () => {
  assert.deepEqual(getKakujaBonusOptions("ukaku", "half"), [{ stat: "spd", value: 20 }, { stat: "acc", value: 20 }]);
  assert.deepEqual(getKakujaBonusOptions("rinkaku", "full"), [{ stat: "rcl", value: 20 }, { stat: "spd", value: 40 }]);
});

test("Kakuja upkeep follows stage and mastery", () => {
  assert.equal(calculateKakujaUpkeep({ stage: "half", rcl: 50 }), 50);
  assert.equal(calculateKakujaUpkeep({ stage: "full", rcl: 150 }), 300);
  assert.equal(calculateKakujaUpkeep({ stage: "full", rcl: 150, mastered: true }), 75);
});

test("mastery requires combat or out-of-combat success streaks and failure causes lost control", () => {
  assert.equal(getMasteryRequirement({ context: "combat" }), 10);
  assert.equal(getMasteryRequirement({ context: "outOfCombat" }), 20);
  assert.deepEqual(advanceKakujaMastery({ currentSuccesses: 9, success: true, context: "combat" }), {
    successes: 10,
    mastered: true,
    lostControl: false
  });
  assert.deepEqual(advanceKakujaMastery({ currentSuccesses: 9, success: false, context: "combat" }), {
    successes: 0,
    mastered: false,
    lostControl: true
  });
});

test("Kakuja Quinque helpers cover weapon slots, armor reduction, parasitic damage, and Quinx costs", () => {
  assert.equal(calculateKakujaWeaponEdgeSlots(3), 6);
  assert.equal(calculateKakujaArmorDamageReduction({ incomingDamage: 18, armorRcl: 10 }), 8);
  assert.equal(calculateKakujaArmorDamageReduction({ incomingDamage: 8, armorRcl: 10 }), 0);
  assert.equal(calculateKakujaArmorParasiticDamage({ armorRcl: 10, weaponRcl: 20, turnsActive: 5 }), 0);
  assert.equal(calculateKakujaArmorParasiticDamage({ armorRcl: 10, weaponRcl: 20, turnsActive: 6 }), 15);
  assert.deepEqual(getKakujaArmorTypeEffect({ armorType: "speed" }), {
    statMultipliers: { spd: 2 },
    extraManeuvers: 1,
    removesDamageManeuverCosts: false
  });
  assert.equal(calculateQuinxKaguneCostUnderArmor({ baseCost: 7, armorActive: true }), 14);
});

 test("PDF armor variants preserve both duplicated chapters and Rampant can reach full Kakuja without mastery", () => {
 assert.deepEqual(getKakujaArmorTypeEffect({armorType:"attack"}).statMultipliers,{str:2});
 assert.equal(getKakujaEligibility({rcl:150,edges:["cannibalistic","rampant"]}).canFull,true);
 assert.equal(getKakujaEligibility({rcl:150,edges:["cannibalistic","inner-peace"]}).canHalf,false);
 });

test("repeated armor variant uses twice END and triples the selected stat", () => {
 assert.equal(calculateKakujaArmorDamageReduction({incomingDamage:40,armorRcl:45,end:10,variant:"repeated"}),20);
 assert.deepEqual(getKakujaArmorTypeEffect({variant:"repeated"}).statMultipliers,{str:3});
});
