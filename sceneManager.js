import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'canvas-container';
    
    // Camera control variables
    this.minDistance = 15;  // Minimum zoom distance
    this.maxDistance = 100; // Maximum zoom distance
    this.zoomSpeed = 1.0;
    this.currentDistance = 25;
    this.targetDistance = 25;
    this.lastTouchDistance = 0;
    this.baseCameraPosition = new THREE.Vector3(-12, 8, -20);
    this.normalizedCameraPosition = this.baseCameraPosition.clone().normalize();
    
    this.setup();
    this.setupLighting();
    this.setupControls();
  }

  setup() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2; 
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    this.containerElement.appendChild(this.renderer.domElement);
    document.body.appendChild(this.containerElement);
    
    this.updateCameraPosition();
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    // Mouse wheel zoom
    this.containerElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomDelta = event.deltaY * 0.001;
      this.targetDistance = Math.max(this.minDistance, 
        Math.min(this.maxDistance, this.targetDistance + (zoomDelta * this.zoomSpeed * this.targetDistance)));
    });

    // Touch events for mobile
    let touchStartY = 0;
    this.containerElement.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    });

    this.containerElement.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const delta = this.lastTouchDistance - currentDistance;
        this.targetDistance = Math.max(this.minDistance, 
          Math.min(this.maxDistance, this.targetDistance + (delta * 0.05)));

        this.lastTouchDistance = currentDistance;
      }
    });
  }

  updateCameraPosition() {
    // Smoothly interpolate current distance to target distance
    this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
    
    // Update camera position based on distance
    this.camera.position.copy(this.normalizedCameraPosition)
      .multiplyScalar(this.currentDistance);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x111111, 1.2);
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
    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  }
}