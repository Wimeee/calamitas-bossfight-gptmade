import {renderScale} from '../core/settings.js?v=29.1.0';
import {canvas,root} from '../core/dom.js?v=29.1.0';
import {W,H,setViewportSize} from '../core/config.js?v=29.1.0';
export function resizeViewport(){
 const r=canvas.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
 const ratio=r.width/r.height,h=720,w=Math.round(h*ratio),scale=Math.min(1,2560/w);
 const width=Math.max(1,Math.round(w*scale)),height=Math.round(h*scale);
 const pixelWidth=Math.max(1,Math.round(width*renderScale())),pixelHeight=Math.max(1,Math.round(height*renderScale()));
 if(W===width&&H===height&&canvas.width===pixelWidth&&canvas.height===pixelHeight)return;
 setViewportSize(width,height);canvas.width=pixelWidth;canvas.height=pixelHeight;
}
export function initializeViewport(){
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeViewport).observe(canvas);
 window.addEventListener('resize',resizeViewport);resizeViewport();
}
