import test from "node:test";
import assert from "node:assert/strict";
import {resolveRegeneration,resolveHealing} from "../../src/rules/conditions.mjs";
import {getKakujaSelections,getKakujaStatBonus} from "../../src/rules/kakuja.mjs";
import {calculateBuilderRcl} from "../../src/rules/character-builder.mjs";

test("normal regeneration heals ordinary wounds while preserving RC wounds",()=>{
  assert.deepEqual(resolveRegeneration({injury:{normalDamage:15,rcDamage:20},end:10,type:"normal"}),{healing:10,injury:{normalDamage:5,rcDamage:20}});
});
test("high-speed regeneration spends END on RC wounds first, and Hunger blocks healing",()=>{
  assert.deepEqual(resolveRegeneration({injury:{normalDamage:15,rcDamage:4},end:10,crl:10,type:"highSpeed"}),{healing:10,injury:{normalDamage:9,rcDamage:0}});
  assert.equal(resolveRegeneration({injury:{normalDamage:15},end:10,type:"normal",suppressed:true}).healing,0);
});
test("Chimera Kakuja selections draw one split bonus from each Kagune",()=>{
  const choices=getKakujaSelections("ukaku","bikaku","half");
  assert.equal(choices.length,4);
  assert(choices.some(c=>c.key==="spd:10,rcl:5"));
  assert.equal(getKakujaStatBonus("str:10,str:10","str"),20);
  assert.equal(getKakujaStatBonus("spd:10,rcl:5","rcl"),5);
  assert(getKakujaSelections("ukaku","bikaku","full").some(c=>c.key==="spd:20,rcl:10"));
});
test("Healer uses two starting slots when calculating unused-slot RCL",()=>{
  assert.equal(calculateBuilderRcl({baseRcl:10,maxEdges:3,chosenEdges:["Healer"]}),12);
});

test("medkit healing removes RC wounds first and caps recovery at missing Vitality",()=>{
  assert.deepEqual(resolveHealing({vitality:30,maxVitality:50,amount:9,injury:{normalDamage:8,rcDamage:12}}),{
    healing:9,vitality:39,injury:{normalDamage:8,rcDamage:3}
  });
  assert.deepEqual(resolveHealing({vitality:30,maxVitality:50,amount:26,injury:{normalDamage:8,rcDamage:12}}),{
    healing:20,vitality:50,injury:{normalDamage:0,rcDamage:0}
  });
});

test("healing reconciles stale and legacy wound pools without leaving phantom regeneration",()=>{
  assert.deepEqual(resolveHealing({vitality:48,maxVitality:50,amount:2,injury:{normalDamage:20,rcDamage:20}}).injury,{normalDamage:0,rcDamage:0});
  assert.deepEqual(resolveHealing({vitality:40,maxVitality:50,amount:4,injury:{amount:10,rc:true}}).injury,{normalDamage:0,rcDamage:6});
});
