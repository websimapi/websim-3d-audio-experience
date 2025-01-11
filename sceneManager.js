import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'canvas-container';
    
    this.setup();
    this.setupLighting();
  }

  setup() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    this.containerElement.appendChild(this.renderer.domElement);
    document.body.appendChild(this.containerElement);
    
    // Position camera at an appropriate viewing distance
    // Using the same scale factor (1 unit = 100,000 km)
    this.camera.position.set(1500, 100, 1500);
    this.camera.lookAt(0, 0, 0);
  }

  setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x111111);
    this.scene.add(ambientLight);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  show() {
    this.containerElement.classList.add('visible');
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}