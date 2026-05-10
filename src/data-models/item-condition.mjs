import { baseItemSchema, fields } from "./helpers.mjs";

export class ConditionDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { BooleanField, NumberField, ObjectField, StringField } = fields();
    return {
      ...baseItemSchema(),
      conditionId: new StringField({ required: false, initial: "" }),
      stacks: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      stackable: new BooleanField({ required: true, initial: false }),
      effect: new ObjectField({ required: true, initial: {} })
    };
  }
}
