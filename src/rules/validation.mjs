import { validateStartingStatTotal } from "./derived-stats.mjs";

export const QUINQUE_CARRY_LIMIT = 2;

export function countCarriedQuinque(items = []) {
  return items.filter(item => item.type === "quinque" && item.system?.equipped).length;
}

export function validateCharacterSystemData(system = {}, items = []) {
  const warnings = [];
  const statTotal = validateStartingStatTotal(system.stats);
  const actorClass = system.identity?.class;
  const itemTypes = new Set(items.map((item) => item.type));

  if (!statTotal.valid) {
    warnings.push({
      code: "stats.total",
      severity: "warning",
      message: "TG.validation.statsTotal"
    });
  }

  if (actorClass === "ghoul" && !itemTypes.has("kagune")) {
    warnings.push({
      code: "class.ghoul.kagune",
      severity: "warning",
      message: "TG.validation.ghoulNeedsKagune"
    });
  }

  if (actorClass === "investigator" && !itemTypes.has("quinque")) {
    warnings.push({
      code: "class.investigator.quinque",
      severity: "warning",
      message: "TG.validation.investigatorNeedsQuinque"
    });
  }

  if (actorClass === "quinx" && (!itemTypes.has("kagune") || !itemTypes.has("quinque"))) {
    warnings.push({
      code: "class.quinx.hybridWeapons",
      severity: "warning",
      message: "TG.validation.quinxNeedsBoth"
    });
  }

  // Investigators and Quinx carry at most two Quinque on their person (PDF p. 16).
  if (countCarriedQuinque(items) > QUINQUE_CARRY_LIMIT) {
    warnings.push({
      code: "quinque.carryLimit",
      severity: "warning",
      message: "TG.validation.quinqueCarryLimit"
    });
  }

  return { warnings, statTotal };
}
