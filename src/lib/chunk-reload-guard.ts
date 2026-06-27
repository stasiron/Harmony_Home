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
function reloadOnce(msg){
  if(!isChunkError(msg))return;
  var last=sessionStorage.getItem(k),now=Date.now();
  if(last&&now-Number(last)<cooldown)return;
  sessionStorage.setItem(k,String(now));
  var url=new URL(window.location.href);
  url.searchParams.set("__cr",String(now));
  window.location.replace(url.toString());
}
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
