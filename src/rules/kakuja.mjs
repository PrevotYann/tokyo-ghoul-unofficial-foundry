function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasEdge(edges = [], edgeName) {
  return edges.some((edge) => edge === edgeName || edge?.name === edgeName);
}

export function canFullKakuja(actor) {
  return actor?.system?.identity?.class !== "quinx";
}

export function getKakujaEligibility({ actorClass = "ghoul", rcl = 0, edges = [], masteredHalf = false } = {}) {
  const cannibalistic = hasEdge(edges, "Cannibalistic");
  const canHalf = (actorClass === "ghoul" || actorClass === "quinx") && cannibalistic && numberOrZero(rcl) >= 50;
  const canFull = actorClass === "ghoul" && cannibalistic && masteredHalf && numberOrZero(rcl) >= 150;

  return { canHalf, canFull };
}

export function getKakujaBonusOptions(kaguneType = "ukaku", stage = "half") {
  const multiplier = stage === "full" ? 2 : 1;
  const statValue = 20 * multiplier;
  const rclValue = 10 * multiplier;
  const map = {
    ukaku: [{ stat: "spd", value: statValue }, { stat: "acc", value: statValue }],
    koukaku: [{ stat: "end", value: statValue }, { stat: "str", value: statValue }],
    rinkaku: [{ stat: "rcl", value: rclValue }, { stat: "spd", value: statValue }],
    bikaku: [{ stat: "str", value: statValue }, { stat: "rcl", value: rclValue }]
  };

  return map[kaguneType] ?? [];
}

export function calculateKakujaUpkeep({ stage = "half", rcl = 0, mastered = false } = {}) {
  const value = numberOrZero(rcl);
  if (stage === "none") return 0;
  if (stage === "half") return mastered ? 0 : value;
  if (stage === "full") return mastered ? Math.floor(value / 2) : value * 2;
  return 0;
}

export function getMasteryRequirement({ context = "combat" } = {}) {
  return context === "combat" ? 10 : 20;
}

export function advanceKakujaMastery({ currentSuccesses = 0, success = false, context = "combat" } = {}) {
  if (!success) return { successes: 0, mastered: false, lostControl: true };
  const successes = numberOrZero(currentSuccesses) + 1;
  return {
    successes,
    mastered: successes >= getMasteryRequirement({ context }),
    lostControl: false
  };
}

export function calculateKakujaWeaponEdgeSlots(baseSlots = 0) {
  return Math.max(0, numberOrZero(baseSlots)) * 2;
}

export function calculateKakujaArmorDamageReduction({ incomingDamage = 0, armorRcl = 0 } = {}) {
  return Math.max(0, numberOrZero(incomingDamage) - numberOrZero(armorRcl));
}

export function calculateKakujaArmorParasiticDamage({ armorRcl = 0, weaponRcl = 0, turnsActive = 0 } = {}) {
  if (numberOrZero(turnsActive) <= 5) return 0;
  return Math.floor(numberOrZero(armorRcl) / 2) + Math.floor(numberOrZero(weaponRcl) / 2);
}

export function getKakujaArmorTypeEffect({ armorType = "attack", selectedAttackStat = "str" } = {}) {
  if (armorType === "speed") {
    return {
      statMultipliers: { spd: 2 },
      extraManeuvers: 1,
      removesDamageManeuverCosts: false
    };
  }

  if (armorType === "attack") {
    return {
      statMultipliers: { [selectedAttackStat === "acc" ? "acc" : "str"]: 2 },
      extraManeuvers: 0,
      removesDamageManeuverCosts: true
    };
  }

  return {
    statMultipliers: {},
    extraManeuvers: 0,
    removesDamageManeuverCosts: false
  };
}

export function calculateQuinxKaguneCostUnderArmor({ baseCost = 0, actorClass = "quinx", armorActive = false } = {}) {
  return actorClass === "quinx" && armorActive ? numberOrZero(baseCost) * 2 : numberOrZero(baseCost);
}
