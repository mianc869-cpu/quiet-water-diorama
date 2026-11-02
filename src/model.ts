import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const cubeGeometry = new THREE.BoxGeometry(1,1,1);
const materials = new Map<string,THREE.MeshStandardMaterial>();
export function material(color:string) {
  if(!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,metalness:0}));
  return materials.get(color)!;
}
export function box(parent:THREE.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number):THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial|THREE.MeshStandardMaterial[]> {
 const mesh = new THREE.Mesh(cubeGeometry, material(color)); mesh.position.set(x,y,z); mesh.scale.set(w,h,d); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
export function rng(seed:number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

// Merge fixed voxels by material while preserving each character's interactive parent group.
export function mergeStatic(group:THREE.Group){
 const buckets=new Map<THREE.Material,{geometries:THREE.BufferGeometry[];meshes:THREE.Mesh[]}>();
 for(const child of group.children){if(!(child instanceof THREE.Mesh)||Array.isArray(child.material))continue;child.updateMatrix();const entry=buckets.get(child.material)||{geometries:[],meshes:[]};entry.geometries.push(child.geometry.clone().applyMatrix4(child.matrix));entry.meshes.push(child);buckets.set(child.material,entry);}
 buckets.forEach(({geometries,meshes},mat)=>{const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)return;meshes.forEach(m=>group.remove(m));const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);});
}
