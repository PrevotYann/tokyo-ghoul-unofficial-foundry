import test from "node:test";
import assert from "node:assert/strict";
import { scaleAdventure, simulate, tokenDistance } from "../../scripts/simulate-last-delivery.mjs";
import { buildCombatant, createRng, runEncounter } from "../../scripts/lib/encounter-simulator.mjs";
import { createLastDelivery } from "../../src/packs-source/adventures/last-delivery.mjs";

// Seeded Monte-Carlo runs of The Last Delivery with the system's own combat formulas.
// Bounds encode the design target: the one-shot is winnable, but not a walkover.
const RUNS = 300;
const report = await simulate({ runs: RUNS, seed: 11, tactics: ["balanced", "aggressive"], enemyTargeting: ["random", "focus"] });
const chain = (size, policy, targeting) => report.chain.find(r => r.size === size && r.policy === policy && r.targeting === targeting);
const single = (size, scene, policy, targeting) => report.single.find(r => r.size === size && r.scene === scene && r.policy === policy && r.targeting === targeting);

test("recommended GM tactics: the whole night is reliably winnable at every party size", () => {
  for (const size of [4, 5, 6]) for (const targeting of ["random", "focus"]) {
    const night = chain(size, "balanced", targeting);
    assert.ok(night.nightWinPct >= 92, `${size}p ${targeting}: night win ${night.nightWinPct}%`);
    assert.ok(night.tpkPct <= 8, `${size}p ${targeting}: TPK ${night.tpkPct}%`);
  }
});

test("a ruthless GM is dangerous but still beatable", () => {
  for (const size of [4, 5, 6]) {
    const night = chain(size, "aggressive", "focus");
    assert.ok(night.nightWinPct >= 75, `${size}p ruthless: night win ${night.nightWinPct}%`);
  }
});

test("the station is a real climax rather than a one-round stomp", () => {
  for (const size of [4, 5, 6]) {
    const night = chain(size, "balanced", "focus");
    assert.ok(night.perScene.station.avgRounds >= 1.8, `${size}p station lasts ${night.perScene.station.avgRounds} rounds`);
    assert.ok(night.perScene.station.anyPcDownPct >= 15, `${size}p station drops a PC in ${night.perScene.station.anyPcDownPct}% of runs`);
    const fresh = single(size, "station", "balanced", "random");
    assert.ok(fresh.avgPartyVitPct <= 90, `${size}p fresh station leaves ${fresh.avgPartyVitPct}% party Vitality`);
  }
});

test("Riku lasts beyond the opening volley at the clinic", () => {
  for (const size of [4, 5, 6]) {
    const clinic = single(size, "clinic", "balanced", "random");
    assert.ok(clinic.avgRounds >= 1.5, `${size}p clinic lasts ${clinic.avgRounds} rounds`);
    assert.equal(clinic.pcWinPct, 100, `${size}p clinic is always winnable`);
  }
});

test("party-size scaling raises Kurose and Riku through temporary CRL only", () => {
  const adventure = createLastDelivery();
  const scaled = (size, key) => buildCombatant(scaleAdventure(adventure, size).actors.find(a => a.flags["tokyo-ghoul-unofficial"].key === key), { side: "enemy", key });
  assert.deepEqual([4, 5, 6].map(size => scaled(size, "boss").vitMax), [126, 156, 216]);
  assert.deepEqual([4, 5, 6].map(size => scaled(size, "guard").vitMax), [123, 147, 171]);
  // Full foes are refilled to the new maximum; damage and Stamina are untouched.
  assert.equal(scaled(6, "boss").vit, 216);
  assert.equal(scaled(6, "boss").staminaMax, scaled(4, "boss").staminaMax);
  assert.equal(scaled(6, "lookout").vitMax, scaled(4, "lookout").vitMax);
});

test("encounter engine applies harsh defenses, counters and no-ambush openers", async () => {
  const adventure = createLastDelivery();
  const actor = key => adventure.actors.find(a => a.flags["tokyo-ghoul-unofficial"].key === key);
  const result = await runEncounter({
    pcs: ["aya", "ren", "mio", "daichi"].map(key => buildCombatant(actor(key), { side: "pc", key })),
    enemies: [buildCombatant(actor("boss"), { side: "enemy", key: "boss" })],
    distance: tokenDistance(adventure, "station", "boss"), rng: createRng(3), keepLog: true
  });
  assert.ok(["pc", "enemy"].includes(result.winner));
  const firstRound = result.log.slice(0, result.log.indexOf("— Round 2 —"));
  assert.ok(!firstRound.some(line => line.startsWith("boss →")), "Kurose never opens on PCs who have not acted");
  assert.ok(result.stats.attacks > 0);
});
