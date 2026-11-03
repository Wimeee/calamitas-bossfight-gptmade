// Signed distance: positive outside the wall, negative inside. No finite hard clip.
export const ARENA_FEATHER_OUTER=384,ARENA_FEATHER_INNER=128;
export function arenaBorderOpacity(distance){
 const x=Math.max(0,Math.min(1,1-Math.abs(distance)/(distance<0?ARENA_FEATHER_INNER:ARENA_FEATHER_OUTER)));
 return x*x*(3-2*x);
}
let tiles;
export function arenaFeatherTiles(){
 if(tiles!==undefined)return tiles;
 const size=256,wall=192,corner=document.createElement('canvas'),side=document.createElement('canvas');corner.width=corner.height=size;side.width=size;side.height=1;
 const c=corner.getContext('2d'),s=side.getContext('2d'),a=c.createImageData(size,size),b=s.createImageData(size,1);
 if(!a?.data||!b?.data)return tiles=null;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=wall-x,dy=wall-y,d=dx>0||dy>0?Math.hypot(Math.max(0,dx),Math.max(0,dy)):Math.max(dx,dy),i=(y*size+x)*4;
  a.data[i]=a.data[i+1]=a.data[i+2]=255;a.data[i+3]=Math.round(arenaBorderOpacity(d*2)*255);
 }
 for(let x=0;x<size;x++){const i=x*4;b.data[i]=b.data[i+1]=b.data[i+2]=255;b.data[i+3]=Math.round(arenaBorderOpacity((wall-x)*2)*255);}
 c.putImageData(a,0,0);s.putImageData(b,0,0);return tiles={corner,side};
}
export function paintArenaFeather(c,box){
 const tiles=arenaFeatherTiles();if(!tiles)return false;
 const out=ARENA_FEATHER_OUTER,inside=ARENA_FEATHER_INNER,size=out+inside,w=box.r-box.l,h=box.b-box.t;
 const corner=(x,y,angle)=>{c.save();c.translate(x,y);c.rotate(angle);c.drawImage(tiles.corner,-out,-out,size,size);c.restore();};
 const edge=(x,y,angle,length)=>{if(length<=0)return;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(tiles.side,-out,0,size,length);c.restore();};
 corner(box.l,box.t,0);corner(box.r,box.t,Math.PI/2);corner(box.r,box.b,Math.PI);corner(box.l,box.b,-Math.PI/2);
 edge(box.l,box.t+inside,0,h-inside*2);edge(box.r-inside,box.t,Math.PI/2,w-inside*2);
 edge(box.r,box.b-inside,Math.PI,h-inside*2);edge(box.l+inside,box.b,-Math.PI/2,w-inside*2);return true;
}
