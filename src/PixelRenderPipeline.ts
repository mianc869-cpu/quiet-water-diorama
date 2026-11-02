import * as THREE from 'three';
export class PixelRenderPipeline {
 target:THREE.WebGLRenderTarget;
 scene=new THREE.Scene(); camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 material:THREE.ShaderMaterial;
 pixelSize=2;
 constructor(private renderer:THREE.WebGLRenderer){
 this.target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
 this.material=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:this.target.texture}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
 uniform sampler2D tDiffuse;varying vec2 vUv;
 float bayer(vec2 p){vec2 q=mod(floor(p),4.);float x=q.x;float v=0.;if(q.y<1.){v=x<1.?0.:x<2.?8.:x<3.?2.:10.;}else if(q.y<2.){v=x<1.?12.:x<2.?4.:x<3.?14.:6.;}else if(q.y<3.){v=x<1.?3.:x<2.?11.:x<3.?1.:9.;}else{v=x<1.?15.:x<2.?7.:x<3.?13.:5.;}return (v+.5)/16.;}
 void main(){gl_FragColor=texture2D(tDiffuse,vUv);
 #include <colorspace_fragment>
 vec3 c=gl_FragColor.rgb;
 float d=bayer(gl_FragCoord.xy/2.)-.5;
 if(min(min(c.r,c.g),c.b)<.97)c=floor(c*28.+d*.28+.5)/28.;
 gl_FragColor=vec4(c,1.);
 }`,depthTest:false,depthWrite:false});
 this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material));this.resize();
 }
 resize(){const density=innerWidth<700?1.25:2;this.target.setSize(Math.ceil(innerWidth/density),Math.ceil(innerHeight/density));}
 render(scene:THREE.Scene,camera:THREE.Camera){this.renderer.setRenderTarget(this.target);this.renderer.render(scene,camera);this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);}
 dispose(){this.target.dispose();this.material.dispose();(this.scene.children[0] as THREE.Mesh).geometry.dispose();}
}
