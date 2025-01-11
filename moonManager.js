import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    // Scale factor applied to maintain visible relative distances
    this.orbitRadius = 800;
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
    
    // Ensure moon and all its children are always visible
    const disableFrustumCulling = (object) => {
      object.frustumCulled = false;
      if (object.children) {
        object.children.forEach(child => disableFrustumCulling(child));
      }
    };
    disableFrustumCulling(this.moon);
  }

  createMoon() {
    const moonGeometry = new THREE.SphereGeometry(8, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.02
    });

    // Create crater bumps
    const craterBumps = new Float32Array(64 * 32 * 3);
    for (let i = 0; i < craterBumps.length; i += 3) {
      const random = Math.random();
      craterBumps[i] = random * 0.3 - 0.15;
      craterBumps[i + 1] = random * 0.3 - 0.15;
      craterBumps[i + 2] = random * 0.3 - 0.15;
    }

    moonGeometry.setAttribute('craterBumps', new THREE.BufferAttribute(craterBumps, 3));
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    return moon;
  }

  getPosition() {
    return this.moon.position;
  }

  animate() {
    // Update moon position in orbit
    this.orbitAngle += this.orbitSpeed;
    this.moon.position.x = Math.cos(this.orbitAngle) * this.orbitRadius;
    this.moon.position.z = Math.sin(this.orbitAngle) * this.orbitRadius;
    this.moon.position.y = Math.sin(this.orbitAngle * 0.5) * this.orbitRadius * 0.1;
    
    // Rotate moon
    this.moon.rotation.y += 0.001;
  }
}