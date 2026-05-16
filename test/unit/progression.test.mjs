import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateChimeraEvolution,
  calculateConsumptionReward,
  calculateForgeQuinqueRcl,
  calculateKaguneEdgeSwap,
  calculateKaguneStatPurchase,
  calculateQuinqueGimmickAddition,
  calculateQuinqueUpgrade,
  createKakuhouStorageEntry,
  getGimmickTypeForKakuhouType,
  validateForgeEdges
} from "../../src/rules/progression.mjs";

test("consumption grants stat points from target highest RCL and a bounded RCL gain", () => {
  assert.deepEqual(calculateConsumptionReward({
    actorClass: "ghoul",
    currentStatPoints: 3,
    currentRcl: 49,
    targetHighestRcl: 12,
    rclLimit: 50
  }), {
    statPointsGained: 12,
    statPoints: 15,
    rclGained: 1,
    rcl: 50
  });

  assert.equal(calculateConsumptionReward({ actorClass: "investigator", targetHighestRcl: 12 }).statPointsGained, 0);
});

test("kagune evolution costs cover stat purchases, edge swaps, and Chimera", () => {
  assert.deepEqual(calculateKaguneStatPurchase({ currentRcl: 8, points: 3 }), {
    cost: 6,
    affordable: true,
    remainingRcl: 2,
    purchasedPoints: 3
  });

  assert.equal(calculateKaguneEdgeSwap({ currentRcl: 9 }).affordable, false);
  assert.equal(calculateChimeraEvolution({ currentRcl: 40, hasCannibalistic: true, hasOpenSlot: true }).affordable, true);
  assert.equal(calculateChimeraEvolution({ currentRcl: 40, hasCannibalistic: false, hasOpenSlot: true }).eligible, false);
});

test("quinque upgrades use half source RCL and gimmick addition spends 20 RCL", () => {
  assert.deepEqual(calculateQuinqueUpgrade({ currentRcl: 10, sourceRcl: 15 }), {
    rclGained: 7,
    rcl: 17
  });

  assert.deepEqual(calculateQuinqueGimmickAddition({ currentRcl: 25, kakuhouType: "rinkaku" }), {
    cost: 20,
    affordable: true,
    rcl: 5,
    gimmickType: "form"
  });

  assert.equal(getGimmickTypeForKakuhouType("ukaku", { hasDynamicEdge: true }), "dynamic");
});

test("forge RCL uses source rank and unused edge bonuses", () => {
  assert.deepEqual(calculateForgeQuinqueRcl({ sourceRank: "S", chosenEdges: ["A"] }), {
    baseRcl: 25,
    unusedEdgeBonus: 4,
    rcl: 29
  });

  assert.deepEqual(validateForgeEdges({
    chosenEdges: ["Sharpened", "Blunt", "Dynamic Edge"],
    sourceEdges: ["Sharpened", "Blunt"]
  }), {
    valid: true,
    chosenCount: 3,
    sourceEdgeCount: 2,
    maxEdges: 3,
    requiredSourceEdges: 2
  });

  assert.equal(validateForgeEdges({ chosenEdges: ["A", "B", "C", "D"], sourceEdges: ["A", "B"] }).valid, false);
});

test("kakuhou storage entries preserve source data without Foundry documents", () => {
  assert.deepEqual(createKakuhouStorageEntry({
    sourceName: "Source",
    sourceRank: "A",
    sourceRcl: 20,
    sourceKaguneType: "bikaku",
    sourceEdges: [{ name: "Massive" }]
  }), {
    sourceName: "Source",
    sourceRank: "A",
    sourceRcl: 20,
    sourceKaguneType: "bikaku",
    sourceEdges: ["Massive"],
    consumed: false,
    usedFor: null
  });
});
