import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene) {
    this.scene = scene;
    this.planet = this.createPlanet();
    this.scene.add(this.planet);
  }

  createPlanet() {
    // Create a large sphere for the planet
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create a material with a gradient texture procedurally
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
    });

    // Add vertex colors for a gradient effect
    const colors = [];
    const vertices = geometry.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const y = vertices[i + 1];
      const color = new THREE.Color();
      
      // Create a gradient from deep blue to lighter blue
      const t = (y + 2) / 4; // Normalize y coordinate
      color.setHSL(0.6, 0.8, 0.3 + t * 0.4);
      
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = 0.2;
    
    return planet;
  }

  animate() {
    this.planet.rotation.y += 0.001;
  }
}