import { baseItemSchema, fields } from "./helpers.mjs";

export class EdgeDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, StringField } = fields();
    return {
      ...baseItemSchema(),
      ruleId: new StringField({ required: true, initial: "" }),
      category: new StringField({ required: true, initial: "universal" }),
      appliesTo: new ArrayField(new StringField()),
      allowedTypes: new ArrayField(new StringField()),
      forbiddenTypes: new ArrayField(new StringField()),
      slots: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      grantsManeuvers: new ArrayField(new StringField()),
      incompatibleWith: new ArrayField(new StringField()),
      mustChooseAtCreation: new BooleanField({ required: true, initial: false }),
      canTakeAfterCreation: new BooleanField({ required: true, initial: true }),
      effects: new ArrayField(new ObjectField()),
      formula: new StringField({ required: false, initial: "" }),
      notes: new HTMLField({ required: false, initial: "" })
    };
  }
}
