// Update moon positioning in constructor:
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    // Scale factor applied to maintain visible relative distances
    this.orbitRadius = 800; // Increased orbital radius
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
    
    // Ensure moon is always visible
    this.moon.frustumCulled = false;
  }