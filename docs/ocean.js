// A small raymarched ocean for the hero. Inlined into index.html by docs/build-page.mjs (minified), so it costs no
// request. It starts after the page has loaded and the browser is idle, so paint, LCP and CLS are untouched; it
// renders at a fraction of the canvas resolution and lowers it until the frame rate holds, pauses when the hero is
// off-screen or the tab is hidden, and draws a single still frame under prefers-reduced-motion. Without WebGL, or on
// a software renderer, the hero is simply plain. Colors come from the page's tokens, so dark mode follows.
const init = () => {
  const canvas = document.querySelector('canvas.sea');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl) return;
  // No GPU (SwiftShader, llvmpipe, headless servers, PageSpeed's own Chrome): a raymarcher would run on the CPU, on
  // the main thread. Those visitors keep the CSS waves. Same if a frame is slow on the first try (see below).
  // #ocean in the URL skips both guards (screenshots, curiosity).
  const force = location.hash === '#ocean', info = gl.getExtension('WEBGL_debug_renderer_info');
  if (!force && /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '')) return;
  if (!force && navigator.connection && navigator.connection.saveData) return;

  const vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const frag = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec3 sky,deep,sun,sunc;
// one wave: a sharpened sine so crests are narrower than troughs
float w(vec2 p,vec2 d,float f,float s){float x=dot(p,d)*f+t*s;return pow(1.-abs(sin(x)),1.7);}
// the height field: a slow warp of the plane, then octaves of two crossing wave trains, rotated each time.
// hm (3 octaves) finds the surface while marching; h (4 octaves) shades it.
vec2 warp(vec2 p){return p+.35*vec2(sin(p.y*.5+t*.12),cos(p.x*.45-t*.1));}
float hm(vec2 p){p=warp(p);float a=.5,s=0.;vec2 d=vec2(.8,.6);
for(int i=0;i<3;i++){s+=a*(w(p,d,1.,.5)*.65+w(p,vec2(-d.y,d.x),1.37,.35)*.35);p=mat2(1.6,1.2,-1.2,1.6)*p;d=mat2(.7,.7,-.7,.7)*d;a*=.44;}return s;}
float h(vec2 p){p=warp(p);float a=.5,s=0.;vec2 d=vec2(.8,.6);
for(int i=0;i<4;i++){s+=a*(w(p,d,1.,.5)*.65+w(p,vec2(-d.y,d.x),1.37,.35)*.35);p=mat2(1.6,1.2,-1.2,1.6)*p;d=mat2(.7,.7,-.7,.7)*d;a*=.44;}return s;}
vec3 nrm(vec2 p,float e){float c=h(p);return normalize(vec3(h(p-vec2(e,0.))-c,e,h(p-vec2(0.,e))-c));}
void main(){
vec2 uv=(gl_FragCoord.xy*2.-r)/r.y;
vec3 ro=vec3(0.,2.6,t*.2),rd=normalize(vec3(uv.x*1.15,uv.y-.62,1.5));
// march: step along the ray until we are under the surface, then refine
float dist=0.,ht=0.;vec3 p=ro;
for(int i=0;i<16;i++){p=ro+rd*dist;ht=p.y-hm(p.xz);if(ht<.02||dist>60.)break;dist+=ht*.95;}
p=ro+rd*dist;
vec3 n=nrm(p.xz,.02+dist*.004);
float fres=pow(1.-max(dot(n,-rd),0.),5.);
vec3 refl=mix(sky,sunc,pow(max(dot(reflect(rd,n),sun),0.),48.)*.35);
vec3 col=mix(deep,refl,fres*.7+.05);
col+=sunc*pow(max(dot(reflect(rd,n),sun),0.),700.)*.9;
// the sky above the horizon, and fog into it with distance
float horizon=smoothstep(-.005,.02,rd.y);
col=mix(col,sky,horizon);
col=mix(col,sky,1.-exp(-dist*.05));
gl_FragColor=vec4(col,1.);}`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uR = u('r'), uT = u('t');

  // colors from the page's tokens, so the ocean follows the theme
  const rgb = (s) => { const m = s.trim().match(/^#([0-9a-f]{3,6})$/i); if (!m) return [0, 0, 0]; const x = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]; return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255); };
  const theme = () => {
    const cs = getComputedStyle(document.documentElement), dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const bg = rgb(cs.getPropertyValue('--bg') || '#fff'), sea = rgb(cs.getPropertyValue('--sea') || cs.getPropertyValue('--acc'));
    gl.uniform3fv(u('sky'), dark ? bg.map((c, i) => c * .62 + sea[i] * .38) : bg);
    gl.uniform3fv(u('deep'), dark ? sea.map((c) => c * .5) : sea.map((c, i) => c * .55 + bg[i] * .05));
    gl.uniform3fv(u('sun'), [0.3, 0.22, 0.93].map((c) => c / Math.hypot(0.3, 0.22, 0.93)));
    gl.uniform3fv(u('sunc'), dark ? [0.9, 0.95, 1] : [1, 1, 0.96]);
  };
  theme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme);

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // resolution: start at half the CSS pixels, then step down while frames take longer than ~17 ms (measured over the
  // first second), so a slow GPU holds a steady frame rate instead of stuttering at full size
  let scale = 0.5, w = 0, hh = 0, visible = true, raf = 0, start = performance.now(), probe = !force, last = 0, slow = 0, n = 0;
  const size = () => {
    const W = Math.max(1, Math.round(canvas.clientWidth * scale)), H = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (W !== w || H !== hh) { w = canvas.width = W; hh = canvas.height = H; gl.viewport(0, 0, w, hh); gl.uniform2f(uR, w, hh); }
  };
  const frame = (now) => {
    raf = 0; size();
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (probe) { probe = false; const t0 = performance.now(); gl.finish(); if (performance.now() - t0 > 40) { canvas.remove(); return; } }
    canvas.classList.add('on');
    if (last && n < 90) { n++; if (now - last > 19) slow++; if (n % 30 === 0) { if (slow > 8 && scale > 0.2) scale *= 0.7; slow = 0; } }
    last = now;
    if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) go(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  addEventListener('resize', go);
  go();
};
// after load, when the browser is idle: the page is painted and measured before a single shader compiles
addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(init, { timeout: 1500 }) : setTimeout(init, 300)));
