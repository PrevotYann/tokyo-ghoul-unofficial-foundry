import { applyCharacterDerivedData, fields, rclResourceField, resourceField, statsSchema } from "./helpers.mjs";

export class CharacterDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, StringField } = fields();

    return {
      identity: new SchemaField({
        class: new StringField({ required: true, initial: "ghoul", choices: ["ghoul", "investigator", "quinx"] }),
        faction: new StringField({ required: true, initial: "ghoul" }),
        rankGhoul: new StringField({ required: true, initial: "C" }),
        rankInvestigator: new StringField({ required: true, initial: "rank3" }),
        alias: new StringField({ required: false, initial: "" }),
        age: new NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
        pronouns: new StringField({ required: false, initial: "" }),
        notes: new StringField({ required: false, initial: "" })
      }),
      stats: statsSchema(),
      rcl: new SchemaField({
        ghoul: rclResourceField(0),
        kagune: rclResourceField(0),
        quinque: rclResourceField(0)
      }),
      resources: new SchemaField({
        vitality: resourceField(60),
        stamina: resourceField(60),
        mealScore: resourceField(15),
        rage: new SchemaField({
          active: new BooleanField({ required: true, initial: false }),
          voluntarilyEntered: new BooleanField({ required: true, initial: false }),
          tempStatBudget: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          assigned: new ObjectField({ required: true, initial: {} })
        }),
        maneuverBudget: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          reactionsReserved: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        })
      }),
      combat: new SchemaField({
        mode: new StringField({ required: true, initial: "squad", choices: ["squad", "raid"] }),
        rangeBand: new StringField({ required: true, initial: "melee" }),
        pendingReactions: new ArrayField(new ObjectField()),
        readiedAction: new ObjectField({ required: false, nullable: true, initial: null }),
        counterDeclared: new BooleanField({ required: true, initial: false }),
        grapple: new ObjectField({ required: true, initial: { isGrappling: false, grappledBy: null, targets: [] } })
      }),
      hunger: new SchemaField({
        active: new BooleanField({ required: true, initial: false }),
        regenerationSuppressed: new BooleanField({ required: true, initial: false }),
        failedAt: new StringField({ required: false, nullable: true, initial: null })
      }),
      kakuja: new SchemaField({
        eligible: new BooleanField({ required: true, initial: false }),
        stage: new StringField({ required: true, initial: "none" }),
        masteredHalf: new BooleanField({ required: true, initial: false }),
        masteredFull: new BooleanField({ required: true, initial: false }),
        active: new BooleanField({ required: true, initial: false }),
        selectedBonus: new StringField({ required: false, nullable: true, initial: null }),
        masterySuccesses: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        lostControl: new BooleanField({ required: true, initial: false }),
        kakujaEdges: new ArrayField(new StringField())
      }),
      progression: new SchemaField({
        statPoints: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        consumed: new ArrayField(new ObjectField()),
        kakuhouStorage: new ArrayField(new ObjectField()),
        notes: new HTMLField({ required: false, initial: "" })
      }),
      biography: new SchemaField({
        appearance: new HTMLField({ required: false, initial: "" }),
        personality: new HTMLField({ required: false, initial: "" }),
        backstory: new HTMLField({ required: false, initial: "" }),
        likes: new HTMLField({ required: false, initial: "" }),
        dislikes: new HTMLField({ required: false, initial: "" }),
        goals: new HTMLField({ required: false, initial: "" })
      }),
      automation: new SchemaField({
        ruleNotes: new HTMLField({ required: false, initial: "" }),
        manualAdjustments: new ArrayField(new ObjectField())
      })
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    applyCharacterDerivedData(this);
  }
}
