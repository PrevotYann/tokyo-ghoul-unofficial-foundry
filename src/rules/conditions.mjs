function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function calculateRegenerationAmount({ type = "normal", end = 0, crl = 0, damageWasRc = false, suppressed = false } = {}) {
  if (suppressed || type === "none") return 0;
  if (type === "highSpeed") return damageWasRc ? numberOrZero(end) : numberOrZero(end) + numberOrZero(crl);
  return damageWasRc ? 0 : numberOrZero(end);
}

export function resolveRegeneration({ injury = {}, type = "normal", end = 0, crl = 0, suppressed = false } = {}) {
  let normalDamage = numberOrZero(injury.normalDamage ?? (injury.rc ? 0 : injury.amount));
  let rcDamage = numberOrZero(injury.rcDamage ?? (injury.rc ? injury.amount : 0));
  const capacity = calculateRegenerationAmount({type,end,crl,damageWasRc:type === "highSpeed" && rcDamage>0,suppressed});
  const rcHealing = type === "highSpeed" ? Math.min(rcDamage,capacity) : 0;
  const normalHealing = Math.min(normalDamage,Math.max(0,capacity-rcHealing));
  return {healing:rcHealing+normalHealing,injury:{rcDamage:rcDamage-rcHealing,normalDamage:normalDamage-normalHealing}};
}

// Healing treats RC wounds first. Reconcile legacy/stale pools against actual missing VIT.
export function resolveHealing({ vitality = 0, maxVitality = 0, amount = 0, injury = {} } = {}) {
  const missing = Math.max(0, numberOrZero(maxVitality) - numberOrZero(vitality));
  const healing = Math.min(missing, Math.max(0, numberOrZero(amount)));
  const rcDamage = Math.min(missing, Math.max(0, numberOrZero(injury.rcDamage ?? (injury.rc ? injury.amount : 0))));
  const normalDamage = Math.min(missing - rcDamage, Math.max(0, numberOrZero(injury.normalDamage ?? (injury.rc ? 0 : injury.amount))));
  const rcHealing = Math.min(rcDamage, healing);
  return {healing, vitality: numberOrZero(vitality) + healing, injury: {
    rcDamage: rcDamage - rcHealing,
    normalDamage: Math.max(0, normalDamage - (healing - rcHealing))
  }};
}

export function removeBleedingStacksByRegeneration(stacks = 0, regenerationType = "normal") {
  const removal = regenerationType === "highSpeed" ? 2 : regenerationType === "normal" ? 1 : 0;
  return Math.max(0, numberOrZero(stacks) - removal);
}

export function resolveBleedingStartTurn({ stacks = 0, regenerationType = "none" } = {}) {
  const remainingStacks = removeBleedingStacksByRegeneration(stacks, regenerationType);
  return {
    remainingStacks,
    vitalityDamage: remainingStacks
  };
}

export function resolveBurningStartTurn({ stacks = 0, endRollTotal = 0, detailed = true, targetNumber = 15 } = {}) {
  const currentStacks = Math.max(0, numberOrZero(stacks));
  const modifiedRoll = numberOrZero(endRollTotal) - (detailed ? currentStacks : 0);
  if (modifiedRoll >= numberOrZero(targetNumber)) {
    return {
      cleared: true,
      stacks: 0,
      vitalityDamage: 0,
      modifiedRoll
    };
  }

  return {
    cleared: false,
    stacks: currentStacks + 1,
    vitalityDamage: currentStacks * 3,
    modifiedRoll
  };
}

export function canActWhileGrappled(action) {
  return ["breather", "breakGrapple", "takeHit"].includes(action);
}

export function resolveGrappleBreak({ grapplerTotal = 0, targetTotal = 0 } = {}) {
  return {
    broken: numberOrZero(targetTotal) > numberOrZero(grapplerTotal),
    margin: numberOrZero(targetTotal) - numberOrZero(grapplerTotal)
  };
}

export function resolveConditionStartTurn({ conditionId = "", stacks = 1, regenerationType = "none", endRollTotal = null } = {}) {
  if (conditionId === "bleeding") {
    const result = resolveBleedingStartTurn({ stacks, regenerationType });
    return {
      conditionId,
      stacks: result.remainingStacks,
      vitalityDamage: result.vitalityDamage,
      remove: result.remainingStacks <= 0
    };
  }

  if (conditionId === "burning") {
    if (endRollTotal === null || endRollTotal === undefined) {
      return {
        conditionId,
        stacks: numberOrZero(stacks),
        vitalityDamage: 0,
        remove: false,
        requiresRoll: "end"
      };
    }

    const result = resolveBurningStartTurn({ stacks, endRollTotal });
    return {
      conditionId,
      stacks: result.stacks,
      vitalityDamage: result.vitalityDamage,
      remove: result.cleared,
      modifiedRoll: result.modifiedRoll
    };
  }

  return {
    conditionId,
    stacks: numberOrZero(stacks),
    vitalityDamage: 0,
    remove: false
  };
}
