function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function calculateMedkitUse({ per = 0, targetEnd = 0 } = {}) {
  return {
    healing: numberOrZero(per) + numberOrZero(targetEnd),
    removes: ["bleeding", "burning"]
  };
}

export function getGrenadeProfile(type, { acc = 0 } = {}) {
  if (type === "fragGrenade") {
    return {
      type,
      range: "mid",
      area: "closeRadius",
      dodgeTargetNumber: 15,
      blockTargetNumber: 16,
      blockRestriction: "koukakuOnly",
      damage: numberOrZero(acc) * 3,
      applies: []
    };
  }

  if (type === "incendiaryGrenade") {
    return {
      type,
      range: "mid",
      area: "closeRadius",
      dodgeTargetNumber: 14,
      blockTargetNumber: null,
      blockRestriction: "cannotBlock",
      damage: 0,
      applies: ["burning"]
    };
  }

  if (type === "rcLimiterGrenade") {
    return {
      type,
      range: "mid",
      area: "closeRadius",
      durationTurns: 3,
      lingerTurnsAfterLeaving: 1,
      suppresses: ["kagune", "kakuja", "regeneration"],
      attackPenaltyMode: "attackerAcc"
    };
  }

  return null;
}

export function calculateQBulletAttack({ acc = 0, ammo = 0 } = {}) {
  return {
    canFire: numberOrZero(ammo) > 0,
    damage: numberOrZero(acc),
    rclDamage: 0,
    ammoAfterShot: Math.max(0, numberOrZero(ammo) - 1)
  };
}
