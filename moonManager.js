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