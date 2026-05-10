import { validateStartingStatTotal } from "./derived-stats.mjs";

export function validateCharacterSystemData(system = {}) {
  const warnings = [];
  const statTotal = validateStartingStatTotal(system.stats);

  if (!statTotal.valid) {
    warnings.push({
      code: "stats.total",
      severity: "warning",
      message: "TG.validation.statsTotal"
    });
  }

  return { warnings, statTotal };
}
