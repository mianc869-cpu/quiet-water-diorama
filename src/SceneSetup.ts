import * as THREE from 'three';
export class SceneSetup {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera();
  renderer: THREE.WebGLRenderer;
  zoomTarget = 1;
  constructor(container: HTMLElement) {
    this.scene.background = new THREE.Color('#ffffff');
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.camera.position.set(16.365, 16.8, 16.66);
    this.camera.lookAt(.465, 1.3, -.09);
    this.scene.add(new THREE.AmbientLight(0xcbdde3, .95));
    const light = new THREE.DirectionalLight(0xffe2b9, 2.5);
    light.position.set(-3, 10, 5); light.castShadow = true;
    light.shadow.mapSize.set(1024,1024);
    Object.assign(light.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:30});
    light.shadow.bias = -.001; this.scene.add(light);
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight, aspect = w / h;
    const height = aspect < 1 ? 16 / aspect : 11.7;
    this.camera.left = -height * aspect / 2; this.camera.right = height * aspect / 2;
    this.camera.top = height / 2; this.camera.bottom = -height / 2;
    this.camera.near = .1; this.camera.far = 100; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h);
  }
  update(dt:number) { this.camera.zoom = THREE.MathUtils.damp(this.camera.zoom,this.zoomTarget,7,dt); this.camera.updateProjectionMatrix(); }
}
