import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SolarSystemManager {
  constructor(scene, physicsManager) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.createCelestialBodies();
  }

  createCelestialBodies() {
    // Create Sun
    const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xffcc00,
      emissiveIntensity: 1,
      roughness: 0.5,
      metalness: 0
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    // Add sun light
    this.sunLight = new THREE.PointLight(0xffcc00, 2, 100, 2);
    this.sunLight.position.copy(this.sun.position);
    this.scene.add(this.sunLight);

    // Create Planet
    const planetGeometry = new THREE.SphereGeometry(2, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.3,
      vertexColors: true
    });

    // Add vertex colors for a gradient effect
    const colors = [];
    const vertices = planetGeometry.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const y = vertices[i + 1];
      const color = new THREE.Color();
      const t = (y + 2) / 4;
      color.setHSL(0.6, 0.8, 0.3 + t * 0.4);
      colors.push(color.r, color.g, color.b);
    }
    
    planetGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.planet = new THREE.Mesh(planetGeometry, planetMaterial);
    this.planet.position.set(15, 0, 0);
    this.scene.add(this.planet);

    // Add physics bodies
    this.physicsManager.addBody('sun', this.sun.position, 5000, 5);
    this.physicsManager.addBody('planet', this.planet.position, 100, 2, new THREE.Vector3(0, 2, 0));
  }

  animate(deltaTime) {
    // Update positions based on physics
    const bodies = this.physicsManager.getBodies();
    
    if (bodies.planet) {
      this.planet.position.copy(bodies.planet.position);
    }
    
    // Rotate the planet
    this.planet.rotation.y += 0.001;
    
    // Update sun's corona effect
    this.sunLight.intensity = 2 + Math.sin(Date.now() * 0.001) * 0.2;
  }
}