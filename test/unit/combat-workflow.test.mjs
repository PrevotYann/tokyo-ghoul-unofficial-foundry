import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCombatModeToAttack,
  buildAttackSummary,
  compareSquadInitiative,
  consumeReaction,
  getAttackSourceFromItem,
  getCombatModeRules,
  getManeuverBudgetForMode,
  reserveReaction
} from "../../src/rules/combat-workflow.mjs";

test("combat mode rules expose squad and raid maneuver budgets", () => {
  assert.equal(getManeuverBudgetForMode("squad"), 2);
  assert.equal(getManeuverBudgetForMode("raid"), 3);
  assert.equal(getCombatModeRules("raid").damageMultiplier, 3);
});

test("raid mode triples damage and halves stamina costs", () => {
  assert.deepEqual(applyCombatModeToAttack({ damage: 10, staminaCost: 5 }, "raid"), {
    damage: 30,
    staminaCost: 3,
    baseDamage: 10,
    baseStaminaCost: 5,
    modeRules: {
      mode: "raid",
      maneuvers: 3,
      damageMultiplier: 3,
      staminaCostMultiplier: 0.5,
      grantsDefeatFollowUpAttack: true
    }
  });
});

test("attack source follows item type", () => {
  assert.equal(getAttackSourceFromItem(null), "basic");
  assert.equal(getAttackSourceFromItem({ type: "kagune" }), "kagune");
  assert.equal(getAttackSourceFromItem({ type: "quinque" }), "quinque");
});

test("attack summary uses actor stats, item RCL, and combat mode", () => {
  const summary = buildAttackSummary({
    stats: { str: 8, acc: 14 },
    item: { name: "Test Kagune", type: "kagune", system: { rcl: 10 } },
    attackMode: "melee",
    combatMode: "squad"
  });

  assert.equal(summary.source, "kagune");
  assert.equal(summary.itemName, "Test Kagune");
  assert.equal(summary.damage, 18);
  assert.equal(summary.staminaCost, 1);
});

test("reaction reservation consumes a maneuver and can be spent", () => {
  assert.deepEqual(reserveReaction({ maneuversRemaining: 2, reactionsReserved: 0 }), {
    maneuversRemaining: 1,
    reactionsReserved: 1,
    reserved: true
  });
  assert.equal(reserveReaction({ maneuversRemaining: 1, reactionsReserved: 1 }).reserved, false);
  assert.deepEqual(consumeReaction({ reactionsReserved: 1 }), { reactionsReserved: 0, consumed: true });
  assert.deepEqual(consumeReaction({ reactionsReserved: 0 }), { reactionsReserved: 0, consumed: false });
});

test("squad initiative sorts by SPD, then ghoul before quinx before investigator", () => {
  const ghoul = { actor: { system: { identity: { class: "ghoul" }, stats: { spd: { total: 10 } } } } };
  const investigator = { actor: { system: { identity: { class: "investigator" }, stats: { spd: { total: 10 } } } } };
  const quinx = { actor: { system: { identity: { class: "quinx" }, stats: { spd: { total: 10 } } } } };
  const fastInvestigator = { actor: { system: { identity: { class: "investigator" }, stats: { spd: { total: 12 } } } } };

  assert.deepEqual([investigator, ghoul, quinx, fastInvestigator].sort(compareSquadInitiative), [fastInvestigator, ghoul, quinx, investigator]);
});
