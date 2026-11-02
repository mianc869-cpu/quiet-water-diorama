import * as THREE from 'three';
import {rng} from './model';

/** Damped 2-D wave equation, integrated with a fixed stable time step.
 * Heights and velocities evolve; clicks and non-periodic wind gusts inject energy.
 * RG encodes the surface gradient, B height and A local curvature for the shader.
 */
export class WaterSimulation {
 readonly size=160;
 readonly extent=18;
 readonly height=new Float32Array(this.size*this.size);
 private velocity=new Float32Array(this.height.length);
 private acceleration=new Float32Array(this.height.length);
 private pixels=new Uint8Array(this.height.length*4);
 readonly texture=new THREE.DataTexture(this.pixels,this.size,this.size,THREE.RGBAFormat);
 private random=rng(72819);
 private accumulator=0;
 private gustIn=.12;
 private stepTime=1/90;
 constructor(){
  this.texture.minFilter=THREE.LinearFilter;this.texture.magFilter=THREE.LinearFilter;
  this.texture.generateMipmaps=false;
  for(let i=0;i<34;i++)this.disturb((this.random()-.5)*15,(this.random()-.5)*13,(this.random()-.5)*.10,.35+this.random()*.7);
  this.encode();
 }
 disturb(x:number,z:number,strength=.05,radius=.24){
  const n=this.size,cell=this.extent/(n-1),cx=(x/this.extent+.5)*(n-1),cy=(z/this.extent+.5)*(n-1);
  const cells=Math.ceil(radius/cell*3);
  for(let y=Math.max(1,Math.floor(cy-cells));y<Math.min(n-1,cy+cells);y++)for(let xx=Math.max(1,Math.floor(cx-cells));xx<Math.min(n-1,cx+cells);xx++){
   const dx=(xx-cx)*cell,dz=(y-cy)*cell;const r2=(dx*dx+dz*dz)/(radius*radius);
   // A zero-volume impulse: a central depression with a low raised shoulder.
   this.velocity[y*n+xx]+=strength*(1.-r2*.5)*Math.exp(-r2*.5);
  }
 }
 update(dt:number){
  this.accumulator+=Math.min(dt,.05);
  while(this.accumulator>=this.stepTime){this.step(this.stepTime);this.accumulator-=this.stepTime;}
  this.encode();
 }
 private step(dt:number){
  const n=this.size,h=this.height,v=this.velocity,cell=this.extent/(n-1),c2=.85*.85;
  this.gustIn-=dt;
  if(this.gustIn<=0){
   this.gustIn=.18+this.random()*.65;
   this.disturb((this.random()-.5)*15,(this.random()-.5)*14,(this.random()-.5)*.07,.30+this.random()*.65);
  }
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
   const i=y*n+x;
   const lap=(h[i-1]+h[i+1]+h[i-n]+h[i+n]-4*h[i])/(cell*cell);
   this.acceleration[i]=c2*lap;
  }
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
   const i=y*n+x;
   // An absorbing margin prevents a rectangular tank's repeated reflected waves.
   const margin=Math.min(x,y,n-1-x,n-1-y);
   const damping=margin<14?1.8*(1-margin/14):.24;
   v[i]=(v[i]+this.acceleration[i]*dt)*Math.exp(-damping*dt);
   h[i]+=v[i]*dt;
  }
 }
 private encode(){
  const n=this.size,h=this.height,cell=this.extent/(n-1);
  const pack=(v:number)=>Math.round(THREE.MathUtils.clamp(v,0,1)*255);
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
   const i=y*n+x,k=i*4;
   this.pixels[k]=pack(.5+(h[i+1]-h[i-1])/(2*cell)*7);
   this.pixels[k+1]=pack(.5+(h[i+n]-h[i-n])/(2*cell)*7);
   this.pixels[k+2]=pack(.5+h[i]*8);
   this.pixels[k+3]=pack(.5+this.acceleration[i]*.7);
  }
  this.texture.needsUpdate=true;
 }
 dispose(){this.texture.dispose();}
}
