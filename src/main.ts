import * as THREE from 'three';
import './style.css';
import {SceneSetup} from './SceneSetup';import {FishingPier} from './FishingPier';import {Characters} from './Characters';import {WaterShader} from './WaterShader';import {FishSystem} from './FishSystem';import {FishingInteraction} from './FishingInteraction';import {PixelRenderPipeline} from './PixelRenderPipeline';import {UIOverlay} from './UIOverlay';
const host=document.querySelector<HTMLElement>('#app')!;
try {
 const setup=new SceneSetup(host);const water=new WaterShader(setup.scene);new FishingPier(setup.scene);const characters=new Characters(setup.scene);const fish=new FishSystem(setup.scene);
 const pipeline=new PixelRenderPipeline(setup.renderer);const ui=new UIOverlay(()=>{setup.zoomTarget=1;});
 const interaction=new FishingInteraction(setup.scene,setup.camera,setup.renderer.domElement,water,ui,characters.people,factor=>{setup.zoomTarget=THREE.MathUtils.clamp(setup.zoomTarget*factor,.8,1.35);});
 let frame=0,previous=performance.now(),time=0;
 function animate(now:number){const dt=Math.min((now-previous)/1000,.05);previous=now;time+=dt;setup.update(dt);water.update(time,dt);characters.update(time);fish.update(time);interaction.update(time);water.reflect(setup.renderer,setup.scene,setup.camera);pipeline.render(setup.scene,setup.camera);frame=requestAnimationFrame(animate);}
 frame=requestAnimationFrame(animate);
 const resize=()=>{setup.resize();pipeline.resize();water.resize();};window.addEventListener('resize',resize);
 function dispose(){cancelAnimationFrame(frame);window.removeEventListener('resize',resize);interaction.dispose();ui.dispose();pipeline.dispose();water.dispose();const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();setup.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach((m:THREE.Material)=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());setup.renderer.dispose();setup.renderer.domElement.remove();}
 if(import.meta.hot)import.meta.hot.dispose(dispose);
 window.addEventListener('pagehide',dispose,{once:true});
 // Read-only state for runtime smoke checks; the scene itself runs without this hook.
 Object.assign(window,{__quietWater:{setup,water,characters,fish,interaction,pipeline}});
}catch(error){host.textContent='此浏览器无法启动 WebGL，请开启硬件加速后刷新。';console.error(error);}
