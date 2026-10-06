import { createHash } from "node:crypto";
import { createCharacterDraft, createKaguneDraft } from "../../rules/character-builder.mjs";
import { calculateDerivedResources } from "../../rules/derived-stats.mjs";
import { journalContent } from "./last-delivery-journals.mjs";
import { buildSceneLayout, sceneLayouts } from "./last-delivery-scenes.mjs";

export const adventureId = key => createHash("sha256").update(`last-delivery:v1:${key}`).digest("hex").slice(0, 16);
const asset = file => `systems/tokyo-ghoul-unofficial/assets/adventures/last-delivery/${file}`;
const flags = { "tokyo-ghoul-unofficial": { adventure: "last-delivery", contentVersion: 2 } };
const folder = key => adventureId(`folder:${key}`);
const actorId = key => adventureId(`actor:${key}`);
const journalId = key => adventureId(`journal:${key}`);
const sceneId = key => adventureId(`scene:${key}`);

export const characterProfiles = [
  { key: "aya", name: "Aya Teshima", actorClass: "investigator", statPreset: "investigatorMarksman", quinqueType: "ukaku", weapons: ["Signal Nine"], role: "Witness protection and ranged support", bond: "Yui is your childhood neighbor. Daichi is your mentor.", secret: "You contacted Yui before reporting the case. Bring her home alive." },
  { key: "ren", name: "Ren Kisaragi", actorClass: "ghoul", statPreset: "balanced", kaguneType: "bikaku", weapons: ["Switchback"], role: "Courier and local guide", bond: "Emi sheltered you; Mio repairs your gear.", secret: "You ignored a suspicious tag on your last delivery. Tell the truth before someone else pays." },
  { key: "mio", name: "Mio Naruse", actorClass: "ghoul", statPreset: "koukakuTank", kaguneType: "koukaku", weapons: ["Rain Shelter"], role: "Protector and repairer", bond: "Ren brings supplies. Aya once let you walk away.", secret: "Kurose knows where your younger ward lives. Protect them without betraying Emi." },
  { key: "daichi", name: "Daichi Ueno", actorClass: "investigator", statPreset: "investigatorBrawler", quinqueType: "koukaku", weapons: ["Bridgekeeper"], role: "Case officer and close defense", bond: "Aya is your junior. Nao deserves to be treated as a person.", secret: "Your supervisor wants a simple arrest. Secure evidence that can survive an honest report." },
  { key: "nao", name: "Nao Fushimi", actorClass: "quinx", statPreset: "balanced", kaguneType: "rinkaku", quinqueType: "bikaku", weapons: ["Suture", "Quiet Line"], role: "Liaison and flexible rescue support", bond: "Daichi checks on you without asking for test results.", secret: "You fear losing control will discredit the truce. Ask for help before that happens." },
  { key: "sora", name: "Sora Amemiya", actorClass: "ghoul", statPreset: "ukakuRanged", kaguneType: "ukaku", weapons: ["Featherlight"], role: "Scout and photographer", bond: "Yui carried film that exposed an earlier abduction.", secret: "A reporter already has one blurred photo. Rescue the subjects before deciding what to publish." }
];

function medkit(key) {
  return { _id: adventureId(`kit:${key}`), name: "Field Medical Kit", type: "consumable", img: "icons/svg/regen.svg", system: { consumableType: "medkit", quantity: 1, maxCarry: 5, range: "melee", area: "none", effect: { removes: ["bleeding", "burning"], healingFormula: "PER + target END" }, automation: "assisted", description: "Use the system's medkit workflow; follow the target's class restrictions." } };
}

function finishActor(draft, key, { role = "", bond = "", secret = "", npc = false } = {}) {
  delete draft.validation;
  draft._id = actorId(key);
  draft.type = npc ? "npc" : "character";
  draft.img = asset(`tokens/${key}.svg`);
  draft.folder = folder(npc ? "npc" : "pcs");
  draft.flags = structuredClone(flags);
  draft.ownership = { default: 0 };
  draft.effects = [];
  draft.items = draft.items.map((item, index) => ({ ...item, _id: adventureId(`embedded:${key}:${index}`), img: "systems/tokyo-ghoul-unofficial/assets/rc-mark.svg", effects: [], flags: {} }));
  const kagune = draft.items.find(i => i.type === "kagune");
  const inputStats = structuredClone(draft.system.stats);
  // Use the existing formula implementation, including the default Bikaku penalty.
  if (kagune?.system.primaryType === "bikaku") inputStats.crl.edge -= 2;
  const derived = calculateDerivedResources({ stats: inputStats, kaguneType: kagune?.system.primaryType });
  const resource = max => ({ value: max, max, min: 0, temp: 0, tempMaxPenalty: 0 });
  draft.system.resources = { vitality: resource(derived.vitalityMax), stamina: resource(derived.staminaMax), mealScore: resource(draft.system.identity.class === "investigator" ? 0 : derived.mealScoreMax) };
  draft.system.biography = { appearance: `<p>${role}</p>`, personality: `<p>${bond}</p>`, backstory: `<p>${secret}</p>`, goals: "<p>Recover Yui, rescue the patients, and decide who receives the evidence.</p>" };
  draft.system.automation = { ruleNotes: "<p>Last Delivery scenario profile. Story objectives and surrender are GM adjudicated. Use existing system attacks, reactions and resource automation.</p>" };
  draft.prototypeToken = { name: draft.name, actorLink: !npc, texture: { src: draft.img }, width: 1, height: 1, disposition: npc ? 0 : 1, displayName: 30, displayBars: 30, bar1: { attribute: "resources.vitality" }, bar2: { attribute: "resources.stamina" }, sight: { enabled: !npc, range: 0, angle: 360, visionMode: "basic" } };
  return draft;
}

export function createLastDelivery() {
  const actors = characterProfiles.map(profile => {
    const draft = createCharacterDraft(profile);
    draft.items.forEach((item, index) => {
      item.name = profile.weapons[index];
      item.system.automation = "full";
      item.system.description = `<p>${profile.role}'s original ${item.system.primaryType} ${item.type}. No optional Edges; unused starting slots convert to RCL through the character builder.</p>`;
    });
    if (["investigator", "quinx"].includes(profile.actorClass)) draft.items.push(medkit(profile.key));
    return finishActor(draft, profile.key, profile);
  });
  const npcProfiles = [
    { key: "emi", name: "Emi Hayase • Coffee Shop Owner", actorClass: "ghoul", kaguneType: "bikaku", role: "Noncombatant ally", bond: "Protects vulnerable ghouls and keeps the meeting neutral.", secret: "Knows the clinic address and will give it freely." },
    { key: "yui", name: "Yui Matsuda • Missing Courier", actorClass: "investigator", role: "Human noncombatant witness", bond: "Trusts Aya and Ren.", secret: "Copied the clinic ledger. Can identify Kurose and open the station cage." },
    { key: "patient", name: "Haru Watanabe • Captive", actorClass: "investigator", role: "Human noncombatant captive", bond: "Wants both patients rescued.", secret: "Can walk with an escort; carries no weapon." },
    { key: "guard", name: "Riku Inose • Clinic Enforcer", actorClass: "ghoul", statPreset: "koukakuTank", kaguneType: "koukaku", role: "Coerced enforcer", bond: "Kurose threatens his household.", secret: "Yields at half Vitality or accepts credible evacuation protection." },
    { key: "lookout", name: "Chika Fuse • Freight Lookout", actorClass: "ghoul", statPreset: "ukakuRanged", kaguneType: "ukaku", role: "Coerced scout", bond: "Her brother is held as collateral.", secret: "She knows the south service route and can be recruited." },
    { key: "boss", name: "Masato Kurose • Pallet", actorClass: "ghoul", kaguneType: "rinkaku", customStats: { str: 14, acc: 8, per: 10, end: 12, spd: 16, crl: 24 }, role: "Developed ghoul broker; original boss", bond: "Uses dependent ghouls as leverage.", secret: "A murderer hiding behind falsified mortuary records. Bargains when exposed; yields at 24 Vitality if escape is blocked." }
  ];
  for (const profile of npcProfiles) {
    const draft = createCharacterDraft(profile);
    if (["yui", "patient", "emi"].includes(profile.key)) draft.items = [];
    if (profile.key === "guard") draft.items[0].name = "Iron Wake";
    if (profile.key === "lookout") draft.items[0].name = "Feather Rain";
    if (profile.key === "boss") {
      draft.items = [createKaguneDraft({ name: "Red Ledger", kaguneType: "rinkaku" })];
      draft.items[0].system.rcl = 22;
      draft.system.identity.rankGhoul = "A";
    }
    actors.push(finishActor(draft, profile.key, { ...profile, npc: true }));
  }
  const items = actors.flatMap(actor => actor.items.filter(i => ["kagune", "quinque"].includes(i.type)).map(item => ({ ...structuredClone(item), _id: adventureId(`item:${item.name}`), folder: folder("items"), ownership: { default: 0 }, flags: structuredClone(flags) })));
  for (const [key, name, description] of [
    ["ledger", "Kurose's Original Ledger", "Original victim identities, dates and signed collection orders. Evidence only; no stat bonus."],
    ["keys", "Shigure Service Keys", "Opens the clinic service door and station latch. Cage access code: 0417. No combat effect."],
    ["phone", "Yui's Cracked Phone", "Recovered draft and location data pointing to Aobane Clinic. Evidence only."],
    ["camera", "Waterproof Camera", "Can preserve photos of evidence through ordinary GM-adjudicated interaction. No automatic roll modifier."]
  ]) items.push({ _id: adventureId(`item:${key}`), name, type: "loot", img: "icons/svg/item-bag.svg", folder: folder("items"), system: { description: `<p>${description}</p>`, quantity: 1, automation: "manual" }, flags: structuredClone(flags), ownership: { default: 0 } });
  items.push({ ...medkit("world"), folder: folder("items"), flags: structuredClone(flags), ownership: { default: 0 } });
  const journal = journalContent.map(([key, name, html], index) => ({ _id: journalId(key), name, folder: folder(key === "briefing" || ["manifest", "message", "ledger"].includes(key) ? "handouts" : "gm"), sort: index * 100000, ownership: { default: 0 }, flags: structuredClone(flags), pages: [{ _id: adventureId(`page:${key}`), name, type: "text", title: { show: false, level: 1 }, text: { format: 1, content: `<article class="tg-system tg-adventure">${html.replace(/\{\{(actor|scene|journal|item):([^}]+)\}\}/g, (_, type, target) => {
    const collection = { actor: actors, scene: null, journal: null, item: items }[type];
    const id = type === "actor" ? actorId(target) : type === "scene" ? sceneId(target) : type === "journal" ? journalId(target) : adventureId(`item:${target}`);
    const label = collection?.find(d => d._id === id)?.name ?? (type === "journal" ? journalContent.find(j => j[0] === target)?.[1] : { alley: "Rain at Sazanami", clinic: "Aobane Clinic", station: "Shigure Last Freight" }[target]) ?? target;
    return `@UUID[${{ actor: "Actor", scene: "Scene", journal: "JournalEntry", item: "Item" }[type]}.${id}]{${label}}`;
  })}</article>` } }] }));
  const sceneSpecs = [
    { key: "alley", name: "01 • Rain at Sazanami", image: "sazanami-alley.png", tokens: [["emi", 320, 240, false], ["lookout", 1240, 170, false], ["guard", 1090, 330, true]], pins: [[350, 280, "Coffee shop"], [780, 440, "Delivery van"], [1230, 220, "Loading yard"]] },
    { key: "clinic", name: "02 • Aobane Clinic", image: "aobane-clinic.png", tokens: [["yui", 1100, 260, false], ["guard", 740, 450, false], ["lookout", 1100, 660, true]], pins: [[400, 280, "Reception"], [1110, 280, "Treatment room"], [380, 690, "Cold room"], [1120, 680, "Office"]] },
    { key: "station", name: "03 • Shigure Last Freight", image: "shigure-station.png", tokens: [["boss", 950, 290, false], ["patient", 1190, 710, false], ["patient", 1270, 710, false], ["guard", 800, 400, true], ["lookout", 1100, 400, true]], pins: [[970, 310, "Loading desk"], [1240, 700, "Captives"], [650, 890, "South service route"]] }
  ];
  const scenes = sceneSpecs.map((spec, index) => ({ _id: sceneId(spec.key), name: spec.name, folder: folder("scenes"), active: false, navigation: true, navOrder: index, width: 1536, height: 1024, padding: 0, background: { src: asset(spec.image) }, backgroundColor: "#10141b", grid: { type: 0, size: 64, distance: 5, units: "ft" }, tokenVision: true, fog: { exploration: true }, environment: { darknessLevel: 0.35, globalLight: { enabled: true, bright: false, alpha: 0.2, luminosity: 0.2, color: "#9ab0c8" } }, journal: journalId(spec.key), ownership: { default: 0 }, flags: structuredClone(flags), tokens: [...spec.tokens.map(([key, x, y, hidden], i) => {
    const actor = actors.find(a => a._id === actorId(key));
    return { ...structuredClone(actor.prototypeToken), _id: adventureId(`token:${spec.key}:${i}`), actorId: actor._id, actorLink: false, x, y, hidden, disposition: ["boss", "guard", "lookout"].includes(key) ? -1 : 0 };
  }), ...sceneLayouts[spec.key].party.map(([key, x, y], i) => {
    const actor = actors.find(a => a._id === actorId(key));
    return { ...structuredClone(actor.prototypeToken), _id: adventureId(`pc-token:${spec.key}:${key}`), actorId: actor._id, actorLink: true, x, y, hidden: i >= 4, disposition: 1 };
  })], notes: spec.pins.map(([x, y, text], i) => ({ _id: adventureId(`note:${spec.key}:${i}`), entryId: journalId(spec.key), pageId: adventureId(`page:${spec.key}`), x, y, text, icon: "icons/svg/book.svg", iconSize: 32, global: false })), ...buildSceneLayout(spec.key, adventureId) }));
  const folders = [["pcs", "Actor", "Last Delivery • Playable Characters"], ["npc", "Actor", "Last Delivery • NPCs"], ["items", "Item", "Last Delivery • Arsenal and Evidence"], ["gm", "JournalEntry", "Last Delivery • GM Guide"], ["handouts", "JournalEntry", "Last Delivery • Handouts"], ["scenes", "Scene", "Last Delivery • Scenes"]].map(([key, type, name]) => ({ _id: folder(key), name, type, folder: null, sorting: "m", color: "#762b40" }));
  return { _id: adventureId("adventure"), name: "The Last Delivery", img: asset("sazanami-alley.png"), caption: "An original Tokyo Ghoul one-shot for 4–6 players.", description: "<p>A stolen delivery exposes a ghoul broker's human trafficking route. Six original pregens, three illustrated scenes, a full GM guide, private character dossiers, evidence handouts, NPCs and equipment. Import all content, then read 00 • GM Start Here. Story content is English.</p>", actors, items, journal, scenes, folders, combats: [], tables: [], macros: [], cards: [], playlists: [], flags: structuredClone(flags) };
}
