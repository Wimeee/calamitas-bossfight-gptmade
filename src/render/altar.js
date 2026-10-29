export function paintAltar(c,x,y){
  c.save();c.translate(x,y);
  const stroke=(x1,y1,x2,y2,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
  // Stone plinth, flared bronze urn, lid and luminous brimstone seams.
  c.fillStyle='#241723';c.fillRect(-45,25,90,10);c.fillRect(-35,16,70,10);
  stroke(-44,25,44,25,'#8c5260',2);
  c.beginPath();c.moveTo(-23,-24);c.lineTo(23,-24);c.lineTo(28,-12);c.lineTo(18,15);c.lineTo(-18,15);c.lineTo(-28,-12);c.closePath();
  c.fillStyle='#3e1c29';c.fill();c.strokeStyle='#bd745e';c.lineWidth=2;c.stroke();
  stroke(-29,-26,29,-26,'#d39c72',4);stroke(-18,-31,18,-31,'#8c4a45',4);
  for(const side of [-1,1]){stroke(side*25,-17,side*35,-28,'#b16c54',3);stroke(side*35,-28,side*30,-36,'#b16c54',2);}
  stroke(0,-18,-7,-3,'#ff9c75',2);stroke(-7,-3,5,2,'#ff5c61',2);stroke(5,2,0,11,'#ff9c75',2);c.restore();
}
