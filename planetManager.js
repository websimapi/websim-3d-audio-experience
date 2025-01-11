import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
    this.clock = new THREE.Clock();
    
    // Constants for Earth's gravity simulation
    this.G = 6.67430e-11; // Gravitational constant
    this.earthMass = 5.972e24; // kg
    this.waterParticleCount = 10000;
    this.waterParticles = [];
  }

  createPlanetLayers() {
    // Accurate Earth scaling (all values in km)
    const baseRadius = 300; // Visual scale factor
    const scaleRatio = baseRadius / 6371; // Scale ratio to convert real measures

    // Core layers with accurate proportions
    const layers = {
      innerCore: {
        radius: 1220 * scaleRatio,
        material: new THREE.MeshStandardMaterial({
          color: 0xff3300,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0xff4400,
          emissiveIntensity: 0.4
        })
      },
      outerCore: {
        radius: 3480 * scaleRatio,
        material: new THREE.MeshStandardMaterial({
          color: 0xff6600,
          metalness: 0.8,
          roughness: 0.3,
          transparent: true,
          opacity: 0.9
        })
      },
      lowerMantle: {
        radius: 5700 * scaleRatio,
        material: new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          metalness: 0.3,
          roughness: 0.8,
          transparent: true,
          opacity: 0.9
        })
      },
      upperMantle: {
        radius: 6340 * scaleRatio,
        material: new THREE.MeshStandardMaterial({
          color: 0xa0522d,
          metalness: 0.2,
          roughness: 0.9,
          transparent: true,
          opacity: 0.85
        })
      }
    };

    // Create each inner layer
    this.planet = new THREE.Group();
    Object.entries(layers).forEach(([name, data]) => {
      const geometry = new THREE.SphereGeometry(data.radius, 128, 128);
      const mesh = new THREE.Mesh(geometry, data.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.planet.add(mesh);
    });

    // Enhanced terrain generation with higher detail
    const segments = 1024; // Increased segment count for higher detail
    const crustGeometry = new THREE.SphereGeometry(baseRadius, segments, segments);
    const positions = crustGeometry.attributes.position;
    
    // Create heightmap using multiple noise layers
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions, i);
      vertex.normalize();
      
      // Multi-layered noise for realistic terrain
      let elevation = 0;
      elevation += this.mountainRange(vertex, 1.0, 100); // Large mountain ranges
      elevation += this.ridgeNoise(vertex, 0.5, 200);   // Medium ridges
      elevation += this.detailNoise(vertex, 0.25, 400); // Small details
      
      // Apply elevation to vertex
      vertex.multiplyScalar(baseRadius * (1 + elevation * 0.15));
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    crustGeometry.computeVertexNormals();
    
    // Enhanced terrain material
    const crustMaterial = this.createTerrainMaterial();
    const crust = new THREE.Mesh(crustGeometry, crustMaterial);
    crust.castShadow = true;
    crust.receiveShadow = true;
    crust.frustumCulled = false;
    this.planet.add(crust);

    // Enhanced ocean simulation
    this.createOceanLayer(baseRadius);

    // Atmosphere layer remains the same
    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.03, 128, 128);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 sunPosition;
        uniform float time;
        
        void main() {
          float intensity = pow(0.6 - dot(normalize(vPosition), vNormal), 2.0);
          vec3 atmosphere = vec3(0.3, 0.6, 1.0);
          gl_FragColor = vec4(atmosphere, intensity * 0.5);
        }
      `
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.frustumCulled = false;
    this.planet.add(atmosphere);

    // Set initial rotation and add to scene
    this.planet.rotation.x = 0.2;
    this.planet.rotation.y = Math.PI;
    this.planet.frustumCulled = false;
    this.scene.add(this.planet);
  }

  mountainRange(vertex, amplitude, frequency) {
    const v3 = new THREE.Vector3(
      vertex.x * frequency,
      vertex.y * frequency,
      vertex.z * frequency
    );
    return this.fbm(v3) * amplitude;
  }

  ridgeNoise(vertex, amplitude, frequency) {
    const v3 = new THREE.Vector3(
      vertex.x * frequency + 123.4,
      vertex.y * frequency + 567.8,
      vertex.z * frequency + 901.2
    );
    return Math.abs(this.fbm(v3)) * amplitude;
  }

  detailNoise(vertex, amplitude, frequency) {
    const v3 = new THREE.Vector3(
      vertex.x * frequency + 432.1,
      vertex.y * frequency + 876.5,
      vertex.z * frequency + 321.9
    );
    return this.fbm(v3) * amplitude;
  }

  fbm(pos) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for(let i = 0; i < 6; i++) {
      total += this.noise3D(pos.x * frequency, pos.y * frequency, pos.z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return total / maxValue;
  }

  noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    return this.lerp(
      w,
      this.lerp(v,
        this.lerp(u,
          this.grad(this.p[X + this.p[Y + this.p[Z]]], x, y, z),
          this.grad(this.p[X + 1 + this.p[Y + this.p[Z]]], x - 1, y, z)
        ),
        this.lerp(u,
          this.grad(this.p[X + this.p[Y + 1 + this.p[Z]]], x, y - 1, z),
          this.grad(this.p[X + 1 + this.p[Y + 1 + this.p[Z]]], x - 1, y - 1, z)
        )
      ),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.p[X + this.p[Y + this.p[Z + 1]]], x, y, z - 1),
          this.grad(this.p[X + 1 + this.p[Y + this.p[Z + 1]]], x - 1, y, z - 1)
        ),
        this.lerp(u,
          this.grad(this.p[X + this.p[Y + 1 + this.p[Z + 1]]], x, y - 1, z - 1),
          this.grad(this.p[X + 1 + this.p[Y + 1 + this.p[Z + 1]]], x - 1, y - 1, z - 1)
        )
      )
    );
  }

  createTerrainMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        landColor: { value: new THREE.Color(0x228B22) },
        oceanColor: { value: new THREE.Color(0x1E90FF) },
        mountainColor: { value: new THREE.Color(0x8B7765) },
        snowColor: { value: new THREE.Color(0xFFFFFF) },
        bumpScale: { value: 2.0 },
        oceanLevel: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // 3D Simplex Noise 
        // Source: https://github.com/ashima/webgl-noise
        vec4 permute(vec4 x) {
          return mod(((x*34.0)+1.0)*x, 289.0);
        }
        
        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }
        
        float cnoise(vec3 P) {
          vec3 Pi0 = floor(P);
          vec3 Pi1 = Pi0 + vec3(1.0);
          Pi0 = mod(Pi0, 289.0);
          Pi1 = mod(Pi1, 289.0);
          vec3 Pf0 = fract(P);
          vec3 Pf1 = Pf0 - vec3(1.0);
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;
          
          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);
          
          vec4 gx0 = ixy0/7.0;
          vec4 gy0 = fract(floor(gx0)/7.0)-0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);
          
          vec4 gx1 = ixy1/7.0;
          vec4 gy1 = fract(floor(gx1)/7.0)-0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);
          
          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
          
          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;
          
          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);
          
          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          vec3 newPosition = position;

          // Apply displacement for terrain
          float elevation = cnoise(normal * 5.0) * 5.0; // Large features
          elevation += cnoise(normal * 20.0) * 2.5;     // Medium features
          elevation += cnoise(normal * 100.0) * 1.0;    // Small features

          newPosition += normal * elevation * 0.5; // Adjust the displacement strength

          vPosition = newPosition;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        uniform vec3 landColor;
        uniform vec3 oceanColor;
        uniform vec3 mountainColor;
        uniform vec3 snowColor;
        uniform float oceanLevel;

        void main() {
          // Calculate elevation based on displacement
          float elevation = length(vPosition) - 300;
          
          // Determine color based on elevation
          vec3 color;

          if (elevation < oceanLevel) {
            color = oceanColor;
          } else if (elevation < 5.0) {
            color = mix(landColor, mountainColor, (elevation - oceanLevel) / 5.0);
          } else if (elevation < 10.0) {
            color = mountainColor;
          } else {
            color = snowColor;
          }

          // Apply simple lighting
          float lighting = dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          color *= lighting;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.FrontSide,
      transparent: false
    });
  }

  createOceanLayer(baseRadius) {
    const oceanRadius = baseRadius * 1.001;
    const oceanGeometry = new THREE.SphereGeometry(oceanRadius, 512, 512);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        moonPosition: { value: new THREE.Vector3() },
        sunPosition: { value: new THREE.Vector3(100, 40, -200) },
        baseColor: { value: new THREE.Color(0x1E90FF) },
        cameraPosition: { value: new THREE.Vector3() },
        displacementScale: { value: 5.0 },
        gravitationalForce: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform float time;
        uniform vec3 moonPosition;
        uniform vec3 gravitationalForce;
        
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying float vWaveHeight;
        
        ${this.getNoiseFunction()}
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;
          
          // Calculate gravitational influence
          vec3 toMoon = normalize(moonPosition - pos);
          float moonDist = length(moonPosition - pos);
          float tidalForce = 1.0 / (moonDist * moonDist);
          
          // Wave system
          float waveHeight = 0.0;
          waveHeight += snoise(vec3(pos.x * 0.05 + time * 0.1, pos.y * 0.05, pos.z * 0.05)) * 2.0;
          waveHeight += snoise(vec3(pos.x * 0.1 - time * 0.15, pos.y * 0.1, pos.z * 0.1)) * 1.0;
          waveHeight += snoise(vec3(pos.x * 0.2 + time * 0.2, pos.y * 0.2, pos.z * 0.2)) * 0.5;
          
          // Apply tidal forces
          vec3 displacement = normal * (waveHeight + tidalForce * 10.0);
          pos += displacement;
          
          vWaveHeight = waveHeight;
          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 sunPosition;
        uniform vec3 moonPosition;
        
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying float vWaveHeight;
        
        void main() {
          vec3 sunDir = normalize(sunPosition - vWorldPosition);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Fresnel effect
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          
          // Wave color variation
          vec3 waterColor = baseColor + vec3(vWaveHeight * 0.1);
          
          // Specular highlights
          float specular = pow(max(dot(reflect(-sunDir, vNormal), viewDir), 0.0), 32.0);
          
          vec3 finalColor = mix(waterColor, vec3(1.0), fresnel * 0.5 + specular);
          
          gl_FragColor = vec4(finalColor, 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.frustumCulled = false;
    this.planet.add(ocean);
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  getNoiseFunction() {
    return `
      // Simplex noise implementation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
    `;
  }

  animate() {
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update planet rotation
    this.planet.rotation.y += 0.001;

    // Update ocean material uniforms
    this.planet.children.forEach(child => {
      if (child.material && child.material.type === 'ShaderMaterial') {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = elapsedTime;
        }
        if (child.material.uniforms.moonPosition && this.moonManager) {
          child.material.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
        }
        
        // Calculate and update gravitational forces
        if (child.material.uniforms.gravitationalForce) {
          const moonPos = this.moonManager.getPosition();
          const gravityVector = new THREE.Vector3()
            .subVectors(moonPos, child.position)
            .normalize()
            .multiplyScalar(this.G * this.earthMass / moonPos.lengthSq());
          
          child.material.uniforms.gravitationalForce.value.copy(gravityVector);
        }
      }
    });
  }
}