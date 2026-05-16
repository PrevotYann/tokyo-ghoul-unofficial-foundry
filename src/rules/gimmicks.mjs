function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export const GIMMICK_TYPES = {
  attack: {
    staminaCostMode: "maxEndSpd",
    descriptionKey: "TG.gimmicks.attack"
  },
  defense: {
    staminaCostMode: "maxEndSpd",
    descriptionKey: "TG.gimmicks.defense"
  },
  form: {
    staminaCostMode: "maxEndSpd",
    descriptionKey: "TG.gimmicks.form"
  },
  utility: {
    staminaCostMode: "tripleMaxEndSpd",
    descriptionKey: "TG.gimmicks.utility"
  },
  dynamic: {
    staminaCostMode: "custom",
    descriptionKey: "TG.gimmicks.dynamic"
  }
};

export function calculateGimmickStaminaCost({ mode = "maxEndSpd", end = 0, spd = 0, customCost = 0, free = false } = {}) {
  if (free) return 0;
  const base = Math.max(numberOrZero(end), numberOrZero(spd));
  if (mode === "none") return 0;
  if (mode === "tripleMaxEndSpd") return base * 3;
  if (mode === "custom") return Math.max(0, numberOrZero(customCost));
  return base;
}

export function getGimmickProfile(gimmickType = "dynamic") {
  return GIMMICK_TYPES[gimmickType] ?? GIMMICK_TYPES.dynamic;
}

export function buildGimmickActivationSummary({
  gimmickType = "dynamic",
  active = false,
  staminaCostMode = null,
  stats = {},
  customCost = 0,
  free = false
} = {}) {
  const profile = getGimmickProfile(gimmickType);
  const mode = staminaCostMode ?? profile.staminaCostMode;
  return {
    gimmickType,
    active: !active,
    staminaCost: active ? 0 : calculateGimmickStaminaCost({
      mode,
      end: stats.end,
      spd: stats.spd,
      customCost,
      free
    }),
    staminaCostMode: mode
  };
}

export function calculateAttackGimmick({ rcl = 0, selectedStatValue = 0 } = {}) {
  return {
    attackBonus: numberOrZero(rcl) + numberOrZero(selectedStatValue),
    formula: "RCL + selected stat"
  };
}

export function calculateDefenseGimmick({ turnsSinceLastUse = 2, attackTotal = 0 } = {}) {
  const available = numberOrZero(turnsSinceLastUse) >= 2;
  return {
    available,
    autoPassTotal: available ? numberOrZero(attackTotal) + 1 : null,
    formula: "attacker total + 1"
  };
}

export function calculateFormGimmickBenefit({ selectedBenefit = "attack", selectedStatValue = 0, currentAttackBonus = 0, currentDamageStat = 0 } = {}) {
  if (selectedBenefit === "damage") {
    return {
      attackBonus: numberOrZero(currentAttackBonus),
      damageStat: numberOrZero(currentDamageStat) + numberOrZero(selectedStatValue),
      formula: "double selected damage stat"
    };
  }

  return {
    attackBonus: numberOrZero(currentAttackBonus) + numberOrZero(selectedStatValue),
    damageStat: numberOrZero(currentDamageStat),
    formula: "+selected stat to attack roll"
  };
}

export function getUtilityGimmickGrantedEdges(grantedEdges = []) {
  return grantedEdges.slice(0, 2);
}
