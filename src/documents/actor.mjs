import { calculateDerivedResources } from "../rules/derived-stats.mjs";
import { buildAttackSummary, consumeReaction, reserveReaction } from "../rules/combat-workflow.mjs";
import { clampResource } from "../rules/damage.mjs";
import { rollD20Check } from "../rules/rolls.mjs";
import { validateCharacterSystemData } from "../rules/validation.mjs";

export class TokyoGhoulActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    this.system.validation = validateCharacterSystemData(this.system, Array.from(this.items ?? []));
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

  getDefaultAttackItem() {
    return this.getActiveKagune() ?? this.getActiveQuinque() ?? null;
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
    const result = await rollD20Check({ actor: this, stat, ...options });
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
    return buildAttackSummary({
      stats: {
        str: this.getStat("str"),
        acc: this.getStat("acc")
      },
      item: item ?? this.getDefaultAttackItem(),
      attackMode: options.attackMode ?? "melee",
      combatMode: options.combatMode ?? this.system?.combat?.mode ?? "squad",
      sidearm: options.sidearm ?? false
    });
  }

  async rollAttack(item = null, options = {}) {
    const attack = this.buildAttackSummary(item, options);
    const roll = await rollD20Check({ actor: this, stat: "per", bonus: options.bonus ?? 0, penalty: options.penalty ?? 0 });
    const resourceSpend = options.spendResources === false
      ? { staminaSpent: 0, vitalityCost: 0 }
      : await this.spendStamina(attack.staminaCost, { quiet: true });
    const content = await renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/attack-card.hbs", {
      actor: this,
      attack,
      roll,
      resourceSpend
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      flags: {
        "tokyo-ghoul-unofficial": {
          attack,
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
    const recovery = this.getStat("end") * (options.multiplier ?? 1);
    const stamina = this.system.resources.stamina;
    await this.update({
      "system.resources.stamina.value": clampResource(stamina.value + recovery, 0, stamina.max)
    });
    if (!options.quiet) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: game.i18n.format("TG.chat.takeBreather", { actor: this.name, amount: recovery })
      });
    }
    return recovery;
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
}
