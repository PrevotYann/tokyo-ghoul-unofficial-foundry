import { hasEdge } from "../rules/edges.mjs";
import { getDefaultTypeRange } from "../rules/character-builder.mjs";
import { calculateRcBondsMax } from "../rules/derived-stats.mjs";

export class TokyoGhoulItem extends Item {
  prepareBaseData() {
    super.prepareBaseData();
    if (!["kagune", "quinque"].includes(this.type)) return;
    this.system.rcl = Number(this._source.system.rcl ?? this.system.rcl);
    this.system.primaryType = this.getFlag("tokyo-ghoul-unofficial","activeForm") === "secondary" && this.system.secondaryType ? this.system.secondaryType : this._source.system.primaryType;
    this.system.edgeSlots.used = Array.from(this.system?.edges ?? []).reduce((n,edge) => n + (hasEdge([edge],"healer") ? 2 : 1),0);
    this.system.range = getDefaultTypeRange(this.system.primaryType);
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "kagune" && this._source.system.primaryType === "bikaku" && this.system.evolution.bikakuPenalty === "rcl") this.system.rcl = Math.max(0,this.system.rcl-2);
    if (this.type !== "quinque") return;
    if (this.system.kakuja.isKakujaWeapon) {
      this.system.rcl = Math.max(45,this.system.rcl);
      this.system.edgeSlots.max = this.parent?.system?.identity?.class === "quinx" ? 4 : 6;
    }
    if (hasEdge(this.system.edges, "cannibalistic")) this.system.rcl = Math.floor(this.system.rcl * 1.5);

    const highSpeedRegeneration = hasEdge(this.system.edges, "high-speed-regeneration");
    this.system.rcBonds.max = calculateRcBondsMax(this.system.rcl, { highSpeedRegeneration });
    this.system.rcBonds.value = Math.min(this.system.rcBonds.value, this.system.rcBonds.max);
    this.system.rcBonds.broken = this.system.rcBonds.value <= 0;
    this.system.sidearm.enabled ||= hasEdge(this.system.edges,"sidearm");
    this.system.sidearm.ammo.max = this.system.rcl;
  }
}
