const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
test('accepted player hits request native hurt audio once and blocked hits stay silent',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.ritual=null;g.mode='playing';g.player.iframes=0;
 const played=[];t.audio.ctx={};t.meleeSamples.play=tag=>{played.push(tag);return true;};
 t.hurt(10);assert.deepEqual(played,['playerHurt']);
 t.hurt(10);t.hurt(0);assert.equal(played.length,1);
 g.player.iframes=0;g.mode='paused';t.hurt(10);assert.equal(played.length,1);
});
test('native hurt bank decodes real Terraria WAVs, rotates variants and honors mute',async()=>{
 const {t}=await loadGame();t.start();const played=[];
 const bank=t.createMeleeAudio({fetcher:async url=>{const bytes=fs.readFileSync(fileURLToPath(url));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}});
 const gain=()=>({gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){}});
 const ctx={currentTime:10,createGain:gain,decodeAudioData:async bytes=>bytes,createBufferSource(){return{connect(){},disconnect(){},start(){played.push(this.buffer);},stop(){}};}};
 await bank.initialize(ctx,gain());assert.equal(bank.status.failed,0);
 for(let i=0;i<3;i++){assert.equal(bank.play('playerHurt'),true);ctx.currentTime+=1;}
 assert.equal(new Set(played).size,3);
 for(const bytes of played)assert.equal(Buffer.from(bytes).toString('ascii',0,4),'RIFF');
 t.updateSettings({sfxEnabled:false});assert.equal(bank.play('playerHurt'),false);assert.equal(bank.activeVoices,0);
});
