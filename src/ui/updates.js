import { VERSION } from '../core/config.js?v=19.0.0';


function initializeUpdates(){
  'use strict';
  const currentVersion=VERSION;
  const banner=document.getElementById('site-update-banner');
  const button=document.getElementById('site-update-now');
  const url=new URL(location.href);
  const load=()=>{
    // A unique query string helps mobile Safari fetch the newest published page.
    url.searchParams.set('site-build',String(Date.now()));
    location.replace(url.toString());
  };
  button.addEventListener('click',load);
  let pending=false;
  async function check(){
    if(pending||document.hidden)return;
    pending=true;
    try{
      const response=await fetch('./version.json?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const manifest=await response.json();
      if(manifest&&typeof manifest.version==='string'&&manifest.version!==currentVersion){
        banner.hidden=false;
      }
    }catch(_){
      /* Offline gameplay remains available if file is already cached. */
    }
    finally{
      pending=false;
    }
  }
  check();
  const everyMinute=setInterval(check,60000);
  document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)check()
  });
  window.addEventListener('focus',check);
}


export { initializeUpdates };
