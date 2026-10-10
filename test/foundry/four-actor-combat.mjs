import { chromium } from "playwright";
import fs from "node:fs/promises";

// Uses real v14 documents, chat cards and combat lifecycle. No campaign worlds.
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1366,height:900}});
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForSelector("[name=username], #board");
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => globalThis.game?.ready);
  const report = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14 || !game.user.isGM) throw Error("Requires GM in disposable tg-qa v14 world");
    const sid = "tokyo-ghoul-unofficial";
    const base = `/systems/${sid}`;
    const {createCharacterDraft} = await import(`${base}/src/rules/character-builder.mjs`);
    const {resolveDefenseRequest} = await import(`${base}/src/ui/chat-cards.mjs`);
    const checks = [], failures = [], transcript = [], actors = [];
    const originalRandom = CONFIG.Dice.randomUniform;
    const originalDialog = foundry.applications.api.DialogV2.input;
    let die = 10, dialog = {};
    CONFIG.Dice.randomUniform = () => 1 - (die - 0.5) / 20;
    foundry.applications.api.DialogV2.input = async () => dialog;
    const assert = (ok, label) => { if (!ok) throw Error(label); checks.push(label); };
    const equal = (actual, expected, label) => assert(actual === expected, `${label} (${actual} / ${expected})`);
    const scenario = async (name, task) => {
      try { await task(); } catch (error) {
        failures.push({name,error:error.message});
        if(combat) {await combat.turnProcessing; await combat.delete(); combat=null;}
      }
      transcript.push({name,actors:actors.map(a=>({name:a.name,vit:a.system.resources.vitality.value,stm:a.system.resources.stamina.value,maneuvers:a.system.resources.maneuverBudget.value,conditions:a.items.filter(i=>i.type==="condition").map(i=>({id:i.system.conditionId,stacks:i.system.stacks}))}))});
    };
    const waitFor = async predicate => {
      for(let n=0;n<100;n++) {if(predicate()) return; await new Promise(resolve=>setTimeout(resolve,50));}
      throw Error("Timed out waiting for Foundry workflow completion");
    };
    let combat;
    const attack = async (a, b, item = a.getDefaultAttackItem(), options = {}) => {
      const result = await a.rollAttack(item,{targets:[{name:b.name,uuid:b.uuid}],targetRangeBand:"melee",...options});
      assert(!!result?.message, `${a.name} attack creates a card`);
      return result;
    };
    const defend = (result, a, action="takeHit") => resolveDefenseRequest({messageId:result.message.id,defenderUuid:a.uuid,action},game.user);
    const refill = async () => {
      for (const a of actors) {
        await a.deleteEmbeddedDocuments("Item",a.items.filter(i=>i.type==="condition").map(i=>i.id));
        await a.update({"system.resources.rage.active":false,"system.resources.rage.assigned":{},"system.hunger.active":false,"system.hunger.regenerationSuppressed":false,"system.kakuja.active":false,"system.kakuja.lostControl":false,"system.combat.counterDeclared":false,"system.combat.grapple":{grappledBy:null,isGrappling:false},[`flags.${sid}.injury`]:{normalDamage:0,rcDamage:0},[`flags.${sid}.turn`]:{}});
        await a.update({"system.resources.vitality.value":a.getVitalityMax(),"system.resources.stamina.value":a.getStaminaMax()});
      }
      die=10; dialog={};
    };
    try {
      const builds = [
        {name:"[TG Fight QA] Ukaku shooter",actorClass:"ghoul",statPreset:"ukakuRanged",kaguneType:"ukaku",kaguneEdges:["sharpened","quick-strikes","preemptive"]},
        {name:"[TG Fight QA] Koukaku bruiser",actorClass:"ghoul",statPreset:"koukakuTank",kaguneType:"koukaku",kaguneEdges:["heavy-strikes","blunt","breathing-exercises"]},
        {name:"[TG Fight QA] Investigator medic",actorClass:"investigator",statPreset:"investigatorMarksman",quinqueType:"bikaku",quinqueEdges:["healer","grenadier"]},
        {name:"[TG Fight QA] Quinx hybrid",actorClass:"quinx",statPreset:"rinkakuBruiser",kaguneType:"rinkaku",quinqueType:"koukaku",quinqueEdges:["hardy","sidearm"]}
      ];
      for (const options of builds) {
        const {items,validation,...data} = createCharacterDraft(options);
        assert(validation.valid, `${options.name} has 60 starting stat points`);
        const a = await Actor.create(data); actors.push(a);
        await a.createEmbeddedDocuments("Item",items);
        for (const i of a.items.filter(i=>i.type==="kagune")) await i.update({"system.manifested":true});
      }
      const [u,k,i,q] = actors;
      const ukaku=u.getActiveKagune(), koukaku=k.getActiveKagune(), quinque=i.getActiveQuinque(), qk=q.getActiveKagune(), qq=q.getActiveQuinque();
      await refill();
      await scenario("Four distinct builds and derived bonuses/penalties", async () => {
        equal(u.getStat("spd"),17,"Ukaku SPD +3"); equal(u.getStaminaMax(),58,"Ukaku STM subtracts total SPD");
        equal(k.getStat("end"),17,"Koukaku END +3"); equal(k.getStat("spd"),3,"Koukaku SPD -3");
        equal(q.getVitalityMax(),54,"Rinkaku VIT subtracts END");
        equal(quinque.system.edgeSlots.used,3,"Healer consumes two slots, Grenadier one");
        equal(u.getEdgeModifiers().dodgeBonus,3,"Preemptive bonus"); equal(q.getEdgeModifiers(qq).blockBonus,3,"Hardy bonus");
        equal(q.getEdgeModifiers(qq).regenerationType,"highSpeed","Quinx biology uses Kagune regeneration while holding Quinque");
        const [buff] = await k.createEmbeddedDocuments("ActiveEffect",[{name:"Audit END modifier",system:{changes:[{key:"system.stats.end.temp",type:"add",value:2,phase:"final"}]}}]);
        equal(k.getStat("end"),19,"Active Effect contributes before derived calculation");
        equal(k.getVitalityMax(),99,"Active Effect recalculates VIT"); await buff.delete();
      });
      await scenario("Squad fight: first turns, awaited damage and reserved reactions", async () => {
        combat = await Combat.create({combatants:actors.map(a=>({actorId:a.id,name:a.name}))}); await combat.startCombat();
        equal(combat.combatant.actor.id,u.id,"SPD chooses shooter first"); equal(u.system.resources.maneuverBudget.value,2,"Squad starts with two maneuvers");
        const shot=await attack(u,i,ukaku,{attackMode:"ranged"}); equal(shot.attack.damage,24,"Ranged Kagune ACC + RCL"); equal(shot.attack.staminaCost,4,"Ranged Kagune cost");
        const before=i.system.resources.vitality.value; assert(!await defend(shot,i,"dodge"),"First-turn defender cannot react");
        await defend(shot,i); equal(i.system.resources.vitality.value,before-24,"Take Hit applies damage");
        await defend(shot,i); equal(i.system.resources.vitality.value,before-24,"Duplicate request applies once");
        assert(i.items.some(c=>c.system.conditionId==="bleeding"),"Sharpened inflicts Bleeding");
        await u.reserveReactionManeuver(); equal(u.system.resources.maneuverBudget.reactionsReserved,1,"Shooter reserves remaining maneuver");
        await combat.nextTurn(); equal(combat.combatant.actor.id,i.id,"Next turn waits for correct actor");
        equal(i.system.resources.vitality.value,before-25,"Investigator suffers Bleeding before acting");
        const returnShot=await attack(i,u,quinque); equal(returnShot.roll.bonus,3,"Quinque anti-Ghoul attack bonus");
        const dodge=await defend(returnShot,u,"dodge"); assert(dodge.success,"Preemptive SPD defense succeeds"); equal(u.system.resources.maneuverBudget.reactionsReserved,0,"Dodge spends reservation");
        await i.reserveReactionManeuver(); await combat.nextTurn(); equal(combat.combatant.actor.id,q.id,"Quinx turn follows medic");
        const strike=await attack(q,k,qq); equal(strike.attack.damage,24,"Quinx uses Quinque RCL 10"); await defend(strike,k);
        await q.reserveReactionManeuver(); await combat.nextTurn(); equal(combat.combatant.actor.id,k.id,"Slow bruiser acts last");
        const heavy=await attack(k,q,koukaku,{action:"heavyStrike"}); equal(heavy.attack.damage,42,"Heavy STR doubled plus Blunt END/2"); equal(heavy.roll.penalty,12,"Heavy Strike STR penalty");
        const block=await defend(heavy,q,"block"); assert(block.success,"Hardy and type bonuses support successful Block");
        equal(k.system.resources.stamina.value,36,"Heavy Strike pays STR times two");
        await k.reserveReactionManeuver(); await combat.nextTurn(); equal(combat.round,2,"Second round starts after four actors");
        equal(u.system.resources.maneuverBudget.reactionsReserved,0,"Unused reactions expire on own next turn");
      });
      if (combat) {
        await qq.update({"system.sidearm.ammo.value":0}); await combat.delete();combat=null;
        await waitFor(()=>qq.system.sidearm.ammo.value===qq.system.rcl);
        equal(qq.system.sidearm.ammo.value,10,"Combat end refills Sidearm ammunition");
      }
      await refill();
      await scenario("Damage classifications and medkit healing do not leave ghost wounds", async () => {
        await q.applyDamage(12,{rc:true,skipChecks:true,quiet:true}); await q.applyDamage(8,{skipChecks:true,quiet:true});
        const [kit]=await i.createEmbeddedDocuments("Item",[{name:"QA medkit",type:"consumable",system:{consumableType:"medkit",quantity:2}}]);
        await q.applyCondition("bleeding",3); await q.applyCondition("burning",2);
        await i.useConsumable(kit,{target:q}); equal(kit.system.quantity,1,"Medkit spends quantity once"); equal(q.system.resources.vitality.value,q.getVitalityMax(),"Medkit heals PER plus target END to max");
        assert(!q.items.some(c=>["bleeding","burning"].includes(c.system.conditionId)),"Medkit clears both conditions");
        await q.applyDamage(6,{rc:true,skipChecks:true,quiet:true});
        const wounds=q.getFlag(sid,"injury"); equal(wounds.normalDamage+wounds.rcDamage,6,"Healed wounds do not reappear after next injury");
      });
      await refill();
      await scenario("Normal and high-speed regeneration; Hunger suppression and feeding", async () => {
        await u.applyDamage(20,{rc:true,quiet:true}); await u.applyDamage(6,{quiet:true}); const before=u.system.resources.vitality.value;
        await u.beginTurn(); equal(u.system.resources.vitality.value,before+6,"Normal regeneration heals only ordinary wounds");
        await q.applyDamage(18,{rc:true,quiet:true}); await q.beginTurn(); equal(q.system.resources.vitality.value,q.getVitalityMax()-6,"High-speed regeneration heals END of RC wounds");
        await q.update({"system.hunger.active":true,"system.hunger.regenerationSuppressed":true}); const injured=q.system.resources.vitality.value;
        await q.beginTurn(); equal(q.system.resources.vitality.value,injured,"Hungry Quinx cannot regenerate"); await q.feed(); await q.beginTurn(); equal(q.system.resources.vitality.value,q.getVitalityMax(),"Feeding restores regeneration");
      });
      await refill();
      await scenario("All-Out, Breather, Rage and stamina overflow", async () => {
        dialog={attacks:"3"}; const before=u.system.resources.stamina.value;
        await u.useManeuver("allOut",{item:ukaku,targets:[{name:k.name,uuid:k.uuid}],attackMode:"ranged"});
        equal(u.system.resources.stamina.value,before-21,"Quick Strikes All-Out pays 3 surcharges plus ordinary costs");
        const allOut=game.messages.filter(m=>m.flags[sid]?.attackerActorUuid===u.uuid).slice(-3); assert(allOut.every(m=>m.flags[sid].attack.damage===41),"Quick Strikes adds SPD to each attack");
        dialog={str:"10"}; const initial=i.system.resources.stamina.value; await i.enterRage(); equal(i.system.resources.stamina.value,initial,"Voluntary Rage has no initial cost"); equal(i.getStat("str"),16,"Rage allocation contributes to STR");
        await i.useManeuver("move"); equal(i.system.resources.stamina.value,initial-2,"Rage charges each maneuver"); await i.useManeuver("breather"); assert(!i.system.resources.rage.active && i.getStat("str")===6,"Breather ends Rage and removes stats");
        await k.update({"system.resources.stamina.value":2}); const vit=k.system.resources.vitality.value; await k.spendStamina(7,{skipChecks:true,quiet:true}); equal(k.system.resources.vitality.value,vit-5,"Unpaid stamina costs overflow to Vitality");
        await k.takeBreather({quiet:true}); equal(k.system.resources.stamina.value,34,"Breathing Exercises doubles END recovery");
      });
      await refill();
      await scenario("Range validation, Overextend and Massive", async () => {
        const stm=q.system.resources.stamina.value;
        assert(!await q.rollAttack(qq,{targets:[{name:u.name,uuid:u.uuid}],targetRangeBand:"mid"}),"Ordinary Koukaku attack cannot reach Mid range"); equal(q.system.resources.stamina.value,stm,"Rejected range does not spend resources");
        const reach=await attack(q,u,qq,{action:"overextend",targetRangeBand:"mid"}); equal(reach.roll.penalty,6,"Overextend subtracts SPD from attack roll"); equal(q.system.resources.stamina.value,stm-6,"Overextend replaces normal attack cost with SPD");
        await ukaku.update({"system.edges":["massive"]});
        const shot=await attack(u,k,ukaku,{attackMode:"ranged",targetRangeBand:"far"}); equal(shot.rangeValidation.maxRangeBand,"infinite","Massive Ukaku reaches infinite projectile range");
        await ukaku.update({"system.edges":["sharpened","quick-strikes","preemptive"]});
      });
      await refill();
      await scenario("Counter stance and the real chat follow-up button", async () => {
        const stm=i.system.resources.stamina.value; await i.useManeuver("counter"); equal(i.system.resources.stamina.value,stm-16,"Counter stance costs SPD times three minus PER");
        const hit=await attack(u,i,ukaku); const result=await defend(hit,i); assert(result.success && result.counter.automatic,"Counter stance prevents ordinary hit and grants automatic counter");
        const card=game.messages.contents.at(-1), before=u.system.resources.vitality.value;
        await waitFor(()=>document.querySelector(`[data-message-id="${card.id}"] [data-tg-chat-action="counterAttack"]`));
        document.querySelector(`[data-message-id="${card.id}"] [data-tg-chat-action="counterAttack"]`).click();
        await waitFor(()=>i.getFlag(sid,`followUps.${card.id}`));
        const counter=game.messages.find(m=>m.flags[sid]?.counterAttack && m.flags[sid]?.attackerActorUuid===i.uuid);
        assert(!!counter,"Chat counter button generates a follow-up attack"); assert(counter.flags[sid].automatic,"Counter attack is automatic");
        await defend({message:counter},u); equal(u.system.resources.vitality.value,before-16,"Counter follow-up applies normal weapon damage");
        assert(!game.messages.contents.at(-1).flags[sid].canCounter,"Counter follow-up does not chain counter rewards");
      });
      await refill();
      await scenario("Failed defenses, automatic hits and critical dice", async () => {
        for(const action of ["dodge","block"]) {
          const hit=await attack(u,i,ukaku); die=1;
          const vit=i.system.resources.vitality.value, stm=i.system.resources.stamina.value;
          const result=await defend(hit,i,action);
          assert(!result.success,`${action} can fail with a natural one`);
          equal(i.system.resources.vitality.value,vit-(action==="block"?24:16),`${action} applies harsh Vitality consequence`);
          equal(i.system.resources.stamina.value,stm-(action==="dodge"?8:0),`${action} applies correct Stamina consequence`);
          await i.update({"system.resources.vitality.value":i.getVitalityMax(),"system.resources.stamina.value":i.getStaminaMax()}); die=10;
        }
        await i.update({"system.combat.counterDeclared":true});
        const automatic=await attack(u,i,ukaku,{automatic:true});
        assert(!await defend(automatic,i,"block"),"Automatic hit cannot be blocked even in Counter stance");
        const result=await defend(automatic,i); equal(result.vitalityDamage,16,"Automatic hit bypasses Counter stance");
        await i.update({"system.combat.counterDeclared":false}); die=20;
        const critical=await attack(u,k,ukaku); equal(critical.roll.natural,20,"Deterministic natural twenty"); equal(critical.roll.extra,20,"Critical adds exactly one extra die"); equal(critical.message.rolls.length,2,"Critical retains both native dice in chat"); die=10;
      });
      await refill();
      await scenario("Hunger and Rage thresholds during a four-actor combat", async () => {
        await i.update({"system.resources.maneuverBudget.reactionsReserved":1,[`flags.${sid}.turn`]:{acted:true,combatUuid:"Combat.previous"}});
        combat=await Combat.create({combatants:actors.map(a=>({actorId:a.id,name:a.name}))}); await combat.startCombat();
        const opening=await attack(u,i,ukaku); assert(!await defend(opening,i,"dodge"),"Previous combat reaction cannot bypass first-turn restriction in a new fight");
        die=1; const vit=u.system.resources.vitality.value; await u.spendStamina(30,{quiet:true});
        assert(u.system.hunger.active && u.system.hunger.regenerationSuppressed,"Crossing 50 percent STM fails Hunger and suppresses regeneration"); equal(u.system.resources.vitality.value,vit-5,"Hunger immediately costs five VIT");
        await u.processEndTurnConditions(); equal(u.system.resources.vitality.value,vit-6,"Hunger costs one VIT per non-Breather turn");
        await u.setFlag(sid,"turn",{...u.turnState,breather:true}); await u.processEndTurnConditions(); equal(u.system.resources.vitality.value,vit-6,"Breather turn avoids Hunger upkeep"); await u.feed(); assert(!u.system.hunger.active,"Feeding ends Hunger");
        dialog={str:"10"}; const stm=i.system.resources.stamina.value; await i.applyDamage(25,{quiet:true});
        assert(i.system.resources.rage.active,"Crossing 50 percent VIT enters involuntary Rage"); equal(i.system.resources.stamina.value,stm-5,"Involuntary Rage costs five initial STM"); equal(i.getStat("str"),16,"Threshold Rage grants allocated stats");
        await i.update({"system.resources.maneuverBudget.reactionsReserved":1}); await i.consumeReactionManeuver(); equal(i.system.resources.stamina.value,stm-7,"Rage also charges defensive reactions");
        await combat.nextTurn(); await i.useManeuver("breather"); assert(!i.system.resources.rage.active,"Breather ends threshold Rage");
        await i.useManeuver("move"); assert(!await i.rollAttack(quinque,{targets:[{name:u.name,uuid:u.uuid}]}),"Breather prevents attack on the same turn");
        await combat.delete(); combat=null; die=10; dialog={};
      });
      await refill();
      await scenario("Gimmick activation, upkeep, utility Edges and defense cooldown", async () => {
        for(const type of ["attack","form","utility"]) {
          const [g]=await i.createEmbeddedDocuments("Item",[{name:`QA ${type}`,type:"gimmick",system:{gimmickType:type,staminaCostMode:type==="utility"?"tripleMaxEndSpd":"maxEndSpd",selectedStat:type==="attack"?"per":"rcl",selectedBenefit:"damage",grantedEdges:["blunt","preemptive","hardy"]}}]);
          const before=i.system.resources.stamina.value; const activation=await i.toggleGimmick(g,{quiet:true}); equal(activation.staminaCost,type==="utility"?30:10,`${type} activation cost`); equal(i.system.resources.stamina.value,before-activation.staminaCost,`${type} activation spends STM`);
          if(type==="attack") equal((await i.buildAttack(quinque,{})).damage,24,"Attack gimmick uses selected PER plus RCL");
          if(type==="form") equal((await i.buildAttack(quinque,{})).damage,26,"Form gimmick doubles selected RCL");
          if(type==="utility") {equal(i.getEdgeModifiers().dodgeBonus,3,"Utility grants Preemptive"); equal(i.getEdgeModifiers().blockBonus,0,"Utility ignores third Edge");}
          await i.update({"system.resources.stamina.value":i.getStaminaMax()}); await i.beginTurn(); equal(i.system.resources.stamina.value,i.getStaminaMax()-activation.staminaCost,`${type} turn upkeep matches activation`);
          const off=await i.toggleGimmick(g,{quiet:true}); equal(off.staminaCost,0,`${type} deactivation is free`); await g.delete(); await i.update({"system.resources.stamina.value":i.getStaminaMax()});
        }
        await quinque.update({"system.primaryType":"koukaku"});
        const [g]=await i.createEmbeddedDocuments("Item",[{name:"QA defense",type:"gimmick",system:{gimmickType:"defense",active:true,staminaCostMode:"maxEndSpd"}}]);
        const [grenadier]=await q.createEmbeddedDocuments("Item",[{name:"Grenadier",type:"edge",system:{ruleId:"grenadier",category:"investigator"}}]);
        const [grenade]=await q.createEmbeddedDocuments("Item",[{name:"QA cooldown grenade",type:"consumable",system:{consumableType:"fragGrenade",quantity:3}}]);
        const blast=async()=>{await q.useConsumable(grenade,{target:i});return {message:game.messages.contents.at(-1)};};
        const first=await defend(await blast(),i,"block"); assert(first.success,"Defense gimmick auto-passes grenade Block TN 16 by one");
        die=1; const second=await defend(await blast(),i,"block"); assert(!second.success,"Defense gimmick cannot repeat during same turn");
        await i.update({"system.resources.vitality.value":i.getVitalityMax()}); await i.beginTurn(); await i.beginTurn();
        const third=await defend(await blast(),i,"block"); assert(third.success,"Defense gimmick recovers after two wielder turns");
        await g.delete(); await grenadier.delete(); await quinque.update({"system.primaryType":"bikaku"}); die=10;
      });
      await refill();
      await scenario("Grab range, restricted actions, throw range and collisions", async () => {
        await koukaku.update({"system.edges":["grappler"]}); await k.update({"system.stats.str.temp":10});
        await k.useManeuver("grab",{target:q,targetRangeBand:"mid"}); assert(!q.system.combat.grapple.grappledBy,"Grab rejects distant targets without Prehensile");
        await k.useManeuver("grab",{target:q}); equal(q.system.combat.grapple.grappledBy,k.uuid,"Opposed STR Grab links target to grappler");
        assert(!await q.rollAttack(qk,{targets:[{name:k.name,uuid:k.uuid}]}),"Grappled target cannot attack");
        dialog={travelled:"5"}; const vit=q.system.resources.vitality.value;
        await k.useManeuver("throw",{target:q}); equal(q.system.resources.vitality.value,vit-11,"Throw uses (STR + weapon RCL)/2 and remaining collision distance"); assert(!q.system.combat.grapple.grappledBy,"Throw releases grapple");
        await k.update({"system.stats.str.temp":0}); await koukaku.update({"system.edges":["heavy-strikes","blunt","breathing-exercises"]}); dialog={};
      });
      await refill();
      await scenario("Broken regenerating Quinque waits two turns then restores completely", async () => {
        await qq.update({"system.primaryType":"rinkaku","system.rcl":60,"system.edges":["high-speed-regeneration"],"system.rcBonds.value":0});
        equal(qq.system.rcBonds.max,30,"High-speed Quinque has half RCL bonds");
        await q.processEndTurnConditions(); equal(qq.system.rcBonds.value,0,"Broken Quinque remains unusable after first turn");
        await q.processEndTurnConditions(); equal(qq.system.rcBonds.value,30,"Broken Quinque restores fully after second turn");
        await qq.update({"system.rcBonds.value":15}); await q.processEndTurnConditions(); equal(qq.system.rcBonds.value,27,"Partially damaged Quinque recovers END each turn");
      });
      await qq.update({"system.primaryType":"koukaku","system.rcl":10,"system.edges":["hardy","sidearm"],"system.rcBonds.value":10}); await refill();
      await scenario("Grenades, Burning checks and source-turn cloud expiry", async () => {
        for (const type of ["fragGrenade","incendiaryGrenade","rcLimiterGrenade"]) {
          const [grenade]=await i.createEmbeddedDocuments("Item",[{name:type,type:"consumable",system:{consumableType:type,quantity:1}}]);
          await i.useConsumable(grenade,{target:u}); const card=game.messages.contents.at(-1); equal(grenade.system.quantity,0,`${type} consumed`);
          const result=await defend({message:card},u); assert(!!result,`${type} resolves`);
          if(type==="fragGrenade") equal(result.vitalityDamage,42,"Frag damage ACC times three");
          if(type==="incendiaryGrenade") {assert(u.items.some(c=>c.system.conditionId==="burning"),"Incendiary inflicts Burning"); await u.processStartTurnConditions({endRollTotal:0,quiet:true}); equal(u.items.find(c=>c.system.conditionId==="burning").system.stacks,2,"Burning failure adds stack"); await u.processStartTurnConditions({endRollTotal:30,quiet:true}); assert(!u.items.some(c=>c.system.conditionId==="burning"),"Successful END clears Burning");}
          if(type==="rcLimiterGrenade") {assert(!ukaku.system.manifested,"RC cloud suppresses Kagune"); for(let n=0;n<2;n++) await i.processEndTurnConditions(); assert(u.items.some(c=>c.system.conditionId==="rc-limiter-cloud"),"RC cloud persists for two source turns"); await i.processEndTurnConditions(); assert(!u.items.some(c=>c.system.conditionId==="rc-limiter-cloud"),"RC cloud expires on third source turn");}
          await u.update({"system.resources.vitality.value":u.getVitalityMax()});
        }
        await ukaku.update({"system.manifested":true});
      });
      await refill();
      await scenario("Sidearm ammo, type bonuses and interpose RC bonds", async () => {
        await qq.update({"system.sidearm.ammo.value":2,"system.sidearm.ammoType":"ukaku"});
        const shot=await attack(q,u,qq,{attackMode:"ranged",sidearm:true,targetRangeBand:"long"}); equal(shot.attack.damage,6,"Sidearm deals ACC only"); equal(shot.attack.staminaCost,0,"Sidearm has no stamina cost"); equal(qq.system.sidearm.ammo.value,1,"Sidearm consumes one round");
        equal(shot.roll.bonus,3,"Sidearm anti-Ghoul bonus"); await defend(shot,u);
        const hit=await attack(u,q,ukaku); const block=await defend(hit,q,"interpose"); equal(block.vitalityDamage,8,"Interpose halves incoming damage"); equal(qq.system.rcBonds.value,0,"Interpose breaks Quinque"); assert(!await q.rollAttack(qq,{targets:[{name:u.name,uuid:u.uuid}]}),"Broken Quinque cannot attack");
      });
      await qq.update({"system.rcBonds.value":10}); await refill();
      await scenario("Kakuja upkeep, deactivation and a fresh activation", async () => {
        await koukaku.update({"system.rcl":50,"system.edges":["cannibalistic","blunt","breathing-exercises"]}); await k.update({"system.kakuja.eligible":true});
        await k.activateKakuja({selectedStat:"end"}); equal(k.getStat("end"),37,"Half Kakuja adds END 20");
        await k.update({"system.resources.stamina.value":120}); die=1; await k.processEndTurnConditions(); assert(k.system.kakuja.lostControl,"Failed mastery loses control");
        await k.deactivateKakuja(); equal(k.getStat("end"),17,"Deactivation removes Kakuja stats"); assert(!k.system.kakuja.lostControl,"Deactivation removes lost control");
        await k.activateKakuja({selectedStat:"end"}); assert(!k.system.kakuja.lostControl,"Fresh Kakuja activation starts controlled");
        await k.deactivateKakuja(); die=10;
        await k.update({"system.kakuja.masteredHalf":false}); await k.activateKakuja({selectedStat:"end"}); await k.update({"system.kakuja.masterySuccesses":19});
        const mastery=await k.resolveKakujaMasteryRoll({success:true}); assert(mastery.mastered && k.system.kakuja.masteredHalf,"Twentieth out-of-combat success masters Half Kakuja"); await k.deactivateKakuja();
        await qk.update({"system.rcl":150,"system.edges":["cannibalistic"]}); await q.update({"system.kakuja.eligible":true,"system.kakuja.masteredHalf":true});
        assert(!await q.activateKakuja({stage:"full",selectedStat:"spd"}),"Quinx cannot activate Full Kakuja"); await qk.update({"system.rcl":5,"system.edges":[]});
      });
      await koukaku.update({"system.rcl":10,"system.edges":["heavy-strikes","blunt","breathing-exercises"]}); await refill();
      await scenario("Consumption reward after a fight", async () => {
        const reward=await u.applyConsumptionReward({targetHighestRcl:10,targetName:"QA defeated NPC"}); assert(reward.statPointsGained>0,"Consumption grants progression without exception");
      });
      await ukaku.update({"system.rcl":10});
      await refill();
      await scenario("Raid mode fight and speed armor/parasitic delay", async () => {
        for(const a of actors) await a.update({"system.combat.mode":"raid"});
        const [armor]=await q.createEmbeddedDocuments("Item",[{name:"QA speed armor",type:"kakuja-armor",system:{armorType:"speed",rcl:45,manifested:true}}]);
        await q.beginTurn(); equal(q.system.resources.maneuverBudget.value,4,"Raid speed armor grants fourth maneuver"); equal(q.getStat("spd"),12,"Speed armor doubles SPD");
        const shot=await attack(u,k,ukaku,{attackMode:"ranged"}); equal(shot.attack.damage,72,"Raid triples ranged damage"); equal(shot.attack.staminaCost,2,"Raid halves ranged stamina cost"); await defend(shot,k);
        const kill=await attack(u,k,ukaku,{attackMode:"ranged"}); await defend(kill,k); assert(game.messages.contents.at(-1).flags[sid].raidFollowUp,"Raid defeat grants free follow-up");
        const again=await attack(u,k,ukaku,{attackMode:"ranged"}); await defend(again,k); assert(!game.messages.contents.at(-1).flags[sid].raidFollowUp,"Already defeated target cannot grant another Raid follow-up");
        const maneuvers=u.system.resources.maneuverBudget.value; await attack(u,i,ukaku,{attackMode:"ranged",free:true}); equal(u.system.resources.maneuverBudget.value,maneuvers,"Free Raid follow-up preserves maneuver budget");
        const vit=q.system.resources.vitality.value; for(let n=0;n<5;n++) await q.processEndTurnConditions(); equal(q.system.resources.vitality.value,vit,"Armor has five turns without parasitic drain");
        await q.processEndTurnConditions(); equal(q.system.resources.vitality.value,vit-27,"Sixth armor turn drains half armor and weapon RCL"); await q.beginTurn(); equal(q.system.resources.vitality.value,vit-5,"Quinx regenerates END + CRL of parasitic injury");
      });
      return {version:game.version,builds,checks,failures,transcript};
    } finally {
      CONFIG.Dice.randomUniform=originalRandom;
      foundry.applications.api.DialogV2.input=originalDialog;
      if(combat) await combat.delete();
      const ids=new Set(actors.map(a=>a.id));
      for(const message of game.messages.filter(m=>ids.has(m.speaker.actor))) await message.delete();
      for(const a of actors) await a.delete();
    }
  });
  await fs.mkdir("artifacts/qa",{recursive:true});
  await fs.writeFile("artifacts/qa/four-actor-combat.json",JSON.stringify({...report,errors},null,2));
  console.log(`Foundry ${report.version}: ${report.checks.length} four-actor combat checks passed; ${report.failures.length} scenarios failed.`);
  for(const failure of report.failures) console.error(`${failure.name}: ${failure.error}`);
  if(report.failures.length || errors.length) throw Error("Four-actor simulation failed; see artifacts/qa/four-actor-combat.json");
} finally {await browser.close();}
