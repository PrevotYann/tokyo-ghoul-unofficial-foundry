import { compareSquadInitiative } from "../rules/combat-workflow.mjs";

// v14 awaits these lifecycle methods on the active GM, including skipped turns.
export class TokyoGhoulCombat extends Combat {
  turnProcessing = Promise.resolve();

  _manageTurnEvents() {
    // Foundry dispatches this protected lifecycle method without awaiting it in _onUpdate.
    // Expose completion so navigation and actor workflows can wait for resource updates.
    this.turnProcessing = super._manageTurnEvents();
    return this.turnProcessing;
  }

  async startCombat() {
    const result = await super.startCombat();
    await this.turnProcessing;
    return result;
  }

  async nextTurn() {
    await this.turnProcessing;
    const result = await super.nextTurn();
    await this.turnProcessing;
    return result;
  }

  async nextRound() {
    await this.turnProcessing;
    const result = await super.nextRound();
    await this.turnProcessing;
    return result;
  }
  _sortCombatants(a, b) {
    return compareSquadInitiative(a, b) || super._sortCombatants(a, b);
  }

  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    await combatant.actor?.beginTurn?.({combatUuid:this.uuid});
  }

  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    await combatant.actor?.processEndTurnConditions?.();
  }
}

export function registerCombatHooks() {}
