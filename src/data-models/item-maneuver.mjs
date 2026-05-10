import { baseItemSchema, fields } from "./helpers.mjs";

export class ManeuverDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField } = fields();
    return {
      ...baseItemSchema(),
      maneuverType: new StringField({ required: true, initial: "action" }),
      requiresEdge: new StringField({ required: false, nullable: true, initial: null }),
      staminaFormula: new StringField({ required: false, initial: "" }),
      damageFormula: new StringField({ required: false, initial: "" }),
      rangeModifier: new StringField({ required: false, initial: "0" }),
      chatAction: new StringField({ required: true, initial: "strike" })
    };
  }
}
