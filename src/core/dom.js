const root=document.querySelector('#scal-game');

const $=id=>root.querySelector('#'+id);

const canvas=$('game');

const ctx=canvas.getContext('2d');


export { root, $, canvas, ctx };
