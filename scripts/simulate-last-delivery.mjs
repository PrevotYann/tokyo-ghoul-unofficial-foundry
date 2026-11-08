// Balance simulation for "The Last Delivery". Run: npm run sim:adventure [-- --runs 2000 --log]
import { createLastDelivery } from "../src/packs-source/adventures/last-delivery.mjs";
import { npcScaling } from "../src/adventures/last-delivery-gm.mjs";
import { buildCombatant, createRng, fieldMedicine, recoverBetweenScenes, runEncounter, summarize } from "./lib/encounter-simulator.mjs";

const PX_PER_FT = 64 / 5;
const PARTY = { 4: ["aya", "ren", "mio", "daichi"], 5: ["aya", "ren", "mio", "daichi", "nao"], 6: ["aya", "ren", "mio", "daichi", "nao", "sora"] };

/** Distance in feet from the party's centroid to an NPC token on a scene. */
export function tokenDistance(adventure, sceneKey, npcKey) {
  const scene = adventure.scenes.find(s => s.flags["tokyo-ghoul-unofficial"].key === sceneKey);
  const party = scene.tokens.filter(t => t.disposition === 1 && !t.hidden);
  const cx = party.reduce((s, t) => s + t.x, 0) / party.length, cy = party.reduce((s, t) => s + t.y, 0) / party.length;
  const actorId = adventure.actors.find(a => a.flags["tokyo-ghoul-unofficial"].key === npcKey)._id;
  const token = scene.tokens.find(t => t.actorId === actorId);
  return Math.hypot(token.x - cx, token.y - cy) / PX_PER_FT;
}

/** Enemy line-up per scene and party size, following "02 • GM Encounters and Scaling" (worst case: all permitted foes appear). */
export const ENCOUNTER_TABLE = {
  // 6 players: Riku only watches the alley and withdraws to warn the clinic.
  alley: { 4: { enemies: ["lookout"] }, 5: { enemies: ["lookout"] }, 6: { enemies: ["lookout"] } },
  clinic: { 4: { enemies: ["guard"] }, 5: { enemies: ["guard"], reinforcements: [{ round: 2, keys: ["lookout"] }] }, 6: { enemies: ["guard", "lookout"] } },
  // Chika fights for Kurose until Kaito is freed; at 6 players Riku returns only if he escaped the clinic.
  station: { 4: { enemies: ["boss", "lookout"] }, 5: { enemies: ["boss", "lookout"] }, 6: { enemies: ["boss", "lookout", "guard"] } }
};

/** Apply the GM panel's party-size scaling to a copy of the adventure actors. */
export function scaleAdventure(adventure, size) {
  const scaled = structuredClone(adventure);
  for (const actor of scaled.actors) {
    const bonus = npcScaling(size, actor.flags["tokyo-ghoul-unofficial"].key);
    for (const [stat, value] of Object.entries(bonus)) actor.system.stats[stat].temp = value;
  }
  return scaled;
}

export function encounterPlan(size, scene, carried = {}, table = ENCOUNTER_TABLE) {
  const plan = table[scene][size];
  // Captured/recruited NPCs never return (guide); escaped ones do, carrying their wounds.
  const available = key => carried[key] !== "removed";
  return { enemies: plan.enemies.filter(available), reinforcements: (plan.reinforcements ?? []).map(w => ({ ...w, keys: w.keys.filter(available) })).filter(w => w.keys.length) };
}

export async function simulate({ runs = 1000, seed = 7, sizes = [4, 5, 6], tactics = ["balanced"], enemyTargeting = ["random", "focus"], adventure = createLastDelivery(), table = ENCOUNTER_TABLE, npcOverrides = { lookout: { fleeAfterTurns: 2 } }, scenes = ["alley", "clinic", "station"], chainRuns = true, restock = { clinic: 2 }, pcTargeting = "smart" } = {}) {
  const distance = { alley: tokenDistance(adventure, "alley", "lookout"), clinic: tokenDistance(adventure, "clinic", "guard"), station: tokenDistance(adventure, "station", "boss") };
  const report = { distance, single: [], chain: [] };

  for (const size of sizes) for (const policy of tactics) for (const targeting of enemyTargeting) {
    const actors = Object.fromEntries(scaleAdventure(adventure, size).actors.map(a => [a.flags["tokyo-ghoul-unofficial"].key, a]));
    const fresh = (key, side, overrides) => buildCombatant(actors[key], { side, key, overrides });
    // Isolated scene fights at full resources.
    for (const scene of scenes) {
      const rng = createRng(seed + size * 101 + scene.length);
      const results = [];
      for (let i = 0; i < runs; i++) {
        const plan = encounterPlan(size, scene, {}, table);
        const pcs = PARTY[size].map(k => fresh(k, "pc"));
        const enemies = plan.enemies.map(k => fresh(k, "enemy", scene === "alley" ? npcOverrides[k] : {}));
        const reinforcements = plan.reinforcements.map(w => ({ round: w.round, combatants: w.keys.map(k => fresh(k, "enemy")) }));
        results.push(await runEncounter({ pcs, enemies, reinforcements, distance: distance[scene], rng, enemyPolicy: policy, enemyTargeting: targeting, pcTargeting }));
      }
      report.single.push({ size, scene, policy, targeting, ...summarize(results) });
    }
    if (!chainRuns) continue;
    // Full night: wounds, spent Stamina and escaped NPCs carry forward; one breather between scenes.
    const rng = createRng(seed + size * 977);
    const chain = { alley: [], clinic: [], station: [] };
    let partyWins = 0, tpk = 0, pcsDownTotal = 0, stationEntryVit = 0;
    for (let i = 0; i < runs; i++) {
      const pcs = PARTY[size].map(k => fresh(k, "pc"));
      const npcState = {};
      let lost = false;
      for (const scene of ["alley", "clinic", "station"]) {
        const standing = pcs.filter(p => p.vit > 0);
        if (scene === "station") stationEntryVit += standing.reduce((s, p) => s + p.vit, 0) / pcs.reduce((s, p) => s + p.vitMax, 0);
        const plan = encounterPlan(size, scene, Object.fromEntries(Object.entries(npcState).map(([k, v]) => [k, v.removed ? "removed" : "present"])), table);
        const make = key => {
          const c = fresh(key, "enemy", scene === "alley" ? npcOverrides[key] : {});
          if (npcState[key]) { c.vit = npcState[key].vit; c.stamina = npcState[key].stamina; }
          return c;
        };
        const enemies = plan.enemies.map(make);
        const reinforcements = plan.reinforcements.map(w => ({ round: w.round, combatants: w.keys.map(make) }));
        const result = await runEncounter({ pcs: standing, enemies, reinforcements, distance: distance[scene], rng, enemyPolicy: policy, enemyTargeting: targeting, pcTargeting });
        chain[scene].push(result);
        for (const c of result.combatants.filter(c => c.side === "enemy")) {
          // Yielded or downed NPCs are captured/recruited; a fleeing scout returns with her wounds.
          // Chika's alley "yield" is a retreat: she flees and is still coerced at the station.
          const retreats = scene === "alley" && c.key === "lookout" && c.outcome !== "down";
          npcState[c.key] = { vit: c.vit, stamina: c.stamina, removed: !retreats && (c.outcome === "yield" || c.outcome === "down") };
        }
        if (result.winner !== "pc") { lost = true; break; }
        // Aobane's treatment room holds sealed field kits; the medic restocks, then patches the party.
        for (const p of pcs.filter(p => p.healer && p.vit > 0)) p.medkits = Math.min(5, p.medkits + (restock[scene] ?? 0));
        fieldMedicine(pcs);
        for (const p of pcs) recoverBetweenScenes(p);
      }
      if (!lost) partyWins++;
      if (pcs.every(p => p.vit <= 0)) tpk++;
      pcsDownTotal += pcs.filter(p => p.vit <= 0).length;
    }
    report.chain.push({
      size, policy, targeting, runs,
      nightWinPct: Math.round(partyWins / runs * 1000) / 10,
      tpkPct: Math.round(tpk / runs * 1000) / 10,
      avgPcsDownByDawn: Math.round(pcsDownTotal / runs * 100) / 100,
      stationEntryVitPct: Math.round(stationEntryVit / runs * 1000) / 10,
      perScene: Object.fromEntries(Object.entries(chain).map(([k, v]) => [k, v.length ? summarize(v) : null]))
    });
  }
  return report;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("simulate-last-delivery.mjs")) {
  const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1]; };
  const runs = Number(arg("runs", 2000));
  if (process.argv.includes("--log")) {
    const adventure = createLastDelivery();
    const actors = Object.fromEntries(adventure.actors.map(a => [a.flags["tokyo-ghoul-unofficial"].key, a]));
    const pcs = PARTY[4].map(k => buildCombatant(actors[k], { side: "pc", key: k }));
    const result = await runEncounter({ pcs, enemies: [buildCombatant(actors.boss, { side: "enemy", key: "boss" })], distance: tokenDistance(adventure, "station", "boss"), rng: createRng(Number(arg("seed", 3))), keepLog: true });
    console.log(result.log.join("\n"));
    console.log(result.winner, result.rounds);
  } else {
    const report = await simulate({ runs, tactics: ["balanced", "aggressive"] });
    console.log("Start distances (ft):", Object.fromEntries(Object.entries(report.distance).map(([k, v]) => [k, Math.round(v)])));
    console.table(report.single.map(r => ({ size: r.size, scene: r.scene, gm: `${r.policy}/${r.targeting}`, "PC win %": r.pcWinPct, "rounds": r.avgRounds, "PCs down": r.avgPcsDown, "any PC down %": r.anyPcDownPct, "party VIT % left": r.avgPartyVitPct })));
    console.table(report.chain.map(r => ({ size: r.size, gm: `${r.policy}/${r.targeting}`, "night win %": r.nightWinPct, "TPK %": r.tpkPct, "PCs down by dawn": r.avgPcsDownByDawn, "VIT % at station": r.stationEntryVitPct, "station win %": r.perScene.station?.pcWinPct })));
  }
}
