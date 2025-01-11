import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    this.orbitRadius = 800;
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
    
    // Ensure moon and all its children are never culled
    this.moon.frustumCulled = false;
    this.moon.traverse(child => {
      child.frustumCulled = false;
    });
  }

  /* Rest of the code remains unchanged */
}