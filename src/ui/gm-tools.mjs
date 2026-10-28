import { SYSTEM_ID } from "../config.mjs";
import { getManeuverBudgetForMode } from "../rules/combat-workflow.mjs";

export function getEncounterMode(combat) {
  return combat?.getFlag(SYSTEM_ID, "mode") === "raid" ? "raid" : "squad";
}

/** Apply Squad or Raid rules to every combatant of an encounter (PDF pp. 33, 37). */
export async function setEncounterMode(combat, mode = "squad") {
  if (!game.user.isGM || !combat) return;
  const budget = getManeuverBudgetForMode(mode);
  await combat.setFlag(SYSTEM_ID, "mode", mode);
  for (const actor of new Set(combat.combatants.map(c => c.actor).filter(a => a?.system?.combat))) {
    const armorBonus = actor.getActiveKakujaArmor?.()?.system.armorType === "speed" ? 1 : 0;
    await actor.update({
      "system.combat.mode": mode,
      "system.resources.maneuverBudget.max": budget + armorBonus,
      "system.resources.maneuverBudget.value": Math.min(actor.system.resources.maneuverBudget.value, budget + armorBonus)
    });
  }
  ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), content: `<section class="tg-system tg-chat-card tg-card-alert"><div class="tg-card-log-line"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i><p>${game.i18n.format("TG.gm.modeSet", { mode: game.i18n.localize(`TG.combat.${mode}`) })}</p></div></section>` });
}

/** Whether a token should join an automatically started encounter. */
export function isEncounterParticipant(token) {
  const actor = token.actor;
  return !token.hidden && !!actor?.system?.resources && actor.system.resources.vitality.value > 0
    && !actor.getFlag(SYSTEM_ID, "noncombatant");
}

/** Create, populate and start an encounter from the visible combatants of a scene. */
export async function startEncounter({ mode = "squad", scene = canvas?.scene } = {}) {
  if (!game.user.isGM || !scene) return null;
  const tokens = scene.tokens.filter(isEncounterParticipant);
  if (!tokens.length) { ui.notifications.warn(game.i18n.localize("TG.gm.noParticipants")); return null; }
  const combat = await Combat.create({ scene: scene.id, active: true });
  await combat.createEmbeddedDocuments("Combatant", tokens.map(token => ({ tokenId: token.id, sceneId: scene.id, actorId: token.actorId, hidden: false })));
  await setEncounterMode(combat, mode);
  await combat.rollAll();
  await combat.startCombat();
  return combat;
}

export function registerGmTools() {
  Hooks.on("renderCombatTracker", (app, element) => {
    const root = element instanceof HTMLElement ? element : element?.[0];
    const combat = app.viewed ?? game.combat;
    if (!root || !game.user.isGM || !combat || root.querySelector(".tg-mode-toggle")) return;
    const mode = getEncounterMode(combat);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tg-mode-toggle tg-mode-${mode}`;
    button.dataset.tooltip = game.i18n.localize("TG.gm.toggleMode");
    button.innerHTML = `<i class="fa-solid ${mode === "raid" ? "fa-users" : "fa-user-group"}" aria-hidden="true"></i> ${game.i18n.localize(`TG.combat.${mode}`)}`;
    button.addEventListener("click", () => setEncounterMode(combat, mode === "raid" ? "squad" : "raid"));
    (root.querySelector(".combat-tracker-header") ?? root.querySelector("header") ?? root).append(button);
  });
}
