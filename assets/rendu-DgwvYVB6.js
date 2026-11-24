const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./EffectComposer-YwA7lW8R.js","./three.module-DDguy-kI.js","./CopyShader-BzTUYzf6.js","./Pass-Bz1gvUsU.js","./RenderPass-CYuu17Cf.js","./GTAOPass-B7maXh2f.js","./OutputPass-B9EnLc1M.js"])))=>i.map(i=>d[i]);
import{_ as S}from"./index-tMbRLpYb.js";async function Q(){const[{EffectComposer:a},{RenderPass:m},{GTAOPass:h},{OutputPass:n}]=await Promise.all([S(()=>import("./EffectComposer-YwA7lW8R.js"),__vite__mapDeps([0,1,2,3]),import.meta.url),S(()=>import("./RenderPass-CYuu17Cf.js"),__vite__mapDeps([4,1,3]),import.meta.url),S(()=>import("./GTAOPass-B7maXh2f.js"),__vite__mapDeps([5,1,3,2]),import.meta.url),S(()=>import("./OutputPass-B9EnLc1M.js"),__vite__mapDeps([6,1,3]),import.meta.url)]);return{EffectComposer:a,RenderPass:m,GTAOPass:h,OutputPass:n}}function X(a,m,h,{zenith:n=10335442,horizon:p=15265008,sol:r=9275513,intensite:d=1}={}){const l=new a.Scene,e=t=>new a.Color(t).multiplyScalar(d),s=new a.Mesh(new a.SphereGeometry(50,48,24),new a.ShaderMaterial({side:a.BackSide,depthWrite:!1,uniforms:{zenith:{value:e(n)},horizon:{value:e(p)},sol:{value:e(r)},halo:{value:e(16773336)},dirSoleil:{value:h.clone().normalize()}},vertexShader:`
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
      uniform vec3 zenith, horizon, sol, halo, dirSoleil;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = d.y > 0.0 ? mix(horizon, zenith, pow(d.y, 0.55)) : mix(horizon, sol, pow(min(1.0, -d.y * 5.0), 0.6));
        c += halo * pow(max(dot(d, dirSoleil), 0.0), 6.0) * 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`}));l.add(s);const i=new a.PMREMGenerator(m),v=i.fromScene(l,.02,.1,100);return i.dispose(),s.geometry.dispose(),s.material.dispose(),v}function Y(a,m,h,n,p,{largeur:r,hauteur:d,rayon:l=.45}){const e=new a.WebGLRenderTarget(r,d,{type:a.HalfFloatType,samples:h.getPixelRatio()>1.5?2:4}),s=new m.EffectComposer(h,e);s.setPixelRatio(h.getPixelRatio()),s.setSize(r,d),s.addPass(new m.RenderPass(n,p));const i=new m.GTAOPass(n,p,r,d);return i.updateGtaoMaterial({radius:l,distanceExponent:2,thickness:1,distanceFallOff:1,scale:1.15,samples:16}),i.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,radiusExponent:1,rings:2,samples:16}),i.blendIntensity=.92,s.addPass(i),s.addPass(new m.OutputPass),{actif:!0,rendre:()=>s.render(),taille:(v,t)=>s.setSize(v,t),liberer:()=>{i.dispose(),s.dispose()}}}function q(a){let m=a;return()=>(m=m*16807%2147483647,m/2147483647)}function F(a,m=5){const n=document.createElement("canvas");n.width=n.height=512;const p=n.getContext("2d"),r=p.createImageData(512,512),d=q(m),l=[];for(let t=0;t<28;t++){const u=1.5+t*.42+d()*.8,c=(d()-.5)*1.9+(t%5===0?Math.PI/2:0),o=Math.round(Math.cos(c)*u),x=Math.round(Math.sin(c)*u);!o&&!x||l.push({kx:o,ky:x,a:1/Math.hypot(o,x)**1.6,p:d()*Math.PI*2})}const e=new Float32Array(512*512*2);for(const t of l){const u=new Float32Array(512),c=new Float32Array(512);for(let o=0;o<512;o++)u[o]=Math.cos(Math.PI*2*t.kx*o/512),c[o]=Math.sin(Math.PI*2*t.kx*o/512);for(let o=0;o<512;o++){const x=Math.cos(Math.PI*2*t.ky*o/512+t.p)*t.a,y=Math.sin(Math.PI*2*t.ky*o/512+t.p)*t.a,g=o*512*2;for(let f=0;f<512;f++){const D=u[f]*x-c[f]*y;e[g+f*2]+=D*t.kx,e[g+f*2+1]+=D*t.ky}}}let s=0;for(let t=0;t<512*512*2;t++)s+=e[t]*e[t];const i=.35/Math.sqrt(s/(512*512)||1);for(let t=0;t<512*512;t++){const u=-e[t*2]*i,c=-e[t*2+1]*i,o=Math.hypot(u,c,1);r.data[t*4]=(u/o*.5+.5)*255,r.data[t*4+1]=(c/o*.5+.5)*255,r.data[t*4+2]=(1/o*.5+.5)*255,r.data[t*4+3]=255}p.putImageData(r,0,0);const v=new a.CanvasTexture(n);return v.wrapS=v.wrapT=a.RepeatWrapping,v.anisotropy=8,v}const j=`
  vec3 mapN1 = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
  vec2 uvHoule = mat2( uHoule.y, uHoule.z, -uHoule.z, uHoule.y ) * vNormalMapUv * uHoule.x + uDecalHoule;
  vec3 mapN2 = texture2D( normalMap, uvHoule ).xyz * 2.0 - 1.0;
  vec3 mapN = normalize( vec3( mapN1.xy + mapN2.xy * 0.65, mapN1.z * mapN2.z ) );
  mapN.xy *= mix( 1.0, 0.35, smoothstep( 10.0, 70.0, length( vViewPosition ) ) ); // au loin, la mer paraît plus lisse
`,k=5.2;function Z(a,m,{reflets:h=null,intensiteReflets:n=.75}={}){const p=[];if(m.updateMatrixWorld(!0),m.traverse(e=>{e.isMesh&&e.geometry?.type==="PlaneGeometry"&&e.geometry.parameters.width>=1e3&&p.push(e)}),!p.length)return null;const r=F(a),d=new a.Vector3,l=[];for(const e of p){e.getWorldScale(d);const s=e.geometry.parameters.width*Math.abs(d.x),i=r.clone();i.repeat.set(s/k,s/k),i.needsUpdate=!0;const v={uHoule:{value:new a.Vector3(2.9,Math.cos(.9),Math.sin(.9))},uDecalHoule:{value:new a.Vector2}},t=e.material,u=new a.MeshPhysicalMaterial({color:t.color.clone().multiplyScalar(.8),roughness:.13,metalness:0,ior:1.333,normalMap:i,normalScale:new a.Vector2(.32,.32),transparent:t.transparent,opacity:t.opacity,depthWrite:t.depthWrite,envMap:h,envMapIntensity:n});u.onBeforeCompile=c=>{Object.assign(c.uniforms,v),c.fragmentShader=c.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 uHoule;
uniform vec2 uDecalHoule;`).replace("vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;",j)},u.customProgramCacheKey=()=>"houle-v4",u.userData.sansDetails=!0,e.material=u,e.receiveShadow=!0,t.dispose(),l.push([i,v,u])}return{animer(e){for(const[s,i]of l)s.offset.set(e*105e-7,e*41e-7),i.uDecalHoule.value.set(-e*62e-7,e*118e-7)},liberer(){r.dispose();for(const[e,,s]of l)e.dispose(),s.dispose()}}}function U(a,{teintes:m=["#6f6550","#857a62","#9a8e74"],graine:h=11,taille:n=512,repetition:p=1}={}){const r=document.createElement("canvas");r.width=r.height=n;const d=r.getContext("2d"),l=d.createImageData(n,n),e=q(h),s=new Float32Array(n*n);for(let c=0,o=4,x=1;c<5;c++,o*=2,x*=.55){const y=Float32Array.from({length:o*o},e),g=n/o;for(let f=0;f<n;f++){const D=f/g,P=Math.floor(D),N=D-P,A=N*N*(3-2*N),_=P%o*o,z=(P+1)%o*o;for(let M=0;M<n;M++){const b=M/g,C=Math.floor(b),I=b-C,L=I*I*(3-2*I),w=C%o,O=(C+1)%o,G=y[_+w]+(y[_+O]-y[_+w])*L,V=y[z+w]+(y[z+O]-y[z+w])*L;s[f*n+M]+=(G+(V-G)*A)*x}}}let i=1/0,v=-1/0;for(const c of s)c<i&&(i=c),c>v&&(v=c);const t=m.map(c=>[1,3,5].map(o=>parseInt(c.slice(o,o+2),16)));for(let c=0;c<s.length;c++){const o=(s[c]-i)/(v-i||1)*(t.length-1),x=Math.min(t.length-2,Math.floor(o)),y=o-x,g=(e()-.5)*16+(e()<.025?(e()-.5)*70:0);for(let f=0;f<3;f++)l.data[c*4+f]=t[x][f]+(t[x+1][f]-t[x][f])*y+g;l.data[c*4+3]=255}d.putImageData(l,0,0);const u=new a.CanvasTexture(r);return u.colorSpace=a.SRGBColorSpace,u.wrapS=u.wrapT=a.RepeatWrapping,u.repeat.set(p,p),u.anisotropy=8,u}const W=["#5f5644","#73694f","#877b62"];function R(a,m,h){const n=document.createElement("canvas");n.width=n.height=256;const p=n.getContext("2d"),r=p.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,"#ffffff"),r.addColorStop(.36,"#ffffff"),r.addColorStop(.6,"#9e9e9e"),r.addColorStop(.8,"#383838"),r.addColorStop(1,"#000000"),p.fillStyle=r,p.fillRect(0,0,256,256);const d=new a.CanvasTexture(n),l=new a.Mesh(new a.CircleGeometry(m,64),new a.MeshStandardMaterial({map:U(a,{teintes:W,repetition:m/4}),alphaMap:d,transparent:!0,roughness:1,metalness:0,depthWrite:!1}));return l.material.userData.sansDetails=!0,l.rotation.x=-Math.PI/2,l.position.y=h,l.receiveShadow=!0,l.renderOrder=-1,l}const B=`
varying vec3 vPosDetail;
varying vec3 vNormDetail;
uniform vec3 uDetails; // x : pas des panneaux (m, 0 : pas de joints) ; y : contraste des joints ; z : usure
float hashDetail(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float bruitDetail(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hashDetail(i), hashDetail(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hashDetail(i + vec3(0.0, 1.0, 0.0)), hashDetail(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hashDetail(i + vec3(0.0, 0.0, 1.0)), hashDetail(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hashDetail(i + vec3(0.0, 1.0, 1.0)), hashDetail(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
// Joints en quinconce (les rangées de panneaux sont décalées), invisibles de loin
float jointsDetail(vec3 p, vec3 n) {
  float pas = uDetails.x;
  vec3 q = p / pas;
  q.x += 0.5 * hashDetail(vec3(0.0, floor(q.y), floor(q.z)));
  q.z += 0.5 * hashDetail(vec3(floor(q.x), floor(q.y), 0.0) + 7.7);
  q.y += 0.5 * hashDetail(vec3(floor(q.x), 0.0, floor(q.z)) + 3.1);
  vec3 d = min(fract(q), 1.0 - fract(q)) * pas;
  vec3 w = max(fwidth(p), vec3(1e-5));
  float demi = 0.007;
  vec3 l = 1.0 - smoothstep(vec3(demi), vec3(demi) + w, d);
  vec3 a = abs(n);
  float t = max(l.x * (1.0 - smoothstep(0.6, 0.92, a.x)), max(l.y * (1.0 - smoothstep(0.6, 0.92, a.y)), l.z * (1.0 - smoothstep(0.6, 0.92, a.z))));
  float wm = max(w.x, max(w.y, w.z));
  return t * clamp(demi * 3.0 / wm, 0.0, 1.0);
}
`,$=`
float jointDetail = 0.0;
if (uDetails.x > 0.0 && dot(vNormDetail, vNormDetail) > 0.0) jointDetail = jointsDetail(vPosDetail, normalize(vNormDetail));
float usureDetail = bruitDetail(vPosDetail * 0.45) * 0.6 + bruitDetail(vPosDetail * 2.3) * 0.4;
diffuseColor.rgb *= (1.0 - uDetails.y * jointDetail) * (1.0 + uDetails.z * (usureDetail - 0.5) * 2.0);
`,K=`
roughnessFactor = clamp(roughnessFactor + uDetails.z * 1.5 * (usureDetail - 0.5) + uDetails.y * 0.6 * jointDetail, 0.04, 1.0);
`;function H(a,m,{pas:h=1.3,joints:n=.08,usure:p=.05}={}){const r=new Set,d=a.Material.prototype.onBeforeCompile;return m.traverse(l=>{if(!(!l.isMesh||!l.material))for(const e of Array.isArray(l.material)?l.material:[l.material]){if(r.has(e)||!e.isMeshStandardMaterial||e.transparent||e.userData?.sansDetails||e.onBeforeCompile!==d)continue;r.add(e);const s=new a.Vector3(h,n,p);e.onBeforeCompile=i=>{i.uniforms.uDetails={value:s},i.vertexShader=i.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vPosDetail;
varying vec3 vNormDetail;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vPosDetail = position;
vNormDetail = normal;`),i.fragmentShader=i.fragmentShader.replace("#include <common>",`#include <common>
${B}`).replace("#include <map_fragment>",`#include <map_fragment>
${$}`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
${K}`)},e.customProgramCacheKey=()=>"details-v1",e.needsUpdate=!0}}),r.size}export{Q as chargerRendu,Y as creerComposition,H as detailler,X as environnementCiel,Z as oceaniser,R as plateauSol,U as textureSol};
