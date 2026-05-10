export function canFullKakuja(actor) {
  return actor?.system?.identity?.class !== "quinx";
}
