import { baseItemSchema, fields } from "./helpers.mjs";

export class ConsumableDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { NumberField, ObjectField, StringField } = fields();
    return {
      ...baseItemSchema(),
      consumableType: new StringField({ required: true, initial: "other" }),
      quantity: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      maxCarry: new NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
      range: new StringField({ required: true, initial: "melee" }),
      area: new StringField({ required: true, initial: "none" }),
      effect: new ObjectField({ required: true, initial: {} })
    };
  }
}
