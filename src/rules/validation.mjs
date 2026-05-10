import { validateStartingStatTotal } from "./derived-stats.mjs";

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

  return { warnings, statTotal };
}
