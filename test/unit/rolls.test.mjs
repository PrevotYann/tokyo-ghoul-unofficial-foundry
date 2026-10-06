import assert from "node:assert/strict";
import test from "node:test";

import { rollD20Check, getMessageRolls } from "../../src/rules/rolls.mjs";

test("natural 1 subtracts 10 from total with minimum 0", async () => {
  assert.equal((await rollD20Check({ statValue: 3, dieResults: [1] })).total, 0);
  assert.equal((await rollD20Check({ statValue: 15, dieResults: [1] })).total, 6);
});

test("natural 20 adds exactly one extra d20", async () => {
  const result = await rollD20Check({ statValue: 5, dieResults: [20, 20] });
  assert.equal(result.total, 45);
  assert.equal(result.extra, 20);
});

test("extra d20 does not fumble or explode", async () => {
  assert.equal((await rollD20Check({ statValue: 5, dieResults: [20, 1] })).total, 26);
  assert.equal((await rollD20Check({ statValue: 5, dieResults: [20, 20, 20] })).total, 45);
});

test("passive target number checks report success or failure", async () => {
  assert.equal((await rollD20Check({ statValue: 5, targetNumber: 15, dieResults: [10] })).success, true);
  assert.equal((await rollD20Check({ statValue: 5, targetNumber: 16, dieResults: [10] })).success, false);
});

test("contest checks compare against opponent total", async () => {
  assert.equal((await rollD20Check({ statValue: 7, opponentTotal: 14, dieResults: [8] })).success, true);
  assert.equal((await rollD20Check({ statValue: 7, opponentTotal: 15, dieResults: [8] })).success, false);
  assert.equal((await rollD20Check({ statValue: 7, opponentTotal: 16, dieResults: [8] })).success, false);
});

test("actor stat values can be read through getStat", async () => {
  const actor = { getStat: (stat) => stat === "per" ? 12 : 0 };
  const result = await rollD20Check({ actor, stat: "per", bonus: 2, penalty: 1, dieResults: [10] });
  assert.equal(result.total, 23);
});
test('evaluated Foundry dice survive for chat and critical animation, without leaking into flags', async () => {
  const previous = globalThis.Roll;
  const values = [20, 7, 1];
  globalThis.Roll = class {
    constructor(formula) { this.formula = formula; }
    async evaluate() { this.total = values.shift(); return this; }
  };
  try {
    const critical = await rollD20Check({statValue:5});
    assert.equal(critical.total, 32);
    assert.deepEqual(getMessageRolls(critical).map(r => r.total), [20,7]);
    assert.equal(JSON.parse(JSON.stringify(critical)).foundryRolls, undefined);
    const fumble = await rollD20Check({statValue:15});
    assert.equal(fumble.total, 6);
    assert.deepEqual(getMessageRolls(fumble).map(r => r.total), [1]);
    assert.deepEqual(getMessageRolls({total:10}), []);
    assert.deepEqual(getMessageRolls(await rollD20Check({dieResults:[10]})), []);
  } finally { globalThis.Roll = previous; }
});
