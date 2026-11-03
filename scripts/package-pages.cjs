const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.resolve(root,'_site');
// Never recursively clean anything except this project's exact generated folder.
if(path.relative(root,output)!=='_site'||path.dirname(output)!==root)throw Error('Unsafe output path');
if(fs.existsSync(output)&&fs.lstatSync(output).isSymbolicLink())throw Error('Output cannot be a symlink');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
let files=0,bytes=0;
function copy(src,dst){const st=fs.lstatSync(src);if(st.isSymbolicLink())throw Error('Symlinks are not deployable');if(st.isDirectory()){fs.mkdirSync(dst,{recursive:true});for(const name of fs.readdirSync(src)){if(/(?:\.bak|\.backup|\.log|\.rawimg)$/.test(name)||name.startsWith('.'))continue;copy(path.join(src,name),path.join(dst,name));}}else{fs.copyFileSync(src,dst);files++;bytes+=st.size;}}
for(const name of ['index.html','debug.html','version.json','src','config','styles','assets'])copy(path.join(root,name),path.join(output,name));
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log(JSON.stringify({output,version:JSON.parse(fs.readFileSync(path.join(output,'version.json'))).version,files,bytes}));
