export function getRollContext(actor) {
  return actor?.getRollData?.() ?? {};
}
