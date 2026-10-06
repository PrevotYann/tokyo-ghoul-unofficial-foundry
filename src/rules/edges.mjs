function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeEdgeName(edge) {
  const name = typeof edge === "string" ? edge : edge?.name;
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getUsedEdgeSlots(items = []) {
  return items.reduce((total, item) => total + Number(item.system?.slots ?? 0), 0);
}

export function collectEdgeNames({ actorItems = [], sourceItem = null } = {}) {
  const sourceEdges = Array.from(sourceItem?.system?.edges ?? []);
  const utilityEdges = actorItems.filter(i => i.type === "gimmick" && i.system?.active && i.system.gimmickType === "utility").flatMap(i => i.system.grantedEdges.slice(0,2));
  const ownedEdges = Array.from(actorItems)
    .filter((item) => item.type === "edge")
    .map((item) => item.name);
  return [...new Set([...sourceEdges, ...ownedEdges, ...utilityEdges].map(normalizeEdgeName).filter(Boolean))];
}

export function hasEdge(edgeNames = [], edgeName) {
  const normalized = normalizeEdgeName(edgeName);
  return edgeNames.map(normalizeEdgeName).includes(normalized);
}

export function calculateEdgeCombatModifiers(edgeNames = [], { actorClass = null, kaguneType = null, end = 0, spd = 0 } = {}) {
  const edges = edgeNames.map(normalizeEdgeName);
  const has = (name) => edges.includes(normalizeEdgeName(name));

  return {
    dodgeBonus: has("Preemptive") ? 3 : 0,
    blockBonus: has("Hardy") ? 3 : 0,
    breatherMultiplier: has("Breathing Exercises") ? 2 : 1,
    damageBonus: has("Blunt") ? Math.floor(numberOrZero(end) / 2) : 0,
    allOutCostMultiplier: has("Quick Strikes") ? 3 : 5,
    allOutDamageBonus: has("Quick Strikes") ? numberOrZero(spd) : 0,
    heavyStrikeCostMultiplier: actorClass === "investigator" && has("Heavy Strikes") ? 1 : 2,
    overextendRangeBonus: has("Massive") ? 1 : 0,
    naturalPredator: has("Natural Predator"),
    autoPassCrl: has("Inner Peace"),
    autoFailCrl: has("Rampant"),
    preventsRage: actorClass !== "ghoul" && has("Inner Peace"),
    hungerTempStatBudget: has("Rampant") ? 10 : 0,
    regenerationType: actorClass === "investigator" ? "none" : (has("High-Speed Regeneration") || kaguneType === "rinkaku") ? "highSpeed" : (has("Ghoul Regeneration") || actorClass === "ghoul" || actorClass === "quinx") ? "normal" : "none",
    grantsManeuvers: [
      ...(has("Grappler") || has("Prehensile") ? ["Grab", "Throw"] : []),
      ...(has("Heavy Strikes") ? ["Heavy Strike"] : [])
    ],
    medkitMax: has("Healer") ? 5 : 0,
    grenadeMax: has("Grenadier") ? 10 : 0,
    sidearmEnabled: has("Sidearm")
  };
}

export function validateEdgeLoadout({ edgeItems = [], sourceType = "any", phase = "progression" } = {}) {
  const errors = [];
  const normalizedNames = edgeItems.map((item) => normalizeEdgeName(item));
  const usedSlots = getUsedEdgeSlots(edgeItems);
  for (const name of new Set(normalizedNames)) {
    if (name !== "dynamic-edge" && normalizedNames.filter(n=>n===name).length>1) errors.push({code:"edge.duplicate",edge:name});
  }

  edgeItems.forEach((edge) => {
    const name = normalizeEdgeName(edge);
    const system = edge.system ?? {};
    const incompatible = Array.from(system.incompatibleWith ?? []).map(normalizeEdgeName);
    const forbidden = Array.from(system.forbiddenTypes ?? []);
    const allowed = Array.from(system.allowedTypes ?? []);

    if (system.mustChooseAtCreation && phase !== "creation") {
      errors.push({ code: "edge.creationOnly", edge: name });
    }

    if (forbidden.includes(sourceType)) {
      errors.push({ code: "edge.forbiddenType", edge: name, sourceType });
    }

    if (allowed.length && !allowed.includes("any") && !allowed.includes(sourceType)) {
      errors.push({ code: "edge.allowedType", edge: name, sourceType });
    }

    for (const other of incompatible) {
      if (normalizedNames.includes(other)) {
        errors.push({ code: "edge.incompatible", edge: name, other });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    usedSlots
  };
}
