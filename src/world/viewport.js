import {canvas,root} from '../core/dom.js?v=25.0.0';
import {W,H,setViewportSize} from '../core/config.js?v=25.0.0';
export function resizeViewport(){
 const r=canvas.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
 const ratio=r.width/r.height,h=720,w=Math.round(h*ratio),scale=Math.min(1,2560/w);
 const width=Math.max(1,Math.round(w*scale)),height=Math.round(h*scale);
 if(W===width&&H===height&&canvas.width===width&&canvas.height===height)return;
 setViewportSize(width,height);canvas.width=width;canvas.height=height;
}
export function initializeViewport(){
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeViewport).observe(canvas);
 window.addEventListener('resize',resizeViewport);resizeViewport();
}
