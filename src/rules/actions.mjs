import { applyCombatModeToAttack } from "./combat-workflow.mjs";
import { calculateAttackGimmick } from "./gimmicks.mjs";

export function planManeuver({ action, remaining = 2, breather = false, counter = false, grappled = false, grappling = false, edges = [], str = 0, spd = 0, per = 0, investigator = false } = {}) {
  const cost = action === "allOut" ? 2 : 1;
  if (remaining < cost) return { allowed: false, reason: "TG.notifications.noManeuvers" };
  if (counter || (grappling && action !== "throw")) return { allowed: false, reason: "TG.notifications.stanceLocked" };
  if (grappled && !["breather", "breakGrapple"].includes(action)) return { allowed: false, reason: "TG.notifications.grappleRestricted" };
  if (breather && !["move", "ready", "enhance", "reserveReaction", "breather"].includes(action)) return { allowed: false, reason: "TG.notifications.breatherRestricted" };
  const required = { heavyStrike: "heavy-strikes", grab: "grappler", throw: "grappler" }[action];
  if (required && !edges.includes(required)) return { allowed: false, reason: "TG.notifications.requiredEdge" };
  const stamina = action === "counter" ? Math.max(0, spd * 3 - per)
    : action === "overextend" ? spd
      : action === "heavyStrike" ? str * (investigator ? 1 : 2)
        : action === "throw" ? str * 2 : 0;
  return { allowed: true, cost, remaining: remaining - cost, stamina };
}

export function modifyAttack(attack, { action = "strike", str = 0, heavyDamageStat = str, damageStatBonus = 0, spd = 0, end = 0, edges = [], mode = "squad", armor = false, gimmick = null, rcl = 0, stat = 0, per = 0, allOut = false } = {}) {
  const raw = { ...attack, damage: attack.baseDamage ?? attack.damage, staminaCost: attack.baseStaminaCost ?? attack.staminaCost };
  let bonus = 0, penalty = 0;
  raw.damage = gimmick?.gimmickType === "attack" ? calculateAttackGimmick({rcl,selectedStatValue:stat}).damage : raw.damage + damageStatBonus;
  if (edges.includes("blunt") && attack.source !== "basic") raw.damage += Math.floor(end / 2);
  if (allOut && edges.includes("quick-strikes")) raw.damage += spd;
  if (action === "heavyStrike") { raw.damage += heavyDamageStat; penalty += str; raw.staminaCost = 0; }
  if (action === "overextend") { penalty += spd; raw.staminaCost = 0; }
  if (gimmick?.gimmickType === "form") {
    if (gimmick.selectedBenefit === "damage") raw.damage += gimmick.selectedStat === "rcl" ? rcl : stat;
    else bonus += per;
  }
  if (armor) raw.staminaCost = 0;
  return { ...applyCombatModeToAttack(raw, mode), bonus, penalty };
}

export function distanceToRangeBand(distance) {
  if (!Number.isFinite(distance) || distance < 0) return null;
  return distance <= 5 ? "melee" : distance <= 15 ? "close" : distance <= 30 ? "mid" : distance <= 45 ? "long" : "far";
}

export function counterDamage(damage, multiplier) {
  return multiplier > 1 ? Math.ceil(damage * multiplier) : Math.floor(damage * multiplier);
}

export function getThrowDistance({ str = 0, weaponRcl = 0 } = {}) {
  return Math.max(0, Math.floor((str + weaponRcl) / 2));
}
