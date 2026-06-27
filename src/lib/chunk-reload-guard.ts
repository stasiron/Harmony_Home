/** Inline in document head — must run before app bundles (stale chunk recovery). */
export const CHUNK_RELOAD_GUARD_SCRIPT = `(function(){
var k="homeharmony-chunk-reload",cooldown=15000;
var patterns=[
  "Failed to fetch dynamically imported module",
  "Loading chunk",
  "Importing a module script failed",
  "Failed to load module script",
  "error loading dynamically imported module",
  "Cannot read properties of undefined (reading 'component')"
];
function isChunkError(msg){
  var s=String(msg||"");
  return patterns.some(function(p){return s.indexOf(p)!==-1;});
}
function dbgLog(msg,data){
  fetch('http://127.0.0.1:7887/ingest/d4923940-ca95-41e7-8370-57941aabba7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'29ea4c'},body:JSON.stringify({sessionId:'29ea4c',location:'chunk-reload-guard',message:msg,data:data||{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(function(){});
}
function reloadOnce(msg,src){
  dbgLog('chunk-error-detected',{msg:String(msg||''),src:src||'unknown',isChunk:isChunkError(msg)});
  if(!isChunkError(msg))return;
  var last=sessionStorage.getItem(k),now=Date.now();
  if(last&&now-Number(last)<cooldown){dbgLog('reload-skipped-cooldown',{last:last,now:now});return;}
  sessionStorage.setItem(k,String(now));
  var url=new URL(window.location.href);
  url.searchParams.set("__cr",String(now));
  dbgLog('reload-triggered',{url:url.toString()});
  window.location.replace(url.toString());
}
window.addEventListener("unhandledrejection",function(e){
  var r=e.reason;
  reloadOnce(r&&r.message?r.message:r,'unhandledrejection');
});
window.addEventListener("error",function(e){
  if(e.target&&e.target.tagName==="SCRIPT"){
    reloadOnce("Failed to load module script: "+(e.target.src||""),'script-error');
  }
});
window.addEventListener("vite:preloadError",function(e){
  e.preventDefault();
  reloadOnce("preload",'vite-preload');
});
dbgLog('guard-installed',{href:window.location.href});
})();`;
