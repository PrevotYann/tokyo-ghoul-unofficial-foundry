import { baseItemSchema, fields } from "./helpers.mjs";

export class KakujaArmorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { BooleanField, HTMLField, NumberField, StringField } = fields();
    return {
      ...baseItemSchema(),
      armorType: new StringField({ required: true, initial: "attack" }),
      rcl: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      manifested: new BooleanField({ required: true, initial: false }),
      turnsActive: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
