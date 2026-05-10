export function getUsedEdgeSlots(items = []) {
  return items.reduce((total, item) => total + Number(item.system?.slots ?? 0), 0);
}
