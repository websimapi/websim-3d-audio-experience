import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    // Moon's orbit is about 384,400 km from Earth
    // Scaled down but maintaining relative proportions
    this.orbitRadius = 200;
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
  }

  createMoon() {
    // Moon's radius is about 1,737 km (Earth's is 6,371 km)
    // Maintain relative size proportion
    const moonRadius = 8.2; // Scaled relative to Earth's 30 unit radius
    const geometry = new THREE.SphereGeometry(moonRadius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.7,
      metalness: 0.1
    });

    const moon = new THREE.Mesh(geometry, material);
    moon.castShadow = true;
    moon.receiveShadow = true;

    return moon;
  }

  animate() {
    // Update moon's orbital position
    this.orbitAngle += this.orbitSpeed;
    const x = Math.cos(this.orbitAngle) * this.orbitRadius;
    const z = Math.sin(this.orbitAngle) * this.orbitRadius;
    this.moon.position.set(x, 0, z);
  }

  getPosition() {
    return this.moon.position;
  }
}