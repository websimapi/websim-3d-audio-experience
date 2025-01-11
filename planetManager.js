import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene) {
    this.scene = scene;
    this.planet = this.createPlanet();
    this.scene.add(this.planet);
  }

  createPlanet() {
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create more realistic Earth material with PBR properties
    const material = new THREE.MeshStandardMaterial({
      color: 0x2233ff,
      metalness: 0.1,
      roughness: 0.8,
      envMapIntensity: 1.0,
      bumpScale: 0.05,
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = 0.2;
    planet.castShadow = true;
    planet.receiveShadow = true;
    
    // Rotate the planet 180 degrees so the lit side faces the camera initially
    planet.rotation.y = Math.PI;
    
    // Add atmosphere effect with improved shader
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(normalize(vPosition), vNormal), 2.0);
          vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
          vec3 finalColor = atmosphereColor * intensity;
          gl_FragColor = vec4(finalColor, intensity * 0.5);
        }
      `,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere);
    
    return planet;
  }

  animate() {
    this.planet.rotation.y += 0.001;
  }
}