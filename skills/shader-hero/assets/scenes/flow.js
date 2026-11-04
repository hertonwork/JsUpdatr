// Scene: a slow flow field — domain-warped value noise in the accent color, like ink drifting in water. Green silk in
// dark mode, marbled ink in light. Covers the whole hero; stronger to the right and the bottom, where there is no
// headline. Transparent where there is nothing, so the page background shows through.
({
  selector: 'canvas.flow',
  hash: '#flow',
  frag: `uniform vec3 ink,ink2;uniform float dark;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
vec2 p=uv*1.6+vec2(t*.02,0.);
// two rounds of warping, each drifting at its own pace
vec2 q=vec2(fbm(p+vec2(0.,t*.05)),fbm(p+vec2(5.2,1.3)-t*.04));
vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.03),fbm(p+3.*q+vec2(8.3,2.8)-t*.02));
float n=fbm(p+2.5*w);
// bands of ink, and thin veins where the field crosses its own values
float v=smoothstep(.35,.75,n)*(.55+.45*sin(n*20.+t*.3));
float veins=pow(1.-abs(fract(n*6.+t*.05)*2.-1.),6.)*(.18+.2*dark);
float a=(v*.7+veins+.16*q.x);
// stronger to the right and the bottom, where there is no headline
a*=smoothstep(-.9,.6,uv.x*.9+.25)*smoothstep(.75,-.2,uv.y);
vec3 col=mix(ink,ink2,w.y);
gl_FragColor=vec4(col*a,a);}`,
  theme(token, dark, set) {
    const acc = token('--acc'), ink = token('--ink');
    set('ink', acc);
    set('ink2', dark ? acc.map((c, i) => c * .5 + ink[i] * .5) : acc.map((c, i) => c * .6 + ink[i] * .1));
    set('dark', dark ? 1 : 0);
  },
})
