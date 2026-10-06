function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getActorStatValue(actor, stat) {
  if (!actor || !stat) return 0;
  if (typeof actor.getStat === "function") return actor.getStat(stat);
  return numberOrZero(actor.system?.stats?.[stat]?.total ?? actor.system?.stats?.[stat]?.base);
}

async function rollDie(sides = 20) {
  if (globalThis.Roll) {
    const roll = await new Roll(`1d${sides}`).evaluate();
    return roll.total;
  }
  return Math.floor(Math.random() * sides) + 1;
}

export function getRollContext(actor) {
  return actor?.getRollData?.() ?? {};
}

export async function rollD20Check({
  actor = null,
  stat = null,
  statValue = null,
  bonus = 0,
  penalty = 0,
  targetNumber = null,
  opponentTotal = null,
  dieResults = null
} = {}) {
  const natural = dieResults?.[0] ?? await rollDie(20);
  const extra = natural === 20 ? dieResults?.[1] ?? await rollDie(20) : 0;
  const resolvedStat = statValue ?? getActorStatValue(actor, stat);
  const modifierTotal = numberOrZero(resolvedStat) + numberOrZero(bonus) - numberOrZero(penalty);
  const preCriticalTotal = natural + modifierTotal;
  const total = natural === 1 ? Math.max(0, preCriticalTotal - 10) : preCriticalTotal + extra;
  const hasContest = opponentTotal != null;
  const target = hasContest ? opponentTotal : targetNumber;

  return {
    stat,
    natural,
    extra,
    statValue: numberOrZero(resolvedStat),
    bonus: numberOrZero(bonus),
    penalty: numberOrZero(penalty),
    total,
    targetNumber,
    opponentTotal,
    success: target == null ? null : hasContest ? total > numberOrZero(target) : total >= numberOrZero(target),
    formula: buildD20Formula({ stat, statValue: resolvedStat, bonus, penalty, natural, extra })
  };
}

export function buildD20Formula({ stat = null, statValue = 0, bonus = 0, penalty = 0, natural = "1d20", extra = 0 } = {}) {
  const parts = [String(natural)];
  if (stat) parts.push(`+ ${stat.toUpperCase()} (${numberOrZero(statValue)})`);
  else if (statValue) parts.push(`+ ${numberOrZero(statValue)}`);
  if (bonus) parts.push(`+ ${numberOrZero(bonus)}`);
  if (penalty) parts.push(`- ${numberOrZero(penalty)}`);
  if (extra) parts.push(`+ ${numberOrZero(extra)}`);
  if (natural === 1) parts.push("- 10");
  return parts.join(" ");
}
