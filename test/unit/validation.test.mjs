import assert from "node:assert/strict";
import test from "node:test";

import { validateCharacterSystemData } from "../../src/rules/validation.mjs";

const validStats = {
  str: { base: 10 },
  acc: { base: 10 },
  per: { base: 10 },
  end: { base: 10 },
  spd: { base: 10 },
  crl: { base: 10 }
};

test("validation warns when class-required weapon items are missing", () => {
  assert.ok(validateCharacterSystemData({ identity: { class: "ghoul" }, stats: validStats }).warnings.some((warning) => warning.code === "class.ghoul.kagune"));
  assert.ok(validateCharacterSystemData({ identity: { class: "investigator" }, stats: validStats }).warnings.some((warning) => warning.code === "class.investigator.quinque"));
  assert.ok(validateCharacterSystemData({ identity: { class: "quinx" }, stats: validStats }, [{ type: "kagune" }]).warnings.some((warning) => warning.code === "class.quinx.hybridWeapons"));
});

test("validation accepts class-required weapon item presence", () => {
  const ghoul = validateCharacterSystemData({ identity: { class: "ghoul" }, stats: validStats }, [{ type: "kagune" }]);
  const investigator = validateCharacterSystemData({ identity: { class: "investigator" }, stats: validStats }, [{ type: "quinque" }]);
  const quinx = validateCharacterSystemData({ identity: { class: "quinx" }, stats: validStats }, [{ type: "kagune" }, { type: "quinque" }]);

  assert.equal(ghoul.warnings.some((warning) => warning.code.startsWith("class.")), false);
  assert.equal(investigator.warnings.some((warning) => warning.code.startsWith("class.")), false);
  assert.equal(quinx.warnings.some((warning) => warning.code.startsWith("class.")), false);
});
