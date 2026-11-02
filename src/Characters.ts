import * as THREE from 'three';
import {box,mergeStatic} from './model';
export class Characters {
 people:THREE.Group[]=[];
 constructor(scene:THREE.Scene) {
  this.make(scene,.76,-.88,false); this.make(scene,.76,-.23,true);
 }
 private make(scene:THREE.Scene,x:number,z:number,red:boolean) {
  const p=new THREE.Group();p.position.set(x-1,1.15,z+.7);p.userData={kind:'person',index:this.people.length};
  const skin=red?'#bb8c64':'#b18b65', shade=red?'#96704f':'#977253';
  // Small stepped volumes describe a seated silhouette rather than a single torso box.
  const shirt=red?'#b6b39c':'#9b7950';
  box(p,shirt,-.055,.29,0,.31,.36,.34);
  box(p,shirt,-.075,.48,0,.29,.10,.36);
  box(p,shirt,-.085,.555,0,.24,.065,.28);
  box(p,shirt,-.12,.15,0,.28,.1,.3);
  const front=.108;
  if(red){
   for(let row=0;row<6;row++)for(let col=0;col<6;col++){
    const tone=(row%3===0||col%3===0)?'#ad4033':((row+col)%2?'#c7c8b1':'#698083');
    box(p,tone,front,.16+row*.061,-.15+col*.059,.018,.053,.052);
    box(p,tone,-.19+col*.052,.16+row*.061,.177,.047,.053,.012);
   }
   box(p,'#7c4436',.125,.345,0,.02,.37,.032);
   for(let i=0;i<3;i++)box(p,'#d6c7a4',.139,.21+i*.11,0,.012,.018,.019);
  }else{
   box(p,'#254956',.113,.34,0,.028,.41,.28);
   for(const dz of [-.115,.115]){
    box(p,'#315765',.128,.48,dz,.028,.18,.065);
    box(p,'#173b48',.135,.26,dz,.025,.12,.085);
    box(p,'#62818a',.152,.325,dz,.012,.018,.079);
   }
   box(p,'#a08356',.135,.38,0,.024,.35,.04);
  }
  // Neck, tapered jaw, ears, nose, a narrow eye line and short sideburns.
  box(p,skin,-.025,.635,0,.135,.14,.14);
  box(p,shade,.018,.70,0,.205,.105,.218);
  box(p,skin,-.005,.805,0,.255,.19,.255);
  box(p,'#c79d74',.065,.845,.0,.13,.10,.25);
  box(p,skin,.15,.793,0,.085,.08,.075);
  box(p,shade,-.025,.78,.145,.075,.10,.042);
  box(p,'#493d2e',-.14,.825,0,.035,.19,.26);
  box(p,'#594a35',-.09,.744,.128,.08,.09,.025);
  for(const dz of [-.085,.085]){
   box(p,'#303b36',.13,.855,dz,.018,.027,.037);
   box(p,'#c9b296',.144,.83,dz,.012,.024,.03);
  }
  box(p,red?'#704333':'#81796a',.12,.731,0,.025,.026,.14);
  const cap=red?'#a8432f':'#dadbc9';
  box(p,cap,-.035,.94,0,.30,.095,.30);
  box(p,red?'#bb5136':'#efead7',-.05,1.0,0,.235,.035,.245);
  box(p,red?'#8e362b':'#aebbb6',.10,.915,0,.26,.035,.32);
  box(p,red?'#ce7751':'#f7f0dc',.17,.93,0,.13,.018,.29);
  box(p,red?'#ae4d37':'#bdc9c3',-.025,.965,.155,.095,.04,.012);
  // Collars, rounded shoulder steps, bent elbows and hands holding the rod.
  for(const side of [-1,1]){
   const dz=side*.19;
   box(p,red?'#d5c8a5':'#bca17b',.03,.57,side*.075,.10,.055,.085);
   const upper=box(p,shirt,-.015,.415,dz,.15,.25,.14);upper.rotation.z=.18;
   box(p,shirt,.018,.52,dz,.105,.065,.13);
   box(p,red?'#ab4433':'#8c6b47',.025,.32,dz,.15,.075,.145);
   const forearm=box(p,skin,.18,.33,dz,.25,.095,.10);forearm.rotation.z=.12;
   box(p,shade,.31,.35,dz,.075,.08,.11);
   box(p,skin,.35,.37,dz,.07,.09,.08);
   box(p,'#ddbd91',.38,.38,dz,.025,.04,.065);
  }
  // Last board ends at local x=.8785. Knee and shin begin at x=.9925,
  // outside the board and end beam; thighs rest on the deck at y=1.13.
  // Separate boot soles preserve a readable hanging seated silhouette.
  box(p,'#334e55',.075,.075,0,.41,.19,.31);
  for(const dz of [-.105,.105]){
   box(p,'#3f5a60',.22,.035,dz,.20,.15,.135);
   box(p,'#2f4850',.30,-.11,dz,.135,.27,.125);
   box(p,'#42616a',.315,-.13,dz+.065,.075,.19,.012);
   box(p,'#5b594a',.315,-.30,dz,.145,.095,.13);
   box(p,red?'#7c6e54':'#655c46',.385,-.35,dz,.24,.10,.15);
   box(p,'#2b3633',.385,-.402,dz,.25,.026,.16);
  }
  mergeStatic(p);scene.add(p);this.people.push(p);
 }
 update(t:number){this.people.forEach((p,i)=>{p.rotation.x=Math.sin(t*.8+i*2)*.008;p.rotation.z=Math.sin(t*.65+i)*.007;});}
}
