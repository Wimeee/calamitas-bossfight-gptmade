const state={
  game: null,
  last: 0,
  raf: 0,
  keys: {},
  pointer: {x:500,y:300,fire:false,inside:false},
  deviceMode: "desktop",
  mobileFire: false,
  mobileAutoAim: true,
  moveAxis: {x:0,y:0},
  aimAxis: {x:0,y:0},
  aimHeld: false,
};


export { state };
