export class TokyoGhoulActiveEffect extends ActiveEffect {
  // v14 phases: bonuses to formula inputs must precede derived resources.
  shouldApplyChange(change, options = {}) {
    if (/^system\.stats\.[a-z]+\.(base|temp|edge|kakuja)$/.test(change.key)) return options.phase === "initial";
    return super.shouldApplyChange(change, options);
  }
}
