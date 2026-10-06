import fs from "node:fs/promises";
import path from "node:path";
import { ClassicLevel } from "classic-level";
import { createLastDelivery } from "../src/packs-source/adventures/last-delivery.mjs";

const index = process.argv.indexOf("--output");
const output = index < 0 ? "packs" : process.argv[index + 1];
if (!output) throw new Error("--output requires a directory");
const target = path.resolve(output, "last-delivery");
const database = new ClassicLevel(target, { keyEncoding: "utf8", valueEncoding: "json" });
await database.open();
try {
  await database.clear();
  const adventure = createLastDelivery();
  await database.sublevel("adventures", { valueEncoding: "json" }).put(adventure._id, adventure);
  await fs.writeFile(path.join(target, "_source.json"), JSON.stringify([adventure], null, 2) + "\n");
  await database.compactRange("", "\uffff");
  console.log(`last-delivery: 1 native Adventure, ${adventure.actors.length} actors, ${adventure.items.length} items, ${adventure.journal.length} journals, ${adventure.scenes.length} scenes`);
} finally { await database.close(); }
