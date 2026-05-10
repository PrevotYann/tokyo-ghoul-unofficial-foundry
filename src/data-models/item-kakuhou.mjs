import { baseItemSchema, fields } from "./helpers.mjs";

export class KakuhouDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, NumberField, StringField } = fields();
    return {
      ...baseItemSchema(),
      sourceName: new StringField({ required: false, initial: "" }),
      sourceRank: new StringField({ required: true, initial: "C" }),
      sourceRcl: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      sourceKaguneType: new StringField({ required: true, initial: "ukaku" }),
      sourceEdges: new ArrayField(new StringField()),
      consumed: new BooleanField({ required: true, initial: false }),
      usedFor: new StringField({ required: false, nullable: true, initial: null })
    };
  }
}
