import { calculateAttackFormula } from "./damage.mjs";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function getManeuverBudgetForMode(mode = "squad") {
  return mode === "raid" ? 3 : 2;
}

export function getCombatModeRules(mode = "squad") {
  if (mode === "raid") {
    return {
      mode,
      maneuvers: 3,
      damageMultiplier: 3,
      staminaCostMultiplier: 0.5,
      grantsDefeatFollowUpAttack: true
    };
  }

  return {
    mode: "squad",
    maneuvers: 2,
    damageMultiplier: 1,
    staminaCostMultiplier: 1,
    grantsDefeatFollowUpAttack: false
  };
}

export function applyCombatModeToAttack(attack, mode = "squad") {
  const rules = getCombatModeRules(mode);
  const staminaCost = attack.staminaCost === 0
    ? 0
    : Math.max(1, Math.ceil(numberOrZero(attack.staminaCost) * rules.staminaCostMultiplier));

  return {
    ...attack,
    baseDamage: attack.damage,
    baseStaminaCost: attack.staminaCost,
    damage: Math.ceil(numberOrZero(attack.damage) * rules.damageMultiplier),
    staminaCost,
    modeRules: rules
  };
}

export function getAttackSourceFromItem(item) {
  if (!item) return "basic";
  if (item.type === "kagune") return "kagune";
  if (item.type === "quinque" || item.type === "kakuja-armor") return "quinque";
  return "basic";
}

export function buildAttackSummary({ stats = {}, item = null, attackMode = "melee", combatMode = "squad", sidearm = false } = {}) {
  const source = getAttackSourceFromItem(item);
  const raw = calculateAttackFormula({
    mode: attackMode,
    source,
    str: stats.str,
    acc: stats.acc,
    rcl: item?.system?.rcl ?? 0,
    sidearm
  });

  return {
    source,
    attackMode,
    itemName: item?.name ?? null,
    ...applyCombatModeToAttack(raw, combatMode)
  };
}

export function canReserveReaction({ maneuversRemaining = 0, reactionsReserved = 0 } = {}) {
  return numberOrZero(maneuversRemaining) > numberOrZero(reactionsReserved);
}

export function reserveReaction({ maneuversRemaining = 0, reactionsReserved = 0 } = {}) {
  if (!canReserveReaction({ maneuversRemaining, reactionsReserved })) {
    return { maneuversRemaining: numberOrZero(maneuversRemaining), reactionsReserved: numberOrZero(reactionsReserved), reserved: false };
  }

  return {
    maneuversRemaining: numberOrZero(maneuversRemaining) - 1,
    reactionsReserved: numberOrZero(reactionsReserved) + 1,
    reserved: true
  };
}

export function consumeReaction({ reactionsReserved = 0 } = {}) {
  const current = numberOrZero(reactionsReserved);
  return {
    reactionsReserved: Math.max(0, current - 1),
    consumed: current > 0
  };
}

export function getSquadInitiativeSortValue(combatant = {}) {
  const actor = combatant.actor ?? combatant;
  const spd = Number(actor.system?.stats?.spd?.total ?? actor.system?.stats?.spd?.base ?? 0);
  const actorClass = actor.system?.identity?.class;
  const classTieBreaker = actorClass === "ghoul" ? 2 : actorClass === "quinx" ? 1 : 0;
  return { spd, classTieBreaker };
}

export function compareSquadInitiative(left, right) {
  const a = getSquadInitiativeSortValue(left);
  const b = getSquadInitiativeSortValue(right);
  if (a.spd !== b.spd) return b.spd - a.spd;
  return b.classTieBreaker - a.classTieBreaker;
}
