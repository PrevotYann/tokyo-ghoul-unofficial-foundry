import test from "node:test";
import assert from "node:assert/strict";
import { registerDiceSoNiceHooks, DICE_COLORSET } from "../../src/ui/dice-so-nice.mjs";

test("optional DsN theme registers at readiness and supports versions without roles", () => {
  const previous = globalThis.Hooks;
  let callback;
  globalThis.Hooks = { once: (name, handler) => { assert.equal(name, "diceSoNiceReady"); callback = handler; } };
  try {
    registerDiceSoNiceHooks();
    let colorset, role, source;
    callback({ addColorset: value => colorset = value });
    assert.equal(colorset.name, DICE_COLORSET);
    assert.equal(colorset.background, "#111117");
    callback({ addColorset: value => colorset = value, addRole: (value, options) => { role = value; source = options; } });
    assert.equal(role.id, "basic");
    assert.equal(role.defaults.global.colorset, DICE_COLORSET);
    assert.equal(source.package, "tokyo-ghoul-unofficial");
  } finally { globalThis.Hooks = previous; }
});
