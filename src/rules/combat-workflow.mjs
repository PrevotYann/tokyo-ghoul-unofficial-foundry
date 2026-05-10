export function getManeuverBudgetForMode(mode = "squad") {
  return mode === "raid" ? 3 : 2;
}
