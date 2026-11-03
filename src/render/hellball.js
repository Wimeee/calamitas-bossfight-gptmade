// Direct GLSL translation of local Calamity Effects/HellBall.fx, with native ScreamyFace.
let cached;
export function drawHellBall(ctx,image,x,y,size,time,opacity){
 if(!image||opacity<=0)return false;
 if(cached===undefined){try{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:false});if(!gl)throw Error('noWebGL');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');return s;};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform float time;uniform float opacity;void main(){float d=length(uv-vec2(.5))*2.;if(d>1.){gl_FragColor=vec4(0.);return;}vec2 blown=pow(abs(uv-vec2(.5))*2.,vec2(3.2));vec2 q=vec2(-blown.y*.2+uv.x*(1.+blown.y*.4),-blown.x*.2+uv.y*(1.+blown.x*.4))*.6;q.y=fract(q.y+time);vec4 n=texture2D(tex,q)+vec4(pow(d,6.));if(d>.95)n*=(1.-(d-.95)/.05);gl_FragColor=n*vec4(mix(vec3(1.,0.,.5)*opacity,vec3(0.),pow(d,4.)),opacity);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');gl.useProgram(program);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.REPEAT);gl.viewport(0,0,512,512);cached={canvas,gl,time:gl.getUniformLocation(program,'time'),opacity:gl.getUniformLocation(program,'opacity')};
 }catch{cached=null;}}
 if(!cached)return false;const {gl}=cached;gl.uniform1f(cached.time,((time%1)+1)%1);gl.uniform1f(cached.opacity,opacity);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);ctx.drawImage(cached.canvas,x-size/2,y-size/2,size,size);return true;
}

export function hellBallRendererStatus(){return cached===undefined?'waiting':cached?'webgl':'native-layer-fallback';}
