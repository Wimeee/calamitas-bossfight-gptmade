const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('prepared backdrop uses one backing pixel per source pixel and restores the camera transform',async()=>{
 const {t}=await loadGame(),image={width:1000,height:1000},calls=[];
 const ctx={getTransform:()=>({a:.5,b:0,c:0,d:.5,e:17.2,f:-30.7}),save:()=>calls.push('save'),restore:()=>calls.push('restore'),setTransform:(...a)=>calls.push(a),drawImage:(...a)=>calls.push(a)};
 assert.equal(typeof t.paintBackdropStamp,'function');
 t.paintBackdropStamp(ctx,image,25,40,1999.6,1999.6);
 assert.deepEqual(calls,['save',[1,0,0,1,0,0],[image,30,-11],'restore']);
});
test('rotated or genuinely scaled backdrop keeps its full original placement',async()=>{
 const {t}=await loadGame(),image={width:1000,height:1000},calls=[];
 const ctx={getTransform:()=>({a:.5,b:.1,c:0,d:.5,e:0,f:0}),drawImage:(...a)=>calls.push(a)};
 t.paintBackdropStamp(ctx,image,25,40,2000,2000);assert.deepEqual(calls,[[image,25,40,2000,2000]]);
 calls.length=0;ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:0,f:0});
 t.paintBackdropStamp(ctx,image,25,40,2000,2000);assert.deepEqual(calls,[[image,25,40,2000,2000]]);
});
