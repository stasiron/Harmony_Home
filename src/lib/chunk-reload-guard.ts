/** Inline in document head — must run before app bundles (stale chunk recovery). */
export const CHUNK_RELOAD_GUARD_SCRIPT = `(function(){
var k="homeharmony-chunk-reload",buildKey="homeharmony-build",maxRetries=3;
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
function showRecovery(){
  if(document.getElementById("hh-recovery"))return;
  var el=document.createElement("div");
  el.id="hh-recovery";
  el.setAttribute("role","alert");
  el.style.cssText="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:1rem;font-family:system-ui,sans-serif";
  el.innerHTML='<div style="max-width:22rem;background:#fff;border-radius:12px;padding:1.25rem;box-shadow:0 8px 32px rgba(0,0,0,.2)"><p style="margin:0 0 .5rem;font-weight:600;color:#111">Strona nie wczytała się</p><p style="margin:0 0 1rem;font-size:.875rem;color:#444;line-height:1.4">Przeglądarka trzyma starą wersję aplikacji. Wyczyść dane tej strony albo odśwież twardo (Ctrl+Shift+R).</p><button type="button" id="hh-recovery-btn" style="width:100%;padding:.5rem 1rem;border:0;border-radius:8px;background:#111;color:#fff;font-size:.875rem;cursor:pointer">Wyczyść cache i odśwież</button></div>';
  document.documentElement.appendChild(el);
  document.getElementById("hh-recovery-btn").onclick=function(){
    try{localStorage.removeItem(buildKey);sessionStorage.removeItem(k);}catch(e){}
    if(window.caches){
      caches.keys().then(function(keys){return Promise.all(keys.map(function(n){return caches.delete(n)}));}).finally(function(){
        var u=new URL(window.location.href);u.searchParams.set("__cr",String(Date.now()));window.location.replace(u.toString());
      });
    }else{
      var u=new URL(window.location.href);u.searchParams.set("__cr",String(Date.now()));window.location.replace(u.toString());
    }
  };
}
function clearCachesThen(fn){
  if(!window.caches){fn();return;}
  caches.keys().then(function(keys){return Promise.all(keys.map(function(n){return caches.delete(n)}));}).catch(function(){}).finally(fn);
}
function reloadOnce(msg){
  if(!isChunkError(msg))return;
  var retries=Number(sessionStorage.getItem(k)||0);
  if(retries>=maxRetries){showRecovery();return;}
  sessionStorage.setItem(k,String(retries+1));
  var url=new URL(window.location.href);
  url.searchParams.set("__cr",String(Date.now()));
  url.searchParams.set("__v",String(retries+1));
  clearCachesThen(function(){window.location.replace(url.toString());});
}
function noteBuildFromDom(){
  var el=document.querySelector('script[type="module"][src*="/assets/"]')||document.querySelector('link[rel="modulepreload"][href*="/assets/index-"]');
  if(!el)return;
  var src=el.src||el.href||"";
  var m=src.match(/index-([^.]+)/);
  if(!m)return;
  try{
    var prev=localStorage.getItem(buildKey);
    if(prev&&prev!==m[1])sessionStorage.removeItem(k);
    localStorage.setItem(buildKey,m[1]);
  }catch(e){}
}
noteBuildFromDom();
window.addEventListener("load",function(){
  try{sessionStorage.removeItem(k);}catch(e){}
});
window.addEventListener("unhandledrejection",function(e){
  var r=e.reason;
  reloadOnce(r&&r.message?r.message:r);
});
window.addEventListener("error",function(e){
  if(e.target&&e.target.tagName==="SCRIPT"){
    reloadOnce("Failed to load module script: "+(e.target.src||""));
  }
});
window.addEventListener("vite:preloadError",function(e){
  e.preventDefault();
  reloadOnce("preload");
});
})();`;
