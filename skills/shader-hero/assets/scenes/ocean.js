// Scene: a raymarched ocean. Put the canvas at the bottom of a `rel oh` hero (see SKILL.md); the horizon sits near
// the top of the canvas. Colors: `--bg` is the sky, `--sea` (or `--acc`) the water.
({
  selector: 'canvas.sea',
  hash: '#ocean',
  frag: `uniform vec3 sky,deep,sun,sunc;
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
// march: step along the ray until we are under the surface
float dist=0.,ht=0.;vec3 p=ro;
for(int i=0;i<16;i++){p=ro+rd*dist;ht=p.y-hm(p.xz);if(ht<.02||dist>60.)break;dist+=ht*.95;}
p=ro+rd*dist;
vec3 n=nrm(p.xz,.02+dist*.004);
float fres=pow(1.-max(dot(n,-rd),0.),5.);
vec3 refl=mix(sky,sunc,pow(max(dot(reflect(rd,n),sun),0.),48.)*.35);
vec3 col=mix(deep,refl,fres*.7+.05);
col+=sunc*pow(max(dot(reflect(rd,n),sun),0.),700.)*.9;
// the sky above the horizon, and fog into it with distance
col=mix(col,sky,smoothstep(-.005,.02,rd.y));
col=mix(col,sky,1.-exp(-dist*.05));
gl_FragColor=vec4(col,1.);}`,
  theme(token, dark, set) {
    const bg = token('--bg'), sea = token('--sea').some(Boolean) ? token('--sea') : token('--acc');
    set('sky', dark ? bg.map((c, i) => c * .62 + sea[i] * .38) : bg);
    set('deep', dark ? sea.map((c) => c * .5) : sea.map((c, i) => c * .55 + bg[i] * .05));
    set('sun', [0.3, 0.22, 0.93].map((c) => c / Math.hypot(0.3, 0.22, 0.93)));
    set('sunc', dark ? [0.9, 0.95, 1] : [1, 1, 0.96]);
  },
})
