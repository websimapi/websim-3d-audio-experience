import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    
    this.containerElement.appendChild(this.renderer.domElement);
    document.body.appendChild(this.containerElement);
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);
    
    // Add subtle space fog
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
  }

  setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x101010);
    this.scene.add(ambientLight);

    // Add stars to the background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    
    for(let i = 0; i < 1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
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