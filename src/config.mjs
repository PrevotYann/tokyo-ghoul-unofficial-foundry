export const SYSTEM_ID = "tokyo-ghoul-unofficial";

export const TG_CONFIG = {
  stats: ["str", "acc", "per", "end", "spd", "crl"],
  classes: ["ghoul", "investigator", "quinx"],
  kaguneTypes: ["ukaku", "koukaku", "rinkaku", "bikaku", "chimera"],
  quinqueTypes: ["ukaku", "koukaku", "rinkaku", "bikaku", "chimera", "kakujaWeapon"],
  automationLevels: ["full", "assisted", "manual"],
  ranks: {
    ghoul: ["C", "B", "A", "S", "SS", "SSS"],
    investigator: ["rank3", "rank2", "rank1", "firstClass", "associateSpecial", "specialClass"]
  },
  startingRcl: {
    ghoulKagune: 10,
    quinxKagune: 5,
    investigatorQuinque: 10,
    quinxQuinque: 10
  },
  startingEdgeSlots: {
    ghoulKagune: 3,
    quinxKagune: 1,
    investigatorQuinque: 3,
    quinxQuinque: 2
  },
  edgeSlotRclBonus: 2,
  mealScore: {
    rounding: "floor",
    minimum: 4
  },
  schemaVersion: 1
};

export const RANGE_BANDS = {
  melee: { min: 0, max: 5 },
  close: { min: 5, max: 15 },
  mid: { min: 15, max: 30 },
  long: { min: 30, max: 45 },
  far: { min: 45, max: null }
};
