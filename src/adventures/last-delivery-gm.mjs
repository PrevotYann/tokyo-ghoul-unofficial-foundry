import { SYSTEM_ID } from "../config.mjs";
import { startEncounter } from "../ui/gm-tools.mjs";
import { escapeHTML } from "../sheets/roll-dialogs.mjs";

// GM automation for "The Last Delivery". Imported documents carry
// flags[SYSTEM_ID] = { adventure: "last-delivery", key } so the tools can find
// them after an Adventure import, independent of translated names.
const ADVENTURE = "last-delivery";
const SCENES = ["alley", "clinic", "station"];
const OPTIONAL_PCS = { nao: 5, sora: 6 };
const LOCKED_DOORS = { serviceDoor: "clinic", captiveGate: "station" };
export const PRESSURE_MAX = 3;

const flagsOf = document => document?.flags?.[SYSTEM_ID] ?? {};
const isAdventure = document => flagsOf(document).adventure === ADVENTURE;
const keyOf = document => flagsOf(document).key;

/** Pure: which optional pregen tokens are visible for a party size. */
export function partyTokenVisibility(size = 4) {
  return Object.fromEntries(Object.entries(OPTIONAL_PCS).map(([key, minimum]) => [key, Number(size) >= minimum]));
}

/** Pure: clamp the story pressure track. */
export function nextPressure(current = 0, delta = 0) {
  return Math.max(0, Math.min(PRESSURE_MAX, Number(current || 0) + Number(delta || 0)));
}

function whisperGM(text, icon = "fa-clipboard-list") {
  return ChatMessage.create({
    whisper: game.users.filter(user => user.isGM).map(user => user.id),
    speaker: { alias: game.i18n.localize("TG.lastDelivery.title") },
    content: `<section class="tg-system tg-chat-card tg-card-alert"><div class="tg-card-log-line"><i class="fa-solid ${icon}" aria-hidden="true"></i><p>${escapeHTML(text)}</p></div></section>`
  });
}

export const lastDelivery = {
  registerHooks() {
    Hooks.once("init", () => {
      game.settings.register(SYSTEM_ID, "lastDeliveryPressure", { scope: "world", config: false, type: Number, default: 0 });
      game.settings.register(SYSTEM_ID, "lastDeliveryPartySize", { scope: "world", config: false, type: Number, default: 4 });
    });
  },

  scene(key) { return game.scenes.find(scene => isAdventure(scene) && keyOf(scene) === key); },
  actor(key) { return game.actors.find(actor => isAdventure(actor) && keyOf(actor) === key); },
  get imported() { return SCENES.every(key => this.scene(key)); },
  get pressure() { return game.settings.get(SYSTEM_ID, "lastDeliveryPressure"); },
  get partySize() { return game.settings.get(SYSTEM_ID, "lastDeliveryPartySize"); },

  requireGM() {
    if (game.user.isGM && this.imported) return true;
    ui.notifications.warn(game.i18n.localize(game.user.isGM ? "TG.lastDelivery.notImported" : "TG.notifications.noPermission"));
    return false;
  },

  /** Tokens of an adventure actor across all three scenes. */
  tokensOf(actorKey, sceneKeys = SCENES) {
    const actor = this.actor(actorKey);
    if (!actor) return [];
    return sceneKeys.flatMap(key => this.scene(key)?.tokens.filter(token => token.actorId === actor.id) ?? []);
  },

  async setPartySize(size) {
    if (!this.requireGM()) return;
    const visible = partyTokenVisibility(size);
    for (const [key, show] of Object.entries(visible)) {
      for (const token of this.tokensOf(key)) await token.update({ hidden: !show });
    }
    await game.settings.set(SYSTEM_ID, "lastDeliveryPartySize", Number(size));
    await whisperGM(game.i18n.format("TG.lastDelivery.partySizeSet", { size, scaling: game.i18n.localize(`TG.lastDelivery.scaling.${size}`) }), "fa-users");
  },

  async adjustPressure(delta) {
    if (!this.requireGM()) return;
    const value = nextPressure(this.pressure, delta);
    if (value === this.pressure) return;
    await game.settings.set(SYSTEM_ID, "lastDeliveryPressure", value);
    // At 2 Chika guards the loading ramp unless she has already left the opposition.
    if (value >= 2 && delta > 0 && !flagsOf(this.actor("lookout")).status) {
      for (const token of this.tokensOf("lookout", ["station"])) await token.update({ hidden: false });
    }
    await whisperGM(game.i18n.format("TG.lastDelivery.pressureSet", { value, effect: game.i18n.localize(`TG.lastDelivery.pressure.${value}`) }), "fa-gauge-high");
  },

  async toggleDoor(doorKey) {
    if (!this.requireGM()) return;
    const wall = this.door(doorKey);
    if (!wall) return;
    const locked = wall.ds === CONST.WALL_DOOR_STATES.LOCKED;
    await wall.update({ ds: locked ? CONST.WALL_DOOR_STATES.CLOSED : CONST.WALL_DOOR_STATES.LOCKED });
    await whisperGM(game.i18n.format(locked ? "TG.lastDelivery.doorUnlocked" : "TG.lastDelivery.doorLocked", { door: game.i18n.localize(`TG.lastDelivery.doors.${doorKey}`) }), locked ? "fa-lock-open" : "fa-lock");
  },

  door(doorKey) {
    return this.scene(LOCKED_DOORS[doorKey])?.walls.find(wall => keyOf(wall) === doorKey);
  },

  doorLocked(doorKey) {
    const wall = this.door(doorKey);
    return wall ? wall.ds === CONST.WALL_DOOR_STATES.LOCKED : null;
  },

  /** Mark an NPC as recruited or captured: it never reappears as an enemy. */
  async setNpcStatus(actorKey, status) {
    if (!this.requireGM()) return;
    const actor = this.actor(actorKey);
    if (!actor) return;
    await actor.update({ [`flags.${SYSTEM_ID}.status`]: status, [`flags.${SYSTEM_ID}.noncombatant`]: true });
    const current = SCENES.indexOf(keyOf(canvas.scene));
    for (const [index, sceneKey] of SCENES.entries()) {
      // Unlinked tokens inherit the base actor's noncombatant flag.
      for (const token of this.tokensOf(actorKey, [sceneKey])) {
        if (status === "recruited") await token.update({ disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY });
        else if (index > current) await token.update({ hidden: true });
      }
    }
    if (status === "recruited" && actorKey === "lookout") for (const token of this.tokensOf("kaito")) await token.update({ disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY });
    await whisperGM(game.i18n.format(`TG.lastDelivery.npc.${status}`, { actor: actor.name }), status === "recruited" ? "fa-handshake" : "fa-handcuffs");
  },

  /** Copy wounds and spent Stamina of unlinked NPC tokens from the previous scene. */
  async carryWounds(targetKey = keyOf(canvas.scene)) {
    if (!this.requireGM()) return;
    const index = SCENES.indexOf(targetKey);
    if (index < 1) return ui.notifications.info(game.i18n.localize("TG.lastDelivery.noPreviousScene"));
    const previous = this.scene(SCENES[index - 1]), target = this.scene(targetKey);
    let carried = 0;
    for (const token of target.tokens.filter(t => !t.actorLink && t.actor)) {
      const source = previous.tokens.find(t => !t.actorLink && t.actorId === token.actorId && t.actor);
      if (!source) continue;
      const { vitality, stamina } = source.actor.system.resources;
      await token.actor.update({ "system.resources.vitality.value": vitality.value, "system.resources.stamina.value": stamina.value });
      if (vitality.value <= 0) await token.update({ hidden: true });
      carried++;
    }
    await whisperGM(game.i18n.format("TG.lastDelivery.woundsCarried", { count: carried, scene: target.name }), "fa-droplet");
  },

  async travel(sceneKey) {
    if (!this.requireGM()) return;
    const scene = this.scene(sceneKey);
    await scene.activate();
    if (SCENES.indexOf(sceneKey) > 0) await this.carryWounds(sceneKey);
  },

  async startEncounter() {
    if (!this.requireGM()) return;
    return startEncounter({ mode: "squad", scene: canvas.scene });
  },

  async revealToken(tokenId) {
    if (!game.user.isGM) return;
    const token = canvas.scene?.tokens.get(tokenId);
    if (token) await token.update({ hidden: !token.hidden });
  },

  openPanel() {
    if (!this.requireGM()) return null;
    return import("./last-delivery-panel.mjs").then(({ LastDeliveryPanel }) => LastDeliveryPanel.open());
  }
};
