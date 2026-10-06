import fs from 'node:fs/promises';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';
import { packMap, folderNames, packId as id, itemId } from './lib/pack-source.mjs';

const root = process.cwd();
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex < 0 ? path.join(root, 'packs') : path.resolve(process.argv[outputIndex + 1]);
for (const [packName, files] of Object.entries(packMap)) {
  const target = path.join(output, packName);
  const database = new ClassicLevel(target, {keyEncoding:'utf8',valueEncoding:'json'});
  await database.open();
  try {
    await database.clear();
    const items=database.sublevel('items',{valueEncoding:'json'});
    const folders=database.sublevel('folders',{valueEncoding:'json'});
    const records=[];
    for (const file of files) {
      const name = folderNames[file];
      const folderId=name?id(`${packName}:${name}`):null;
      if (folderId) await folders.put(folderId,{_id:folderId,name,type:'Item',folder:null,sorting:'a',color:packName==='edges'?'#9b263b':'#3e5168'});
      const data=JSON.parse(await fs.readFile(path.join(root,'src','packs-source',file),'utf8'));
      for (const record of data) {
        const _id=itemId(packName, file, record);
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
