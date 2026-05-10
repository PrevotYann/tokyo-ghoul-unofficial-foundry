import { calculateDerivedResources } from "../rules/derived-stats.mjs";
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
}
