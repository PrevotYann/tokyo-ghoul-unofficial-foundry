import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { normalizeEdgeName } from "../src/rules/edges.mjs";

const sourceDir = path.resolve("src/packs-source");
const allowedTypes = new Set([
  "kagune",
  "quinque",
  "edge",
  "gimmick",
  "maneuver",
  "consumable",
  "kakuhou",
  "kakuja-armor",
  "condition",
  "loot"
]);

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".json"));
const errors = [];
let total = 0;

for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  let records;
  try {
    records = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error.message})`);
    continue;
  }

  if (!Array.isArray(records)) {
    errors.push(`${file}: expected a top-level array`);
    continue;
  }

  records.forEach((record, index) => {
    total += 1;
    const prefix = `${file}[${index}]`;
    if (!record.name || typeof record.name !== "string") errors.push(`${prefix}: missing string name`);
    if (!allowedTypes.has(record.type)) errors.push(`${prefix}: unsupported type ${record.type}`);
    if (!record.system || typeof record.system !== "object" || Array.isArray(record.system)) errors.push(`${prefix}: missing system object`);
    if (typeof record.system?.automation !== "string") errors.push(`${prefix}: missing system.automation`);
    if (record.type === "edge" && record.system.ruleId !== normalizeEdgeName(record.name)) errors.push(`${prefix}: missing or inconsistent stable Edge rule ID`);
  });
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${total} pack source records across ${files.length} files.`);
}
