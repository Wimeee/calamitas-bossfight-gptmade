const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('mobile launch requests native fullscreen synchronously before resource waits',async()=>{
 const {t,sandbox}=await loadGame();let calls=0;sandbox.document.documentElement={requestFullscreen(options){calls++;assert.equal(options.navigationUI,'hide');return Promise.reject(Error('browser refuses'));}};
 t.updateSettings({device:'mobile'});const launched=t.launchBattle();assert.equal(calls,1,'request must stay in the initiating user gesture');await launched;assert.equal(t.state.deviceMode,'mobile');assert.equal(t.state.screen,'game');
});
test('upward movement stick jumps and holds wings; releasing it stops flying',async()=>{
 const {t}=await loadGame();t.start();t.setDeviceMode('mobile');const g=t.getGame(),p=g.player,y=p.y;t.setAxis({x:.3,y:-1});for(let i=0;i<60;i++){g.t+=1/120;t.updatePlayerMovement(g,1/120);}assert.ok(p.y<y);assert.ok(p.flightRemaining<6);t.resetTouchInput();t.updatePlayerMovement(g,1/120);assert.equal(p.jumpWasHeld,false);
});
test('manual aiming is the default for the two-stick mobile layout',async()=>{const {t}=await loadGame();t.updateSettings({device:'mobile'});await t.launchBattle();assert.equal(t.state.mobileAutoAim,false);});
