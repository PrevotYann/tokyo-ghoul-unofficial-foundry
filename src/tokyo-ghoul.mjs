import { SYSTEM_ID, TG_CONFIG } from "./config.mjs";
import { CharacterDataModel } from "./data-models/actor-character.mjs";
import { NpcDataModel } from "./data-models/actor-npc.mjs";
import { KaguneDataModel } from "./data-models/item-kagune.mjs";
import { QuinqueDataModel } from "./data-models/item-quinque.mjs";
import { EdgeDataModel } from "./data-models/item-edge.mjs";
import { GimmickDataModel } from "./data-models/item-gimmick.mjs";
import { ManeuverDataModel } from "./data-models/item-maneuver.mjs";
import { ConsumableDataModel } from "./data-models/item-consumable.mjs";
import { KakuhouDataModel } from "./data-models/item-kakuhou.mjs";
import { KakujaArmorDataModel } from "./data-models/item-kakuja-armor.mjs";
import { ConditionDataModel } from "./data-models/item-condition.mjs";
import { LootDataModel } from "./data-models/item-loot.mjs";
import { TokyoGhoulActor } from "./documents/actor.mjs";
import { TokyoGhoulItem } from "./documents/item.mjs";
import { TokyoGhoulActiveEffect } from "./documents/active-effect.mjs";
import { registerCombatHooks } from "./documents/combat.mjs";
import { TokyoGhoulActorSheet } from "./sheets/actor-sheet.mjs";
import { CharacterBuilderApp, createActorFromCharacterDraft, openCharacterBuilder } from "./sheets/builder-app.mjs";
import { TokyoGhoulItemSheet } from "./sheets/item-sheet.mjs";
import { registerMigrationSettings, runMigrations } from "./rules/migrations.mjs";
import { registerChatCardListeners } from "./ui/chat-cards.mjs";
import { registerHandlebarsHelpers } from "./ui/handlebars-helpers.mjs";

const ACTOR_DATA_MODELS = {
  character: CharacterDataModel,
  npc: NpcDataModel
};

const ITEM_DATA_MODELS = {
  kagune: KaguneDataModel,
  quinque: QuinqueDataModel,
  edge: EdgeDataModel,
  gimmick: GimmickDataModel,
  maneuver: ManeuverDataModel,
  consumable: ConsumableDataModel,
  kakuhou: KakuhouDataModel,
  "kakuja-armor": KakujaArmorDataModel,
  condition: ConditionDataModel,
  loot: LootDataModel
};

async function preloadTemplates() {
  const templates = [
    "systems/tokyo-ghoul-unofficial/templates/actor/character-sheet.hbs",
    "systems/tokyo-ghoul-unofficial/templates/actor/parts/item-list.hbs",
    "systems/tokyo-ghoul-unofficial/templates/apps/character-builder.hbs",
    "systems/tokyo-ghoul-unofficial/templates/item/item-sheet.hbs",
    "systems/tokyo-ghoul-unofficial/templates/chat/roll-card.hbs",
    "systems/tokyo-ghoul-unofficial/templates/chat/attack-card.hbs",
    "systems/tokyo-ghoul-unofficial/templates/chat/defense-card.hbs",
    "systems/tokyo-ghoul-unofficial/templates/chat/condition-card.hbs"
  ];
  const loader = foundry.applications.handlebars?.loadTemplates ?? globalThis.loadTemplates;
  if (loader) await loader(templates);
}

function registerDocumentSheets() {
  const sheetConfig = foundry.applications.apps.DocumentSheetConfig;

  sheetConfig.registerSheet(Actor, SYSTEM_ID, TokyoGhoulActorSheet, {
    label: "TG.sheets.actor",
    types: ["character", "npc"],
    makeDefault: true
  });

  sheetConfig.registerSheet(Item, SYSTEM_ID, TokyoGhoulItemSheet, {
    label: "TG.sheets.item",
    types: Object.keys(ITEM_DATA_MODELS),
    makeDefault: true
  });
}

Hooks.once("init", async () => {
  console.log(`${SYSTEM_ID} | Initializing Tokyo Ghoul: Unofficial TTRPG.`);

  CONFIG.TG = TG_CONFIG;
  CONFIG.Actor.documentClass = TokyoGhoulActor;
  CONFIG.Item.documentClass = TokyoGhoulItem;
  CONFIG.ActiveEffect.documentClass = TokyoGhoulActiveEffect;
  CONFIG.Actor.dataModels = { ...CONFIG.Actor.dataModels, ...ACTOR_DATA_MODELS };
  CONFIG.Item.dataModels = { ...CONFIG.Item.dataModels, ...ITEM_DATA_MODELS };
  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["resources.vitality", "resources.stamina", "resources.mealScore"],
      value: ["stats.spd.total"]
    },
    npc: {
      bar: ["resources.vitality", "resources.stamina"],
      value: ["stats.spd.total"]
    }
  };
  game.tokyoGhoul = {
    CharacterBuilderApp,
    createActorFromCharacterDraft,
    openCharacterBuilder
  };

  registerHandlebarsHelpers();
  registerDocumentSheets();
  await registerMigrationSettings();
  await preloadTemplates();
});

Hooks.once("ready", async () => {
  registerCombatHooks();
  registerChatCardListeners();
  await runMigrations();
});
