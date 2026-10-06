import fs from "node:fs/promises";
import path from "node:path";

// Portable ZIP writer (stored entries). No runtime or shell dependencies.
const crcTable = Uint32Array.from({length:256}, (_, i) => {
  for (let bit=0; bit<8; bit++) i = (i & 1) ? 0xedb88320 ^ (i >>> 1) : i >>> 1;
  return i >>> 0;
});
const crc32 = data => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const root = process.cwd();
const manifest = JSON.parse(await fs.readFile("system.json", "utf8"));
const files = ["system.json", "README.md"];
const sources = new Map();
const packsIndex = process.argv.indexOf("--packs");
const packsDirectory = packsIndex < 0 ? "packs" : path.resolve(process.argv[packsIndex + 1]);
for (const optional of ["LICENSE", "LICENSE.md"]) {
  try { await fs.access(optional); files.push(optional); } catch {}
}
async function collect(directory, sourceDirectory = directory) {
  for (const entry of await fs.readdir(sourceDirectory, {withFileTypes:true})) {
    const relative = `${directory}/${entry.name}`;
    const source = path.join(sourceDirectory, entry.name);
    if (entry.isDirectory()) {
      if (directory.startsWith("packs") && entry.name === "lost") continue;
      await collect(relative, source);
    } else if (!/^(LOCK|LOG.*)$/.test(entry.name)) {
      files.push(relative);
      sources.set(relative, source);
    }
  }
}
for (const directory of ["assets", "src", "templates", "styles", "lang", "babele", "docs/qa"]) await collect(directory);
await collect("packs", packsDirectory);
const local = [], central = [];
let offset = 0;
for (const relative of files.sort()) {
  const content = await fs.readFile(sources.get(relative) ?? path.join(root, relative));
  const name = Buffer.from(`${manifest.id}/${relative}`, "utf8");
  const crc = crc32(content);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20,4); header.writeUInt16LE(0x800,6);
  header.writeUInt16LE(33,12); header.writeUInt32LE(crc,14); header.writeUInt32LE(content.length,18);
  header.writeUInt32LE(content.length,22); header.writeUInt16LE(name.length,26);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20,4); record.writeUInt16LE(20,6);
  record.writeUInt16LE(0x800,8); record.writeUInt16LE(33,14); record.writeUInt32LE(crc,16);
  record.writeUInt32LE(content.length,20); record.writeUInt32LE(content.length,24);
  record.writeUInt16LE(name.length,28); record.writeUInt32LE(offset,42);
  local.push(header,name,content); central.push(record,name);
  offset += header.length + name.length + content.length;
}
const directory = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10);
end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
await fs.mkdir("artifacts/release", {recursive:true});
await fs.writeFile(`artifacts/release/${manifest.id}.zip`, Buffer.concat([...local,directory,end]));
for (const name of ["system.json", "manifest.json"]) await fs.copyFile("system.json", `artifacts/release/${name}`);
console.log(`Packaged ${manifest.id} ${manifest.version}: ${files.length} files, PDF excluded.`);
