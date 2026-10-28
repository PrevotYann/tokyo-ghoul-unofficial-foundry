function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function clampResource(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(numberOrZero(value), min), max);
}

export function calculateAttackFormula({
  mode = "melee",
  source = "basic",
  str = 0,
  acc = 0,
  rcl = 0,
  sidearm = false
} = {}) {
  const damageStat = mode === "ranged" ? numberOrZero(acc) : numberOrZero(str);
  const rcLevel = numberOrZero(rcl);

  if (source === "basic") {
    return {
      damage: damageStat,
      staminaCost: 0,
      damageFormula: mode === "ranged" ? "ACC" : "STR",
      costFormula: "0"
    };
  }

  if (sidearm) {
    return {
      damage: numberOrZero(acc),
      staminaCost: 0,
      damageFormula: "ACC",
      costFormula: "0"
    };
  }

  const isKagune = source === "kagune";
  const cost = isKagune ? Math.max(damageStat - rcLevel, 1) : Math.max(rcLevel - damageStat, 1);

  return {
    damage: damageStat + rcLevel,
    staminaCost: cost,
    damageFormula: `${mode === "ranged" ? "ACC" : "STR"} + RCL`,
    costFormula: isKagune
      ? `max(${mode === "ranged" ? "ACC" : "STR"} - RCL, 1)`
      : `max(RCL - ${mode === "ranged" ? "ACC" : "STR"}, 1)`
  };
}

export function calculateDefenseOutcome({ defense = "takeHit", success = false, damage = 0, harshConsequences = true } = {}) {
  const incoming = numberOrZero(damage);

  if (success) {
    return { vitalityDamage: 0, staminaDamage: 0 };
  }

  if (defense === "dodge" && harshConsequences) {
    return {
      vitalityDamage: incoming,
      staminaDamage: Math.floor(incoming / 2)
    };
  }

  if (defense === "block" && harshConsequences) {
    return {
      vitalityDamage: Math.floor(incoming * 1.5),
      staminaDamage: 0
    };
  }

  return {
    vitalityDamage: incoming,
    staminaDamage: 0
  };
}

export function getCounterTier(defenderTotal, attackerTotal) {
  const margin = numberOrZero(defenderTotal) - numberOrZero(attackerTotal);
  if (margin >= 20) return { margin, automatic: true, damageMultiplier: 1.5 };
  if (margin >= 15) return { margin, automatic: true, damageMultiplier: 1 };
  if (margin >= 10) return { margin, automatic: false, damageMultiplier: 1 };
  if (margin >= 5) return { margin, automatic: false, damageMultiplier: 0.5 };
  return { margin, automatic: false, damageMultiplier: 0 };
}

export function resolveDefense({
  defense = "takeHit",
  defenseTotal = 0,
  attackTotal = 0,
  damage = 0,
  harshConsequences = true
} = {}) {
  const success = defense === "takeHit" ? false : numberOrZero(defenseTotal) > numberOrZero(attackTotal);
  const outcome = calculateDefenseOutcome({ defense, success, damage, harshConsequences });
  const counter = success ? getCounterTier(defenseTotal, attackTotal) : getCounterTier(0, attackTotal);

  return {
    defense,
    success,
    defenseTotal: numberOrZero(defenseTotal),
    attackTotal: numberOrZero(attackTotal),
    ...outcome,
    counter
  };
}

// Vitality 0 incapacitates (PDF p. 5); an optional yield threshold prompts the GM before that.
export function getVitalityTransition({ previous = 0, current = 0, yieldAt = null } = {}) {
  const before = numberOrZero(previous), after = numberOrZero(current);
  const threshold = yieldAt === null || yieldAt === undefined || yieldAt === "" ? null : numberOrZero(yieldAt);
  return {
    downed: before > 0 && after <= 0,
    revived: before <= 0 && after > 0,
    yields: threshold !== null && before > threshold && after <= threshold && after > 0
  };
}
