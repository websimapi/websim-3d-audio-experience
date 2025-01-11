import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'canvas-container';
    
    this.setup();
    this.setupLighting();
  }

  setup() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.containerElement.appendChild(this.renderer.domElement);
    document.body.appendChild(this.containerElement);
    this.camera.position.z = 5;
    
    // Adjust fog for better space feel
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0015);
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