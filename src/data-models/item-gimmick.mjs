import { baseItemSchema, fields } from "./helpers.mjs";

export class GimmickDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, HTMLField, ObjectField, StringField } = fields();
    return {
      ...baseItemSchema(),
      gimmickType: new StringField({ required: true, initial: "dynamic" }),
      active: new BooleanField({ required: true, initial: false }),
      staminaCostMode: new StringField({ required: true, initial: "none" }),
      selectedStat: new StringField({ required: false, nullable: true, initial: null }),
      selectedBenefit: new StringField({ required: false, nullable: true, initial: null }),
      grantedEdges: new ArrayField(new StringField()),
      dynamicEffect: new HTMLField({ required: false, initial: "" }),
      effects: new ArrayField(new ObjectField())
    };
  }
}
