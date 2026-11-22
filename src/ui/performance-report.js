import {getPerformanceReport} from '../core/frame-trace.js?v=31.1.3';
import {translate} from '../core/localization.js?v=31.1.3';
const byId=id=>document.getElementById(id);
export async function copyPerformanceReport(){
 const report=getPerformanceReport(),area=byId('performance-report'),status=byId('performance-report-status');
 if(!report.samples){area.value='';area.hidden=true;status.textContent=translate('Спершу пограй до підсмикування, потім повернись сюди.');return;}
 const text=JSON.stringify(report);area.value=text;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(text);area.hidden=true;status.textContent=translate('Звіт скопійовано. Встав його в чат.');
 }catch{
  area.hidden=false;area.focus?.();area.select?.();status.textContent=translate('Скопіюй виділений текст і встав його в чат.');
 }
}
