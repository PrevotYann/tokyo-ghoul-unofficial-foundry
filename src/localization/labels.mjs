import { normalizeEdgeName } from "../rules/edges.mjs";

export function edgeLabel(value) {
  const key = `TG.edges.${normalizeEdgeName(value)}`;
  return game.i18n.has(key) ? game.i18n.localize(key) : String(value?.name ?? value);
}
