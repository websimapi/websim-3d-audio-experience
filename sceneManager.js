import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.setup();
    this.setupLighting();
  }

  setup() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'none';
    this.camera.position.z = 5;
    
    // Add some fog to create depth
    this.scene.fog = new THREE.FogExp2(0x000000, 0.05);
  }

  setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  show() {
    this.renderer.domElement.style.display = 'block';
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}