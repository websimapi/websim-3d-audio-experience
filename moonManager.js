import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    this.orbitRadius = 60;
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
  }

  createMoon() {
    const geometry = new THREE.SphereGeometry(2.5, 64, 64);
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

  getPosition() {
    return this.moon.position;
  }

  animate() {
    this.orbitAngle += this.orbitSpeed;
    this.moon.position.x = Math.cos(this.orbitAngle) * this.orbitRadius;
    this.moon.position.z = Math.sin(this.orbitAngle) * this.orbitRadius;
    this.moon.position.y = Math.sin(this.orbitAngle * 0.5) * 20; // Inclined orbit
    this.moon.rotation.y += 0.001;
  }
}