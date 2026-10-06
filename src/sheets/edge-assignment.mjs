import { validateEdgeLoadout, normalizeEdgeName } from "../rules/edges.mjs";

export async function assignEdgeToWeapon(weapon, edge) {
  if (!weapon?.isOwner || !["kagune", "quinque"].includes(weapon.type) || edge?.type !== "edge") return false;
  const category = weapon.type === "kagune" ? "ghoul" : "investigator";
  const catalog = await game.packs.get("tokyo-ghoul-unofficial.edges").getDocuments();
  const entries = [...weapon.system.edges.map(name => catalog.find(i => normalizeEdgeName(i.name) === normalizeEdgeName(name) && i.system.category === category)), edge];
  const validation = validateEdgeLoadout({edgeItems:entries.filter(Boolean),sourceType:weapon.system.primaryType,phase:"creation"});
  if (edge.system.category !== category || entries.some(i => !i) || !validation.valid || validation.usedSlots > weapon.system.edgeSlots.max) {
    ui.notifications.warn(game.i18n.localize("TG.notifications.invalidEdges"));
    return false;
  }
  await weapon.update({"system.edges":[...weapon.system.edges, edge.name]});
  return true;
}
