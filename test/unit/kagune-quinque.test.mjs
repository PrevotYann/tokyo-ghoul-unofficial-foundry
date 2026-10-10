import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateRcBondDamage,
  getAntiGhoulQuinqueBonus,
  getTypeAdvantageBonus,
  hasTypeAdvantage,
  resolveQuinqueInterposeBlock
} from "../../src/rules/kagune-quinque.mjs";

test("type advantage follows the Kagune and Quinque type cycle", () => {
  assert.equal(hasTypeAdvantage("ukaku", "bikaku"), true);
  assert.equal(hasTypeAdvantage("bikaku", "ukaku"), false);
  assert.equal(getTypeAdvantageBonus({ attackerSource: "kagune", attackerType: "rinkaku", defenderType: "koukaku" }), 3);
  assert.equal(getTypeAdvantageBonus({ attackerSource: "quinque", attackerType: "koukaku", defenderType: "ukaku" }), 2);
  assert.equal(getTypeAdvantageBonus({ attackerSource: "quinque", attackerType: "koukaku", defenderType: "ukaku", naturalPredator: true }), 4);
});

test("investigators and quinx get a general Quinque anti-Ghoul bonus", () => {
  assert.equal(getAntiGhoulQuinqueBonus({ attackerClass: "investigator", defenderClass: "ghoul", source: "quinque" }), 3);
  assert.equal(getAntiGhoulQuinqueBonus({ attackerClass: "quinx", defenderClass: "ghoul", source: "quinque" }), 3);
  assert.equal(getAntiGhoulQuinqueBonus({ attackerClass: "ghoul", defenderClass: "ghoul", source: "kagune" }), 0);
});

test("RC Bonds absorb incoming damage and mark broken at zero", () => {
  assert.deepEqual(calculateRcBondDamage({ currentRcBonds: 10, incomingDamage: 7 }), {
    rcBondDamage: 7,
    remainingRcBonds: 3,
    broken: false
  });
  assert.deepEqual(calculateRcBondDamage({ currentRcBonds: 10, incomingDamage: 12 }), {
    rcBondDamage: 10,
    remainingRcBonds: 0,
    broken: true
  });
});

test("Quinque interpose block succeeds, damages RC Bonds, and halves vitality damage", () => {
  assert.deepEqual(resolveQuinqueInterposeBlock({ currentRcBonds: 10, incomingDamage: 9 }), {
    rcBondDamage: 9,
    remainingRcBonds: 1,
    broken: false,
    vitalityDamage: 4,
    blockSucceeded: true
  });
});
import { resolveQuinqueRegeneration } from "../../src/rules/kagune-quinque.mjs";

test("completely broken regenerating Quinque remains broken for one turn and restores on the second",()=>{
  const first=resolveQuinqueRegeneration({currentRcBonds:0,maxRcBonds:30,end:12});
  assert.deepEqual(first,{value:0,brokenTurns:1});
  assert.deepEqual(resolveQuinqueRegeneration({currentRcBonds:first.value,maxRcBonds:30,end:12,brokenTurns:first.brokenTurns}),{value:30,brokenTurns:0});
  assert.deepEqual(resolveQuinqueRegeneration({currentRcBonds:15,maxRcBonds:30,end:12,brokenTurns:1}),{value:27,brokenTurns:0});
});
