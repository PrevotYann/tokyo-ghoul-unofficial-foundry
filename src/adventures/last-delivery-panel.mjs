import { SYSTEM_ID } from "../config.mjs";
import { lastDelivery, PRESSURE_MAX } from "./last-delivery-gm.mjs";

let instance = null;

/** GM-only control panel for The Last Delivery. Re-renders on relevant document changes. */
export class LastDeliveryPanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tg-last-delivery-panel",
    classes: ["tg-system", "tg-sheet", "tg-gm-panel"],
    window: { title: "TG.lastDelivery.panelTitle", icon: "fa-solid fa-clapperboard", resizable: true },
    position: { width: 460, height: "auto" },
    actions: {
      partySize: (event, target) => lastDelivery.setPartySize(Number(target.dataset.size)),
      pressure: (event, target) => lastDelivery.adjustPressure(Number(target.dataset.delta)),
      door: (event, target) => lastDelivery.toggleDoor(target.dataset.door),
      travel: (event, target) => lastDelivery.travel(target.dataset.scene),
      carry: () => lastDelivery.carryWounds(),
      encounter: () => lastDelivery.startEncounter(),
      npc: (event, target) => lastDelivery.setNpcStatus(target.dataset.actor, target.dataset.status),
      reveal: (event, target) => lastDelivery.revealToken(target.dataset.token)
    }
  };

  static PARTS = { body: { template: "systems/tokyo-ghoul-unofficial/templates/apps/last-delivery-panel.hbs" } };

  static open() {
    instance ??= new LastDeliveryPanel();
    return instance.render({ force: true });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const scene = canvas.scene;
    const sceneKey = scene?.flags?.[SYSTEM_ID]?.key;
    const pressure = lastDelivery.pressure;
    const npcKeys = ["guard", "lookout", "boss"];
    return {
      ...context,
      partySize: lastDelivery.partySize,
      sizes: [4, 5, 6].map(size => ({ size, active: size === lastDelivery.partySize })),
      pressure,
      pressureMax: PRESSURE_MAX,
      pressurePips: Array.from({ length: PRESSURE_MAX }, (_, i) => ({ filled: i < pressure })),
      pressureEffect: `TG.lastDelivery.pressure.${pressure}`,
      scenes: ["alley", "clinic", "station"].map(key => ({ key, name: lastDelivery.scene(key)?.name, current: key === sceneKey, active: lastDelivery.scene(key)?.active })),
      doors: ["serviceDoor", "captiveGate"].map(key => ({ key, label: `TG.lastDelivery.doors.${key}`, locked: lastDelivery.doorLocked(key) })),
      npcs: npcKeys.map(key => lastDelivery.actor(key)).filter(Boolean).map(actor => ({ key: actor.flags[SYSTEM_ID].key, name: actor.name, img: actor.img, status: actor.flags[SYSTEM_ID].status ?? null })),
      hiddenTokens: sceneKey ? scene.tokens.filter(token => token.hidden && !token.actorLink && token.actor).map(token => ({ id: token.id, name: token.name })) : [],
      onAdventureScene: !!sceneKey,
      sceneKey
    };
  }

  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    const refresh = foundry.utils.debounce(() => this.rendered && this.render(), 150);
    this._hooks = [
      ["updateSetting", refresh], ["updateWall", refresh], ["updateToken", refresh], ["updateActor", refresh], ["canvasReady", refresh], ["updateScene", refresh]
    ].map(([hook, fn]) => [hook, Hooks.on(hook, fn)]);
  }

  _onClose(options) {
    super._onClose?.(options);
    for (const [hook, id] of this._hooks ?? []) Hooks.off(hook, id);
    this._hooks = [];
  }
}
