import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const packMap = {
  edges: ["edges-ghoul.json", "edges-investigator.json"],
  maneuvers: ["maneuvers.json"],
  conditions: ["conditions.json"],
  equipment: ["consumables.json", "gimmicks.json"],
  "sample-kagune": ["templates-kagune.json"],
  "sample-quinque": ["templates-quinque.json"]
};

const root = process.cwd();
const sourceDir = path.join(root, "src", "packs-source");
const packDir = path.join(root, "packs");

for (const [packName, files] of Object.entries(packMap)) {
  const records = files.flatMap((file) => JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8")));
  const targetDir = path.join(packDir, packName);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, "_source.json"), `${JSON.stringify(records, null, 2)}\n`);
}

console.log(`Built source import bundles for ${Object.keys(packMap).length} packs.`);
