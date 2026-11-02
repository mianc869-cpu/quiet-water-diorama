import * as THREE from 'three';
import {WaterSimulation} from './WaterSimulation';
const vertex = `varying vec3 vWorld; varying vec4 vReflection; uniform mat4 uReflectionMatrix; void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vReflection=uReflectionMatrix*w;gl_Position=projectionMatrix*viewMatrix*w;}`;
const fragment = `
precision highp float;
varying vec3 vWorld;
varying vec4 vReflection;
uniform sampler2D uReflection;
uniform sampler2D uWaveState;
uniform float uTime;
uniform vec4 uRipples[24];

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float bayer(vec2 p){vec2 q=mod(floor(p),4.);float x=q.x;float v=0.;if(q.y<1.){v=x<1.?0.:x<2.?8.:x<3.?2.:10.;}else if(q.y<2.){v=x<1.?12.:x<2.?4.:x<3.?14.:6.;}else if(q.y<3.){v=x<1.?3.:x<2.?11.:x<3.?1.:9.;}else{v=x<1.?15.:x<2.?7.:x<3.?13.:5.;}return (v+.5)/16.;}
void main(){
 vec2 p=vWorld.xz; vec2 ep=p-vec2(.35,.25); vec2 e=vec2(dot(ep,vec2(.728,-.685)),dot(ep,vec2(.685,.728)))/vec2(7.1,5.45);
 float angle=atan(e.y,e.x);float edge=length(e)+sin(angle*5.+1.)*.025+sin(angle*9.)*.018+noise(p*2.5)*.028+sin(angle*3.-.5)*.018;
 vec2 pierMargin=(p-vec2(-5.8,.20))/vec2(1.85,1.65);
 edge-=.14*exp(-dot(pierMargin,pierMargin));
 // Slow coherent drift moves only the fringe by roughly 1–2 screen pixels.
 // Bayer thresholds remain fixed, so pixels appear/disappear without random flicker.
 float edgeDrift=(noise(p*1.55+vec2(uTime*.044,-uTime*.031))-.5)*.010;
 float fineDrift=(noise(p*4.3+vec2(-uTime*.065,uTime*.048))-.5)*.0025;
 edge+=edgeDrift+fineDrift;
 float coverage=1.-smoothstep(.88,1.045,edge);
 float d=bayer(gl_FragCoord.xy);
 if(coverage<d)discard;
 // The CPU wave solver supplies one coherent height field and its derivatives.
 vec2 waveUv=p/18.+.5;
 vec4 waveState=texture2D(uWaveState,waveUv);
 vec2 slope=(waveState.rg-.5)/7.;
 float elevation=(waveState.b-.5)/8.;
 float curvature=(waveState.a-.5)/.7;
 vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));
 vec3 base=vec3(.375,.602,.659)+vec3(.07,.09,.08)*elevation;
 // Highlights follow facing slopes and changing curvature, never an isocontour.
 float facing=dot(slope,normalize(vec2(-.6,.8)));
 float crest=smoothstep(.0015,.018,facing)*smoothstep(-.025,.018,-curvature);
 float glint=smoothstep(.009,.035,length(slope))*.26;
 // Current only deforms transient float ripples; no persistent noise-contour lines.
 vec2 current=vec2(noise(p*.40+vec2(uTime*.018,-uTime*.013)),noise(p*.46+vec2(-uTime*.011,uTime*.021)+8.7))-.5;
 vec2 warped=p+current*1.35+slope*5.;
 float litCoverage=clamp(crest*.48+glint,0.,.9);
 float bright=step(d,litCoverage);
 base=mix(base,vec3(.59,.75,.76),bright*.50);
 // Only a mild contact shadow; the actual reflected supports provide the dark shapes.
 vec2 s=p-vec2(-.9,1.08);
 float along=smoothstep(-5.7,-5.25,s.x)*(1.-smoothstep(.8,1.35,s.x));
 float width=1.-smoothstep(.30,.65,abs(s.y+.55));
 float shadow=along*width;
 base=mix(base,vec3(.14,.29,.36),shadow*.36);
 float ringLight=0.;float ringShade=0.;
 for(int i=0;i<24;i++){
  vec4 r=uRipples[i];float age=uTime-r.z;
  if(age>0.&&age<5.){
   vec2 delta=p-r.xy;
   // A recognizable ripple packet is retained; the local height field and current
   // change its outline, thickness and visible arc lengths continuously.
   float angle=atan(delta.y,delta.x);
   float radius=.10+age*.34;
   float bend=(noise(warped*2.+r.xy)-.5)*.09+elevation*1.8+dot(current,delta)*.045*age;
   float offset=length(delta)-radius+bend;
   float width=.048+.035*noise(warped*2.2+r.xy);
   float outer=1.-smoothstep(width*.35,width,abs(offset));
   float inner=1.-smoothstep(.014,.048,abs(length(delta)-radius*.72+bend*.65));
   float fade=(1.-age/5.)*min(1.,age*4.);
   float visibility=.55+.45*noise(warped*1.5+r.xy*3.);
   ringLight+=step(d,(outer+inner*.65)*visibility)*fade*min(r.w,1.);
   ringShade+=step(d,(1.-smoothstep(.013,.030,abs(offset-width)))*visibility*.7)*fade;
  }
 }
 // The same local slope bends the reflected objects, synchronizing all movement.
 vec2 reflectionUv=vReflection.xy/vReflection.w+slope*vec2(.30,.12);
 vec3 reflected=pow(max(texture2D(uReflection,reflectionUv).rgb,vec3(0.)),vec3(1./2.2));
 float reflectMask=1.-smoothstep(.82,.99,max(max(reflected.r,reflected.g),reflected.b));
 // Keep opaque silhouettes, rather than covering the entire mirror with a dot grid.
 vec3 reflectionTint=mix(reflected,vec3(.16,.31,.43),.37);
 float reflectionStrength=.70+clamp(facing*3.,-.07,.07);
 base=mix(base,reflectionTint,reflectMask*reflectionStrength);
 base=mix(base,min(base+vec3(.14,.17,.15),vec3(.72,.83,.81)),bright*.42);
 base=mix(base,min(base+vec3(.18,.20,.17),vec3(.72,.83,.81)),min(.78,ringLight*.8));
 base=mix(base,base*vec3(.78,.86,.91),min(.34,ringShade*.45));
 gl_FragColor=vec4(pow(base,vec3(2.2)),1.);
}`;
export class WaterShader {
 mesh:THREE.Mesh; material:THREE.ShaderMaterial;
 reflectionTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
 reflectionCamera=new THREE.OrthographicCamera();
 reflectionMatrix=new THREE.Matrix4();
 simulation=new WaterSimulation();
 ripples=Array.from({length:24},()=>new THREE.Vector4(0,0,-100,0));index=0;
 constructor(scene:THREE.Scene){
 this.material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uTime:{value:0},uRipples:{value:this.ripples},uWaveState:{value:this.simulation.texture},uReflection:{value:this.reflectionTarget.texture},uReflectionMatrix:{value:this.reflectionMatrix}},side:THREE.DoubleSide});
 this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(18,18),this.material);this.mesh.rotation.x=-Math.PI/2;this.mesh.userData.kind='water';scene.add(this.mesh);this.resize();
 }
 resize(){this.reflectionTarget.setSize(Math.ceil(innerWidth/2),Math.ceil(innerHeight/2));}
 reflect(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.OrthographicCamera){
  const mirror=this.reflectionCamera;mirror.copy(camera);mirror.position.y=-camera.position.y;
  const direction=camera.getWorldDirection(new THREE.Vector3());direction.y=-direction.y;
  mirror.up.set(0,-1,0);mirror.lookAt(mirror.position.clone().add(direction));mirror.updateMatrixWorld();
  this.reflectionMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
  const previous=renderer.getRenderTarget(),shadow=renderer.shadowMap.autoUpdate,clips=renderer.clippingPlanes;
  this.mesh.visible=false;renderer.shadowMap.autoUpdate=false;
  renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,1,0),0)];
  const hidden:THREE.Object3D[]=[];scene.traverse(o=>{if(o.userData.submerged&&o.visible){o.visible=false;hidden.push(o);}});
  renderer.setRenderTarget(this.reflectionTarget);renderer.render(scene,mirror);renderer.setRenderTarget(previous);
  hidden.forEach(o=>o.visible=true);renderer.clippingPlanes=clips;renderer.shadowMap.autoUpdate=shadow;this.mesh.visible=true;
 }
 dispose(){this.reflectionTarget.dispose();this.simulation.dispose();}
 contains(p:THREE.Vector3){const x=p.x-.35,z=p.z-.25;return ((x*.728-z*.685)/7.1)**2+((x*.685+z*.728)/5.45)**2<.94;}
 ripple(x:number,z:number,time:number,strength=1){this.ripples[this.index++%24].set(x,z,time,strength);this.simulation.disturb(x,z,.09*strength,.18+.025*strength);}
 update(t:number,dt:number){this.material.uniforms.uTime.value=t;this.simulation.update(dt);}
}
