// Presentation helpers shared by sheets and chat cards. Pure: no Foundry globals.

export const ACTION_ICONS = {
  strike: "fa-burst",
  dodge: "fa-wind",
  block: "fa-shield-halved",
  takeHit: "fa-heart-crack",
  interpose: "fa-shield",
  breather: "fa-lungs",
  controlCheck: "fa-brain",
  roll: "fa-dice-d20",
  move: "fa-shoe-prints",
  ready: "fa-hourglass-half",
  allOut: "fa-bolt",
  counter: "fa-rotate-left",
  overextend: "fa-arrows-left-right-to-line",
  heavyStrike: "fa-hammer",
  grab: "fa-hand-back-fist",
  throw: "fa-person-falling-burst",
  breakGrapple: "fa-link-slash",
  reload: "fa-arrows-rotate",
  reserveReaction: "fa-hand",
  toggleGimmick: "fa-gears",
  rage: "fa-fire",
  assignStats: "fa-sliders",
  feed: "fa-utensils",
  mastery: "fa-eye",
  consume: "fa-tooth",
  spendPoints: "fa-arrow-up-wide-short",
  evolve: "fa-dna",
  forge: "fa-hammer",
  upgrade: "fa-circle-up",
  activateKakuja: "fa-skull",
  deactivateKakuja: "fa-power-off",
  setupClass: "fa-wand-magic-sparkles",
  addEffect: "fa-plus",
  counterAttack: "fa-reply",
  raidFollowUp: "fa-forward",
  use: "fa-hand-pointer",
  edit: "fa-pen",
  delete: "fa-trash",
  manifest: "fa-eye",
  withdraw: "fa-eye-slash",
  equip: "fa-hand-fist",
  unequip: "fa-box-archive",
  toggleArmor: "fa-user-shield",
  switchForm: "fa-shuffle"
};

export const ITEM_ICONS = {
  kagune: "fa-dragon",
  quinque: "fa-briefcase",
  "kakuja-armor": "fa-user-shield",
  edge: "fa-gem",
  gimmick: "fa-gears",
  maneuver: "fa-person-running",
  consumable: "fa-kit-medical",
  kakuhou: "fa-heart-pulse",
  condition: "fa-triangle-exclamation",
  loot: "fa-box-open"
};

// Rulebook rank equivalence (p. 9): Ghoul letter ranks pair with CCG ranks by index.
export const RANK_EQUIVALENCE = [["C", "rank3"], ["B", "rank2"], ["A", "rank1"], ["S", "firstClass"], ["SS", "associateSpecial"], ["SSS", "specialClass"]];

export function equivalentRank(rank) {
  const pair = RANK_EQUIVALENCE.find(entry => entry.includes(rank));
  if (!pair) return null;
  return pair[0] === rank ? pair[1] : pair[0];
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function resourceBar(resource = {}) {
  const value = number(resource.value), max = number(resource.max);
  const pct = max > 0 ? Math.round(Math.min(1, Math.max(0, value / max)) * 100) : 0;
  return { value, max, pct, low: max > 0 && pct <= 25, critical: max > 0 && pct <= 10 };
}

export function pips(filled = 0, total = 0) {
  const count = Math.max(0, Math.min(12, Math.floor(number(total))));
  return Array.from({ length: count }, (_, index) => ({ filled: index < number(filled) }));
}

export function statDelta(stat = {}) {
  return number(stat.total) - number(stat.base);
}

/** Classify a d20 result for chat styling: natural 20, natural 1 or ordinary. */
export function rollTone(natural) {
  return natural === 20 ? "critical" : natural === 1 ? "fumble" : "normal";
}

const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Compact chat card for a single already-localized log line. */
export function logCardHTML(text, icon = "fa-circle-info", tone = "log") {
  return `<section class="tg-system tg-chat-card tg-card-${tone}"><div class="tg-card-log-line"><i class="fa-solid ${icon}" aria-hidden="true"></i><p>${escape(text)}</p></div></section>`;
}
