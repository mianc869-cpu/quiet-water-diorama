import * as THREE from 'three';
import {box,rng,material,mergeStatic} from './model';
export class FishingPier {
 group=new THREE.Group();
 constructor(scene:THREE.Scene) {
  const random=rng(48), wood=['#b98851','#c5945b','#d3a569','#bd8a50','#c69960'];
  // The individual boards run across the narrow walkway, with open dark seams.
  for(let i=0;i<23;i++) {
   const x=-5.3+i*.275;
   const board=box(this.group,wood[i%wood.length],x,1.05+(random()-.5)*.035,-.55,.257,.15,1.55+(random()-.5)*.12);
   board.material=[material('#70502e'),material('#6a492d'),material(wood[i%wood.length]),material('#382d22'),material('#866039'),material('#715232')];
   for(let j=0;j<9;j++) {
    const z=-1.24+random()*1.38;
    box(this.group,random()>.42?'#986d40':'#dfb47a',x+(random()-.5)*.19,1.132,z,.025+random()*.05,.008,.04+random()*.19);
   }
   for(const z of [-1.13,.04]) box(this.group,'#584730',x,1.14,z,.025,.012,.025);
  }
  for(const z of [-1.18,.08]) box(this.group,'#4b3a29',-2.23,.89,z,6.6,.25,.16);
  for(const x of [-5.25,-3.55,-1.85,.55]) for(const z of [-1.16,.07]) {
   box(this.group,'#25302c',x,.28,z,.29,1.6,.31);
   box(this.group,'#413b2b',x+.025,.6,z+.125,.065,.75,.012);
  }
  box(this.group,'#57442d',.7,.87,-.55,.21,.3,1.72);
  // Small tackle box beside the red-capped angler.
  box(this.group,'#263a3b',-.65,1.24,.01,.42,.23,.32);
  box(this.group,'#94b5bb',-.65,1.38,.01,.46,.055,.35);
  box(this.group,'#d2d6c3',-.65,1.43,.01,.14,.045,.06);
  mergeStatic(this.group);this.group.position.set(-1,0,.7);scene.add(this.group);
 }
}
