import fs from "node:fs/promises";
import { characterProfiles } from "../src/packs-source/adventures/last-delivery.mjs";

// Original vector token art, separate from generated raster battlemaps.
const target = "assets/adventures/last-delivery/tokens";
await fs.mkdir(target, { recursive: true });
const profiles = [ ...characterProfiles.map(p => [p.key, p.name, p.actorClass]), ["emi", "Emi Hayase", "ghoul"], ["yui", "Yui Matsuda", "human"], ["patient", "Haru Watanabe", "human"], ["guard", "Riku Inose", "ghoul"], ["lookout", "Chika Fuse", "ghoul"], ["boss", "Masato Kurose", "boss"] ];
for (const [index, [key, name, type]] of profiles.entries()) {
  const color = { investigator: "#58c8d6", ghoul: "#d46378", quinx: "#d6b565", human: "#8ab4a2", boss: "#ff435f" }[type];
  const mask = ["ghoul", "boss"].includes(type);
  const initials = name.split(" ").map(n => n[0]).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><title>${name} — original silhouette token</title><defs><radialGradient id="bg"><stop stop-color="#303d4c"/><stop offset="1" stop-color="#090e17"/></radialGradient></defs><circle cx="128" cy="128" r="122" fill="url(#bg)" stroke="${color}" stroke-width="7"/><path d="M34 224Q45 166 91 160L107 147H149L165 160Q212 169 222 224" fill="#171d28" stroke="${color}" stroke-width="2"/><path d="M91 164L112 202L128 180L144 202L165 164" fill="#354051"/><ellipse cx="128" cy="107" rx="43" ry="55" fill="#bbc1ca"/><path d="M83 109L86 73Q96 ${35 + index % 4 * 4} 139 51Q181 62 172 103L156 79L132 89L113 77L92 101Z" fill="#151c27"/><path d="M99 112H115M141 112H157" stroke="${color}" stroke-width="6"/>${mask ? '<path d="M85 126Q128 110 171 126L165 151Q128 177 91 151Z" fill="#111820" stroke="' + color + '" stroke-width="2"/><path d="M104 143H153" stroke="#a9aeba" stroke-width="2"/>' : '<path d="M116 145Q128 151 140 145" fill="none" stroke="#485263" stroke-width="3"/>'}<rect x="87" y="207" width="82" height="31" rx="12" fill="#0c1320"/><text x="128" y="230" text-anchor="middle" font-family="sans-serif" font-size="23" font-weight="bold" fill="${color}">${initials}</text></svg>`;
  await fs.writeFile(`${target}/${key}.svg`, svg + "\n");
}
console.log(`Saved ${profiles.length} original vector tokens.`);
