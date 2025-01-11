import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PhysicsManager {
  constructor() {
    this.G = 6.67430e-11; // Gravitational constant
    this.timeScale = 1000000; // Scale time to make effects visible
    this.bodies = {};
  }

  addBody(name, position, mass, radius, initialVelocity = new THREE.Vector3(0, 0, 0)) {
    this.bodies[name] = {
      position: position.clone(),
      velocity: initialVelocity,
      mass: mass,
      radius: radius
    };
  }

  calculateGravity(body1, body2) {
    const direction = new THREE.Vector3().subVectors(body2.position, body1.position);
    const distance = direction.length();
    
    // Normalize direction
    direction.normalize();
    
    // Calculate gravitational force
    const forceMagnitude = (this.G * body1.mass * body2.mass) / (distance * distance);
    
    return direction.multiplyScalar(forceMagnitude);
  }

  update(deltaTime) {
    const scaledDeltaTime = deltaTime * this.timeScale;
    
    // Calculate gravitational forces between all bodies
    Object.entries(this.bodies).forEach(([name1, body1]) => {
      Object.entries(this.bodies).forEach(([name2, body2]) => {
        if (name1 !== name2) {
          const force = this.calculateGravity(body1, body2);
          
          // Apply acceleration to velocity (F = ma -> a = F/m)
          const acceleration = force.multiplyScalar(1 / body1.mass);
          body1.velocity.add(acceleration.multiplyScalar(scaledDeltaTime));
        }
      });
    });

    // Update positions
    Object.values(this.bodies).forEach(body => {
      body.position.add(body.velocity.clone().multiplyScalar(scaledDeltaTime));
    });
  }

  getBodies() {
    return this.bodies;
  }
}