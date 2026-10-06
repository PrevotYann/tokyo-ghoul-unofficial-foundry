import { TG_CONFIG } from "../config.mjs";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampNumber(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(numberOrZero(value), min), max);
}

export function calculateVitalityMax(end, crl, { vitalityPenalty = 0 } = {}) {
  return Math.max(0, ((numberOrZero(end) + numberOrZero(crl)) * 3) - numberOrZero(vitalityPenalty));
}

export function calculateStaminaMax(end, spd, { staminaPenalty = 0 } = {}) {
  return Math.max(0, ((numberOrZero(end) + numberOrZero(spd)) * 3) - numberOrZero(staminaPenalty));
}

export function calculateMealScoreMax(crl, { rounding = TG_CONFIG.mealScore.rounding, minimum = TG_CONFIG.mealScore.minimum } = {}) {
  const raw = numberOrZero(crl) * 1.5;
  const rounded = rounding === "ceil" ? Math.ceil(raw) : rounding === "round" ? Math.round(raw) : Math.floor(raw);
  return Math.max(numberOrZero(minimum), rounded);
}

export function calculateRcBondsMax(rcl, { highSpeedRegeneration = false } = {}) {
  const value = numberOrZero(rcl);
  return highSpeedRegeneration ? Math.floor(value / 2) : value;
}

export function calculateEdgeSlotRclBonus({ maxSlots, chosenSlots, bonusPerUnusedSlot = TG_CONFIG.edgeSlotRclBonus } = {}) {
  const max = Math.max(0, numberOrZero(maxSlots));
  const chosen = clampNumber(chosenSlots, 0, max);
  return (max - chosen) * numberOrZero(bonusPerUnusedSlot);
}

export function calculateStartingRcl({ baseRcl, maxStartingEdges, chosenStartingEdges, bonusPerUnusedSlot = TG_CONFIG.edgeSlotRclBonus } = {}) {
  return numberOrZero(baseRcl) + calculateEdgeSlotRclBonus({
    maxSlots: maxStartingEdges,
    chosenSlots: chosenStartingEdges,
    bonusPerUnusedSlot
  });
}

export function calculateStatTotal(stat = {}) {
  return numberOrZero(stat.base) + numberOrZero(stat.temp) + numberOrZero(stat.edge) + numberOrZero(stat.kakuja);
}

export function calculateStatTotals(stats = {}) {
  return Object.fromEntries(TG_CONFIG.stats.map((key) => [key, calculateStatTotal(stats[key])]));
}

export function getKaguneTypeDerivedModifiers(kaguneType) {
  switch (kaguneType) {
    case "ukaku":
      return { stats: { spd: 3 }, staminaPenaltyStat: "spd" };
    case "koukaku":
      return { stats: { end: 3, spd: -3 } };
    case "rinkaku":
      return { stats: {}, vitalityPenaltyStat: "end" };
    case "bikaku":
      return { stats: {}, edgeSlotBonus: 1 };
    default:
      return { stats: {} };
  }
}

export function applyKaguneTypeStatModifiers(stats = {}, kaguneType) {
  const totals = { ...calculateStatTotals(stats) };
  const modifiers = getKaguneTypeDerivedModifiers(kaguneType).stats;
  for (const [key, modifier] of Object.entries(modifiers)) {
    totals[key] = numberOrZero(totals[key]) + modifier;
  }
  return totals;
}

export function calculateDerivedResources({ stats = {}, kaguneType = null } = {}) {
  const totals = applyKaguneTypeStatModifiers(stats, kaguneType);
  const typeModifiers = getKaguneTypeDerivedModifiers(kaguneType);
  const vitalityPenalty = typeModifiers.vitalityPenaltyStat ? totals[typeModifiers.vitalityPenaltyStat] : 0;
  const staminaPenalty = typeModifiers.staminaPenaltyStat ? totals[typeModifiers.staminaPenaltyStat] : 0;

  return {
    statTotals: totals,
    vitalityMax: calculateVitalityMax(totals.end, totals.crl, { vitalityPenalty }),
    staminaMax: calculateStaminaMax(totals.end, totals.spd, { staminaPenalty }),
    mealScoreMax: calculateMealScoreMax(totals.crl)
  };
}

export function validateStartingStatTotal(stats = {}, expectedTotal = 60) {
  const total = TG_CONFIG.stats.reduce((sum, key) => sum + numberOrZero(stats[key]?.base), 0);
  return {
    valid: total === expectedTotal && TG_CONFIG.stats.every(key => Number.isInteger(Number(stats[key]?.base)) && Number(stats[key]?.base) >= 0),
    total,
    expected: expectedTotal,
    difference: total - expectedTotal
  };
}
