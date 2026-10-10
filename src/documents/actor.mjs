import { actorAutomation } from "./actor-automation.mjs";
import { progressionDialog } from "./progression-workflows.mjs";
import { calculateDerivedResources } from "../rules/derived-stats.mjs";
import { buildAttackSummary, consumeReaction, reserveReaction, validateAttackRange } from "../rules/combat-workflow.mjs";
import { resolveConditionStartTurn } from "../rules/conditions.mjs";
import { clampResource } from "../rules/damage.mjs";
import { calculateEdgeCombatModifiers, collectEdgeNames, normalizeEdgeName } from "../rules/edges.mjs";
import { buildGimmickActivationSummary } from "../rules/gimmicks.mjs";
import { calculateHungerTargetNumber, calculateRageTargetNumber } from "../rules/hunger-rage.mjs";
import { calculateKakujaUpkeep, getKakujaBonusOptions } from "../rules/kakuja.mjs";
import { calculateConsumptionReward, calculateQuinqueGimmickAddition, calculateQuinqueUpgrade } from "../rules/progression.mjs";
import { rollD20Check, getMessageRolls } from "../rules/rolls.mjs";
import { validateCharacterSystemData } from "../rules/validation.mjs";

export class TokyoGhoulActor extends actorAutomation(Actor) {
  progressionDialog(action) { return progressionDialog(this, action); }
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
    return this.items.find((item) => item.type === "quinque" && item.system?.equipped && !item.system?.rcBonds?.broken);
  }

  getActiveKakujaArmor() {
    return this.items.find((item) => item.type === "kakuja-armor" && item.system?.manifested);
  }

  getDefaultAttackItem() {
    return this.getActiveKagune() ?? this.getActiveQuinque() ?? null;
  }

  getEdgeNames(sourceItem = null) {
    const personal = ["inner-peace","rampant","breathing-exercises","cannibalistic","ghoul-regeneration","high-speed-regeneration","chimera","grappler"];
    const innate = this.items.filter(i=>i.type==="kagune").flatMap(i=>i.system.edges).map(normalizeEdgeName).filter(e=>personal.includes(e));
    return [...new Set([...collectEdgeNames({actorItems:Array.from(this.items??[]),sourceItem}),...innate,...(this.system.kakuja.active?this.system.kakuja.kakujaEdges.map(normalizeEdgeName):[])])];
  }

  getEdgeModifiers(sourceItem = this.getDefaultAttackItem()) {
    const modifiers = calculateEdgeCombatModifiers(this.getEdgeNames(sourceItem), {
      actorClass: this.system?.identity?.class,
      kaguneType: sourceItem?.type === "kagune" ? sourceItem.system.primaryType : this.items.find(i => i.type === "kagune")?.system.primaryType,
      end: this.getStat("end"),
      spd: this.getStat("spd")
    });
    // Quinque regeneration repairs the weapon; it never heals its wielder.
    if (sourceItem?.type === "quinque" && this.system.identity.class === "quinx") {
      const kagune = this.items.find(i => i.type === "kagune");
      modifiers.regenerationType = calculateEdgeCombatModifiers(this.getEdgeNames(kagune), {
        actorClass: "quinx", kaguneType: kagune?.system.primaryType
      }).regenerationType;
    }
    return modifiers;
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
    const content = await foundry.applications.handlebars.renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/roll-card.hbs", {
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
      rolls: getMessageRolls(result),
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
    const rolls = [];
    const edgeModifiers = this.getEdgeModifiers();

    for (const condition of conditionItems) {
      let endRollTotal = options.endRollTotal;
      if (condition.system?.conditionId === "burning" && endRollTotal === undefined) {
        const roll = await rollD20Check({ actor: this, stat: "end" });
        endRollTotal = roll.total;
        rolls.push(...getMessageRolls(roll));
      }

      const result = resolveConditionStartTurn({
        conditionId: condition.system?.conditionId,
        stacks: condition.system?.stacks,
        regenerationType: this.system.hunger.regenerationSuppressed || this.items.some(i => i.type === "condition" && i.system.conditionId === "rc-limiter-cloud") ? "none" : edgeModifiers.regenerationType,
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
        rolls,
        flags: { "tokyo-ghoul-unofficial": { conditionTurn: results.map(({ item, ...result }) => ({ itemId: item.id, ...result })) } }
      });
    }

    return results;
  }


  async toggleGimmick(gimmick = null, options = {}) {
    const item = gimmick ?? this.items.find((owned) => owned.type === "gimmick");
    if (!item) return null;
    if (!item.system.active && !await this.spendManeuver("enhance")) return;

    const summary = buildGimmickActivationSummary({
      gimmickType: item.system?.gimmickType,
      active: item.system?.active,
      staminaCostMode: item.system?.staminaCostMode,
      stats: {
        end: this.getStat("end"),
        spd: this.getStat("spd")
      },
      customCost: options.customCost,
      free: options.free ?? this.getActiveQuinque()?.system.kakuja.freeGimmick ?? false
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
    if (this.inCombat && game.user.isActiveGM) await game.combat.turnProcessing;
    if (!this.isOwner) return this.notify("TG.notifications.noPermission");
    if (this.system.resources.vitality.value <= 0) return this.notify("TG.notifications.incapacitated");
    if (this.inCombat && game.combat.combatant?.actor?.uuid !== this.uuid) return this.notify("TG.notifications.notYourTurn");
    if (this.system.combat.counterDeclared || this.system.combat.grapple.grappledBy) return this.notify("TG.notifications.stanceLocked");
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
    if (this.system.resources.rage.active) await this.spendStamina(this.getEdgeModifiers().autoFailCrl ? 1 : 2, {quiet:true});
    return result;
  }



  async deactivateKakuja() {
    if (this.system.kakuja.lostControl && this.system.resources.vitality.value > 0 && !game.user.isGM) return this.notify("TG.notifications.lostControl");
    const update = {
      "system.kakuja.active": false,
      "system.kakuja.lostControl": false,
      "system.kakuja.masterySuccesses": 0,
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
