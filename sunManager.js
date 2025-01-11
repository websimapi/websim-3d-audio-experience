import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
  constructor(scene) {
    this.scene = scene;
    this.sun = this.createSun();
    this.scene.add(this.sun);
    this.setupSunLight();
    
    // Position sun at a more realistic scaled distance (roughly 150 million km scale factor)
    this.sun.position.set(1500, 200, -2000);
  }

  createSun() {
    // Sun's radius is about 696,340 km, Earth's is 6,371 km
    // Using scale factor to keep it visually interesting while maintaining relative size
    const geometry = new THREE.SphereGeometry(180, 64, 64); 
    const material = new THREE.MeshStandardMaterial({
      emissive: 0xffdd44,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    });

    const sun = new THREE.Mesh(geometry, material);
    
    const glowGeometry = new THREE.SphereGeometry(185, 64, 64);
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
    // Main directional light for sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.copy(this.sun.position);
    sunLight.castShadow = true;
    
    // Improve shadow quality
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 5000;
    sunLight.shadow.bias = -0.0001;
    
    // Increase shadow camera frustum
    const d = 1000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    
    this.scene.add(sunLight);

    // Add point light for volumetric lighting effects
    const pointLight = new THREE.PointLight(0xffdd44, 5, 3000);
    pointLight.position.copy(this.sun.position);
    this.scene.add(pointLight);

    // Add secondary fill light
    const fillLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    this.scene.add(fillLight);
  }

  animate(camera) {
    const glowMesh = this.sun.children[0];
    glowMesh.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, this.sun.position);
  }
}