import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true
      });
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      throw new Error('Failed to create WebGL context');
    }

    this.containerElement = document.createElement('div');
    this.containerElement.className = 'canvas-container';
    
    // Camera control variables
    this.minDistance = 30;  
    this.maxDistance = 300;
    this.zoomSpeed = 1.0;
    this.currentDistance = 100;
    this.targetDistance = 100;
    this.lastTouchDistance = 0;
    
    // Orbital control variables
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.sphericalCoords = new THREE.Spherical(
      this.currentDistance,
      Math.PI / 2, // phi (vertical angle)
      0 // theta (horizontal angle)
    );
    this.minPolarAngle = 0.1; 
    this.maxPolarAngle = Math.PI - 0.1; 
    this.rotationSpeed = 0.01;
    
    this.setup();
    this.setupLighting();
    this.setupControls();
    this.initializeBackground();
    this.updateCameraPosition();
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
  }

  setupControls() {
    // Mouse controls for orbit
    this.containerElement.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isDragging) return;

      const deltaMove = {
        x: event.clientX - this.previousMousePosition.x,
        y: event.clientY - this.previousMousePosition.y
      };

      // Update spherical coordinates based on mouse movement
      this.sphericalCoords.theta -= deltaMove.x * this.rotationSpeed;
      this.sphericalCoords.phi += deltaMove.y * this.rotationSpeed;
      
      // Clamp vertical rotation
      this.sphericalCoords.phi = Math.max(this.minPolarAngle, 
        Math.min(this.maxPolarAngle, this.sphericalCoords.phi));

      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };

      this.updateCameraPosition();
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch controls for orbit
    this.containerElement.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      } else if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    });

    this.containerElement.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1 && this.isDragging) {
        const deltaMove = {
          x: event.touches[0].clientX - this.previousMousePosition.x,
          y: event.touches[0].clientY - this.previousMousePosition.y
        };

        this.sphericalCoords.theta -= deltaMove.x * this.rotationSpeed;
        this.sphericalCoords.phi += deltaMove.y * this.rotationSpeed;
        
        this.sphericalCoords.phi = Math.max(this.minPolarAngle, 
          Math.min(this.maxPolarAngle, this.sphericalCoords.phi));

        this.previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };

        this.updateCameraPosition();
      } else if (event.touches.length === 2) {
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

    this.containerElement.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Mouse wheel zoom
    this.containerElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomDelta = event.deltaY * 0.001;
      this.targetDistance = Math.max(this.minDistance, 
        Math.min(this.maxDistance, this.targetDistance + (zoomDelta * this.zoomSpeed * this.targetDistance)));
    });
  }

  updateCameraPosition() {
    // Smoothly interpolate current distance to target distance
    this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
    this.sphericalCoords.radius = this.currentDistance;

    // Convert spherical coordinates to Cartesian
    const position = new THREE.Vector3().setFromSpherical(this.sphericalCoords);
    this.camera.position.copy(position);
    
    // Look at the center (origin)
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrix();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x111111, 1.2);
    this.scene.add(ambientLight);
  }

  initializeBackground() {
    // Add stars to the background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.5,
      sizeAttenuation: true
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
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
    if (!this.scene || !this.camera || !this.renderer) {
      console.warn('Essential rendering components not initialized');
      return;
    }

    this.updateCameraPosition();

    try {
      // Find ocean material safely
      const ocean = this.scene.children.find(child => 
        child?.type === 'Group' && // Planet group
        child.children?.[4]?.material?.type === 'ShaderMaterial' // Ocean layer
      )?.children?.[4];

      // Update ocean shader only if it exists
      if (ocean?.material?.uniforms?.cameraPosition) {
        ocean.material.uniforms.cameraPosition.value.copy(this.camera.position);
      }

      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error during render:', error);
    }
  }
}