import { TG_CONFIG } from "../config.mjs";
import { normalizeEdgeName } from "./edges.mjs";

export const GHOUL_RANK_FORGE_RCL = {
  C: 10,
  B: 15,
  A: 20,
  S: 25,
  SS: 30,
  SSS: 40
};

export const KAGUNE_EVOLUTION_COSTS = {
  statPoint: 2,
  edgeSwap: 10,
  chimera: 40
};

export const QUINQUE_UPGRADE_COSTS = {
  addGimmickRcl: 20,
  repairDays: 7,
  maxForgeEdges: 3,
  requiredSourceEdges: 2
};

const GIMMICK_BY_KAKUHOU_TYPE = {
  ukaku: "attack",
  koukaku: "defense",
  rinkaku: "form",
  bikaku: "utility"
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampNumber(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(numberOrZero(value), min), max);
}

function normalizeEdges(edges = []) {
  return edges.map(normalizeEdgeName).filter(Boolean);
}

export function calculateConsumptionReward({
  actorClass = "ghoul",
  currentStatPoints = 0,
  currentRcl = 0,
  targetHighestRcl = 0,
  rclLimit = Number.POSITIVE_INFINITY,
  rclGain = 1
} = {}) {
  const canGainStatPoints = actorClass === "ghoul" || actorClass === "quinx";
  const canGainRcl = actorClass === "ghoul" || actorClass === "quinx";
  const statPointsGained = canGainStatPoints ? Math.max(0, numberOrZero(targetHighestRcl)) : 0;
  const nextRcl = canGainRcl
    ? clampNumber(numberOrZero(currentRcl) + Math.max(0, numberOrZero(rclGain)), 0, rclLimit)
    : numberOrZero(currentRcl);

  return {
    statPointsGained,
    statPoints: numberOrZero(currentStatPoints) + statPointsGained,
    rclGained: Math.max(0, nextRcl - numberOrZero(currentRcl)),
    rcl: nextRcl
  };
}

export function calculateKaguneStatPurchase({ currentRcl = 0, points = 1 } = {}) {
  const purchasedPoints = Math.max(0, numberOrZero(points));
  const cost = purchasedPoints * KAGUNE_EVOLUTION_COSTS.statPoint;
  return {
    cost,
    affordable: numberOrZero(currentRcl) >= cost,
    remainingRcl: Math.max(0, numberOrZero(currentRcl) - cost),
    purchasedPoints
  };
}

export function calculateKaguneEdgeSwap({ currentRcl = 0, fromEdge = null, toEdge = null } = {}) {
  const cost = KAGUNE_EVOLUTION_COSTS.edgeSwap;
  return {
    cost,
    affordable: numberOrZero(currentRcl) >= cost,
    remainingRcl: Math.max(0, numberOrZero(currentRcl) - cost),
    fromEdge,
    toEdge
  };
}

export function calculateChimeraEvolution({ currentRcl = 0, hasCannibalistic = false, hasOpenSlot = false, swappingEdge = false } = {}) {
  const cost = KAGUNE_EVOLUTION_COSTS.chimera;
  const eligible = Boolean(hasCannibalistic && (hasOpenSlot || swappingEdge));
  return {
    cost,
    eligible,
    affordable: eligible && numberOrZero(currentRcl) >= cost,
    remainingRcl: eligible ? Math.max(0, numberOrZero(currentRcl) - cost) : numberOrZero(currentRcl)
  };
}

export function calculateQuinqueUpgrade({ currentRcl = 0, sourceRcl = 0 } = {}) {
  const rclGained = Math.floor(Math.max(0, numberOrZero(sourceRcl)) / 2);
  return {
    rclGained,
    rcl: numberOrZero(currentRcl) + rclGained
  };
}

export function getGimmickTypeForKakuhouType(kakuhouType, { hasDynamicEdge = false } = {}) {
  if (hasDynamicEdge) return "dynamic";
  return GIMMICK_BY_KAKUHOU_TYPE[kakuhouType] ?? "dynamic";
}

export function calculateQuinqueGimmickAddition({ currentRcl = 0, kakuhouType = "ukaku", hasDynamicEdge = false } = {}) {
  const cost = QUINQUE_UPGRADE_COSTS.addGimmickRcl;
  return {
    cost,
    affordable: numberOrZero(currentRcl) >= cost,
    rcl: Math.max(0, numberOrZero(currentRcl) - cost),
    gimmickType: getGimmickTypeForKakuhouType(kakuhouType, { hasDynamicEdge })
  };
}

export function calculateForgeQuinqueRcl({ sourceRank = "C", chosenEdges = [], maxEdges = QUINQUE_UPGRADE_COSTS.maxForgeEdges } = {}) {
  const baseRcl = GHOUL_RANK_FORGE_RCL[sourceRank] ?? GHOUL_RANK_FORGE_RCL.C;
  const chosenCount = clampNumber(normalizeEdges(chosenEdges).reduce((n,edge)=>n+(edge.toLowerCase()==="healer"?2:1),0), 0, maxEdges);
  const unusedEdgeBonus = (maxEdges - chosenCount) * TG_CONFIG.edgeSlotRclBonus;
  return {
    baseRcl,
    unusedEdgeBonus,
    rcl: baseRcl + unusedEdgeBonus
  };
}

export function validateForgeEdges({ chosenEdges = [], sourceEdges = [] } = {}) {
  const chosen = normalizeEdges(chosenEdges);
  const source = new Set(normalizeEdges(sourceEdges));
  const sourceEdgeCount = chosen.filter((edge) => source.has(edge)).length;
  const maxExceeded = chosen.length > QUINQUE_UPGRADE_COSTS.maxForgeEdges;
  const enoughSourceEdges = sourceEdgeCount >= Math.min(QUINQUE_UPGRADE_COSTS.requiredSourceEdges, chosen.length);

  return {
    valid: !maxExceeded && enoughSourceEdges,
    chosenCount: chosen.length,
    sourceEdgeCount,
    maxEdges: QUINQUE_UPGRADE_COSTS.maxForgeEdges,
    requiredSourceEdges: QUINQUE_UPGRADE_COSTS.requiredSourceEdges
  };
}

export function createKakuhouStorageEntry({
  sourceName = "",
  sourceRank = "C",
  sourceRcl = 10,
  sourceKaguneType = "ukaku",
  sourceEdges = []
} = {}) {
  return {
    sourceName,
    sourceRank,
    sourceRcl: numberOrZero(sourceRcl),
    sourceKaguneType,
    sourceEdges: normalizeEdges(sourceEdges),
    consumed: false,
    usedFor: null
  };
}
