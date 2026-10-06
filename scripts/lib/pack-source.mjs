import { createHash } from "node:crypto";

export const packMap = {
  edges: ["edges-ghoul.json", "edges-investigator.json"],
  maneuvers: ["maneuvers.json"], conditions: ["conditions.json"],
  equipment: ["consumables.json", "gimmicks.json", "kakuja-armor.json"],
  "sample-kagune": ["templates-kagune.json"], "sample-quinque": ["templates-quinque.json"]
};
export const folderNames = {
  "edges-ghoul.json": "Kagune Edges", "edges-investigator.json": "Investigator Edges",
  "consumables.json": "Consumables", "gimmicks.json": "Gimmicks", "kakuja-armor.json": "Kakuja Armor"
};
export const packId = value => createHash("sha256").update(value).digest("hex").slice(0, 16);
export const itemId = (pack, file, record) => packId(`${pack}:${file}:${record.name}`);
