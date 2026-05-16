import { calculateRcBondsMax } from "../rules/derived-stats.mjs";

export class TokyoGhoulItem extends Item {
  prepareBaseData() {
    super.prepareBaseData();
    if (!["kagune", "quinque"].includes(this.type)) return;
    this.system.edgeSlots.used = Array.from(this.system?.edges ?? []).length;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type !== "quinque") return;

    const highSpeedRegeneration = this.system?.edges?.includes?.("high-speed-regeneration") ?? false;
    this.system.rcBonds.max = calculateRcBondsMax(this.system.rcl, { highSpeedRegeneration });
    this.system.rcBonds.value = Math.min(this.system.rcBonds.value, this.system.rcBonds.max);
    this.system.rcBonds.broken = this.system.rcBonds.value <= 0;
  }
}
