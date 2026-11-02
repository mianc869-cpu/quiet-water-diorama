import * as THREE from 'three';
import {rng} from './model';
export class FishSystem {
 fish: {group:THREE.Group; phase:number; speed:number; radius:number;depth:number}[]=[];
 constructor(scene:THREE.Scene){
 const random=rng(98);
 for(let i=0;i<9;i++) {
  const g=new THREE.Group();g.userData.submerged=true;
  const mat=new THREE.MeshBasicMaterial({color:i%2?'#315e6b':'#3e7180',transparent:true,opacity:.28+random()*.28,depthWrite:false});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.32,.022,.085),mat);g.add(body);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.08,.14,3),mat);tail.rotation.z=Math.PI/2;tail.rotation.x=Math.PI/2;tail.position.x=-.22;g.add(tail);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.08,.02,.055),mat);head.position.x=.18;g.add(head);
  scene.add(g);this.fish.push({group:g,phase:random()*Math.PI*2,speed:.045+random()*.065,radius:1.7+random()*2.6,depth:random()});
 }
 }
 update(t:number){this.fish.forEach((f,i)=>{const a=f.phase+t*f.speed;f.group.position.set(1.1+Math.cos(a)*f.radius,.018+f.depth*.009, .7+Math.sin(a)*f.radius*.67);f.group.rotation.y=-Math.atan2(Math.cos(a)*.67,-Math.sin(a))+Math.sin(t*3+i)*.06;f.group.scale.setScalar(.75+f.depth*.5);});}
}
