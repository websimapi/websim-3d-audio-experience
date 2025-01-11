constructor(scene) {
  this.scene = scene;
  this.sun = this.createSun();
  this.scene.add(this.sun);
  this.setupSunLight();
  
  // Ensure sun and all its children are always visible
  const disableFrustumCulling = (object) => {
    object.frustumCulled = false;
    if (object.children) {
      object.children.forEach(child => disableFrustumCulling(child));
    }
  };
  disableFrustumCulling(this.sun);

  // Ensure proper render order
  this.sun.renderOrder = 1000;
  this.sun.children[0].renderOrder = 999;
}