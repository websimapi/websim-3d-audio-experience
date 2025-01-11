import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
  constructor(scene) {
    // Real values (in km):
    // Sun diameter: 1,392,700
    // We'll use the same scale factor as the planet (1 unit = 100,000 km)
    this.SCALE_FACTOR = 1/100000;
    this.SUN_RADIUS = (1392700/2) * this.SCALE_FACTOR; // About 6.96 units

    this.scene = scene;
    this.sun = this.createSun();
    this.scene.add(this.sun);
    this.setupSunLight();
  }

  createSun() {
    const geometry = new THREE.SphereGeometry(this.SUN_RADIUS, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      emissive: 0xffdd44,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9
    });

    const sun = new THREE.Mesh(geometry, material);
    sun.position.set(0, 0, 0); // Sun at the center of the solar system
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(this.SUN_RADIUS * 1.05, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.7 - dot(vPositionNormal, vNormal), 2.0);
          gl_FragColor = vec4(1.0, 0.8, 0.3, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glowMesh);

    return sun;
  }

  setupSunLight() {
    // Main directional light with shadows
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 2000; // Increased to account for larger scale
    sunLight.shadow.bias = -0.0001;
    
    // Adjust shadow camera frustum
    const d = 2000; // Increased to account for larger scale
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    
    this.scene.add(sunLight);

    // Add volumetric light effect
    const pointLight = new THREE.PointLight(0xffdd44, 2, 3000);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  animate(camera) {
    // Update glow effect based on camera position
    const glowMesh = this.sun.children[0];
    glowMesh.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, this.sun.position);
  }
}