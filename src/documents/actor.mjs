import { calculateDerivedResources } from "../rules/derived-stats.mjs";
import { buildAttackSummary, consumeReaction, reserveReaction, validateAttackRange } from "../rules/combat-workflow.mjs";
import { resolveConditionStartTurn } from "../rules/conditions.mjs";
import { clampResource } from "../rules/damage.mjs";
import { calculateEdgeCombatModifiers, collectEdgeNames } from "../rules/edges.mjs";
import { buildGimmickActivationSummary } from "../rules/gimmicks.mjs";
import { calculateHungerTargetNumber, calculateRageTargetNumber } from "../rules/hunger-rage.mjs";
import { calculateKakujaUpkeep, getKakujaBonusOptions } from "../rules/kakuja.mjs";
import { calculateConsumptionReward, calculateQuinqueGimmickAddition, calculateQuinqueUpgrade } from "../rules/progression.mjs";
import { rollD20Check } from "../rules/rolls.mjs";
import { validateCharacterSystemData } from "../rules/validation.mjs";

export class TokyoGhoulActor extends Actor {
  prepareBaseData() {
    super.prepareBaseData();
    this.system.validation = this.system.validation ?? { warnings: [] };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.system.validation = validateCharacterSystemData(this.system, Array.from(this.items ?? []));
    this.edgeModifiers = this.getEdgeModifiers();
  }

  getStat(key) {
    return Number(this.system?.stats?.[key]?.total ?? 0);
  }

  getVitalityMax() {
    return Number(this.system?.resources?.vitality?.max ?? 0);
  }

  getStaminaMax() {
    return Number(this.system?.resources?.stamina?.max ?? 0);
  }

  getMealScoreMax() {
    return Number(this.system?.resources?.mealScore?.max ?? 0);
  }

  getActiveKagune() {
    return this.items.find((item) => item.type === "kagune" && item.system?.manifested);
  }

  getActiveQuinque() {
    return this.items.find((item) => item.type === "quinque" && item.system?.equipped);
  }

  getActiveKakujaArmor() {
    return this.items.find((item) => item.type === "kakuja-armor" && item.system?.manifested);
  }

  getDefaultAttackItem() {
    return this.getActiveKagune() ?? this.getActiveQuinque() ?? null;
  }

  getEdgeNames(sourceItem = null) {
    return collectEdgeNames({ actorItems: Array.from(this.items ?? []), sourceItem });
  }

  getEdgeModifiers(sourceItem = null) {
    return calculateEdgeCombatModifiers(this.getEdgeNames(sourceItem), {
      actorClass: this.system?.identity?.class,
      end: this.getStat("end"),
      spd: this.getStat("spd")
    });
  }

  getAvailableManeuvers() {
    return this.items.filter((item) => item.type === "maneuver");
  }

  canUseManeuver(id) {
    return this.getAvailableManeuvers().some((item) => item.id === id || item.name === id);
  }

  getDerivedPreview() {
    const kagune = this.getActiveKagune();
    return calculateDerivedResources({
      stats: this.system?.stats,
      kaguneType: kagune?.system?.primaryType ?? kagune?.system?.type ?? null
    });
  }

  async rollCheck(stat, options = {}) {
    const edgeModifiers = this.getEdgeModifiers();
    const reactionBonus = options.reaction === "dodge"
      ? edgeModifiers.dodgeBonus
      : options.reaction === "block"
        ? edgeModifiers.blockBonus
        : 0;
    const result = await rollD20Check({ actor: this, stat, ...options, bonus: (options.bonus ?? 0) + reactionBonus });
    const content = await renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/roll-card.hbs", {
      title: game.i18n.format("TG.chat.statCheck", { stat: game.i18n.localize(`TG.stats.${stat}.label`) }),
      formula: result.formula,
      total: result.total,
      natural: result.natural,
      extra: result.extra,
      success: result.success
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      flags: {
        "tokyo-ghoul-unofficial": {
          roll: result
        }
      }
    });

    return result;
  }

  buildAttackSummary(item = null, options = {}) {
    const sourceItem = item ?? this.getDefaultAttackItem();
    const attack = buildAttackSummary({
      stats: {
        str: this.getStat("str"),
        acc: this.getStat("acc")
      },
      item: sourceItem,
      attackMode: options.attackMode ?? "melee",
      combatMode: options.combatMode ?? this.system?.combat?.mode ?? "squad",
      sidearm: options.sidearm ?? false
    });
    const edgeModifiers = this.getEdgeModifiers(sourceItem);

    return {
      ...attack,
      damage: attack.damage + edgeModifiers.damageBonus,
      edgeModifiers
    };
  }

  async rollAttack(item = null, options = {}) {
    const sourceItem = item ?? this.getDefaultAttackItem();
    const attack = this.buildAttackSummary(sourceItem, options);
    const targets = Array.from(game.user?.targets ?? []).map((target) => ({
      name: target.name,
      uuid: target.document?.uuid ?? target.actor?.uuid ?? null
    }));
    const rangeValidation = validateAttackRange({
      item: sourceItem,
      attackMode: options.attackMode ?? "melee",
      targetRangeBand: options.targetRangeBand ?? this.system?.combat?.rangeBand ?? "melee",
      sidearm: options.sidearm ?? false
    });
    const roll = await rollD20Check({ actor: this, stat: "per", bonus: options.bonus ?? 0, penalty: options.penalty ?? 0 });
    const resourceSpend = options.spendResources === false
      ? { staminaSpent: 0, vitalityCost: 0 }
      : await this.spendStamina(attack.staminaCost, { quiet: true });
    const content = await renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/attack-card.hbs", {
      actor: this,
      attack,
      targets,
      rangeValidation,
      roll,
      resourceSpend
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      flags: {
        "tokyo-ghoul-unofficial": {
          attackerActorUuid: this.uuid,
          attack,
          targets,
          rangeValidation,
          roll,
          resourceSpend
        }
      }
    });

    return { attack, roll, resourceSpend };
  }

  async spendStamina(amount, options = {}) {
    const cost = Math.max(0, Number(amount) || 0);
    const stamina = this.system.resources.stamina;
    const vitality = this.system.resources.vitality;
    const staminaSpent = Math.min(stamina.value, cost);
    const vitalityCost = cost - staminaSpent;

    const update = {
      "system.resources.stamina.value": clampResource(stamina.value - staminaSpent, 0, stamina.max)
    };

    if (vitalityCost > 0) {
      update["system.resources.vitality.value"] = clampResource(vitality.value - vitalityCost, 0, vitality.max);
    }

    await this.update(update);
    if (!options.quiet && cost > 0) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.spendStamina", { actor: this.name, amount: cost, vitality: vitalityCost })
      });
    }

    return { staminaSpent, vitalityCost };
  }

  async applyDamage(amount, options = {}) {
    const damage = Math.max(0, Number(amount) || 0);
    const vitality = this.system.resources.vitality;
    await this.update({
      "system.resources.vitality.value": clampResource(vitality.value - damage, 0, vitality.max)
    });
    if (!options.quiet && damage > 0) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.applyDamage", { actor: this.name, amount: damage })
      });
    }
    return damage;
  }

  async takeBreather(options = {}) {
    const recovery = this.getStat("end") * (options.multiplier ?? this.getEdgeModifiers().breatherMultiplier);
    const stamina = this.system.resources.stamina;
    const update = {
      "system.resources.stamina.value": clampResource(stamina.value + recovery, 0, stamina.max)
    };

    if (this.system.resources.rage?.active) {
      update["system.resources.rage.active"] = false;
      update["system.resources.rage.voluntarilyEntered"] = false;
      update["system.resources.rage.tempStatBudget"] = 0;
      update["system.resources.rage.assigned"] = {};
    }

    await this.update(update);
    if (!options.quiet) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.takeBreather", { actor: this.name, amount: recovery })
      });
    }
    return recovery;
  }

  async processStartTurnConditions(options = {}) {
    const conditionItems = Array.from(this.items ?? []).filter((item) => item.type === "condition");
    const results = [];
    const edgeModifiers = this.getEdgeModifiers();

    for (const condition of conditionItems) {
      let endRollTotal = options.endRollTotal;
      if (condition.system?.conditionId === "burning" && endRollTotal === undefined) {
        const roll = await rollD20Check({ actor: this, stat: "end" });
        endRollTotal = roll.total;
      }

      const result = resolveConditionStartTurn({
        conditionId: condition.system?.conditionId,
        stacks: condition.system?.stacks,
        regenerationType: edgeModifiers.regenerationType,
        endRollTotal
      });
      results.push({ item: condition, ...result });

      if (result.vitalityDamage > 0) await this.applyDamage(result.vitalityDamage, { quiet: true });
      if (result.remove) await condition.delete();
      else if (result.stacks !== condition.system?.stacks) await condition.update({ "system.stacks": result.stacks });
    }

    if (!options.quiet && results.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.conditionTurn", { actor: this.name, count: results.length }),
        flags: { "tokyo-ghoul-unofficial": { conditionTurn: results.map(({ item, ...result }) => ({ itemId: item.id, ...result })) } }
      });
    }

    return results;
  }

  async processEndTurnConditions(options = {}) {
    const updates = [];

    if (this.system?.combat?.grapple?.isGrappling) {
      const drain = this.getStat("end");
      if (drain > 0) {
        await this.spendStamina(drain, { quiet: true });
        updates.push({ kind: "grappleDrain", staminaDamage: drain });
      }
    }

    if (this.system?.kakuja?.active) {
      const kagune = this.getActiveKagune() ?? this.items.find((item) => item.type === "kagune");
      const stage = this.system.kakuja.stage;
      const mastered = stage === "full" ? this.system.kakuja.masteredFull : this.system.kakuja.masteredHalf;
      const upkeep = calculateKakujaUpkeep({ stage, rcl: kagune?.system?.rcl ?? 0, mastered });
      if (upkeep > 0) {
        await this.spendStamina(upkeep, { quiet: true });
        updates.push({ kind: "kakujaUpkeep", staminaDamage: upkeep });
      }
    }

    if (!options.quiet && updates.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.endTurnEffects", { actor: this.name, count: updates.length }),
        flags: { "tokyo-ghoul-unofficial": { endTurnEffects: updates } }
      });
    }

    return updates;
  }

  async toggleGimmick(gimmick = null, options = {}) {
    const item = gimmick ?? this.items.find((owned) => owned.type === "gimmick");
    if (!item) return null;

    const summary = buildGimmickActivationSummary({
      gimmickType: item.system?.gimmickType,
      active: item.system?.active,
      staminaCostMode: item.system?.staminaCostMode,
      stats: {
        end: this.getStat("end"),
        spd: this.getStat("spd")
      },
      customCost: options.customCost,
      free: options.free ?? false
    });

    if (summary.staminaCost > 0) await this.spendStamina(summary.staminaCost, { quiet: true });
    await item.update({ "system.active": summary.active });

    if (!options.quiet) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.gimmickToggle", {
          actor: this.name,
          gimmick: item.name,
          state: game.i18n.localize(summary.active ? "TG.states.active" : "TG.states.inactive"),
          cost: summary.staminaCost
        })
      });
    }

    return summary;
  }

  async reserveReactionManeuver() {
    const budget = this.system.resources.maneuverBudget;
    const result = reserveReaction({
      maneuversRemaining: budget.value,
      reactionsReserved: budget.reactionsReserved
    });
    if (!result.reserved) return result;
    await this.update({
      "system.resources.maneuverBudget.value": result.maneuversRemaining,
      "system.resources.maneuverBudget.reactionsReserved": result.reactionsReserved
    });
    return result;
  }

  async consumeReactionManeuver() {
    const budget = this.system.resources.maneuverBudget;
    const result = consumeReaction({ reactionsReserved: budget.reactionsReserved });
    if (!result.consumed) return result;
    await this.update({
      "system.resources.maneuverBudget.reactionsReserved": result.reactionsReserved
    });
    return result;
  }

  async checkHungerOrRage(trigger = "manual", options = {}) {
    const actorClass = this.system?.identity?.class;
    const checks = [];

    if (actorClass === "ghoul" || actorClass === "quinx") {
      checks.push({
        kind: "hunger",
        targetNumber: calculateHungerTargetNumber({
          mealScore: this.system.resources.mealScore,
          stamina: this.system.resources.stamina,
          context: options.context ?? "outOfCombat"
        })
      });
    }

    if (actorClass === "investigator" || actorClass === "quinx") {
      checks.push({
        kind: "rage",
        targetNumber: calculateRageTargetNumber(this.system.resources.vitality)
      });
    }

    const results = [];
    for (const check of checks) {
      const edgeModifiers = this.getEdgeModifiers();
      const roll = edgeModifiers.autoPassCrl
        ? { total: check.targetNumber, success: true, formula: "Inner Peace", natural: null, extra: null }
        : edgeModifiers.autoFailCrl
          ? { total: 0, success: false, formula: "Rampant", natural: null, extra: null }
          : await rollD20Check({ actor: this, stat: "crl", targetNumber: check.targetNumber });
      results.push({ ...check, roll });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.controlCheck", {
          actor: this.name,
          kind: game.i18n.localize(`TG.control.${check.kind}`),
          trigger,
          total: roll.total,
          target: check.targetNumber
        })
      });
    }

    return results;
  }

  async activateKakuja({ stage = "half", selectedStat = null } = {}) {
    const kagune = this.getActiveKagune() ?? this.items.find((item) => item.type === "kagune");
    const kaguneType = kagune?.system?.primaryType ?? kagune?.system?.type ?? "ukaku";
    const options = getKakujaBonusOptions(kaguneType, stage);
    const bonus = options.find((option) => option.stat === selectedStat) ?? options[0];
    const update = {
      "system.kakuja.active": true,
      "system.kakuja.stage": stage,
      "system.kakuja.selectedBonus": bonus ? `${bonus.stat}:${bonus.value}` : null
    };

    if (bonus && bonus.stat !== "rcl") {
      update[`system.stats.${bonus.stat}.kakuja`] = bonus.value;
    }

    await this.update(update);
    return bonus;
  }

  async deactivateKakuja() {
    const update = {
      "system.kakuja.active": false,
      "system.kakuja.selectedBonus": null
    };

    for (const key of ["str", "acc", "per", "end", "spd", "crl"]) {
      update[`system.stats.${key}.kakuja`] = 0;
    }

    await this.update(update);
  }

  async applyConsumptionReward({ targetHighestRcl = 0, rclGain = 1, rclLimit = Number.POSITIVE_INFINITY, targetName = "" } = {}) {
    const kagune = this.getActiveKagune() ?? this.items.find((item) => item.type === "kagune");
    const currentRcl = Number(kagune?.system?.rcl ?? this.system?.rcl?.ghoul?.value ?? 0);
    const reward = calculateConsumptionReward({
      actorClass: this.system?.identity?.class,
      currentStatPoints: this.system?.progression?.statPoints,
      currentRcl,
      targetHighestRcl,
      rclLimit,
      rclGain
    });

    const consumed = Array.from(this.system?.progression?.consumed ?? []);
    consumed.push({
      targetName,
      targetHighestRcl,
      statPointsGained: reward.statPointsGained,
      rclGained: reward.rclGained
    });

    await this.update({
      "system.progression.statPoints": reward.statPoints,
      "system.progression.consumed": consumed
    });

    if (kagune && reward.rclGained > 0) await kagune.update({ "system.rcl": reward.rcl });
    return reward;
  }

  async upgradeQuinqueWithKakuhou(quinque, kakuhou, options = {}) {
    if (!quinque || quinque.type !== "quinque") return null;
    const source = kakuhou?.system ?? kakuhou ?? {};
    const update = {};

    if (options.addGimmick) {
      const gimmick = calculateQuinqueGimmickAddition({
        currentRcl: quinque.system?.rcl,
        kakuhouType: source.sourceKaguneType,
        hasDynamicEdge: source.sourceEdges?.includes?.("Dynamic Edge")
      });
      if (!gimmick.affordable) return { affordable: false, gimmick };
      update["system.rcl"] = gimmick.rcl;
      update["system.gimmick"] = gimmick.gimmickType;
    } else {
      const upgrade = calculateQuinqueUpgrade({
        currentRcl: quinque.system?.rcl,
        sourceRcl: source.sourceRcl
      });
      update["system.rcl"] = upgrade.rcl;
    }

    await quinque.update(update);
    if (kakuhou?.update) await kakuhou.update({ "system.consumed": true, "system.usedFor": options.addGimmick ? "gimmick" : "upgrade" });
    return { affordable: true, update };
  }
}
