import { baseItemSchema, fields } from "./helpers.mjs";

export class QuinqueDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, StringField } = fields();
    return {
      ...baseItemSchema(),
      type: new StringField({ required: true, initial: "ukaku" }),
      primaryType: new StringField({ required: true, initial: "ukaku" }),
      secondaryType: new StringField({ required: false, nullable: true, initial: null }),
      rcl: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      rcBonds: new SchemaField({
        value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
        max: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
        broken: new BooleanField({ required: true, initial: false }),
        repairDaysRemaining: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      equipped: new BooleanField({ required: true, initial: true }),
      range: new ObjectField({ required: true, initial: { melee: "close", projectile: "long" } }),
      edgeSlots: new SchemaField({
        max: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
        used: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      edges: new ArrayField(new StringField()),
      gimmick: new StringField({ required: false, nullable: true, initial: null }),
      sidearm: new ObjectField({ required: true, initial: { enabled: false, ammoType: "ukaku", ammo: { value: 0, max: 0 } } }),
      kakuja: new ObjectField({ required: true, initial: { isKakujaWeapon: false, freeGimmick: false, dynamicEdge: null } }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
