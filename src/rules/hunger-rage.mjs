export const HUNGER_RAGE_THRESHOLDS = [0.5, 0.25, 0.1];

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getThresholdKey(threshold) {
  return `${Math.round(threshold * 100)}%`;
}

export function getCrossedResourceThresholds({ previousValue, currentValue, maxValue, thresholds = HUNGER_RAGE_THRESHOLDS, alreadyChecked = [] } = {}) {
  const previous = numberOrZero(previousValue);
  const current = numberOrZero(currentValue);
  const max = numberOrZero(maxValue);
  if (max <= 0) return [];

  const checked = new Set(alreadyChecked);
  return thresholds
    .filter((threshold) => {
      const key = getThresholdKey(threshold);
      const thresholdValue = max * threshold;
      return !checked.has(key) && previous > thresholdValue && current <= thresholdValue;
    })
    .map((threshold) => ({ threshold, key: getThresholdKey(threshold), value: max * threshold }));
}

export function reduceMealScoreDaily(mealScore = {}) {
  return Math.max(0, numberOrZero(mealScore.value) - 1);
}

export function restoreMealScore(mealScore = {}, mode = "fullHumanMeal") {
  const max = numberOrZero(mealScore.max);
  const current = numberOrZero(mealScore.value);

  if (mode === "fullHumanMeal" || mode === "cannibalisticGhoulMeal") return max;
  if (mode === "fullGhoulMeal") return Math.min(max, current + Math.ceil(max / 2));
  return current;
}

export function calculateHungerTargetNumber({ mealScore = {}, stamina = {}, context = "outOfCombat" } = {}) {
  const resource = context === "inCombat" ? stamina : mealScore;
  return Math.max(0, numberOrZero(resource.max) - numberOrZero(resource.value));
}

export function calculateRageTargetNumber(vitality = {}) {
  return Math.max(0, numberOrZero(vitality.max) - numberOrZero(vitality.value));
}

export function resolveHungerFailure({ vitality = {}, turnsOrIntervals = 0, rampant = false } = {}) {
  if (rampant) return { vitalityDamage: 0, suppressesRegeneration: false, tempStatBudget: 10 };
  return {
    vitalityDamage: 5 + Math.max(0, numberOrZero(turnsOrIntervals)),
    suppressesRegeneration: true,
    tempStatBudget: 0,
    vitalityAfterDamage: Math.max(0, numberOrZero(vitality.value) - (5 + Math.max(0, numberOrZero(turnsOrIntervals))))
  };
}

export function resolveRageFailure({ voluntary = false, rampant = false } = {}) {
  return {
    active: true,
    initialStaminaLoss: voluntary || rampant ? 0 : 5,
    perActionStaminaCost: rampant ? 1 : 2,
    tempStatBudget: 10
  };
}
