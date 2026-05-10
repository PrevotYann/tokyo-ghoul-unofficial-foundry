import { baseItemSchema, fields } from "./helpers.mjs";

export class LootDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { HTMLField, NumberField, StringField } = fields();
    return {
      ...baseItemSchema(),
      quantity: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      category: new StringField({ required: false, initial: "misc" }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
