import { SYSTEM_ID } from "../config.mjs";
import { buildAttackSummary, getManeuverBudgetForMode, validateAttackRange } from "../rules/combat-workflow.mjs";
import { planManeuver, modifyAttack, distanceToRangeBand, counterDamage } from "../rules/actions.mjs";
import { hasEdge } from "../rules/edges.mjs";
import { resolveRegeneration } from "../rules/conditions.mjs";
import { getCrossedResourceThresholds, calculateHungerTargetNumber, calculateRageTargetNumber, resolveHungerFailure, resolveRageFailure, restoreMealScore } from "../rules/hunger-rage.mjs";
import { getKakujaEligibility, getKakujaSelections, getKakujaStatBonus, getKakujaArmorTypeEffect, calculateKakujaUpkeep, advanceKakujaMastery, calculateKakujaArmorParasiticDamage, calculateKakujaArmorDamageReduction } from "../rules/kakuja.mjs";
import { getTypeAdvantageBonus, getAntiGhoulQuinqueBonus } from "../rules/kagune-quinque.mjs";
import { calculateGimmickStaminaCost } from "../rules/gimmicks.mjs";
import { calculateMedkitUse, getGrenadeProfile } from "../rules/consumables.mjs";
import { rollD20Check } from "../rules/rolls.mjs";
import { clampResource } from "../rules/damage.mjs";
import { promptFields, escapeHTML } from "../sheets/roll-dialogs.mjs";

export const actorAutomation = Base => class extends Base {
  get inCombat() { return !!game.combat?.started && game.combat.combatants.some(c => c.actor?.uuid === this.uuid); }
  get turnState() { return this.getFlag(SYSTEM_ID, "turn") ?? {}; }
  notify(key) { ui.notifications.warn(game.i18n.localize(key)); return null; }
  async log(key, data = {}) {
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: `<section class="tg-system tg-chat-card"><p>${escapeHTML(game.i18n.format(key, {actor:this.name,...data}))}</p></section>` });
  }

  async beginTurn() {
    const armor = this.getActiveKakujaArmor();
    const max = getManeuverBudgetForMode(this.system.combat.mode) + (armor?.system.armorType === "speed" ? 1 : 0);
    await this.update({ "system.resources.maneuverBudget.value": max, "system.resources.maneuverBudget.max": max,
      "system.resources.maneuverBudget.reactionsReserved": 0, "system.combat.counterDeclared": false,
      [`flags.${SYSTEM_ID}.turn`]: { acted: true, breather: false, locked: false } });
    for (const gimmick of this.items.filter(i => i.type === "gimmick" && i.system.active)) {
      const cost = calculateGimmickStaminaCost({mode: gimmick.system.gimmickType === "utility" ? "tripleMaxEndSpd" : "maxEndSpd", end: this.getStat("end"), spd: this.getStat("spd"), free: this.getActiveQuinque()?.system.kakuja.freeGimmick});
      await this.spendStamina(cost, { quiet: true });
    }
    const injury = this.getFlag(SYSTEM_ID, "injury") ?? {};
    const suppressed = this.system.hunger.regenerationSuppressed || this.items.some(i => i.type === "condition" && i.system.conditionId === "rc-limiter-cloud");
    const regeneration = resolveRegeneration({injury,type:this.getEdgeModifiers().regenerationType,end:this.getStat("end"),crl:this.getStat("crl"),suppressed});
    if (regeneration.healing) await this.update({"system.resources.vitality.value":clampResource(this.system.resources.vitality.value+regeneration.healing,0,this.getVitalityMax()), [`flags.${SYSTEM_ID}.injury`]:regeneration.injury});
    await this.processStartTurnConditions({quiet:false});
  }

  async spendManeuver(action, { free = false, weapon = this.getDefaultAttackItem() } = {}) {
    if (!this.isOwner) return this.notify("TG.notifications.noPermission");
    if (this.system.resources.vitality.value <= 0) return this.notify("TG.notifications.incapacitated");
    if (this.system.kakuja.lostControl && !game.user.isGM) return this.notify("TG.notifications.lostControl");
    if ((this.system.combat.grapple.grappledBy || this.items.some(i=>i.type==="condition"&&i.system.conditionId==="grappled")) && !["breather","breakGrapple"].includes(action)) return this.notify("TG.notifications.grappleRestricted");
    if (free) return {allowed:true, stamina:0,staminaPaid:0};
    if (this.inCombat && game.combat.combatant?.actor?.uuid !== this.uuid) return this.notify("TG.notifications.notYourTurn");
    const plan = planManeuver({ action, remaining:this.inCombat?this.system.resources.maneuverBudget.value:3, breather:this.inCombat&&this.turnState.breather, counter:this.inCombat&&this.system.combat.counterDeclared,
      grappling:this.inCombat&&this.turnState.locked, grappled:!!this.system.combat.grapple.grappledBy || this.items.some(i=>i.type==="condition"&&i.system.conditionId==="grappled"), edges:this.getEdgeNames(weapon),
      str:this.getStat("str"), spd:this.getStat("spd"), per:this.getStat("per"), investigator:this.system.identity.class !== "ghoul"&&weapon?.type==="quinque" });
    if (!plan.allowed) return this.notify(plan.reason);
    if (this.inCombat) await this.update({"system.resources.maneuverBudget.value":plan.remaining});
    if (action !== "breather" && this.system.resources.rage.active) await this.spendStamina(this.getEdgeModifiers().autoFailCrl ? 1 : 2, {quiet:true});
    const armor=this.getActiveKakujaArmor();
    const quinxKagune=!!armor && this.system.identity.class==="quinx" && weapon?.type==="kagune";
    plan.staminaPaid = plan.stamina && (armor?.system.armorType !== "attack" || quinxKagune) ? plan.stamina*(quinxKagune?2:1) : 0;
    if (plan.staminaPaid) await this.spendStamina(plan.staminaPaid,{quiet:true});
    return plan;
  }

  async buildAttack(item, options) {
    const edges = this.getEdgeNames(item);
    const armor = this.getActiveKakujaArmor();
    const armorEffect = armor ? getKakujaArmorTypeEffect({armorType:armor.system.armorType,selectedAttackStat:armor.system.selectedAttackStat,variant:game.settings.get(SYSTEM_ID,"armorRules")}) : {statMultipliers:{}};
    const multipliers=armorEffect.statMultipliers;
    const lightweight = item?.type === "quinque" && edges.includes("lightweight") && options.attackMode !== "ranged";
    const rclBonus = this.system.kakuja.active && item?.type === "kagune" ? getKakujaStatBonus(this.system.kakuja.selectedBonus,"rcl") : 0;
    const source = item ? { type:item.type, name:item.name, system:{...item.system, rcl:item.system.rcl+rclBonus} } : null;
    const raw = buildAttackSummary({stats:{str:lightweight ? this.getStat("spd") : this.getStat("str"), acc:this.getStat("acc")}, item:source, ...options, combatMode:this.system.combat.mode});
    const damageStat=options.attackMode==="ranged"?"acc":lightweight?"spd":"str";
    const damageStatBonus=this.getStat(damageStat)*((multipliers[damageStat]??1)-1);
    const gimmick = item?.type === "quinque" ? this.items.find(i => i.type === "gimmick" && i.system.active) : null;
    return {...modifyAttack(raw,{action:options.action, str:this.getStat("str"), heavyDamageStat:this.getStat("str")*(multipliers.str??1), damageStatBonus, spd:this.getStat("spd"), end:this.getStat("end"), per:this.getStat("per"), rcl:source?.system.rcl??0, stat:this.getStat(gimmick?.system.selectedStat??"str")*(multipliers[gimmick?.system.selectedStat]??1), edges, mode:this.system.combat.mode, armor:armor?.system.armorType==="attack"&&!(item?.type==="kagune"&&this.system.identity.class==="quinx"), gimmick:gimmick?.system, allOut:options.allOut}), itemUuid:item?.uuid, primaryType:options.sidearm ? item?.system.sidearm.ammoType : item?.system.primaryType, edges};
  }

  async rollAttack(item = null, options = {}) {
    if (!this.isOwner) return this.notify("TG.notifications.noPermission");
    const source = options.explicitSource ? item : item ?? this.getDefaultAttackItem();
    if (["heavyStrike","overextend"].includes(options.action) && options.attackMode === "ranged") return this.notify("TG.notifications.meleeOnly");
    if (options.action === "heavyStrike" && !["kagune","quinque"].includes(source?.type)) return this.notify("TG.notifications.requiredEdge");
    if (source?.type === "kagune" && (!source.system.manifested || this.items.some(i => i.type === "condition" && i.system.conditionId === "rc-limiter-cloud"))) return this.notify("TG.notifications.weaponInactive");
    if (source?.type === "quinque" && (!source.system.equipped || source.system.rcBonds.broken)) return this.notify("TG.notifications.weaponInactive");
    if (options.attackMode === "ranged" && source && !options.sidearm && !source.system.range.projectile) return this.notify("TG.validation.targetOutOfRange");
    if (options.sidearm && (!source?.system.sidearm.enabled || source.system.sidearm.ammo.value < 1)) return this.notify("TG.notifications.noAmmo");
    const targets = options.targets ?? Array.from(game.user.targets ?? []).map(t => ({name:t.name, uuid:t.document.uuid}));
    // Each attack has one defender. All-Out and grenades provide separate cards per defender.
    if (targets.length !== 1) return this.notify("TG.notifications.oneTarget");
    const targetDocument = await fromUuid(targets[0].uuid);
    const defender = targetDocument?.actor ?? targetDocument;
    if (!defender?.system || defender.uuid === this.uuid) return this.notify("TG.notifications.oneTarget");
    let band = options.targetRangeBand ?? this.system.combat.rangeBand;
    const ownToken = this.getActiveTokens()[0];
    if (ownToken && targetDocument?.object && canvas.grid?.measurePath) {
      const measurement = canvas.grid.measurePath([ownToken.center, targetDocument.object.center]);
      band = distanceToRangeBand(measurement.distance) ?? band;
    }
    let range = source?.system.range ?? {melee:"melee",projectile:"long"};
    const edges = this.getEdgeNames(source);
    const bands = ["melee","close","mid","long","far","infinite"];
    const extend = value => bands[Math.min(bands.indexOf(value)+1,bands.length-1)];
    range = {...range};
    if (edges.includes("massive")) {range.melee=extend(range.melee); if (range.projectile) range.projectile=source?.system.primaryType==="ukaku" ? "infinite" : extend(range.projectile);}
    if (options.action === "overextend") range.melee=extend(range.melee);
    const rangeValidation = validateAttackRange({item:source ? {system:{range}} : null, ...options, targetRangeBand:band});
    if (!rangeValidation.valid) return this.notify(rangeValidation.message);
    if (options.preview) return {attack:await this.buildAttack(source,options),targets,rangeValidation};
    const action = options.action ?? "strike";
    const maneuverSpend=await this.spendManeuver(action,{free:options.free,weapon:source});
    if (!maneuverSpend) return null;
    const attack = await this.buildAttack(source, options);
    if (source?.type === "kagune" && this.system.identity.class === "quinx" && this.getActiveKakujaArmor()) attack.staminaCost *= 2;
    const targetWeapon = defender.getDefaultAttackItem?.();
    const typeBonus = getTypeAdvantageBonus({attackerSource:attack.source, attackerType:attack.primaryType, defenderType:targetWeapon?.system.primaryType, naturalPredator:edges.includes("natural-predator")});
    const antiGhoul = getAntiGhoulQuinqueBonus({attackerClass:this.system.identity.class, defenderClass:defender.system.identity.class, source:attack.source});
    const cloud = this.items.some(i => i.type === "condition" && i.system.conditionId === "rc-limiter-cloud") || defender.items.some(i => i.type === "condition" && i.system.conditionId === "rc-limiter-cloud");
    const roll = await rollD20Check({actor:this,stat:"per",bonus:Number(options.bonus??0)+attack.bonus+typeBonus+antiGhoul,penalty:Number(options.penalty??0)+attack.penalty+(cloud?this.getStat("acc"):0)});
    const resourceSpend = options.spendResources === false ? {staminaSpent:0,vitalityCost:0} : await this.spendStamina(attack.staminaCost,{quiet:true});
    if (options.sidearm) await source.update({"system.sidearm.ammo.value":source.system.sidearm.ammo.value-1});
    if (options.damageMultiplier) attack.damage=counterDamage(attack.damage,options.damageMultiplier);
    const data = {actor:this,attack,targets,rangeValidation,roll,resourceSpend,maneuverSpend};
    const content = await foundry.applications.handlebars.renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/attack-card.hbs",data);
    const message = await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:this}),content,flags:{[SYSTEM_ID]:{attackerActorUuid:this.uuid,attack,targets,rangeValidation,roll,resourceSpend,maneuverSpend,automatic:options.automatic??false}}});
    return {...data,message};
  }

  async spendStamina(amount, options = {}) {
    const cost = Math.max(0,Number(amount)||0), resource=this.system.resources.stamina;
    const spent = Math.min(resource.value,cost), overflow=cost-spent;
    const previous=resource.value;
    await this.update({"system.resources.stamina.value":Math.max(0,previous-spent)});
    if (overflow) await this.applyDamage(overflow,{quiet:true,bypassArmor:true});
    if (!options.skipChecks && this.inCombat && ["ghoul","quinx"].includes(this.system.identity.class)) await this.checkThresholds("hunger",previous,this.system.resources.stamina);
    if (!options.quiet && cost) await this.log("TG.chat.spendStamina",{amount:cost,vitality:overflow});
    return {staminaSpent:spent,vitalityCost:overflow};
  }

  async applyDamage(amount, options = {}) {
    let damage=Math.max(0,Number(amount)||0);
    if (!options.bypassArmor && this.getActiveKakujaArmor()) damage=calculateKakujaArmorDamageReduction({incomingDamage:damage,armorRcl:this.getActiveKakujaArmor().system.rcl,end:this.getStat("end"),variant:game.settings.get(SYSTEM_ID,"armorRules")});
    const vitality=this.system.resources.vitality, previous=vitality.value;
    const injury=this.getFlag(SYSTEM_ID,"injury")??{};
    const normalDamage=injury.normalDamage??(injury.rc?0:injury.amount??0), rcDamage=injury.rcDamage??(injury.rc?injury.amount??0:0);
    await this.update({"system.resources.vitality.value":Math.max(0,previous-damage),[`flags.${SYSTEM_ID}.injury`]:{normalDamage:normalDamage+(!options.rc?Math.min(previous,damage):0),rcDamage:rcDamage+(options.rc?Math.min(previous,damage):0)}});
    if (!options.skipChecks && this.inCombat && ["investigator","quinx"].includes(this.system.identity.class)) await this.checkThresholds("rage",previous,this.system.resources.vitality);
    if (!options.quiet && damage) await this.log("TG.chat.applyDamage",{amount:damage});
    return damage;
  }

  async checkThresholds(kind, previousValue, resource) {
    const crossed=getCrossedResourceThresholds({previousValue,currentValue:resource.value,maxValue:resource.max});
    for (const threshold of crossed) await this.checkHungerOrRage(threshold.key,{kind,context:this.inCombat?"inCombat":"outOfCombat"});
  }

  async checkHungerOrRage(trigger="manual",options={}) {
    const cls=this.system.identity.class, results=[];
    for (const kind of options.kind ? [options.kind] : cls==="quinx" ? ["hunger","rage"] : [cls==="ghoul"?"hunger":"rage"]) {
      const edge=this.getEdgeModifiers(this.getDefaultAttackItem());
      const targetNumber=kind==="hunger" ? calculateHungerTargetNumber({mealScore:this.system.resources.mealScore,stamina:this.system.resources.stamina,context:options.context??(this.inCombat?"inCombat":"outOfCombat")}) : calculateRageTargetNumber(this.system.resources.vitality);
      const roll=edge.autoPassCrl ? {total:targetNumber+1,success:true} : edge.autoFailCrl ? {total:0,success:false} : await rollD20Check({actor:this,stat:"crl",targetNumber});
      if (!roll.success) {
        if (kind==="hunger" && !this.system.hunger.active) {
          const failure=resolveHungerFailure({vitality:this.system.resources.vitality,rampant:edge.autoFailCrl});
          await this.update({"system.hunger.active":true,"system.hunger.regenerationSuppressed":failure.suppressesRegeneration});
          if (failure.vitalityDamage) await this.applyDamage(failure.vitalityDamage,{quiet:true,bypassArmor:true,skipChecks:true});
          if (failure.tempStatBudget) await this.allocateTemporaryStats("hunger");
        } else if (kind==="rage" && !this.system.resources.rage.active && !edge.preventsRage) await this.enterRage({voluntary:false});
        const eligibility=getKakujaEligibility({actorClass:cls,rcl:this.items.find(i=>i.type==="kagune")?.system.rcl,edges:this.getEdgeNames(this.getDefaultAttackItem()),masteredHalf:this.system.kakuja.masteredHalf});
        if (eligibility.canHalf) await this.update({"system.kakuja.eligible":true});
      }
      await this.log("TG.chat.controlCheck",{kind:game.i18n.localize(`TG.control.${kind}`),trigger,total:roll.total,target:targetNumber});
      if (kind==="hunger" && this.system.kakuja.active) await this.resolveKakujaMasteryRoll(roll);
      results.push({kind,targetNumber,roll});
    }
    return results;
  }

  async allocateTemporaryStats(kind="rage") {
    const data=await promptFields("TG.dialog.temporaryStats",["str","acc","per","end","spd","crl"].map(key=>({name:key,label:`TG.stats.${key}.label`,value:0,min:0,max:10})),{hint:"TG.dialog.tenPoints"});
    if (!data) return;
    const assigned=Object.fromEntries(Object.entries(data).map(([key,value])=>[key,Number(value)]));
    if (Object.values(assigned).some(v=>!Number.isInteger(v)||v<0)||Object.values(assigned).reduce((a,b)=>a+b,0)>10) return this.notify("TG.notifications.invalidAllocation");
    await this.update({[kind==="rage"?"system.resources.rage.assigned":`flags.${SYSTEM_ID}.hungerAssigned`]:assigned});
  }

  async enterRage({voluntary=true}={}) {
    if (this.system.identity.class==="ghoul" || this.getEdgeModifiers(this.getDefaultAttackItem()).preventsRage || this.system.resources.rage.active) return;
    const result=resolveRageFailure({voluntary,rampant:this.getEdgeModifiers(this.getDefaultAttackItem()).autoFailCrl});
    await this.update({"system.resources.rage.active":true,"system.resources.rage.voluntarilyEntered":voluntary,"system.resources.rage.tempStatBudget":10});
    if (result.initialStaminaLoss) await this.spendStamina(result.initialStaminaLoss,{quiet:true,skipChecks:true});
    await this.allocateTemporaryStats();
  }

  async feed(mode="fullHumanMeal") {
    const meal=this.system.resources.mealScore;
    const value=restoreMealScore(meal,mode==="fullGhoulMeal"&&hasEdge(this.getEdgeNames(this.getDefaultAttackItem()),"cannibalistic")?"cannibalisticGhoulMeal":mode);
    await this.update({"system.resources.mealScore.value":value,"system.hunger.active":false,"system.hunger.regenerationSuppressed":false,[`flags.${SYSTEM_ID}.hungerAssigned`]:{}});
  }

  async applyCondition(conditionId,stacks=1,effect={}) {
    const existing=this.items.find(i=>i.type==="condition"&&i.system.conditionId===conditionId);
    if (existing) return existing.update({"system.stacks":existing.system.stacks+stacks,"system.effect":{...existing.system.effect,...effect}});
    return this.createEmbeddedDocuments("Item",[{name:game.i18n.localize(`TG.conditions.${conditionId}`),type:"condition",system:{conditionId,stacks,stackable:true,effect,automation:"full"}}]);
  }

  async processEndTurnConditions(options={}) {
    if (this.system.hunger.active && !this.turnState.breather && !this.getEdgeModifiers(this.getDefaultAttackItem()).autoFailCrl) await this.applyDamage(1,{quiet:true,bypassArmor:true});
    if (this.system.combat.grapple.isGrappling) await this.spendStamina(this.getStat("end"),{quiet:true});
    if (this.system.kakuja.active) {
      const k=this.system.kakuja, kagune=this.getActiveKagune();
      const mastered=k.stage==="full"?k.masteredFull:k.masteredHalf;
      const upkeep=calculateKakujaUpkeep({stage:k.stage,rcl:kagune?.system.rcl??0,mastered});
      await this.spendStamina(upkeep,{quiet:true});
      if (!mastered && !k.lostControl && !this.getEdgeModifiers(kagune).autoFailCrl) await this.checkKakujaMastery();
      if (!this.system.resources.stamina.value) await this.update({"system.kakuja.lostControl":true});
      if (!this.system.resources.vitality.value || (k.lostControl && !this.system.resources.stamina.value)) await this.deactivateKakuja();
    }
    const armor=this.getActiveKakujaArmor();
    if (armor) {
      const turns=armor.system.turnsActive+1;
      await armor.update({"system.turnsActive":turns});
      const damage=calculateKakujaArmorParasiticDamage({armorRcl:armor.system.rcl,weaponRcl:this.getActiveQuinque()?.system.rcl??0,turnsActive:turns});
      if (damage) await this.applyDamage(damage,{quiet:false,bypassArmor:true});
    }
    for (const weapon of this.items.filter(i=>i.type==="quinque"&&hasEdge(i.system.edges,"high-speed-regeneration"))) {
      const brokenTurns=(weapon.getFlag(SYSTEM_ID,"brokenTurns")??0)+(weapon.system.rcBonds.broken?1:0);
      await weapon.update({"system.rcBonds.value":brokenTurns>=2?weapon.system.rcBonds.max:Math.min(weapon.system.rcBonds.max,weapon.system.rcBonds.value+this.getStat("end")),[`flags.${SYSTEM_ID}.brokenTurns`]:brokenTurns>=2?0:brokenTurns});
    }
    const actors = new Set([this,...game.actors,...(game.combat?.combatants.map(c=>c.actor).filter(Boolean)??[])]);
    for (const actor of actors) for (const condition of actor.items.filter(i=>i.type==="condition"&&Number.isFinite(i.system.effect.remainingTurns))) {
      const clock = condition.system.effect.sourceActorUuid;
      if (clock ? clock!==this.uuid : actor.uuid!==this.uuid) continue;
      if (condition.system.effect.remainingTurns<=1) await condition.delete();
      else await condition.update({"system.effect.remainingTurns":condition.system.effect.remainingTurns-1});
    }
  }

  async activateKakuja({stage="half",selectedStat=null}={}) {
    const kagune=this.getActiveKagune();
    const eligibility=getKakujaEligibility({actorClass:this.system.identity.class,rcl:kagune?.system.rcl,edges:this.getEdgeNames(kagune),masteredHalf:this.system.kakuja.masteredHalf});
    if (!kagune || !(stage==="full"?eligibility.canFull:eligibility.canHalf) || (!this.system.kakuja.eligible && !this.getEdgeModifiers(kagune).autoFailCrl)) return this.notify("TG.notifications.kakujaIneligible");
    if (this.system.kakuja.active) return;
    const choices=getKakujaSelections(kagune._source.system.primaryType,hasEdge(kagune.system.edges,"chimera") ? kagune.system.secondaryType : null,stage);
    const remembered=this.getFlag(SYSTEM_ID,`kakujaChoice.${stage}`);
    if (!selectedStat && !remembered) {
      const data=await promptFields("TG.actions.activateKakuja",[{name:"stat",label:"TG.sheet.stats",value:choices[0].key,options:choices.map(c=>({value:c.key,label:c.entries.map(e=>`${game.i18n.localize(`TG.stats.${e.stat}.label`)} +${e.value}`).join(" / ")}))}]);
      if (!data) return; selectedStat=data.stat;
    }
    const selected=remembered??selectedStat;
    const bonus=choices.find(c=>c.key===selected || (c.entries.length===1&&c.entries[0].stat===selected));
    if (!bonus || !await this.spendManeuver("enhance")) return;
    await this.update({"system.kakuja.active":true,"system.kakuja.stage":stage,"system.kakuja.selectedBonus":bonus.key,[`flags.${SYSTEM_ID}.kakujaChoice.${stage}`]:bonus.key});
    return bonus;
  }

  async checkKakujaMastery() {
    const k=this.system.kakuja, rcl=this.getActiveKagune()?.system.rcl??0;
    if (!k.active || this.getEdgeModifiers(this.getActiveKagune()).autoFailCrl) return;
    const roll=await this.rollCheck("crl",{targetNumber:rcl});
    return this.resolveKakujaMasteryRoll(roll);
  }

  async resolveKakujaMasteryRoll(roll) {
    const k=this.system.kakuja;
    if ((k.stage==="full"?k.masteredFull:k.masteredHalf)||this.getEdgeModifiers(this.getActiveKagune()).autoFailCrl) return;
    const result=advanceKakujaMastery({currentSuccesses:k.masterySuccesses,success:roll.success,context:this.inCombat?"combat":"outOfCombat"});
    await this.update({"system.kakuja.masterySuccesses":result.successes,"system.kakuja.lostControl":result.lostControl,...(result.mastered?{[`system.kakuja.${k.stage==="full"?"masteredFull":"masteredHalf"}`]:true}:{})});
    if (result.lostControl) await this.log("TG.chat.lostControl");
    return result;
  }

  async useManeuver(action, options={}) {
    if (["strike","heavyStrike","overextend"].includes(action)) return this.rollAttack(options.item??null,{...options,action});
    if (action==="reload") {
      const weapon = this.getActiveQuinque();
      if (!weapon?.system.sidearm.enabled) return;
      const data = await promptFields("TG.actions.reload", [{name:"type",label:"TG.sheet.type",value:weapon.system.sidearm.ammoType,options:["ukaku","koukaku","rinkaku","bikaku"].map(value=>({value,key:`TG.kagune.${value}`}))}]);
      if (data && await this.spendManeuver("reload")) await weapon.update({"system.sidearm.ammoType":data.type});
      return;
    }
    if (action==="allOut") {
      if (!await this.rollAttack(options.item??null,{...options,preview:true})) return;
      const data=await promptFields("TG.actions.allOut",[{name:"attacks",label:"TG.sheet.attackCount",value:2,min:1,max:5}]);
      if (!data) return;
      const count=Number(data.attacks);
      if (!Number.isInteger(count)||count<1||count>5) return;
      const weapon = options.item ?? this.getDefaultAttackItem();
      if (!await this.spendManeuver(action,{weapon})) return;
      const armor = this.getActiveKakujaArmor();
      const quinxKagune = !!armor && this.system.identity.class === "quinx" && weapon?.type === "kagune";
      if (armor?.system.armorType !== "attack" || quinxKagune) await this.spendStamina(count*this.getEdgeModifiers(weapon).allOutCostMultiplier*(quinxKagune?2:1));
      for (let i=0;i<count;i++) await this.rollAttack(options.item??null,{...options,free:true,allOut:true});
      return;
    }
    if (action==="breather") {
      if (!await this.spendManeuver(action)) return;
      await this.setFlag(SYSTEM_ID,"turn",{...this.turnState,breather:true});
      return this.takeBreather();
    }
    if (action==="reserveReaction") return this.reserveReactionManeuver();
    if (["grab","breakGrapple","throw"].includes(action)) return this.grappleAction(action);
    if (action==="enhance") return this.toggleGimmick();
    if (action==="ready") {
      const data=await promptFields("TG.actions.ready",[{name:"trigger",label:"TG.sheet.trigger",type:"text",value:""}]);
      if (!data?.trigger || !await this.spendManeuver(action)) return;
      return this.update({"system.combat.readiedAction":{trigger:data.trigger}});
    }
    if (!await this.spendManeuver(action)) return;
    if (action==="counter") await this.update({"system.combat.counterDeclared":true,"system.resources.maneuverBudget.value":0});
    await this.log(action==="move"?"TG.chat.move":"TG.chat.maneuver",{action:game.i18n.localize(`TG.actions.${action}`)});
  }

  async grappleAction(action) {
    // Opposed rolls and cross-owner writes are GM-mediated; never roll on another client's behalf.
    if (!game.user.isGM) return this.notify("TG.notifications.gmGrapple");
    const target=action==="breakGrapple" ? await fromUuid(this.system.combat.grapple.grappledBy) : Array.from(game.user.targets)[0]?.actor;
    if (!target) return;
    if (action==="throw") {
      if (target.system.combat.grapple.grappledBy!==this.uuid) return;
      const distance=Math.floor((this.getStat("str")+(hasEdge(this.getEdgeNames(this.getDefaultAttackItem()),"prehensile")?this.getDefaultAttackItem()?.system.rcl??0:0))/2);
      const data=await promptFields("TG.actions.throw",[{name:"travelled",label:"TG.sheet.throwDistance",value:distance,min:0,max:distance}]);
      if (!data) return;
      const free = !!this.turnState.locked;
      if (!await this.spendManeuver(action,{free})) return;
      if (free) await this.spendStamina(this.getStat("str")*2);
      await target.applyDamage(Math.max(0,distance-Number(data.travelled)));
      await target.update({"system.combat.grapple.grappledBy":null});
      await target.deleteEmbeddedDocuments("Item",target.items.filter(i=>i.type==="condition"&&i.system.conditionId==="grappled").map(i=>i.id));
      await this.update({"system.combat.grapple.isGrappling":false});
      return;
    }
    if (!await this.spendManeuver(action)) return;
    const rollActor=actor=>actor.rollCheck("str",{bonus:hasEdge(actor.getEdgeNames(actor.getDefaultAttackItem()),"prehensile")?actor.getDefaultAttackItem()?.system.rcl??0:0});
    const a=await rollActor(this), b=await rollActor(target);
    if (a.total<=b.total) return;
    if (action==="breakGrapple") {
      await this.update({"system.combat.grapple.grappledBy":null});
      await this.deleteEmbeddedDocuments("Item",this.items.filter(i=>i.type==="condition"&&i.system.conditionId==="grappled").map(i=>i.id));
      await target.update({"system.combat.grapple.isGrappling":false});
    } else {
      await target.update({"system.combat.grapple.grappledBy":this.uuid});
      await this.update({"system.combat.grapple.isGrappling":true,[`flags.${SYSTEM_ID}.turn.locked`]:true});
      await target.applyCondition("grappled");
    }
  }

  async useConsumable(item, options = {}) {
    if (!item || item.system.quantity<1) return this.notify("TG.notifications.noAmmo");
    const type=item.system.consumableType;
    const edges=this.getEdgeNames(this.getDefaultAttackItem());
    if (type==="medkit" && !edges.includes("healer")) return this.notify("TG.notifications.requiredEdge");
    if (type.endsWith("Grenade") && !edges.includes("grenadier")) return this.notify("TG.notifications.requiredEdge");
    const targets=options.target ? [options.target] : Array.from(game.user.targets).map(t=>t.actor);
    if (type==="medkit") {
      const target=targets[0]??this;
      if (!target.isOwner) {
        if (!game.users.activeGM) return this.notify("TG.notifications.activeGMRequired");
        return ChatMessage.create({content:game.i18n.format("TG.chat.healingRequested",{actor:this.name,target:target.name}),whisper:[game.users.activeGM.id],flags:{[SYSTEM_ID]:{healRequest:{actorUuid:this.uuid,itemUuid:item.uuid,targetUuid:target.uuid}}}});
      }
      if (!await this.spendManeuver("medkit")) return;
      const result=calculateMedkitUse({per:this.getStat("per"),targetEnd:target.getStat("end")});
      await target.update({"system.resources.vitality.value":clampResource(target.system.resources.vitality.value+result.healing,0,target.getVitalityMax())});
      await target.deleteEmbeddedDocuments("Item",target.items.filter(i=>i.type==="condition"&&result.removes.includes(i.system.conditionId)).map(i=>i.id));
      await this.log("TG.chat.healing",{target:target.name,amount:result.healing});
    } else {
      const profile=getGrenadeProfile(type,{acc:this.getStat("acc")});
      if (!profile || !targets.length) return this.notify("TG.notifications.oneTarget");
      if (!await this.spendManeuver("grenade")) return;
      for (const target of targets) {
        const data={attackerActorUuid:this.uuid,attack:{source:"basic",damage:profile.damage??0,grenade:profile,edges:[]},targets:[{name:target.name,uuid:target.uuid}],roll:{total:profile.dodgeTargetNumber??0},rangeValidation:{valid:true}};
        const content=await foundry.applications.handlebars.renderTemplate("systems/tokyo-ghoul-unofficial/templates/chat/attack-card.hbs",{...data,actor:this,resourceSpend:{},rangeValidation:{valid:true}});
        await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:this}),content,flags:{[SYSTEM_ID]:data}});
      }
    }
    await item.update({"system.quantity":item.system.quantity-1});
  }
};
