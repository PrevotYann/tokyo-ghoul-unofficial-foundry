import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ClassicLevel } from 'classic-level';

const packMap = {
  edges: ['edges-ghoul.json', 'edges-investigator.json'],
  maneuvers: ['maneuvers.json'], conditions: ['conditions.json'],
  equipment: ['consumables.json', 'gimmicks.json', 'kakuja-armor.json'],
  'sample-kagune': ['templates-kagune.json'], 'sample-quinque': ['templates-quinque.json']
};
const id = value => createHash('sha256').update(value).digest('hex').slice(0,16);
const root = process.cwd();
for (const [packName, files] of Object.entries(packMap)) {
  const target = path.join(root, 'packs', packName);
  const database = new ClassicLevel(target, {keyEncoding:'utf8',valueEncoding:'json'});
  await database.open();
  try {
    await database.clear();
    const items=database.sublevel('items',{valueEncoding:'json'});
    const folders=database.sublevel('folders',{valueEncoding:'json'});
    const records=[];
    for (const file of files) {
      const name = ({'edges-ghoul.json':'Kagune Edges','edges-investigator.json':'Investigator Edges','consumables.json':'Consumables','gimmicks.json':'Gimmicks','kakuja-armor.json':'Kakuja Armor'})[file];
      const folderId=name?id(`${packName}:${name}`):null;
      if (folderId) await folders.put(folderId,{_id:folderId,name,type:'Item',folder:null,sorting:'a',color:packName==='edges'?'#9b263b':'#3e5168'});
      const data=JSON.parse(await fs.readFile(path.join(root,'src','packs-source',file),'utf8'));
      for (const record of data) {
        const _id=id(`${packName}:${file}:${record.name}`);
        const entry={...record,_id,folder:folderId,img:record.img??'systems/tokyo-ghoul-unofficial/assets/rc-mark.svg',effects:[],flags:{},ownership:{default:0}};
        await items.put(_id,entry); records.push(entry);
      }
    }
    await fs.writeFile(path.join(target,'_source.json'),JSON.stringify(records,null,2)+'\n');
    // Flush the write-ahead log into native SST files before distribution.
    await database.compactRange('', '\uffff');
    console.log(`${packName}: ${records.length} native Item records`);
  } finally {await database.close();}
}
