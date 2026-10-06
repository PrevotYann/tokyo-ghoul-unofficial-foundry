import { resolveDefense } from "../rules/damage.mjs";
import { resolveQuinqueInterposeBlock, getTypeAdvantageBonus, getAntiGhoulQuinqueBonus } from "../rules/kagune-quinque.mjs";
import { rollD20Check, getMessageRolls } from "../rules/rolls.mjs";
import { SYSTEM_ID } from "../config.mjs";

let queue = Promise.resolve();
const pending = new Set();

async function actorFromUuid(uuid) {
  const document = await fromUuid(uuid);
  return document?.actor ?? document;
}

export async function resolveDefenseRequest(request, user) {
  const message = game.messages.get(request.messageId);
  const flags = message?.flags?.[SYSTEM_ID];
  if (!flags?.attack || !flags.rangeValidation?.valid) return;
  const defender = await actorFromUuid(request.defenderUuid);
  if (!defender || !defender.testUserPermission(user, "OWNER")) return;
  if (!flags.targets.some(target => target.uuid === request.defenderUuid || target.uuid === defender.uuid)) return;
  const key = `${message.id}.${defender.id}`;
  if (defender.getFlag(SYSTEM_ID, `resolved.${message.id}`)) return;
  const action = request.action;
  if (!["takeHit", "dodge", "block", "interpose"].includes(action)) return;
  const automatic = flags.automatic || !!defender.system.combat.grapple.grappledBy || defender.items.some(i=>i.type==="condition"&&i.system.conditionId==="grappled");
  if (action !== "takeHit" && !defender.system.combat.counterDeclared && (automatic || (defender.inCombat && (!defender.turnState.acted || defender.system.resources.maneuverBudget.reactionsReserved < 1)))) {
    ui.notifications.warn(game.i18n.localize("TG.notifications.noReservedReaction")); return;
  }
  const weapon = defender.getActiveQuinque();
  if (action === "interpose" && (!weapon || weapon.system.rcBonds.broken)) return;
  const grenade = flags.attack.grenade;
  if (action === "interpose" && grenade) return;
  let resolution, defenseRoll = null;
  if (defender.system.combat.counterDeclared && !grenade) {
    resolution = {success:true,vitalityDamage:0,staminaDamage:0,counter:{damageMultiplier:1,automatic:true}};
  } else if (action === "interpose") {
    const result = resolveQuinqueInterposeBlock({currentRcBonds:weapon.system.rcBonds.value,incomingDamage:flags.attack.damage});
    await weapon.update({"system.rcBonds.value":result.remainingRcBonds,"system.rcBonds.repairDaysRemaining":result.broken?7:0});
    resolution={success:true,vitalityDamage:result.vitalityDamage,staminaDamage:0,counter:{damageMultiplier:0},rcBondDamage:result.rcBondDamage};
  } else {
    const stat=action==="dodge"?"spd":"end";
    const edges=defender.getEdgeModifiers(defender.getDefaultAttackItem());
    const attacker=await actorFromUuid(flags.attackerActorUuid);
    const source=defender.getDefaultAttackItem();
    const typeBonus=getTypeAdvantageBonus({attackerSource:source?.type,attackerType:source?.system.primaryType,defenderType:flags.attack.primaryType,naturalPredator:edges.naturalPredator});
    const antiGhoul=getAntiGhoulQuinqueBonus({attackerClass:defender.system.identity.class,defenderClass:attacker?.system.identity.class,source:source?.type});
    const defenseGimmick=defender.items.find(i=>i.type==="gimmick"&&i.system.active&&i.system.gimmickType==="defense");
    const turnIndex=game.combat ? game.combat.round*10000+game.combat.turn : 0;
    const lastUse=defenseGimmick?.getFlag(SYSTEM_ID,"lastDefenseRound")??-2;
    if (action !== "takeHit") {
      if (defenseGimmick && (game.combat?.round??0)-lastUse>=2) {
        defenseRoll={total:flags.roll.total+1,formula:game.i18n.localize("TG.chat.defenseGimmick")};
        await defenseGimmick.setFlag(SYSTEM_ID,"lastDefenseRound",game.combat?.round??0);
      } else defenseRoll=await rollD20Check({actor:defender,stat,bonus:(action==="dodge"?edges.dodgeBonus:edges.blockBonus)+typeBonus+antiGhoul, penalty:grenade ? attacker?.getStat("acc") ?? 0 : 0});
    }
    let attackTotal=flags.roll.total;
    if (grenade) {
      attackTotal=action==="block"?grenade.blockTargetNumber:grenade.dodgeTargetNumber;
      if ((action==="block" && (grenade.blockRestriction==="cannotBlock" || defender.getDefaultAttackItem()?.system.primaryType!=="koukaku")) || attackTotal===null) attackTotal=Number.MAX_SAFE_INTEGER;
    }
    resolution=resolveDefense({defense:action,defenseTotal:defenseRoll?.total??0,attackTotal,damage:flags.attack.damage,harshConsequences:game.settings.get(SYSTEM_ID,"harshDefenses")});
    if (grenade) resolution.counter={damageMultiplier:0};
  }
  if (action !== "takeHit" && defender.inCombat && !defender.system.combat.counterDeclared) await defender.consumeReactionManeuver();
  await defender.setFlag(SYSTEM_ID,`resolved.${message.id}`,{action,at:Date.now()});
  if (resolution.vitalityDamage) await defender.applyDamage(resolution.vitalityDamage,{quiet:true,rc:["kagune","quinque"].includes(flags.attack.source)});
  if (resolution.staminaDamage) await defender.spendStamina(resolution.staminaDamage,{quiet:true});
  if (!resolution.success && flags.attack.edges?.includes("sharpened")) await defender.applyCondition("bleeding");
  if (!resolution.success && grenade?.applies?.includes("burning")) await defender.applyCondition("burning");
  if (grenade?.type==="rcLimiterGrenade") {
    await defender.applyCondition("rc-limiter-cloud",1,{remainingTurns:3,sourceActorUuid:flags.attackerActorUuid});
    for (const item of defender.items.filter(i=>i.type==="kagune"&&i.system.manifested)) await item.update({"system.manifested":false});
    await defender.deactivateKakuja();
  }
  const counter = resolution.counter.damageMultiplier > 0 && !flags.counterAttack && game.settings.get(SYSTEM_ID,"counterRewards");
  const raidFollowUp = defender.system.resources.vitality.value===0 && flags.attack.modeRules?.grantsDefeatFollowUpAttack;
  const content=await foundry.applications.handlebars.renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/defense-card.hbs",{defender,action,defenseRoll,resolution,canCounter:counter,raidFollowUp});
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:defender}),content,rolls:getMessageRolls(defenseRoll),flags:{[SYSTEM_ID]:{defenderActorUuid:defender.uuid,attackerActorUuid:flags.attackerActorUuid,defense:{action,defenseRoll,resolution},canCounter:counter,raidFollowUp}}});
  return resolution;
}

async function handleRequest(message) {
  if (!game.user.isActiveGM) return;
  const user=game.users.get(message.author?.id ?? message._source.author);
  if (!user) return;
  const heal=message.getFlag(SYSTEM_ID,"healRequest");
  if (heal) {
    const actor=await actorFromUuid(heal.actorUuid), item=await fromUuid(heal.itemUuid), target=await actorFromUuid(heal.targetUuid);
    if (!actor?.testUserPermission(user,"OWNER") || item?.parent?.uuid!==actor.uuid || item.system.consumableType!=="medkit" || !target) return;
    await actor.useConsumable(item,{target}); return;
  }
  const request=message.getFlag(SYSTEM_ID,"defenseRequest");
  if (!request) return;
  await resolveDefenseRequest(request,user);
}

export function registerChatCardListeners() {
  Hooks.on("createChatMessage",message=>{
    queue=queue.then(()=>handleRequest(message)).catch(error=>{console.error(`${SYSTEM_ID} | Defense resolution failed`,error);ui.notifications.error(game.i18n.localize("TG.notifications.workflowError"));});
  });
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-tg-chat-action]");
    if (!button) return;
    event.preventDefault();
    const message=game.messages.get(button.closest("[data-message-id]")?.dataset.messageId);
    const flags=message?.flags?.[SYSTEM_ID];
    if (!flags) return;
    const action=button.dataset.tgChatAction;
    if (pending.has(message.id)) return;
    pending.add(message.id); button.disabled=true;
    try {
      if (action==="counterAttack" || action==="raidFollowUp") {
        if (!flags[action==="counterAttack"?"canCounter":"raidFollowUp"] || flags.followUpUsed) return;
        const actor=await actorFromUuid(action==="counterAttack"?flags.defenderActorUuid:flags.attackerActorUuid);
        if (!actor?.isOwner || actor.getFlag(SYSTEM_ID,`followUps.${message.id}`)) return;
        const target=await actorFromUuid(flags.attackerActorUuid);
        const tier=flags.defense.resolution.counter;
        const result=await actor.rollAttack(null,{free:true,targets:action==="counterAttack"?[{name:target.name,uuid:target.uuid}]:undefined,damageMultiplier:action==="counterAttack"?tier.damageMultiplier:1,automatic:action==="counterAttack"&&tier.automatic});
        if (result) {
          await result.message.setFlag(SYSTEM_ID,"counterAttack",action==="counterAttack");
          // The follow-up card is GM-owned. Owner records usage on their Actor instead.
          await actor.setFlag(SYSTEM_ID,`followUps.${message.id}`,true);
          button.disabled=true;
        }
        return;
      }
      if (!["dodge","block","takeHit","interpose"].includes(action)) return;
      const target=flags.targets?.[0];
      const actor=await actorFromUuid(target?.uuid);
      if (!actor?.isOwner) {ui.notifications.warn(game.i18n.localize("TG.notifications.noPermission"));return;}
      if (!game.users.activeGM) {ui.notifications.warn(game.i18n.localize("TG.notifications.activeGMRequired"));return;}
      if (actor.getFlag(SYSTEM_ID,`resolved.${message.id}`)) {ui.notifications.warn(game.i18n.localize("TG.notifications.alreadyResolved"));return;}
      await ChatMessage.create({content:game.i18n.format("TG.chat.defenseRequested",{actor:actor.name,action:game.i18n.localize(`TG.actions.${action}`)}),whisper:[game.users.activeGM.id],flags:{[SYSTEM_ID]:{defenseRequest:{messageId:message.id,defenderUuid:target.uuid,action}}}});
    } catch(error) {console.error(error);ui.notifications.error(game.i18n.localize("TG.notifications.workflowError"));}
    finally {pending.delete(message.id);button.disabled=false;}
  });
}
