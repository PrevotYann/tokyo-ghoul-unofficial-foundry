export function registerCombatHooks() {
  Hooks.on("combatStart", (combat) => {
    console.log("tokyo-ghoul-unofficial | Combat started.", combat.id);
  });
}
