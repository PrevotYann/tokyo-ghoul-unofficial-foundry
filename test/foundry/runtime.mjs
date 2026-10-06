import { chromium } from "playwright";
import fs from "node:fs/promises";

// Run only against the dedicated disposable QA world. Never touches a campaign world.
const url = process.env.TG_QA_URL ?? "http://localhost:30014";
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1366,height:900}});
const errors=[];
page.on("pageerror",error=>errors.push(error.message));
page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
try {
  await page.goto(url);
  await page.waitForTimeout(1200);
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(()=>globalThis.game?.ready);
  const result=await page.evaluate(async()=>{
    if (game.world.id!=="tg-qa") throw new Error("Only the disposable tg-qa world is allowed");
    const checks=[];
    const assert=(value,name)=>{if(!value) throw new Error(name);checks.push(name);};
    const sid="tokyo-ghoul-unofficial";
    const prefix="[TG QA]";
    const {resolveDefenseRequest}=await import("/systems/tokyo-ghoul-unofficial/src/ui/chat-cards.mjs");
    for(const actor of game.actors.filter(a=>a.name.startsWith(prefix))) await actor.delete();
    for(const item of game.items.filter(i=>i.name.startsWith(prefix))) await item.delete();
    const actors=[];
    for(const actorClass of ["ghoul","investigator","quinx"]) {
      const actor=await game.tokyoGhoul.createActorFromCharacterDraft({name:`${prefix} ${actorClass}`,actorClass});
      await actor.sheet.render({force:true});
      assert(actor.sheet.element instanceof HTMLFormElement,`${actorClass} uses native form`);
      assert(!actor.sheet.element.querySelector("form"),`${actorClass} has no nested form`);
      assert(actor.items.size===(actorClass==="quinx"?2:1),`${actorClass} starting weapons`);
      await actor.update({"system.stats.crl.base":1000});
      await actor.update({"system.resources.vitality.value":actor.getVitalityMax(),"system.resources.stamina.value":actor.getStaminaMax()});
      await actor.sheet.close();actors.push(actor);
    }
    const [ghoul,investigator,quinx]=actors;
    const kagune=ghoul.items.find(i=>i.type==="kagune");
    await kagune.update({"system.manifested":true,"system.edges":["Sharpened"]});
    const [effect]=await ghoul.createEmbeddedDocuments("ActiveEffect",[{name:"END +3",system:{changes:[{key:"system.stats.end.temp",type:"add",value:3,phase:"final"}]}}]);
    assert(ghoul.getStat("end")===13,"effect input applied before derived stats even with default final phase");
    assert(ghoul.getVitalityMax()===(13+1000)*3,"effect updates resource maximum");
    await effect.update({disabled:true});
    assert(ghoul.getStat("end")===10,"disabled effect removes its bonus");
    for(const pack of game.packs) {
      const entries=await pack.getDocuments();
      assert(entries.length>0,`${pack.metadata.name} native pack populated`);
      assert(entries.every(e=>e.type in CONFIG.Item.dataModels),`${pack.metadata.name} records have DataModels`);
    }
    for(const type of Object.keys(CONFIG.Item.dataModels)) {
      const item=await Item.create({name:`${prefix} ${type}`,type});
      await item.sheet.render({force:true});
      assert(item.sheet.element instanceof HTMLFormElement && !item.sheet.element.querySelector("form"),`${type} sheet renders`);
      const copy=await Item.create(item.toObject());assert(copy.type===type,`${type} roundtrip source`);
      await item.sheet.close();await item.delete();await copy.delete();
    }
    const [npc]=await Actor.createDocuments([{name:`${prefix} NPC`,type:"npc"}]);
    await npc.sheet.render({force:true});assert(npc.sheet.rendered,"NPC sheet renders");await npc.sheet.close();await npc.delete();
    const combat=await Combat.create({combatants:actors.map(a=>({actorId:a.id,name:a.name}))});
    await combat.startCombat();
    await new Promise(r=>setTimeout(r,300));
    assert(combat.turns[0].actor.id===ghoul.id,"SPD initiative selects ghoul first");
    assert(ghoul.system.resources.maneuverBudget.value===2,"combat start resets squad budget");
    const attack=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}],targetRangeBand:"melee"});
    assert(attack?.message && ghoul.system.resources.maneuverBudget.value===1,"attack spends a maneuver and creates card");
    const request={messageId:attack.message.id,defenderUuid:investigator.uuid,action:"dodge"};
    const illegal=await resolveDefenseRequest(request,game.user);assert(!illegal,"first-turn defender cannot dodge");
    const before=investigator.system.resources.vitality.value;
    const resolution=await resolveDefenseRequest({...request,action:"takeHit"},game.user);
    assert(resolution.vitalityDamage===attack.attack.damage,"take-hit resolves damage");
    assert(investigator.system.resources.vitality.value===before-attack.attack.damage,"defense applies vitality once");
    await resolveDefenseRequest({...request,action:"takeHit"},game.user);
    assert(investigator.system.resources.vitality.value===before-attack.attack.damage,"duplicate defense is ignored");
    assert(investigator.items.some(i=>i.type==="condition"&&i.system.conditionId==="bleeding"),"Sharpened applies Bleeding");
    await ghoul.reserveReactionManeuver();assert(ghoul.system.resources.maneuverBudget.reactionsReserved===1,"remaining maneuver reserves a reaction");
    await combat.nextTurn();await new Promise(r=>setTimeout(r,300));
    assert(combat.combatant.actor.system.resources.maneuverBudget.value===2,"next turn resets budget");
    await combat.delete();
    const beforeHeal=ghoul.system.resources.vitality.value;
    await ghoul.applyDamage(8,{skipChecks:true,quiet:true});
    await ghoul.beginTurn();assert(ghoul.system.resources.vitality.value===beforeHeal,"non-RC damage regenerates");
    await ghoul.update({"system.hunger.active":true,"system.hunger.regenerationSuppressed":true});
    await ghoul.applyDamage(8,{skipChecks:true,quiet:true});
    const injured=ghoul.system.resources.vitality.value;await ghoul.beginTurn();assert(ghoul.system.resources.vitality.value===injured,"Hunger suppresses regeneration");
    await ghoul.feed();assert(!ghoul.system.hunger.active,"feeding ends Hunger");
    const [medkit]=await ghoul.createEmbeddedDocuments("Item",[{name:"Medkit",type:"consumable",system:{consumableType:"medkit",quantity:1}}]);
    await ghoul.createEmbeddedDocuments("Item",[{name:"Healer",type:"edge",system:{category:"investigator",slots:2}}]);
    await ghoul.applyCondition("burning");await ghoul.useConsumable(medkit);
    assert(medkit.system.quantity===0&&!ghoul.items.some(i=>i.type==="condition"&&i.system.conditionId==="burning"),"medkit consumes a charge and clears conditions");
    await investigator.update({"system.stats.end.base":1000});
    const blockAttack=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}]});
    const blockResult=await resolveDefenseRequest({messageId:blockAttack.message.id,defenderUuid:investigator.uuid,action:"block"},game.user);
    assert(blockResult.success && blockResult.vitalityDamage===0 && blockResult.counter.automatic,"successful Block prevents damage and grants automatic counter tier");
    const interposeAttack=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}]});
    const quinque=investigator.items.find(i=>i.type==="quinque");const bonds=quinque.system.rcBonds.value;
    const interpose=await resolveDefenseRequest({messageId:interposeAttack.message.id,defenderUuid:investigator.uuid,action:"interpose"},game.user);
    assert(interpose.rcBondDamage===Math.min(bonds,interposeAttack.attack.damage) && quinque.system.rcBonds.broken,"interpose damages and breaks RC Bonds");
    assert(interpose.vitalityDamage===Math.floor(interposeAttack.attack.damage/2),"interpose halves Vitality damage");
    const edge = (await game.packs.get("tokyo-ghoul-unofficial.edges").getDocuments()).find(i=>i.name==="Blunt"&&i.system.category==="ghoul");
    const [dropWeapon]=await ghoul.createEmbeddedDocuments("Item",[{name:"Drop weapon",type:"kagune",system:{primaryType:"bikaku",rcl:10}}]);
    const event={preventDefault(){},dataTransfer:{getData(){return JSON.stringify({type:"Item",uuid:edge.uuid});}}};
    assert(await dropWeapon.sheet._onDrop(event) && dropWeapon.system.edges.includes("Blunt"),"Edge drop assigns to weapon and updates its slots");
    assert(!await dropWeapon.sheet._onDrop(event),"duplicate Edge drop is rejected");
    await dropWeapon.delete();
    await ghoul.update({"system.stats.per.base":1000});await investigator.update({"system.stats.spd.base":0});
    const dodgeAttack=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}]});
    const dodge=await resolveDefenseRequest({messageId:dodgeAttack.message.id,defenderUuid:investigator.uuid,action:"dodge"},game.user);
    assert(!dodge.success && dodge.staminaDamage===Math.floor(dodgeAttack.attack.damage/2),"failed Dodge applies stamina damage");
    await ghoul.update({"system.combat.mode":"raid"});await ghoul.beginTurn();
    assert(ghoul.system.resources.maneuverBudget.value===3,"Raid grants three maneuvers");
    const raid=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}]});
    assert(raid.attack.damage===raid.attack.baseDamage*3,"Raid multiplies final damage");await ghoul.update({"system.combat.mode":"squad"});
    const [gear]=await ghoul.createEmbeddedDocuments("Item",[{name:"Effect gear",type:"loot",effects:[{name:"PER bonus",transfer:true,system:{changes:[{key:"system.stats.per.temp",type:"add",value:2,phase:"initial"}]}}]}]);
    assert(ghoul.getStat("per")===1002,"owned equipment transfers native effects");await gear.delete();
    const player=game.users.find(u=>u.name==="TG QA Player") ?? await User.create({name:"TG QA Player",role:1});
    await investigator.update({ownership:{default:0,[player.id]:3}});
    const permissionAttack=await ghoul.rollAttack(kagune,{targets:[{name:investigator.name,uuid:investigator.uuid}]});
    const unauthorized=await resolveDefenseRequest({messageId:permissionAttack.message.id,defenderUuid:ghoul.uuid,action:"takeHit"},player);
    assert(!unauthorized,"unowned or untargeted defender resolution is rejected");
    await ghoul.sheet.render({force:true});
    return {checks,playerAttackId:permissionAttack.message.id,playerDefenderId:investigator.id,playerBefore:investigator.system.resources.vitality.value,playerDamage:permissionAttack.attack.damage,actorId:ghoul.id,version:game.version};
  });
  const playerContext=await browser.newContext({viewport:{width:1366,height:900}});
  const playerPage=await playerContext.newPage();playerPage.on("pageerror",error=>errors.push(error.message));
  await playerPage.goto(url);await playerPage.waitForTimeout(1200);
  await playerPage.locator("[name=username]").fill("TG QA Player");await playerPage.locator("button[name=join]").click();await playerPage.waitForFunction(()=>globalThis.game?.ready);
  await playerPage.evaluate(async result=>{
    const defender=game.actors.get(result.playerDefenderId);
    for(let i=0;i<2;i++) await ChatMessage.create({content:"QA defense request",whisper:[game.users.activeGM.id],flags:{"tokyo-ghoul-unofficial":{defenseRequest:{messageId:result.playerAttackId,defenderUuid:defender.uuid,action:"takeHit"}}}});
  },result);
  await page.waitForFunction(result=>game.actors.get(result.playerDefenderId).getFlag("tokyo-ghoul-unofficial",`resolved.${result.playerAttackId}`),result);
  await page.waitForTimeout(300);
  const value=await page.evaluate(id=>game.actors.get(id).system.resources.vitality.value,result.playerDefenderId);
  if(value!==result.playerBefore-result.playerDamage) throw new Error("Multi-client duplicate defense was not applied exactly once");
  result.checks.push("player defense requests are GM-mediated and duplicated requests apply once");await playerContext.close();
  // Create through the actual builder form, including empty custom-stat fields.
  await page.evaluate(async()=>{await game.tokyoGhoul.openCharacterBuilder();});
  await page.locator("#tg-character-builder [name=name]").fill("[TG QA] Builder UI");
  await page.locator("#tg-character-builder [name=kaguneEdges]").selectOption(["Sharpened"]);
  await page.locator("#tg-character-builder button[type=submit]").click();
  await page.waitForFunction(()=>game.actors.some(a=>a.name==="[TG QA] Builder UI"));
  result.checks.push("builder form creates a valid character with selected Edges");
  await page.evaluate(async id=>{for(const actor of game.actors) if(actor.sheet.rendered) await actor.sheet.close();await game.actors.get(id).sheet.render({force:true});},result.actorId);
  await fs.mkdir("artifacts",{recursive:true});
  await page.locator("#notifications").evaluate(element=>element.replaceChildren());
  await page.screenshot({path:"artifacts/actor-desktop.png"});
  await page.evaluate(async id=>{const actor=game.actors.get(id);actor.sheet.setPosition({width:520,height:700,left:20,top:20});},result.actorId);
  await page.screenshot({path:"artifacts/actor-tablet.png"});
  const overflow=await page.locator(".tg-actor-sheet .window-content").evaluate(e=>e.scrollWidth>e.clientWidth+1);
  if(overflow) throw new Error("Narrow sheet overflows horizontally");
  if(errors.length) throw new Error(errors.join("\n"));
  console.log(`Foundry ${result.version}: ${result.checks.length+1} runtime checks passed.`);
  await fs.writeFile("artifacts/runtime-results.json",JSON.stringify({...result,errors,narrowOverflow:overflow},null,2));
} catch(error) { console.error("Browser errors", errors); console.error((await page.locator("body").innerText()).slice(-2000)); throw error; } finally { await browser.close(); }
