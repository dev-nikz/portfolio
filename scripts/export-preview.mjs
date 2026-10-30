import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
const css=await fs.readFile(path.join(root,'motion/motion.css'),'utf8');
const js=(await Promise.all(['math.js','text-reveal.js','app.js'].map(file=>fs.readFile(path.join(root,'motion',file),'utf8')))).map(code=>code.replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
html=html.replace('<link rel="stylesheet" href="motion/motion.css" />',`<style>${css}</style>`).replace('<script type="module" src="motion/app.js"></script>',`<script type="module">${js}</script>`);
for(const relative of new Set([...html.matchAll(/src="(assets\/[^" ]+)"/g)].map(m=>m[1]))){
  const bytes=await fs.readFile(path.join(root,relative));
  const mime=relative.endsWith('.png')?'image/png':relative.endsWith('.svg')?'image/svg+xml':'image/jpeg';
  html=html.replaceAll(`src="${relative}"`,`src="data:${mime};base64,${bytes.toString('base64')}"`);
}
const output=path.resolve(process.argv[2]||path.join(root,'preview.html'));
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html);
console.log(output);
