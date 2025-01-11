import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

// Include SimplexNoise for terrain generation
class SimplexNoise {
  constructor(r = Math) {
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(r.random()*256);
    }
    this.perm = [];
    for(let i=0; i<512; i++) {
      this.perm[i]=this.p[i & 255];
    }
  }
  dot(g, x, y, z) {
    return g[0]*x + g[1]*y + g[2]*z;
  }
  noise(xin, yin, zin) {
    let n0, n1, n2, n3;
    const F3 = 1.0/3.0;
    const s = (xin+yin+zin)*F3;
    const i = Math.floor(xin+s);
    const j = Math.floor(yin+s);
    const k = Math.floor(zin+s);
    const G3 = 1.0/6.0;
    const t = (i+j+k)*G3;
    const X0 = i-t;
    const Y0 = j-t;
    const Z0 = k-t;
    const x0 = xin-X0;
    const y0 = yin-Y0;
    const z0 = zin-Z0;
    let i1, j1, k1;
    let i2, j2, k2;
    if(x0>=y0) {
      if(y0>=z0) {
        i1=1; j1=0; k1=0;
        i2=1; j2=1; k2=0;
      } else if(x0>=z0) {
        i1=1; j1=0; k1=0;
        i2=1; j2=0; k2=1;
      } else {
        i1=0; j1=0; k1=1;
        i2=1; j2=0; k2=1;
      }
    } else {
      if(y0<z0) {
        i1=0; j1=0; k1=1;
        i2=0; j2=1; k2=1;
      } else if(x0<z0) {
        i1=0; j1=1; k1=0;
        i2=0; j2=1; k2=1;
      } else {
        i1=0; j1=1; k1=0;
        i2=1; j2=1; k2=0;
      }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0*G3;
    const y2 = y0 - j2 + 2.0*G3;
    const z2 = z0 - k2 + 2.0*G3;
    const x3 = x0 - 1.0 + 3.0*G3;
    const y3 = y0 - 1.0 + 3.0*G3;
    const z3 = z0 - 1.0 + 3.0*G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.grad3[this.perm[ii+this.perm[jj+this.perm[kk]]] % 12];
    const gi1 = this.grad3[this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12];
    const gi2 = this.grad3[this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12];
    const gi3 = this.grad3[this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12];
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(gi0, x0, y0, z0);
    }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(gi1, x1, y1, z1);
    }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(gi2, x2, y2, z2);
    }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(gi3, x3, y3, z3);
    }
    return 32.0*(n0 + n1 + n2 + n3);
  }
}

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanet();
    this.clock = new THREE.Clock();
    this.gravity = 9.81; // Gravitational acceleration (m/s^2)
    this.objects = []; // Objects affected by gravity
    this.setupPhysics();
  }

  createPlanet() {
    // Earth's mean radius in km
    const baseRadius = 6371; 
    const scaleFactor = 0.05; // Adjust scale for visualization
    const radius = baseRadius * scaleFactor;

    // Create an icosahedron geometry for the planet
    const subdivisions = 7; // Increase for higher detail
    const geometry = new THREE.IcosahedronGeometry(radius, subdivisions);

    // Displace vertices to create realistic terrain using simplex noise
    const simplex = new SimplexNoise();

    const positions = geometry.attributes.position.array;
    const vectors = [];

    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );

      // Normalize to get direction vector
      const normalized = vertex.clone().normalize();

      // Apply noise based on latitude and longitude
      const nx = normalized.x;
      const ny = normalized.y;
      const nz = normalized.z;

      // Generate elevation using noise
      let elevation = 0;
      let frequency = 1;
      let amplitude = 1;
      // Fractal noise (multiple octaves)
      for (let octave = 0; octave < 5; octave++) {
        elevation += simplex.noise(nx * frequency, ny * frequency, nz * frequency) * amplitude;
        frequency *= 2;
        amplitude *= 0.5;
      }

      // Scale elevation
      elevation *= radius * 0.1; // Adjust to control elevation magnitude

      // Update vertex position based on elevation
      vertex.add(normalized.multiplyScalar(elevation));

      positions[i] = vertex.x;
      positions[i + 1] = vertex.y;
      positions[i + 2] = vertex.z;

      vectors.push(vertex);
    }

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    // Create material for land
    const landMaterial = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 1,
      metalness: 0
    });

    // Create mesh for the planet
    this.planetMesh = new THREE.Mesh(geometry, landMaterial);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.planetMesh.frustumCulled = false;

    // Create water mesh based on sea level
    const seaLevel = radius * 1.005;
    const waterGeometry = this.planetMesh.geometry.clone();
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1E90FF,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.5, // Make water transparent
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0
    });

    // Flatten water mesh vertices to sea level
    const waterPositions = waterGeometry.attributes.position.array;
    for (let i = 0; i < waterPositions.length; i += 3) {
      const vertex = new THREE.Vector3(
        waterPositions[i],
        waterPositions[i + 1],
        waterPositions[i + 2]
      ).normalize().multiplyScalar(seaLevel);

      waterPositions[i] = vertex.x;
      waterPositions[i + 1] = vertex.y;
      waterPositions[i + 2] = vertex.z;
    }

    waterGeometry.computeVertexNormals();
    waterGeometry.attributes.position.needsUpdate = true;

    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.receiveShadow = true;
    this.waterMesh.frustumCulled = false;

    // Add both meshes to the planet group
    this.planet = new THREE.Group();
    this.planet.add(this.planetMesh);
    this.planet.add(this.waterMesh);

    this.planet.rotation.x = 0.2;
    this.planet.rotation.y = Math.PI;
    this.planet.frustumCulled = false;
    this.scene.add(this.planet);
  }

  setupPhysics() {
    // Create a test object to demonstrate gravity
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({color: 0xff0000});
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 15, 0);
    this.scene.add(sphere);
    this.objects.push({mesh: sphere, velocity: new THREE.Vector3(0, 0, 0)});
  }

  applyGravity(deltaTime) {
    this.objects.forEach(obj => {
      // Calculate gravitational force towards the planet center
      const direction = new THREE.Vector3().subVectors(
        this.planet.position, obj.mesh.position
      ).normalize();

      // Compute gravitational acceleration based on distance
      const distance = obj.mesh.position.distanceTo(this.planet.position);
      const planetMass = 5.972e24; // Mass of Earth in kg
      const G = 6.67430e-11; // Gravitational constant
      const scaleFactor = 0.05; // Same scale factor as planet
      const scaledDistance = distance / scaleFactor; // Convert to real distance

      // Gravitational acceleration formula: g = G*M / r^2
      const accelerationMagnitude = (G * planetMass) / (scaledDistance * scaledDistance);
      const acceleration = direction.clone().multiplyScalar(accelerationMagnitude * deltaTime);

      // Update velocity
      obj.velocity.add(acceleration);

      // Update position
      obj.mesh.position.add(obj.velocity.clone().multiplyScalar(deltaTime));

      // Check for collision with planet surface
      const planetRadius = this.planetMesh.geometry.boundingSphere.radius;
      if (distance <= planetRadius) {
        // Simple collision response: position at surface and stop movement
        obj.mesh.position.setLength(planetRadius);
        obj.velocity.set(0, 0, 0);
      }
    });
  }

  animate() {
    const deltaTime = this.clock.getDelta();

    // Rotate planet
    this.planet.rotation.y += 0.0005;

    // Apply gravity to objects
    this.applyGravity(deltaTime);
  }
}