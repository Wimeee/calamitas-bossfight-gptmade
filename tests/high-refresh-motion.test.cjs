const test = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('Calamitas renders fractional native ticks at 180Hz without moving simulation state', async () => {
  const translations = [];
  const {t} = await loadGame({canvasContext: {translate: (x,y) => translations.push([x,y])}});
  t.start(); t.enter('normal','opening');
  const g = t.getGame();
  t.bossAttack(1/60);
  const positions = [];
  for (let i=0;i<3;i++) {
    const before = JSON.stringify(g);
    translations.length = 0;
    t.drawCalamitas(g);
    assert.equal(JSON.stringify(g),before);
    const offset = translations[0] || [0,0];
    positions.push([g.boss.x+offset[0],g.boss.y+offset[1]]);
    if(i<2)t.bossAttack(1/180);
  }
  assert.notDeepEqual(positions[0],positions[1]);
  assert.notDeepEqual(positions[1],positions[2]);
});

test('brother body and native bullets draw at their fractional motion position', async () => {
  const translations = [], lines = [];
  const {t} = await loadGame({canvasContext: {
    translate: (x,y) => translations.push([x,y]),
    lineTo: (x,y) => lines.push([x,y])
  }});
  t.start();t.enter('brothers','h50');
  const g=t.getGame(),b=g.brothers[0];
  b.vx=600;b.vy=-300;g.brotherStepRemainder=1/180;
  translations.length=0;
  const before=JSON.stringify(g);
  t.drawBrother(b,g);
  assert.ok(Math.abs(translations[0][0]-600/180)<1e-9);
  assert.ok(Math.abs(translations[0][1]+300/180)<1e-9);
  assert.equal(JSON.stringify(g),before);
  const q={kind:'dart',ai1:4,x:200,y:300,vx:600,vy:-300,r:6,stepRemainder:1/180};
  g.projectiles=[q];translations.length=0;lines.length=0;
  t.drawEnemyProjectiles(g);
  // The fallback line ends at the same instantaneous position as collision checks.
  assert.ok(Math.abs(translations[0][0]-600/180)<1e-9);
  assert.ok(Math.abs(translations[0][1]+300/180)<1e-9);
  assert.deepEqual(lines.at(-1),[q.x,q.y]);
  assert.equal(q.x,200);assert.equal(q.y,300);
});
