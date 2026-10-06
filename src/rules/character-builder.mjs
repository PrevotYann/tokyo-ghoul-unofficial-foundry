import { TG_CONFIG } from "../config.mjs";
import { hasEdge, normalizeEdgeName } from "./edges.mjs";
import { calculateStartingRcl, validateStartingStatTotal } from "./derived-stats.mjs";

export const STAT_PRESETS = {
  balanced: { str: 10, acc: 10, per: 10, end: 10, spd: 10, crl: 10 },
  ukakuRanged: { str: 6, acc: 14, per: 12, end: 8, spd: 14, crl: 6 },
  koukakuTank: { str: 12, acc: 6, per: 8, end: 14, spd: 6, crl: 14 },
  rinkakuBruiser: { str: 14, acc: 6, per: 12, end: 12, spd: 6, crl: 10 },
  investigatorBrawler: { str: 14, acc: 6, per: 12, end: 12, spd: 8, crl: 8 },
  investigatorMarksman: { str: 6, acc: 14, per: 14, end: 8, spd: 10, crl: 8 }
};

function statObject(base) {
  return { base, temp: 0, edge: 0, kakuja: 0, total: base };
}

export function buildStatsFromPreset(preset = "balanced") {
  const values = STAT_PRESETS[preset] ?? STAT_PRESETS.balanced;
  return Object.fromEntries(TG_CONFIG.stats.map((key) => [key, statObject(values[key] ?? 10)]));
}

export function getClassStartingProfile(actorClass = "ghoul") {
  if (actorClass === "investigator") {
    return {
      needsKagune: false,
      needsQuinque: true,
      kaguneRcl: 0,
      quinqueRcl: TG_CONFIG.startingRcl.investigatorQuinque,
      kaguneEdgeSlots: 0,
      quinqueEdgeSlots: TG_CONFIG.startingEdgeSlots.investigatorQuinque
    };
  }

  if (actorClass === "quinx") {
    return {
      needsKagune: true,
      needsQuinque: true,
      kaguneRcl: TG_CONFIG.startingRcl.quinxKagune,
      quinqueRcl: TG_CONFIG.startingRcl.quinxQuinque,
      kaguneEdgeSlots: TG_CONFIG.startingEdgeSlots.quinxKagune,
      quinqueEdgeSlots: TG_CONFIG.startingEdgeSlots.quinxQuinque
    };
  }

  return {
    needsKagune: true,
    needsQuinque: false,
    kaguneRcl: TG_CONFIG.startingRcl.ghoulKagune,
    quinqueRcl: 0,
    kaguneEdgeSlots: TG_CONFIG.startingEdgeSlots.ghoulKagune,
    quinqueEdgeSlots: 0
  };
}

export function calculateBuilderRcl({ baseRcl, maxEdges, chosenEdges = [] } = {}) {
  return calculateStartingRcl({
    baseRcl,
    maxStartingEdges: maxEdges,
    chosenStartingEdges: chosenEdges.reduce((n,edge)=>n+(hasEdge([edge], "healer")?2:1),0)
  });
}

export function createKaguneDraft({ name = "Kagune", actorClass = "ghoul", kaguneType = "ukaku", edges = [] } = {}) {
  edges = edges.map(normalizeEdgeName);
  const profile = getClassStartingProfile(actorClass);
  const rcl = calculateBuilderRcl({ baseRcl: profile.kaguneRcl, maxEdges: profile.kaguneEdgeSlots, chosenEdges: edges });
  return {
    name,
    type: "kagune",
    system: {
      type: kaguneType,
      primaryType: kaguneType,
      secondaryType: null,
      rcl,
      manifested: false,
      range: getDefaultTypeRange(kaguneType),
      edgeSlots: { max: profile.kaguneEdgeSlots + (kaguneType === "bikaku" ? 1 : 0), used: edges.length, bonusFromType: kaguneType === "bikaku" ? 1 : 0 },
      edges,
      evolution: { spentRcl: 0, statPurchases: [], swappedEdges: [] },
      automation: "manual",
      description: "",
      dynamicNotes: ""
    }
  };
}

export function createQuinqueDraft({ name = "Quinque", actorClass = "investigator", quinqueType = "ukaku", edges = [] } = {}) {
  edges = edges.map(normalizeEdgeName);
  const profile = getClassStartingProfile(actorClass);
  const rcl = calculateBuilderRcl({ baseRcl: profile.quinqueRcl, maxEdges: profile.quinqueEdgeSlots, chosenEdges: edges });
  return {
    name,
    type: "quinque",
    system: {
      type: quinqueType,
      primaryType: quinqueType,
      secondaryType: null,
      rcl,
      rcBonds: { value: rcl, max: rcl, broken: false, repairDaysRemaining: 0 },
      equipped: true,
      range: getDefaultTypeRange(quinqueType),
      edgeSlots: { max: profile.quinqueEdgeSlots, used: edges.length },
      edges,
      gimmick: null,
      sidearm: { enabled: hasEdge(edges, "sidearm"), ammoType: quinqueType, ammo: { value: hasEdge(edges, "sidearm") ? rcl : 0, max: rcl } },
      kakuja: { isKakujaWeapon: false, freeGimmick: false, dynamicEdge: null },
      automation: "manual",
      description: ""
    }
  };
}

export function getDefaultTypeRange(type) {
  if (type === "ukaku") return { melee: "close", projectile: "long" };
  if (type === "koukaku") return { melee: "close", projectile: null };
  return { melee: "mid", projectile: null };
}

export function createCharacterDraft({
  name = "New Character",
  actorClass = "ghoul",
  statPreset = "balanced",
  kaguneType = "ukaku",
  quinqueType = "ukaku",
  kaguneEdges = [],
  quinqueEdges = [],
  customStats = null
} = {}) {
  const profile = getClassStartingProfile(actorClass);
  const stats = customStats ? Object.fromEntries(TG_CONFIG.stats.map(key => [key, statObject(Number(customStats[key]))])) : buildStatsFromPreset(statPreset);
  const items = [];
  if (profile.needsKagune) items.push(createKaguneDraft({ actorClass, kaguneType, edges: kaguneEdges }));
  if (profile.needsQuinque) items.push(createQuinqueDraft({ actorClass, quinqueType, edges: quinqueEdges }));

  return {
    name,
    type: "character",
    system: {
      identity: {
        class: actorClass,
        faction: actorClass === "ghoul" ? "ghoul" : "ccg",
        rankGhoul: "C",
        rankInvestigator: "rank3",
        alias: "",
        age: null,
        pronouns: "",
        notes: ""
      },
      stats
    },
    items,
    validation: validateStartingStatTotal(stats)
  };
}
