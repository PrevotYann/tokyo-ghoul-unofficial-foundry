import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateEdgeCombatModifiers,
  collectEdgeNames,
  normalizeEdgeName,
  validateEdgeLoadout
} from "../../src/rules/edges.mjs";

test("a regenerating Quinque does not grant its Investigator biological regeneration", () => {
  assert.equal(calculateEdgeCombatModifiers(["High-Speed Regeneration"], {actorClass:"investigator"}).regenerationType,"none");
});

test("edge names normalize consistently across owned and source data", () => {
  assert.equal(normalizeEdgeName("High-Speed Regeneration"), "high-speed-regeneration");
  assert.deepEqual(collectEdgeNames({
    actorItems: [{ type: "edge", name: "Hardy" }, { type: "loot", name: "Other" }],
    sourceItem: { system: { edges: ["Preemptive", "Hardy"] } }
  }), ["preemptive", "hardy"]);
});

test("edge combat modifiers expose automated bonuses and state changes", () => {
  assert.deepEqual(calculateEdgeCombatModifiers([
    "Preemptive",
    "Hardy",
    "Breathing Exercises",
    "Blunt",
    "Quick Strikes",
    "Rampant",
    "High-Speed Regeneration",
    "Grenadier"
  ], { actorClass: "ghoul", end: 9, spd: 12 }), {
    dodgeBonus: 3,
    blockBonus: 3,
    breatherMultiplier: 2,
    damageBonus: 4,
    allOutCostMultiplier: 3,
    allOutDamageBonus: 12,
    heavyStrikeCostMultiplier: 2,
    overextendRangeBonus: 0,
    naturalPredator: false,
    autoPassCrl: false,
    autoFailCrl: true,
    preventsRage: false,
    hungerTempStatBudget: 10,
    regenerationType: "highSpeed",
    grantsManeuvers: [],
    medkitMax: 0,
    grenadeMax: 10,
    sidearmEnabled: false
  });
});

test("edge loadout validation catches restrictions and incompatible edges", () => {
  const result = validateEdgeLoadout({
    sourceType: "ukaku",
    phase: "progression",
    edgeItems: [
      {
        name: "High-Speed Regeneration",
        system: {
          slots: 1,
          mustChooseAtCreation: true,
          allowedTypes: ["rinkaku"],
          forbiddenTypes: [],
          incompatibleWith: []
        }
      },
      {
        name: "Sharpened",
        system: {
          slots: 1,
          mustChooseAtCreation: false,
          allowedTypes: ["any"],
          forbiddenTypes: [],
          incompatibleWith: ["Blunt"]
        }
      },
      {
        name: "Blunt",
        system: {
          slots: 1,
          mustChooseAtCreation: false,
          allowedTypes: ["any"],
          forbiddenTypes: [],
          incompatibleWith: ["Sharpened"]
        }
      }
    ]
  });

  assert.equal(result.valid, false);
  assert.equal(result.usedSlots, 3);
  assert.equal(result.errors.some((error) => error.code === "edge.creationOnly"), true);
  assert.equal(result.errors.some((error) => error.code === "edge.allowedType"), true);
  assert.equal(result.errors.some((error) => error.code === "edge.incompatible"), true);
});
