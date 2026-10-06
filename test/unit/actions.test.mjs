import test from "node:test";
import assert from "node:assert/strict";
import { planManeuver, modifyAttack, distanceToRangeBand, counterDamage } from "../../src/rules/actions.mjs";
import { reserveReaction } from "../../src/rules/combat-workflow.mjs";

test("both squad maneuvers can be reserved without counting the first twice", () => {
  const first = reserveReaction({ maneuversRemaining: 2, reactionsReserved: 0 });
  const second = reserveReaction(first);
  assert.equal(second.reserved, true);
  assert.equal(second.reactionsReserved, 2);
});
test("maneuvers enforce action budget, breather, grapple and counter restrictions", () => {
  assert.equal(planManeuver({ action: "allOut", remaining: 1 }).allowed, false);
  assert.equal(planManeuver({ action: "strike", breather: true }).allowed, false);
  assert.equal(planManeuver({ action: "move", grappled: true }).allowed, false);
  assert.equal(planManeuver({ action: "breather", grappled: true }).allowed, true);
  assert.equal(planManeuver({ action: "strike", counter: true }).allowed, false);
  assert.equal(planManeuver({ action: "heavyStrike", edges: ["heavy-strikes"], str: 12, investigator: true }).stamina, 12);
});
test("raid multiplies edge and heavy damage after bonuses and replaces heavy cost", () => {
  const result = modifyAttack({ source: "kagune", baseDamage: 20, baseStaminaCost: 2 }, { action: "heavyStrike", str: 10, end: 12, edges: ["blunt"], mode: "raid" });
  assert.equal(result.damage, 108);
  assert.equal(result.staminaCost, 0);
  assert.equal(result.penalty, 10);
});
test("range boundaries and counter rounding match the PDF", () => {
  assert.deepEqual([5,15,30,45,46].map(distanceToRangeBand), ["melee","close","mid","long","far"]);
  assert.equal(counterDamage(11, 0.5), 5);
  assert.equal(counterDamage(11, 1.5), 17);
});
