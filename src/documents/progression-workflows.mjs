import { promptFields } from "../sheets/roll-dialogs.mjs";
import { calculateForgeQuinqueRcl, validateForgeEdges, calculateKaguneStatPurchase, calculateKaguneEdgeSwap, calculateChimeraEvolution } from "../rules/progression.mjs";
import { createQuinqueDraft } from "../rules/character-builder.mjs";
import { normalizeEdgeName, validateEdgeLoadout, hasEdge } from "../rules/edges.mjs";
import { edgeLabel } from "../localization/labels.mjs";

export async function progressionDialog(actor, action) {
  if (!actor.isOwner) return;
  const stats=["str","acc","per","end","spd","crl"].map(value=>({value,key:`TG.stats.${value}.label`}));
  if (action==="evolve") {
    const mode=await promptFields("TG.actions.evolve",[{name:"mode",label:"TG.sheet.type",value:"stat",options:[{value:"stat",key:"TG.sheet.statPoints"},{value:"swap",key:"TG.actions.swapEdge"},{value:"chimera",key:"TG.actions.chimeraEvolution"}]}]);
    if (!mode) return;
    if (mode.mode!=="stat") return evolveEdge(actor,mode.mode);
  }
  if (action==="spendPoints" || action==="evolve") {
    const data=await promptFields(`TG.actions.${action}`, [{name:"stat",label:"TG.sheet.stats",value:"str",options:stats},{name:"points",label:"TG.sheet.statPoints",value:1,min:1}]);
    if (!data) return;
    const points=Number(data.points);
    if (!stats.some(s=>s.value===data.stat) || !Number.isInteger(points)||points<1) return;
    const kagune=actor.items.find(i=>i.type==="kagune");
    const result=calculateKaguneStatPurchase({currentRcl:kagune?.system.rcl,points});
    if (action==="evolve" && (!kagune || !result.affordable)) return actor.notify("TG.notifications.insufficientPoints");
    if (action==="spendPoints" && points>actor.system.progression.statPoints) return actor.notify("TG.notifications.insufficientPoints");
    if (action==="evolve") await kagune.update({"system.rcl":result.remainingRcl});
    await actor.update({[`system.stats.${data.stat}.base`]:actor.system.stats[data.stat].base+points,...(action==="spendPoints"?{"system.progression.statPoints":actor.system.progression.statPoints-points}:{})});
    return;
  }
  if (action==="consume") {
    if (actor.system.identity.class==="investigator") return actor.notify("TG.notifications.requiredClass");
    const data=await promptFields("TG.actions.consume",[{name:"targetName",label:"TG.sheet.name",type:"text",value:""},{name:"rcl",label:"TG.resources.rcl.label",value:10,min:0}]);
    if (!data || !Number.isInteger(Number(data.rcl)) || Number(data.rcl)<0) return;
    await actor.applyConsumptionReward({targetName:data.targetName,targetHighestRcl:Number(data.rcl)});
    await actor.feed();
    return;
  }
  const sources=actor.items.filter(i=>i.type==="kakuhou"&&!i.system.consumed);
  if (!sources.length) return actor.notify("TG.notifications.noKakuhou");
  const weapons=actor.items.filter(i=>i.type==="quinque");
  const data=await promptFields(`TG.actions.${action}`,[
    {name:"source",label:"TG.itemTypes.kakuhou",value:sources[0].id,options:sources.map(i=>({value:i.id,label:i.name}))},
    ...(action==="upgrade"?[
      {name:"weapon",label:"TG.itemTypes.quinque",value:weapons[0]?.id,options:weapons.map(i=>({value:i.id,label:i.name}))},
      {name:"mode",label:"TG.sheet.type",value:"rcl",options:[{value:"rcl",key:"TG.resources.rcl.label"},{value:"gimmick",key:"TG.itemTypes.gimmick"},{value:"swap",key:"TG.actions.swapEdge"}]}
    ]:[{name:"name",label:"TG.sheet.name",type:"text",value:game.i18n.localize("TG.itemTypes.quinque")},{name:"edges",label:"TG.sheet.edgesComma",type:"text",value:""}])
  ],{hint:"TG.dialog.forgeHint"});
  if (!data) return;
  const source=actor.items.get(data.source);
  if (!source || source.system.consumed) return;
  if (action==="upgrade") {
    const weapon=actor.items.get(data.weapon);
    if (!weapon || weapon.type!=="quinque") return;
    if (data.mode==="swap") {
      const catalog=await game.packs.get("tokyo-ghoul-unofficial.edges").getDocuments();
      const allowed=catalog.filter(i=>i.system.category==="investigator"&&hasEdge(source.system.sourceEdges,i));
      if (!weapon.system.edges.length || !allowed.length) return actor.notify("TG.notifications.invalidEdges");
      const selection=await promptFields("TG.actions.swapEdge",[
        {name:"from",label:"TG.sheet.fromEdge",value:weapon.system.edges[0],options:weapon.system.edges.map(value=>({value,label:edgeLabel(value)}))},
        {name:"to",label:"TG.sheet.toEdge",value:allowed[0].id,options:allowed.map(i=>({value:i.id,label:i.name}))}
      ]);
      if (!selection) return;
      const edge=allowed.find(i=>i.id===selection.to), edges=weapon.system.edges.map(e=>e===selection.from?normalizeEdgeName(edge):e);
      const records=edges.map(name=>catalog.find(i=>normalizeEdgeName(i)===normalizeEdgeName(name)&&i.system.category==="investigator")).filter(Boolean);
      const validation=validateEdgeLoadout({edgeItems:records,sourceType:weapon.system.primaryType,phase:"creation"});
      if (!edge || !validation.valid || records.length!==edges.length || validation.usedSlots>weapon.system.edgeSlots.max) return actor.notify("TG.notifications.invalidEdges");
      await weapon.update({"system.edges":edges});
      await source.update({"system.consumed":true,"system.usedFor":"edgeSwap"});
      await actor.update({"system.progression.statPoints":actor.system.progression.statPoints+source.system.sourceRcl});return;
    }
    if (data.mode==="gimmick" && weapon.system.gimmick) return actor.notify("TG.notifications.oneGimmick");
    const result=await actor.upgradeQuinqueWithKakuhou(weapon,source,{addGimmick:data.mode==="gimmick"});
    if (result?.affordable) {
      await actor.update({"system.progression.statPoints":actor.system.progression.statPoints+source.system.sourceRcl});
      if (data.mode==="gimmick") await actor.createEmbeddedDocuments("Item",[{name:game.i18n.localize("TG.itemTypes.gimmick"),type:"gimmick",system:{gimmickType:result.update["system.gimmick"],staminaCostMode:"maxEndSpd"}}]);
    }
    return;
  }
  const catalog=await game.packs.get("tokyo-ghoul-unofficial.edges").getDocuments();
  const edges=String(data.edges??"").split(",").map(s=>s.trim()).filter(Boolean).map(name => normalizeEdgeName(catalog.find(i=>i.system.category==="investigator"&&(i.name===name||normalizeEdgeName(i)===normalizeEdgeName(name))) ?? name));
  const validation=validateForgeEdges({chosenEdges:edges.map(normalizeEdgeName),sourceEdges:source.system.sourceEdges.map(normalizeEdgeName)});
  if (!validation.valid) return actor.notify("TG.notifications.invalidEdges");
  const draft=createQuinqueDraft({name:data.name,actorClass:actor.system.identity.class,quinqueType:source.system.sourceKaguneType,edges});
  const records=edges.map(name=>catalog.find(i=>normalizeEdgeName(i)===normalizeEdgeName(name)&&i.system.category==="investigator")).filter(Boolean);
  const loadout=validateEdgeLoadout({edgeItems:records,sourceType:source.system.sourceKaguneType,phase:"creation"});
  if (!loadout.valid || records.length!==edges.length || loadout.usedSlots>draft.system.edgeSlots.max) return actor.notify("TG.notifications.invalidEdges");
  draft.system.rcl=calculateForgeQuinqueRcl({sourceRank:source.system.sourceRank,chosenEdges:edges,maxEdges:draft.system.edgeSlots.max}).rcl;
  draft.system.rcBonds.value=draft.system.rcl;
  await actor.createEmbeddedDocuments("Item",[draft]);
  await source.update({"system.consumed":true,"system.usedFor":"forge"});
}

async function evolveEdge(actor, mode) {
  const weapon=actor.getActiveKagune()??actor.items.find(i=>i.type==="kagune");
  if (!weapon) return actor.notify("TG.notifications.requiredClass");
  const catalog=await game.packs.get("tokyo-ghoul-unofficial.edges").getDocuments();
  const allowed=catalog.filter(i=>i.system.category==="ghoul"&&i.system.canTakeAfterCreation&&!i.system.mustChooseAtCreation);
  const fields=[{name:"from",label:"TG.sheet.fromEdge",value:weapon.system.edges[0]??"",options:[{value:"",key:"TG.sheet.openSlot"},...weapon.system.edges.map(value=>({value,label:edgeLabel(value)}))]}];
  if (mode==="swap") fields.push({name:"to",label:"TG.sheet.toEdge",value:allowed[0].id,options:allowed.map(i=>({value:i.id,label:i.name}))});
  else fields.push({name:"secondaryType",label:"TG.sheet.secondaryType",value:"bikaku",options:["ukaku","koukaku","rinkaku","bikaku"].map(value=>({value,key:`TG.kagune.${value}`}))});
  const data=await promptFields(mode==="swap"?"TG.actions.swapEdge":"TG.actions.chimeraEvolution",fields);
  if (!data) return;
  const old=catalog.find(i=>normalizeEdgeName(i)===normalizeEdgeName(data.from)&&i.system.category==="ghoul");
  const selected=mode==="swap"?allowed.find(i=>i.id===data.to):catalog.find(i=>normalizeEdgeName(i)==="chimera"&&i.system.category==="ghoul");
  if (!selected || (mode==="swap"&&(!data.from||!weapon.system.edges.includes(data.from))) || old?.system.incompatibleWith.some(e=>normalizeEdgeName(e)===normalizeEdgeName(selected))) return actor.notify("TG.notifications.invalidEdges");
  if (mode==="chimera" && (actor.system.identity.class!=="ghoul"||hasEdge(weapon.system.edges,"chimera"))) return actor.notify("TG.notifications.requiredClass");
  const result=mode==="swap"?calculateKaguneEdgeSwap({currentRcl:weapon.system.rcl}):calculateChimeraEvolution({currentRcl:weapon.system.rcl,hasCannibalistic:hasEdge(weapon.system.edges,"cannibalistic"),hasOpenSlot:weapon.system.edgeSlots.used<weapon.system.edgeSlots.max,swappingEdge:!!data.from});
  if (!result.affordable) return actor.notify("TG.notifications.insufficientPoints");
  const edges=data.from?weapon.system.edges.map(e=>e===data.from?normalizeEdgeName(selected):e):[...weapon.system.edges,normalizeEdgeName(selected)];
  const records=edges.map(name=>catalog.find(i=>normalizeEdgeName(i)===normalizeEdgeName(name)&&i.system.category==="ghoul")).filter(Boolean);
  const validation=validateEdgeLoadout({edgeItems:records,sourceType:weapon.system.primaryType,phase:"creation"});
  if (!validation.valid) return actor.notify("TG.notifications.invalidEdges");
  await weapon.update({"system.rcl":result.remainingRcl,"system.edges":edges,...(mode==="chimera"?{"system.secondaryType":data.secondaryType,"system.edgeSlots.max":weapon.system.edgeSlots.max+3}:{})});
}
