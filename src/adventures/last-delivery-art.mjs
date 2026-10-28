import { SYSTEM_ID } from "../config.mjs";

export const LAST_DELIVERY_ART_KEYS = Object.freeze([
  "aya", "ren", "mio", "daichi", "nao", "sora", "emi", "yui", "patient", "guard", "lookout", "boss", "kaito"
]);
const directory = `systems/${SYSTEM_ID}/assets/adventures/last-delivery/tokens`;
export const lastDeliveryPortrait = key => `${directory}/${key}.png`;
const replacements = new Map(LAST_DELIVERY_ART_KEYS.map(key => [`${directory}/${key}.svg`, lastDeliveryPortrait(key)]));

/** Replace only bundled legacy artwork; preserve uploaded/custom images and all gameplay data. */
export function migrateLastDeliveryActorArtwork(actor) {
  const source = actor._source ?? actor;
  const update = {};
  if (replacements.has(source.img)) update.img = replacements.get(source.img);
  const texture = source.prototypeToken?.texture?.src;
  if (replacements.has(texture)) update["prototypeToken.texture.src"] = replacements.get(texture);
  return update;
}

export function migrateLastDeliveryTokenArtwork(token) {
  const source = token._source ?? token;
  const update = {};
  if (replacements.has(source.texture?.src)) update["texture.src"] = replacements.get(source.texture.src);
  // Unlinked tokens may have their own portrait or prototype texture overrides.
  if (replacements.has(source.delta?.img)) update["delta.img"] = replacements.get(source.delta.img);
  const texture = source.delta?.prototypeToken?.texture?.src;
  if (replacements.has(texture)) update["delta.prototypeToken.texture.src"] = replacements.get(texture);
  return update;
}
