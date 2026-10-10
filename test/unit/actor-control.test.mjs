import test from "node:test";
import assert from "node:assert/strict";

globalThis.Actor = class {};
const {TokyoGhoulActor} = await import("../../src/documents/actor.mjs");

test("uncontrolled Kakuja remains GM-controlled until unconscious; ending the episode clears stale control", async () => {
  globalThis.game = {user:{isGM:false}};
  let update;
  const actor = {
    system:{kakuja:{lostControl:true},resources:{vitality:{value:20}}},
    notify:key=>key,
    update:async data=>{update=data;}
  };
  assert.equal(await TokyoGhoulActor.prototype.deactivateKakuja.call(actor),"TG.notifications.lostControl");
  assert.equal(update,undefined);
  game.user.isGM=true;
  await TokyoGhoulActor.prototype.deactivateKakuja.call(actor);
  assert.equal(update["system.kakuja.active"],false);
  assert.equal(update["system.kakuja.lostControl"],false);
  assert.equal(update["system.kakuja.masterySuccesses"],0);
  game.user.isGM=false;
  actor.system.resources.vitality.value=0;
  update=undefined;
  await TokyoGhoulActor.prototype.deactivateKakuja.call(actor);
  assert.equal(update["system.kakuja.lostControl"],false);
});
