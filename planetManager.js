import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
    this.clock = new THREE.Clock();

    // Ensure planet and all its layers are never culled
    this.planet.frustumCulled = false;
    this.planet.traverse(child => {
      child.frustumCulled = false;
    });
  }

  /* Rest of the code remains unchanged */
}