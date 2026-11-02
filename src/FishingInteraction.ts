import * as THREE from 'three';
import {WaterShader} from './WaterShader';
import {UIOverlay} from './UIOverlay';
import {box} from './model';
type State='waiting'|'casting'|'nibble'|'bite'|'reeling';
interface Rod {group:THREE.Group;bobber:THREE.Group;line:THREE.Line;tip:THREE.Vector3;target:THREE.Vector3;position:THREE.Vector3;state:State;since:number;nextBite:number;lastRipple:number;index:number;}
export class FishingInteraction {
 rods:Rod[]=[];ray=new THREE.Raycaster();pointer=new THREE.Vector2();time=0;count=0;active=0;
 abort=new AbortController();touches=new Map<number,THREE.Vector2>();pinch=0;down=new THREE.Vector2();
 constructor(private scene:THREE.Scene,private camera:THREE.OrthographicCamera,private canvas:HTMLCanvasElement,private water:WaterShader,private ui:UIOverlay,people:THREE.Group[],private zoom:(factor:number)=>void){
 for(let i=0;i<2;i++){
  const group=new THREE.Group();group.userData={kind:'rod',index:i};
  const start=new THREE.Vector3(.14,1.55,i===0?-.18:.47);
  const tip=start.clone().add(new THREE.Vector3(i===0?2.1:.50,i===0?.65:.50,i===0?-1.05:1.80));
  const curve=new THREE.QuadraticBezierCurve3(start,start.clone().lerp(tip,.5).add(new THREE.Vector3(0,.22,0)),tip);
  const rod=new THREE.Mesh(new THREE.TubeGeometry(curve,18,.022,4,false),new THREE.MeshStandardMaterial({color:'#39382c',roughness:1}));group.add(rod);
  // Larger invisible hit volume keeps the thin rod usable with mouse and touch.
  const hit=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.15,4,false),new THREE.MeshBasicMaterial({visible:false}));group.add(hit);
  scene.add(group);
  const bobber=new THREE.Group();bobber.userData={kind:'bobber',index:i};
  box(bobber,'#b54635',0,.065,0,.055,.13,.055);box(bobber,'#e1dbc1',0,.17,0,.045,.09,.045);
  const pick=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),new THREE.MeshBasicMaterial({visible:false}));bobber.add(pick);scene.add(bobber);
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([tip,tip,tip]),new THREE.LineBasicMaterial({color:'#657b7c',transparent:true,opacity:.7}));scene.add(line);
  const target=new THREE.Vector3(i===0?2.7:.9,0,i===0?-1.0:2.7);
  this.rods.push({group,bobber,line,tip,target,position:target.clone(),state:'waiting',since:0,nextBite:9+i*7,lastRipple:-i*2,index:i});
 }
 people.forEach((p,i)=>p.userData={kind:'person',index:i});
 const opts={signal:this.abort.signal};
 canvas.addEventListener('pointermove',this.move,opts);canvas.addEventListener('pointerdown',this.press,opts);canvas.addEventListener('pointerup',this.release,opts);canvas.addEventListener('pointercancel',this.cancel,opts);
 canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(-e.deltaY*.0006));},{...opts,passive:false});
 window.addEventListener('keydown',e=>{if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();this.reel(this.rods[this.active]);}},opts);
 }
 hit(x:number,y:number){this.pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1);this.ray.setFromCamera(this.pointer,this.camera);return this.ray.intersectObjects(this.scene.children,true);}
 kind(object:THREE.Object3D):{kind?:string;index?:number}{let p:THREE.Object3D|null=object;while(p){if(p.userData.kind)return p.userData;p=p.parent;}return {};}
 move=(e:PointerEvent)=>{
  if(this.touches.has(e.pointerId))this.touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));
  if(this.touches.size===2){const [a,b]=[...this.touches.values()];const distance=a.distanceTo(b);if(this.pinch)this.zoom(distance/this.pinch);this.pinch=distance;return;}
  const h=this.hit(e.clientX,e.clientY).find(h=>['rod','person','bobber'].includes(this.kind(h.object).kind||''));
  const kind=h?this.kind(h.object):{};this.ui.hover(kind.kind==='bobber'?'点击收线':kind.kind?'点击抛竿':'',e.clientX,e.clientY);this.canvas.style.cursor=h?'pointer':'default';
 };
 press=(e:PointerEvent)=>{this.touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));this.down.set(e.clientX,e.clientY);this.canvas.setPointerCapture(e.pointerId);};
 cancel=(e:PointerEvent)=>{this.touches.delete(e.pointerId);this.pinch=0;};
 release=(e:PointerEvent)=>{
  const wasPinch=this.pinch>0;this.cancel(e);if(wasPinch||this.down.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>8)return;
  const hits=this.hit(e.clientX,e.clientY);
  const item=hits.find(h=>['rod','person','bobber'].includes(this.kind(h.object).kind||''));
  if(item){const k=this.kind(item.object);this.active=k.index||0;const rod=this.rods[this.active];if(k.kind==='bobber')this.reel(rod);else this.cast(rod);return;}
  const waterHit=hits.find(h=>h.object===this.water.mesh);if(waterHit&&this.water.contains(waterHit.point))this.water.ripple(waterHit.point.x,waterHit.point.z,this.time);
 };
 cast(r:Rod){if(r.state==='casting'||r.state==='reeling')return;r.state='casting';r.since=this.time;r.target.set(r.index===0?2.2+Math.random()*.8:.6+Math.random()*.5,0,r.index===0?-1.0+Math.random()*.6:2.5+Math.random()*.5);this.ui.toast('抛竿 · 等待水面的动静');}
 reel(r:Rod){if(r.state==='casting'||r.state==='reeling')return;if(r.state==='bite'){this.ui.caught(++this.count);this.water.ripple(r.target.x,r.target.z,this.time,1.5);}else this.ui.toast('还没有上钩');r.state='reeling';r.since=this.time;}
 update(t:number){this.time=t;
 for(const r of this.rods){let age=t-r.since;const p=r.position;
 if(r.state==='casting'){
  const f=Math.min(1,age/1.25);p.lerpVectors(r.tip,r.target,f);p.y+=Math.sin(f*Math.PI)*1.8;
  if(f===1){r.state='waiting';r.since=t;r.nextBite=t+7+Math.random()*12;this.water.ripple(p.x,p.z,t);}
 }else if(r.state==='reeling'){
  const f=Math.min(1,age/.7);p.lerpVectors(r.target,r.tip,f);p.y+=Math.sin(f*Math.PI)*.5;
  if(f===1){r.state='waiting';this.cast(r);}
 }else{
  p.copy(r.target);p.y=.015+Math.sin(t*2+r.index)*.025;
  if(r.state==='waiting'&&t>r.nextBite){r.state='nibble';r.since=t;}
  if(r.state==='nibble'){p.x+=Math.sin(t*19)*.035;p.y+=Math.sin(t*14)*.04;if(t-r.since>1.6){r.state='bite';r.since=t;this.ui.toast('鱼漂下沉了 · 点击鱼漂 / 空格收线');this.active=r.index;}}
  if(r.state==='bite'){p.y=-.17+Math.sin(t*7)*.018;if(t-r.since>3.2){r.state='waiting';r.nextBite=t+8+Math.random()*10;this.ui.toast('鱼游走了');}}
  if(t-r.lastRipple>4.3+r.index*.7){this.water.ripple(p.x,p.z,t,.55);r.lastRipple=t;}
 }
 r.bobber.position.copy(p);
 const a=r.line.geometry.attributes.position as THREE.BufferAttribute;
 a.setXYZ(0,r.tip.x,r.tip.y,r.tip.z);const m=r.tip.clone().lerp(p,.52);m.y-=r.state==='casting'?.18:.07;a.setXYZ(1,m.x,m.y,m.z);a.setXYZ(2,p.x,p.y+.16,p.z);a.needsUpdate=true;r.line.geometry.computeBoundingSphere();
 }
 }
 dispose(){this.abort.abort();}
}
