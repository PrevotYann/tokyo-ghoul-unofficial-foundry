import { calculateDerivedResources } from "../rules/derived-stats.mjs";
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
}
