// Conservative screen bounds, including zoom, reflection, rotation and camera shake.
// A missing Canvas transform API keeps the original rendering fallback.
export function circleVisible(context,x,y,radius){
 const canvas=context.canvas;if(!(canvas?.width>0&&canvas?.height>0)||typeof context.getTransform!=='function')return true;
 const m=context.getTransform();if(!m)return true;
 const sx=m.a*x+m.c*y+m.e,sy=m.b*x+m.d*y+m.f,rx=radius*Math.hypot(m.a,m.c)+2,ry=radius*Math.hypot(m.b,m.d)+2;
 if(!Number.isFinite(sx+sy+rx+ry)||radius<0)return true;
 return sx+rx>=0&&sy+ry>=0&&sx-rx<=canvas.width&&sy-ry<=canvas.height;
}
