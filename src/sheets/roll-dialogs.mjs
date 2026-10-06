export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function promptFields(title, fields, { hint = "", user = null } = {}) {
  const localize = key => escapeHTML(game.i18n.localize(key));
  const content = `<div class="tg-dialog-body">${hint ? `<p class="tg-muted">${localize(hint)}</p>` : ""}<div class="tg-grid tg-grid-2">${fields.map(field => {
    const options = field.options?.map(option => `<option value="${escapeHTML(option.value)}" ${option.value === field.value ? "selected" : ""}>${escapeHTML(option.label ?? game.i18n.localize(option.key))}</option>`).join("");
    const control = options !== undefined ? `<select name="${field.name}">${options}</select>`
      : `<input name="${field.name}" type="${field.type ?? "number"}" value="${escapeHTML(field.value ?? 0)}" ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.max !== undefined ? `max="${field.max}"` : ""} step="1">`;
    return `<label><span>${localize(field.label)}</span>${control}</label>`;
  }).join("")}</div></div>`;
  const config = { window: { title: game.i18n.localize(title) }, classes: ["tg-system", "tg-dialog"], position: { width: 480 }, content, rejectClose: false, ok: { label: game.i18n.localize("TG.actions.apply") } };
  return user ? foundry.applications.api.DialogV2.query(user, "input", config) : foundry.applications.api.DialogV2.input(config);
}

export async function promptRollOptions() {
  return promptFields("TG.actions.roll", [
    { name: "bonus", label: "TG.rolls.bonus", value: 0 },
    { name: "penalty", label: "TG.rolls.penalty", value: 0, min: 0 },
    { name: "targetNumber", label: "TG.rolls.target", type: "text", value: "" }
  ]);
}

export async function promptAttackOptions(actor, item = null) {
  const weapons = actor.items.filter(i => ["kagune", "quinque"].includes(i.type));
  const result = await promptFields("TG.chat.attack", [
    { name: "itemId", label: "TG.chat.source", value: item?.id ?? actor.getDefaultAttackItem()?.id ?? "", options: [{value:"",key:"TG.chat.basicAttack"}, ...weapons.map(i => ({value:i.id,label:i.name}))] },
    { name: "attackMode", label: "TG.sheet.attackMode", value: "melee", options: [{value:"melee",key:"TG.ranges.melee"},{value:"ranged",key:"TG.ranges.ranged"},{value:"sidearm",key:"TG.actions.sidearm"}] },
    { name: "targetRangeBand", label: "TG.sheet.rangeBand", value: actor.system.combat.rangeBand, options: ["melee","close","mid","long","far"].map(value => ({value,key:`TG.ranges.${value}`})) },
    { name: "bonus", label: "TG.rolls.bonus", value: 0 },
    { name: "penalty", label: "TG.rolls.penalty", value: 0, min: 0 }
  ], { hint: "TG.dialog.attackHint" });
  if (!result) return null;
  return { item: actor.items.get(result.itemId) ?? null, options: { ...result, explicitSource: true, sidearm: result.attackMode === "sidearm", attackMode: result.attackMode === "sidearm" ? "ranged" : result.attackMode, bonus: Number(result.bonus), penalty: Number(result.penalty) } };
}
