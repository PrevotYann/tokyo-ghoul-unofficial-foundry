export function registerCombatHooks() {
  Hooks.on("combatStart", (combat) => {
    console.log("tokyo-ghoul-unofficial | Combat started.", combat.id);
  });

  Hooks.on("combatTurn", async (combat) => {
    const actor = combat?.combatant?.actor;
    if (!actor?.processStartTurnConditions) return;
    await actor.processStartTurnConditions({ trigger: "combatTurn" });
  });

  Hooks.on("updateCombat", async (combat, changed) => {
    if (!("turn" in changed) && !("round" in changed)) return;
    const previousCombatantId = combat?.previous?.combatantId;
    const actor = previousCombatantId ? combat.combatants.get(previousCombatantId)?.actor : null;
    if (!actor?.processEndTurnConditions) return;
    await actor.processEndTurnConditions({ trigger: "combatTurnEnd" });
  });
}
