import { SYSTEM_ID } from "../config.mjs";

export const DICE_COLORSET = `${SYSTEM_ID}-red-black`;

export function registerDiceSoNiceHooks() {
  Hooks.once("diceSoNiceReady", dice3d => {
    dice3d.addColorset({
      name: DICE_COLORSET,
      description: "TG.dice.redBlack",
      category: "Tokyo Ghoul: Unofficial TTRPG",
      foreground: "#ff5263",
      background: "#111117",
      outline: "#000000",
      edge: "#9b1527",
      texture: "none",
      material: "plastic"
    });
    // Newer DsN versions support defaults which preserve player customizations.
    dice3d.addRole?.({ id: "basic", defaults: { global: { colorset: DICE_COLORSET } } }, { package: SYSTEM_ID });
  });
}
