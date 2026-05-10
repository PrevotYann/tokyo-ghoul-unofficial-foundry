export const TYPE_ADVANTAGE = {
  ukaku: "bikaku",
  bikaku: "rinkaku",
  rinkaku: "koukaku",
  koukaku: "ukaku"
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function hasTypeAdvantage(attackerType, defenderType) {
  return TYPE_ADVANTAGE[attackerType] === defenderType;
}

export function getTypeAdvantageBonus({ attackerSource = "kagune", attackerType = null, defenderType = null, naturalPredator = false } = {}) {
  if (!hasTypeAdvantage(attackerType, defenderType)) return 0;
  if (attackerSource === "quinque") return naturalPredator ? 4 : 2;
  return 3;
}

export function getAntiGhoulQuinqueBonus({ attackerClass = null, defenderClass = null, source = null } = {}) {
  return source === "quinque" && attackerClass !== "ghoul" && defenderClass === "ghoul" ? 3 : 0;
}

export function calculateRcBondDamage({ currentRcBonds = 0, incomingDamage = 0 } = {}) {
  const current = numberOrZero(currentRcBonds);
  const incoming = numberOrZero(incomingDamage);
  const rcBondDamage = Math.min(current, incoming);
  return {
    rcBondDamage,
    remainingRcBonds: Math.max(0, current - incoming),
    broken: current - incoming <= 0
  };
}

export function resolveQuinqueInterposeBlock({ currentRcBonds = 0, incomingDamage = 0 } = {}) {
  const bondResult = calculateRcBondDamage({ currentRcBonds, incomingDamage });
  return {
    ...bondResult,
    vitalityDamage: Math.floor(numberOrZero(incomingDamage) / 2),
    blockSucceeded: true
  };
}
