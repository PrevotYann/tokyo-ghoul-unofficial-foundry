import { TG_CONFIG } from "../config.mjs";
import { calculateDerivedResources, calculateStatTotal } from "../rules/derived-stats.mjs";

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
  for (const key of TG_CONFIG.stats) {
    model.stats[key].total = calculateStatTotal(model.stats[key]);
  }

  const activeKagune = model.parent?.items?.find((item) => item.type === "kagune" && item.system?.manifested);
  const kaguneType = activeKagune?.system?.primaryType || activeKagune?.system?.type || null;
  const derived = calculateDerivedResources({ stats: model.stats, kaguneType });

  for (const key of TG_CONFIG.stats) {
    model.stats[key].total = derived.statTotals[key];
  }

  model.resources.vitality.max = Math.max(0, derived.vitalityMax - model.resources.vitality.tempMaxPenalty);
  model.resources.vitality.value = Math.min(model.resources.vitality.value, model.resources.vitality.max);
  model.resources.stamina.max = Math.max(0, derived.staminaMax - model.resources.stamina.tempMaxPenalty);
  model.resources.stamina.value = Math.min(model.resources.stamina.value, model.resources.stamina.max);
  model.resources.mealScore.max = derived.mealScoreMax;
  model.resources.mealScore.value = Math.min(model.resources.mealScore.value, model.resources.mealScore.max);
}

export function baseItemSchema() {
  const { HTMLField, StringField } = fields();
  return {
    description: new HTMLField({ required: false, initial: "" }),
    automation: new StringField({ required: true, initial: "manual", choices: TG_CONFIG.automationLevels })
  };
}
