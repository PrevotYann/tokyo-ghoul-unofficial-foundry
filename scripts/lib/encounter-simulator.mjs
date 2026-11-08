// Monte-Carlo Squad combat simulator for adventure balance testing.
// It reuses the system's rule functions so results track the real automation:
// attack formulas, harsh Dodge/Block, counter tiers, type and anti-Ghoul bonuses,
// regeneration pools, Hunger/Rage thresholds, medkits and breathers.
import { rollD20Check } from "../../src/rules/rolls.mjs";
import { calculateAttackFormula, resolveDefense } from "../../src/rules/damage.mjs";
import { compareSquadInitiative, getManeuverBudgetForMode } from "../../src/rules/combat-workflow.mjs";
import { counterDamage } from "../../src/rules/actions.mjs";
import { getTypeAdvantageBonus, getAntiGhoulQuinqueBonus } from "../../src/rules/kagune-quinque.mjs";
import { calculateDerivedResources } from "../../src/rules/derived-stats.mjs";
import { calculateEdgeCombatModifiers } from "../../src/rules/edges.mjs";
import { resolveRegeneration, resolveBleedingStartTurn } from "../../src/rules/conditions.mjs";
import { calculateMedkitUse } from "../../src/rules/consumables.mjs";
import { getCrossedResourceThresholds, resolveHungerFailure, resolveRageFailure, calculateRageTargetNumber } from "../../src/rules/hunger-rage.mjs";
import { resolveHealing } from "../../src/rules/conditions.mjs";

const REACH_FT = { melee: 5, close: 15, mid: 30, long: 45, far: 60, infinite: Infinity };
const MOVE_FT = 15;

export function createRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const d20 = rng => Math.floor(rng() * 20) + 1;
async function check(rng, statValue, bonus = 0, penalty = 0, extra = {}) {
  return rollD20Check({ statValue, bonus, penalty, dieResults: [d20(rng), d20(rng)], ...extra });
}

/** Build a combatant snapshot from an Actor source object (adventure or world export). */
export function buildCombatant(actor, { side, key = actor.flags?.["tokyo-ghoul-unofficial"]?.key ?? actor.name, overrides = {} } = {}) {
  const cls = actor.system.identity.class;
  const kagune = actor.items.find(i => i.type === "kagune");
  const quinque = actor.items.find(i => i.type === "quinque");
  const kaguneType = cls !== "investigator" ? kagune?.system.primaryType ?? null : null;
  const stats = structuredClone(actor.system.stats);
  if (kaguneType === "bikaku" && ["crl", "per"].includes(kagune.system.evolution?.bikakuPenalty ?? "crl")) stats[kagune.system.evolution?.bikakuPenalty ?? "crl"].edge -= 2;
  const derived = calculateDerivedResources({ stats, kaguneType });
  const edges = [...new Set([...(kagune?.system.edges ?? []), ...(quinque?.system.edges ?? [])])];
  const modifiers = calculateEdgeCombatModifiers(edges, { actorClass: cls, kaguneType, end: derived.statTotals.end, spd: derived.statTotals.spd });
  const weapons = [kagune, quinque].filter(Boolean).map(item => ({
    source: item.type === "kagune" ? "kagune" : "quinque", type: item.system.primaryType, rcl: item.system.rcl,
    melee: REACH_FT[item.system.range?.melee ?? "melee"], ranged: item.system.range?.projectile ? REACH_FT[item.system.range.projectile] : 0,
    bonds: item.type === "quinque" ? item.system.rcBonds?.value ?? item.system.rcl : null
  }));
  const medkits = actor.items.filter(i => i.type === "consumable" && i.system.consumableType === "medkit").reduce((n, i) => n + (i.system.quantity ?? 1), 0);
  const vitality = actor.system.resources?.vitality ?? {};
  const stamina = actor.system.resources?.stamina ?? {};
  return {
    key, name: actor.name, side, cls, stats: derived.statTotals, kaguneType, edges, weapons,
    vitMax: derived.vitalityMax, staminaMax: derived.staminaMax,
    // A combatant stored at full resources stays full when temporary stats raise its maxima.
    vit: vitality.value === undefined || vitality.value >= vitality.max ? derived.vitalityMax : Math.min(vitality.value, derived.vitalityMax),
    stamina: stamina.value === undefined || stamina.value >= stamina.max ? derived.staminaMax : Math.min(stamina.value, derived.staminaMax),
    mods: modifiers, sharpened: edges.map(e => String(e).toLowerCase()).includes("sharpened"), bleeding: 0,
    regenerationType: modifiers.regenerationType, healer: edges.map(e => String(e).toLowerCase()).includes("healer"), medkits,
    yieldAt: actor.system.combat?.yieldAt ?? null, injury: { normalDamage: 0, rcDamage: 0 },
    rage: { active: false, per: 0, damage: 0 }, hunger: { active: false, turns: 0 }, checked: { hunger: [], rage: [] },
    acted: false, reactions: 0, maneuvers: 0, breathed: false, out: false, outcome: null, turnsTaken: 0, ...overrides
  };
}

const active = c => !c.out && c.vit > 0;
const foesOf = (c, all) => all.filter(o => o.side !== c.side && active(o));
const alliesOf = (c, all) => all.filter(o => o.side === c.side && !o.out);

function bestAttack(c, distance) {
  const options = [];
  for (const weapon of c.weapons) {
    if (weapon.bonds !== null && weapon.bonds <= 0) continue;
    for (const mode of ["melee", "ranged"]) {
      const reach = mode === "melee" ? weapon.melee : weapon.ranged;
      if (!reach) continue;
      const stat = mode === "ranged" ? "acc" : "str";
      const formula = calculateAttackFormula({ mode, source: weapon.source, str: c.stats.str + (stat === "str" ? c.rage.damage : 0), acc: c.stats.acc + (stat === "acc" ? c.rage.damage : 0), rcl: weapon.rcl });
      options.push({ weapon, mode, reach, ...formula, damage: formula.damage + c.mods.damageBonus, inReach: reach >= distance });
    }
  }
  if (!options.length) options.push({ weapon: { source: "basic", type: null, melee: 5, ranged: 0 }, mode: "melee", reach: 5, ...calculateAttackFormula({ source: "basic", str: c.stats.str }), inReach: distance <= 5 });
  options.sort((a, b) => (b.inReach - a.inReach) || (b.damage - a.damage) || (a.staminaCost - b.staminaCost));
  return options[0];
}

function defenseWeaponType(c) {
  const weapon = c.weapons.find(w => w.bonds === null || w.bonds > 0);
  return weapon ? { source: weapon.source, type: weapon.type } : { source: null, type: null };
}

function successChance(defMod, atkMod) {
  // P(d20 + def > d20 + atk), ignoring the rare crit/fumble swings.
  let wins = 0;
  for (let a = 1; a <= 20; a++) for (let d = 1; d <= 20; d++) if (d + defMod > a + atkMod) wins++;
  return wins / 400;
}

async function spendStamina(c, amount, log, rng) {
  const cost = Math.max(0, amount);
  const previous = c.stamina;
  const spent = Math.min(c.stamina, cost);
  c.stamina -= spent;
  if (cost - spent > 0) await applyDamage(c, cost - spent, { rc: false, log, rng });
  if (["ghoul", "quinx"].includes(c.cls)) await thresholdCheck(c, "hunger", previous, c.stamina, c.staminaMax, log, rng);
}

async function thresholdCheck(c, kind, previous, current, max, log, rng) {
  const crossed = getCrossedResourceThresholds({ previousValue: previous, currentValue: current, maxValue: max, alreadyChecked: c.checked[kind] });
  for (const threshold of crossed) {
    c.checked[kind].push(threshold.key);
    if (kind === "hunger" && !c.hunger.active) {
      const roll = await check(rng, c.stats.crl, 0, 0, { targetNumber: c.staminaMax - c.stamina });
      if (!roll.success) {
        const failure = resolveHungerFailure({ vitality: { value: c.vit } });
        c.hunger.active = true;
        log.push(`${c.key} fails Hunger (${roll.total} vs ${c.staminaMax - c.stamina})`);
        await applyDamage(c, failure.vitalityDamage, { rc: false, log, rng, skipChecks: true });
      }
    }
    if (kind === "rage" && !c.rage.active && c.vit > 0) {
      const roll = await check(rng, c.stats.crl, 0, 0, { targetNumber: calculateRageTargetNumber({ max: c.vitMax, value: c.vit }) });
      if (!roll.success) {
        const failure = resolveRageFailure({});
        // Players usually split the +10 temporary budget between PER and their damage stat.
        c.rage = { active: true, per: failure.tempStatBudget / 2, damage: failure.tempStatBudget / 2, perAction: failure.perActionStaminaCost };
        log.push(`${c.key} enters Rage`);
        await spendStamina(c, failure.initialStaminaLoss, log, rng);
      }
    }
  }
}

async function applyDamage(c, amount, { rc, log, rng, skipChecks = false }) {
  if (amount <= 0 || c.vit <= 0) return;
  const previous = c.vit;
  const dealt = Math.min(previous, amount);
  c.vit -= dealt;
  c.injury[rc ? "rcDamage" : "normalDamage"] += dealt;
  if (c.vit <= 0) { c.out = true; c.outcome = "down"; log.push(`${c.key} is down`); return; }
  if (c.yieldAt !== null && previous > c.yieldAt && c.vit <= c.yieldAt) { c.out = true; c.outcome = "yield"; log.push(`${c.key} yields at ${c.vit}`); return; }
  if (!skipChecks && ["investigator", "quinx"].includes(c.cls)) await thresholdCheck(c, "rage", previous, c.vit, c.vitMax, log, rng);
}

function chooseDefense(defender, attacker, attack, atkMod) {
  if (!defender.acted || defender.reactions < 1 || !active(defender)) return "takeHit";
  const own = defenseWeaponType(defender);
  const typeBonus = getTypeAdvantageBonus({ attackerSource: own.source, attackerType: own.type, defenderType: attack.weapon.type });
  const antiGhoul = getAntiGhoulQuinqueBonus({ attackerClass: defender.cls, defenderClass: attacker.cls, source: own.source });
  const choices = { takeHit: attack.damage };
  for (const [defense, stat] of [["dodge", "spd"], ["block", "end"]]) {
    const p = successChance(defender.stats[stat] + typeBonus + antiGhoul + defender.mods[`${defense}Bonus`], atkMod);
    const failLoss = defense === "dodge" ? attack.damage + Math.floor(attack.damage / 2) * 0.5 : attack.damage * 1.5;
    choices[defense] = (1 - p) * failLoss - p * attack.damage * 0.3; // a successful defense can counter
  }
  return Object.entries(choices).sort((a, b) => a[1] - b[1])[0][0];
}

async function strike(attacker, defender, state, { multiplier = 1, automatic = false, isCounter = false } = {}) {
  const { rng, log } = state;
  const attack = bestAttack(attacker, state.distance);
  if (!attack.inReach) return;
  const damage = counterDamage(attack.damage, multiplier);
  const target = defenseWeaponType(defender);
  const typeBonus = getTypeAdvantageBonus({ attackerSource: attack.weapon.source, attackerType: attack.weapon.type, defenderType: target.type });
  const antiGhoul = getAntiGhoulQuinqueBonus({ attackerClass: attacker.cls, defenderClass: defender.cls, source: attack.weapon.source });
  const atkMod = attacker.stats.per + attacker.rage.per + typeBonus + antiGhoul;
  const roll = await check(rng, attacker.stats.per + attacker.rage.per, typeBonus + antiGhoul);
  await spendStamina(attacker, attack.staminaCost, log, rng);
  if (!active(attacker) && !isCounter) return;
  const defense = automatic ? "takeHit" : chooseDefense(defender, attacker, { ...attack, damage }, atkMod);
  let defenseRoll = null;
  if (defense !== "takeHit") {
    defender.reactions -= 1;
    const own = defenseWeaponType(defender);
    const dTypeBonus = getTypeAdvantageBonus({ attackerSource: own.source, attackerType: own.type, defenderType: attack.weapon.type });
    const dAnti = getAntiGhoulQuinqueBonus({ attackerClass: defender.cls, defenderClass: attacker.cls, source: own.source });
    defenseRoll = await check(rng, defender.stats[defense === "dodge" ? "spd" : "end"], dTypeBonus + dAnti + defender.mods[`${defense}Bonus`]);
  }
  const resolution = resolveDefense({ defense, defenseTotal: defenseRoll?.total ?? 0, attackTotal: roll.total, damage, harshConsequences: true });
  state.stats.attacks++;
  if (!resolution.success) state.stats.hits++;
  log.push(`${attacker.key}${isCounter ? " counter" : ""} → ${defender.key}: ${roll.total} vs ${defense}${defenseRoll ? ` ${defenseRoll.total}` : ""} → ${resolution.success ? "miss" : `${resolution.vitalityDamage} dmg`}`);
  await applyDamage(defender, resolution.vitalityDamage, { rc: attack.weapon.source !== "basic", log, rng });
  if (resolution.staminaDamage && active(defender)) await spendStamina(defender, resolution.staminaDamage, log, rng);
  if (!resolution.success && attacker.sharpened && attack.weapon.source !== "basic" && active(defender)) defender.bleeding += 1;
  if (resolution.success && !isCounter && resolution.counter.damageMultiplier > 0 && active(defender) && active(attacker)) {
    await strike(defender, attacker, state, { multiplier: resolution.counter.damageMultiplier, automatic: resolution.counter.automatic, isCounter: true });
  }
}

function pickTarget(c, state) {
  // GM guideline: NPCs never open on a PC who has not acted yet (no ambush alpha strikes).
  const foes = foesOf(c, state.combatants).filter(f => !(c.side === "enemy" && state.spareUnacted && !f.acted));
  if (!foes.length) return null;
  const policy = c.side === "pc" ? state.pcTargeting : state.enemyTargeting;
  // "smart" players bait reactions: hit foes that have no reaction left, then the most wounded.
  if (policy === "smart") return foes.sort((a, b) => (a.reactions > 0) - (b.reactions > 0) || a.vit - b.vit)[0];
  if (policy === "focus") return foes.sort((a, b) => a.vit - b.vit)[0];
  if (policy === "tank") return foes.sort((a, b) => b.vit - a.vit)[0];
  return foes[Math.floor(state.rng() * foes.length)];
}

async function maneuver(c, state, action) {
  if (c.rage.active && action !== "breather") await spendStamina(c, c.rage.perAction, state.log, state.rng);
  c.maneuvers -= 1;
}

async function takeTurn(c, state) {
  const { rng, log } = state;
  c.acted = true;
  c.turnsTaken++;
  c.maneuvers = getManeuverBudgetForMode("squad");
  c.reactions = 0;
  const regeneration = resolveRegeneration({ injury: c.injury, type: c.regenerationType, end: c.stats.end, crl: c.stats.crl, suppressed: c.hunger.active });
  if (regeneration.healing) { c.vit = Math.min(c.vitMax, c.vit + regeneration.healing); c.injury = regeneration.injury; }
  if (c.bleeding) {
    const bleed = resolveBleedingStartTurn({ stacks: c.bleeding, regenerationType: c.hunger.active ? "none" : c.regenerationType });
    c.bleeding = bleed.remainingStacks;
    await applyDamage(c, bleed.vitalityDamage, { rc: false, log, rng, skipChecks: true });
    if (!active(c)) return;
  }
  if (c.hunger.active && !c.breathed) { c.hunger.turns++; await applyDamage(c, 1, { rc: false, log, rng, skipChecks: true }); if (!active(c)) return; }
  c.breathed = false;
  if (c.fleeAfterTurns && c.turnsTaken > c.fleeAfterTurns) { c.out = true; c.outcome = "fled"; log.push(`${c.key} flees`); return; }

  const attack = bestAttack(c, state.distance);
  // Breathe when the next attack would cost Vitality or Stamina is nearly gone.
  if (c.stamina < Math.max(attack.staminaCost * 2, c.staminaMax * 0.15) && c.stamina < c.staminaMax - c.stats.end / 2) {
    await maneuver(c, state, "breather");
    c.stamina = Math.min(c.staminaMax, c.stamina + c.stats.end * c.mods.breatherMultiplier);
    c.rage = { active: false, per: 0, damage: 0 };
    c.breathed = true;
    c.reactions += 1; c.maneuvers -= 1;
    log.push(`${c.key} takes a breather`);
    return;
  }
  // Medic first: patch the most hurt standing ally below 50% Vitality.
  if (c.healer && c.medkits > 0) {
    const patient = alliesOf(c, state.combatants).filter(a => a.vit > 0 && a.vit <= a.vitMax * 0.5).sort((a, b) => a.vit / a.vitMax - b.vit / b.vitMax)[0];
    if (patient) {
      await maneuver(c, state, "medkit");
      const amount = calculateMedkitUse({ per: c.stats.per, targetEnd: patient.stats.end }).healing;
      const healing = resolveHealing({ vitality: patient.vit, maxVitality: patient.vitMax, amount, injury: patient.injury });
      patient.vit = healing.vitality; patient.injury = healing.injury; patient.bleeding = 0; c.medkits--;
      state.stats.healing += healing.healing;
      log.push(`${c.key} medkits ${patient.key} +${healing.healing}`);
    }
  }
  while (c.maneuvers > 0 && active(c)) {
    const current = bestAttack(c, state.distance);
    if (!current.inReach) {
      // Close once per turn; if still out of reach, keep the other maneuver as a reaction.
      if (c.movedThisTurn) break;
      await maneuver(c, state, "move");
      c.movedThisTurn = true;
      state.distance = Math.max(5, state.distance - MOVE_FT);
      continue;
    }
    const policy = c.side === "pc" ? state.pcPolicy : state.enemyPolicy;
    const wantsReaction = policy === "balanced" ? c.maneuvers === 1 && c.reactions === 0 && c.maneuversUsedOnAttack : false;
    if (wantsReaction) { c.maneuvers -= 1; c.reactions += 1; break; }
    const target = pickTarget(c, state);
    if (!target) break;
    await maneuver(c, state, "strike");
    c.maneuversUsedOnAttack = true;
    await strike(c, target, state);
    if (!foesOf(c, state.combatants).length) return;
  }
  // Leftover maneuvers after moving become a reserved reaction.
  if (c.maneuvers > 0) { c.reactions += c.maneuvers; c.maneuvers = 0; }
  c.maneuversUsedOnAttack = false;
  c.movedThisTurn = false;
}

/**
 * Run one Squad encounter. `waves` adds reinforcements at the start of a round.
 * Returns the winning side, rounds, and end-of-fight snapshots.
 */
export async function runEncounter({ pcs, enemies, reinforcements = [], distance = 30, rng, pcPolicy = "balanced", enemyPolicy = "balanced", pcTargeting = "smart", enemyTargeting = "random", spareUnacted = true, maxRounds = 15, keepLog = false }) {
  const state = { combatants: [...pcs, ...enemies], distance, rng, pcPolicy, enemyPolicy, pcTargeting, enemyTargeting, spareUnacted, log: [], stats: { attacks: 0, hits: 0, healing: 0 } };
  for (const c of state.combatants) Object.assign(c, { acted: false, reactions: 0, turnsTaken: 0, checked: { hunger: [], rage: [] } });
  let round = 0, winner = null;
  while (!winner && round < maxRounds) {
    round++;
    for (const wave of reinforcements.filter(w => w.round === round)) for (const c of wave.combatants) state.combatants.push(c);
    const asActor = c => ({ system: { stats: { spd: { total: c.stats.spd } }, identity: { class: c.cls } } });
    const order = state.combatants.filter(active).sort((a, b) => compareSquadInitiative(asActor(a), asActor(b)));
    state.log.push(`— Round ${round} —`);
    for (const c of order) {
      if (!active(c)) continue;
      await takeTurn(c, state);
      const pcsUp = state.combatants.some(x => x.side === "pc" && active(x));
      const enemiesUp = state.combatants.some(x => x.side === "enemy" && active(x));
      if (!enemiesUp) { winner = "pc"; break; }
      if (!pcsUp) { winner = "enemy"; break; }
    }
  }
  return { winner: winner ?? "timeout", rounds: round, combatants: state.combatants, log: keepLog ? state.log : [], stats: state.stats };
}

/** Out-of-combat first aid: a Healer spends medkits on the most wounded allies below `threshold`. */
export function fieldMedicine(party, { threshold = 0.6 } = {}) {
  let healed = 0;
  for (const medic of party.filter(c => c.healer && c.vit > 0)) {
    for (;;) {
      const patient = party.filter(a => a.vit > 0 && a.vit < a.vitMax * threshold).sort((a, b) => a.vit / a.vitMax - b.vit / b.vitMax)[0];
      if (!patient || medic.medkits < 1) break;
      const amount = calculateMedkitUse({ per: medic.stats.per, targetEnd: patient.stats.end }).healing;
      const healing = resolveHealing({ vitality: patient.vit, maxVitality: patient.vitMax, amount, injury: patient.injury });
      patient.vit = healing.vitality; patient.injury = healing.injury; medic.medkits--; healed += healing.healing;
    }
  }
  return healed;
}

/** Out-of-combat recovery between scenes: one breather, Rage ends, Hunger resets with a full Meal Score. */
export function recoverBetweenScenes(c) {
  c.stamina = Math.min(c.staminaMax, c.stamina + c.stats.end);
  c.rage = { active: false, per: 0, damage: 0 };
  c.hunger = { active: false, turns: 0 };
  c.bleeding = 0;
  c.out = c.vit <= 0;
  c.outcome = c.out ? "down" : null;
  return c;
}

export function summarize(results) {
  const n = results.length;
  const pct = x => Math.round((x / n) * 1000) / 10;
  return {
    runs: n,
    pcWinPct: pct(results.filter(r => r.winner === "pc").length),
    enemyWinPct: pct(results.filter(r => r.winner === "enemy").length),
    timeoutPct: pct(results.filter(r => r.winner === "timeout").length),
    avgRounds: Math.round(results.reduce((s, r) => s + r.rounds, 0) / n * 10) / 10,
    avgPcsDown: Math.round(results.reduce((s, r) => s + r.combatants.filter(c => c.side === "pc" && c.vit <= 0).length, 0) / n * 100) / 100,
    anyPcDownPct: pct(results.filter(r => r.combatants.some(c => c.side === "pc" && c.vit <= 0)).length),
    avgPartyVitPct: Math.round(results.reduce((s, r) => { const p = r.combatants.filter(c => c.side === "pc"); return s + p.reduce((a, c) => a + Math.max(0, c.vit), 0) / p.reduce((a, c) => a + c.vitMax, 0); }, 0) / n * 1000) / 10
  };
}
