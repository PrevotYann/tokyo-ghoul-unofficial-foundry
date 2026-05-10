export function clampResource(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}
