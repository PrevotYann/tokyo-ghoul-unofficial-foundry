import { compareSquadInitiative } from "../rules/combat-workflow.mjs";

// v14 awaits these lifecycle methods on the active GM, including skipped turns.
export class TokyoGhoulCombat extends Combat {
  _sortCombatants(a, b) {
    return compareSquadInitiative(a, b) || super._sortCombatants(a, b);
  }

  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    await combatant.actor?.beginTurn?.();
  }

  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    await combatant.actor?.processEndTurnConditions?.();
  }
}

export function registerCombatHooks() {}
