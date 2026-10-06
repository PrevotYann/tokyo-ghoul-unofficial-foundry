import { TG_CONFIG } from "../config.mjs";
import { calculateDerivedResources, calculateStatTotal, calculateStaminaMax, calculateVitalityMax, calculateMealScoreMax } from "../rules/derived-stats.mjs";
import { getKakujaStatBonus } from "../rules/kakuja.mjs";

export function fields() {
  return foundry.data.fields;
}

export function statField(initial = 10) {
  const { NumberField, SchemaField } = fields();
  return new SchemaField({
    base: new NumberField({ required: true, integer: true, initial }),
    temp: new NumberField({ required: true, integer: true, initial: 0 }),
    edge: new NumberField({ required: true, integer: true, initial: 0 }),
    kakuja: new NumberField({ required: true, integer: true, initial: 0 }),
    total: new NumberField({ required: true, integer: true, initial })
  });
}

export function resourceField(initial = 0) {
  const { NumberField, SchemaField } = fields();
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, min: 0, initial }),
    max: new NumberField({ required: true, integer: true, min: 0, initial }),
    min: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    temp: new NumberField({ required: true, integer: true, initial: 0 }),
    tempMaxPenalty: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
  });
}

export function rclResourceField(initial = 0) {
  const { NumberField, SchemaField } = fields();
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, min: 0, initial }),
    max: new NumberField({ required: true, integer: true, min: 0, initial }),
    spent: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
  });
}

export function statsSchema() {
  const { SchemaField } = fields();
  return new SchemaField(Object.fromEntries(TG_CONFIG.stats.map((key) => [key, statField(10)])));
}

export function applyCharacterDerivedData(model) {
  const conditions = model.parent?.items?.filter(i=>i.type==="condition").map(i=>i.system.conditionId) ?? [];
  if (conditions.includes("hunger-active")) model.hunger.active = true;
  if (conditions.some(id=>["hunger-active","regeneration-suppressed","rc-limiter-cloud"].includes(id))) model.hunger.regenerationSuppressed = true;
  if (conditions.includes("rage-active")) model.resources.rage.active = true;
  if (conditions.includes("lost-control")) model.kakuja.lostControl = true;
  for (const key of TG_CONFIG.stats) {
    model.stats[key].total = calculateStatTotal(model.stats[key]);
  }

  const kagune = model.parent?.items?.find(item => item.type === "kagune");
  const kaguneType = model.identity.class !== "investigator" ? kagune?._source?.system.primaryType ?? kagune?.system.primaryType ?? null : null;
  const inputStats = Object.fromEntries(TG_CONFIG.stats.map(key => [key, {...model.stats[key]}]));
  if (kaguneType === "bikaku") {
    const penalty = kagune?.system.evolution.bikakuPenalty ?? "crl";
    if (["crl","per"].includes(penalty)) inputStats[penalty].edge -= 2;
  }
  const rage = model.resources.rage;
  const hunger = model.parent?.getFlag?.("tokyo-ghoul-unofficial", "hungerAssigned") ?? {};
  for (const key of TG_CONFIG.stats) {
    inputStats[key].temp += rage?.active ? Number(rage.assigned[key] ?? 0) : 0;
    inputStats[key].temp += model.hunger?.active ? Number(hunger[key] ?? 0) : 0;
    // Kakuja bonuses derive from activation, never mutate persisted base stats.
    inputStats[key].kakuja = 0;
    if (model.kakuja?.active) inputStats[key].kakuja = getKakujaStatBonus(model.kakuja.selectedBonus,key);
  }
  const derived = calculateDerivedResources({ stats: inputStats, kaguneType });
  if (kagune?.system.edges.some(e => String(e).toLowerCase() === "chimera")) derived.statTotals.crl = Math.min(15, derived.statTotals.crl);
  const armor = model.parent?.items?.find(i => i.type === "kakuja-armor" && i.system.manifested);
  if (armor?.system.armorType === "speed") {
    derived.statTotals.spd *= 2;
    derived.staminaMax = calculateStaminaMax(derived.statTotals.end,derived.statTotals.spd,{staminaPenalty:kaguneType === "ukaku"?derived.statTotals.spd:0});
  }
  derived.vitalityMax = calculateVitalityMax(derived.statTotals.end,derived.statTotals.crl,{vitalityPenalty:kaguneType === "rinkaku"?derived.statTotals.end:0});
  derived.mealScoreMax = calculateMealScoreMax(derived.statTotals.crl);

  for (const key of TG_CONFIG.stats) {
    model.stats[key].total = derived.statTotals[key];
  }

  model.resources.vitality.max = Math.max(0, derived.vitalityMax - model.resources.vitality.tempMaxPenalty);
  model.resources.vitality.value = Math.min(model.resources.vitality.value, model.resources.vitality.max);
  model.resources.stamina.max = Math.max(0, derived.staminaMax - model.resources.stamina.tempMaxPenalty);
  model.resources.stamina.value = Math.min(model.resources.stamina.value, model.resources.stamina.max);
  const usesMealScore = model.identity?.class === "ghoul" || model.identity?.class === "quinx";
  model.resources.mealScore.max = usesMealScore ? derived.mealScoreMax : 0;
  model.resources.mealScore.value = Math.min(model.resources.mealScore.value, model.resources.mealScore.max);
}

export function baseItemSchema() {
  const { HTMLField, StringField } = fields();
  return {
    description: new HTMLField({ required: false, initial: "" }),
    automation: new StringField({ required: true, initial: "manual", choices: TG_CONFIG.automationLevels })
  };
}
