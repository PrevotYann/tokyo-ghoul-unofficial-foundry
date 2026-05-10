import { baseItemSchema, fields } from "./helpers.mjs";

export class KaguneDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, StringField } = fields();
    return {
      ...baseItemSchema(),
      type: new StringField({ required: true, initial: "ukaku" }),
      primaryType: new StringField({ required: true, initial: "ukaku" }),
      secondaryType: new StringField({ required: false, nullable: true, initial: null }),
      rcl: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      manifested: new BooleanField({ required: true, initial: false }),
      range: new ObjectField({ required: true, initial: { melee: "close", projectile: "long" } }),
      edgeSlots: new SchemaField({
        max: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
        used: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        bonusFromType: new NumberField({ required: true, integer: true, initial: 0 })
      }),
      edges: new ArrayField(new StringField()),
      evolution: new ObjectField({ required: true, initial: { spentRcl: 0, statPurchases: [], swappedEdges: [] } }),
      description: new HTMLField({ required: false, initial: "" }),
      dynamicNotes: new HTMLField({ required: false, initial: "" })
    };
  }
}
