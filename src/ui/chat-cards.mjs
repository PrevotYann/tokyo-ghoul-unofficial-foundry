import { resolveDefense } from "../rules/damage.mjs";
import { rollD20Check } from "../rules/rolls.mjs";

const SYSTEM_ID = "tokyo-ghoul-unofficial";

function getMessageFromEvent(event) {
  const messageElement = event.target.closest?.(".message");
  const messageId = messageElement?.dataset?.messageId;
  return messageId ? game.messages.get(messageId) : null;
}

async function resolveActorReference(reference) {
  if (!reference) return null;
  const document = await fromUuid(reference);
  return document?.actor ?? document;
}

async function getDefenseActor(message) {
  const flags = message?.flags?.[SYSTEM_ID];
  const firstTarget = flags?.targets?.[0];
  const targetActor = await resolveActorReference(firstTarget?.uuid);
  if (targetActor) return targetActor;

  const controlled = globalThis.canvas?.tokens?.controlled?.[0]?.actor;
  if (controlled) return controlled;

  const speakerActor = message?.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
  return speakerActor ?? null;
}

async function handleDefenseAction(message, action) {
  const flags = message?.flags?.[SYSTEM_ID];
  if (!flags?.attack || !flags?.roll) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noAttackContext"));
    return;
  }

  const defender = await getDefenseActor(message);
  if (!defender) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noDefenseActor"));
    return;
  }

  if (!defender.isOwner && !game.user.isGM) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noPermission"));
    return;
  }

  if (action === "takeHit") {
    const resolution = resolveDefense({
      defense: "takeHit",
      attackTotal: flags.roll.total,
      damage: flags.attack.damage
    });
    await defender.applyDamage(resolution.vitalityDamage, { quiet: true });
    await createDefenseMessage({ defender, action, resolution });
    return;
  }

  const stat = action === "dodge" ? "spd" : "end";
  const reaction = await defender.consumeReactionManeuver?.();
  if (reaction && !reaction.consumed) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noReservedReaction"));
  }

  const edgeModifiers = defender.getEdgeModifiers?.() ?? {};
  const bonus = action === "dodge" ? edgeModifiers.dodgeBonus ?? 0 : edgeModifiers.blockBonus ?? 0;
  const defenseRoll = await rollD20Check({ actor: defender, stat, bonus, opponentTotal: flags.roll.total });
  const resolution = resolveDefense({
    defense: action,
    defenseTotal: defenseRoll.total,
    attackTotal: flags.roll.total,
    damage: flags.attack.damage
  });

  if (resolution.vitalityDamage > 0) await defender.applyDamage(resolution.vitalityDamage, { quiet: true });
  if (resolution.staminaDamage > 0) await defender.spendStamina(resolution.staminaDamage, { quiet: true });
  await createDefenseMessage({ defender, action, defenseRoll, resolution });
}

async function handleGmControlAction(message, action) {
  if (!game.user.isGM) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noPermission"));
    return;
  }

  const flags = message?.flags?.[SYSTEM_ID];
  const actor = await getDefenseActor(message);
  if (!actor || !flags?.attack) {
    ui.notifications?.warn(game.i18n.localize("TG.notifications.noDefenseActor"));
    return;
  }

  const amount = action === "gmApplyHalfDamage" ? Math.floor(flags.attack.damage / 2) : flags.attack.damage;
  if (action === "gmApplyStaminaDamage") await actor.spendStamina(amount, { quiet: true });
  else await actor.applyDamage(amount, { quiet: true });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: game.i18n.format("TG.chat.gmAdjustment", {
      actor: actor.name,
      amount,
      resource: game.i18n.localize(action === "gmApplyStaminaDamage" ? "TG.resources.stamina.label" : "TG.resources.vitality.label")
    }),
    flags: {
      [SYSTEM_ID]: {
        gmAdjustment: { action, amount, actorUuid: actor.uuid }
      }
    }
  });
}

async function createDefenseMessage({ defender, action, defenseRoll = null, resolution }) {
  const content = await renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/defense-card.hbs", {
    defender,
    action,
    defenseRoll,
    resolution
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: defender }),
    content,
    flags: {
      [SYSTEM_ID]: {
        defense: {
          action,
          defenseRoll,
          resolution
        }
      }
    }
  });
}

export function registerChatCardListeners() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest?.("[data-tg-chat-action]");
    if (!button) return;
    event.preventDefault();

    const action = button.dataset.tgChatAction;
    if (["dodge", "block", "takeHit"].includes(action)) {
      await handleDefenseAction(getMessageFromEvent(event), action);
      return;
    }

    if (["gmApplyDamage", "gmApplyHalfDamage", "gmApplyStaminaDamage"].includes(action)) {
      await handleGmControlAction(getMessageFromEvent(event), action);
      return;
    }

    ui.notifications?.info(game.i18n.localize("TG.chat.notImplemented"));
  });
}
