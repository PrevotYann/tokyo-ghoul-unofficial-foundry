import { baseItemSchema, fields } from "./helpers.mjs";

export class KakujaArmorDataModel extends foundry.abstract.TypeDataModel {
  static migrateData(source) {
    if (typeof source.rcl === "number" && source.rcl < 45) source.rcl = 45;
    return super.migrateData(source);
  }
  static defineSchema() {
    const { BooleanField, HTMLField, NumberField, StringField } = fields();
    return {
      ...baseItemSchema(),
      armorType: new StringField({ required: true, initial: "attack" }),
      selectedAttackStat: new StringField({ required: true, initial: "str", choices: ["str", "acc"] }),
      rcl: new NumberField({ required: true, integer: true, min: 45, initial: 45 }),
      manifested: new BooleanField({ required: true, initial: false }),
      turnsActive: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
