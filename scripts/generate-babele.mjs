import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packMap, folderNames, itemId } from "./lib/pack-source.mjs";

export async function translationFiles(root) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "system.json"), "utf8"));
  const files = {};
  for (const [pack, sources] of Object.entries(packMap)) {
    const entries = {}, folders = {}, mapping = { name: "name", description: "system.description" };
    for (const source of sources) {
      if (folderNames[source]) folders[folderNames[source]] = folderNames[source];
      const records = JSON.parse(await fs.readFile(path.join(root, "src/packs-source", source), "utf8"));
      for (const record of records) {
        const entry = { name: record.name };
        for (const field of ["description", "notes", "dynamicNotes", "dynamicEffect"]) {
          if (typeof record.system[field] !== "string") continue;
          mapping[field] = `system.${field}`;
          entry[field] = record.system[field];
        }
        entries[itemId(pack, source, record)] = entry;
      }
    }
    files[`${manifest.id}.${pack}.json`] = {
      label: manifest.packs.find(p => p.name === pack).label, mapping, folders, entries
    };
  }
  files[`${manifest.id}._packs-folders.json`] = {
    entries: Object.fromEntries(manifest.packFolders.map(folder => [folder.name, { name: folder.name }]))
  };
  return files;
}

export async function generateBabele({ root = process.cwd(), lang = "en", output = path.join(root, "babele/en"), module = false } = {}) {
  const target = module ? path.join(output, "compendium", lang) : output;
  await fs.mkdir(target, { recursive: true });
  const files = await translationFiles(root);
  for (const [name, data] of Object.entries(files)) await fs.writeFile(path.join(target, name), JSON.stringify(data, null, 2) + "\n");
  if (module) {
    const id = `tokyo-ghoul-unofficial-${lang}`;
    await fs.mkdir(path.join(output, "lang"), { recursive: true });
    await fs.copyFile(path.join(root, "lang/en.json"), path.join(output, "lang", `${lang}.json`));
    await fs.writeFile(path.join(output, "module.json"), JSON.stringify({
      id, title: `Tokyo Ghoul: Unofficial TTRPG - ${lang} translation`, version: "1.0.0",
      description: "Translation module starter. Translate the English values before publishing.",
      compatibility: { minimum: "14", verified: "14.368" },
      relationships: { systems: [{ id: "tokyo-ghoul-unofficial", type: "system" }], requires: [{ id: "babele", type: "module", compatibility: { minimum: "2.8.0" } }] },
      languages: [{ lang, name: lang, path: `lang/${lang}.json` }], esmodules: ["register.mjs"]
    }, null, 2) + "\n");
    await fs.writeFile(path.join(output, "register.mjs"), `Hooks.once("babele.init", babele => {\n  babele.register({ module: ${JSON.stringify(id)}, lang: ${JSON.stringify(lang)}, dir: ${JSON.stringify(`compendium/${lang}`)} });\n});\n`);
  }
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
  const lang = arg("--lang") ?? "en";
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(lang)) throw new Error("Use a language code such as fr or pt-BR.");
  const module = process.argv.includes("--module");
  const output = arg("--output") ?? (module ? `artifacts/translation-module/${lang}` : `babele/${lang}`);
  const files = await generateBabele({ lang, module, output });
  console.log(`Generated ${Object.keys(files).length} English translation templates in ${output}.`);
}
