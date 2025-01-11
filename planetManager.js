import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene) {
    this.scene = scene;
    this.planet = this.createPlanet();
    this.scene.add(this.planet);
  }

  createPlanet() {
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create more realistic Earth material
    const material = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      specular: 0x333333,
      shininess: 15,
      bumpScale: 0.05,
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = 0.2;
    
    // Add atmosphere effect
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
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