/**
 * Safari na iPhonie ignoruje `user-scalable=no` — blokujemy pinch-zoom
 * zdarzeniami gestów. Inline w <head>, żeby działało od pierwszej klatki.
 */
export const NO_ZOOM_SCRIPT = `(function(){
var stop=function(e){e.preventDefault();};
document.addEventListener("gesturestart",stop,{passive:false});
document.addEventListener("gesturechange",stop,{passive:false});
document.addEventListener("touchmove",function(e){if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});
})();`;
