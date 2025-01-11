import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
    this.clock = new THREE.Clock();
  }

  createPlanetLayers() {
    // Accurate Earth scaling (all values in km)
    // Real Earth radius: 6,371 km
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
      },
      crust: {
        radius: baseRadius,
        material: new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          metalness: 0.1,
          roughness: 0.95,
          transparent: true,
          opacity: 0.9
        })
      }
    };

    // Create each layer
    this.planet = new THREE.Group();
    Object.entries(layers).forEach(([name, data]) => {
      const geometry = new THREE.SphereGeometry(data.radius, 128, 128);
      const mesh = new THREE.Mesh(geometry, data.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.planet.add(mesh);
    });

    // Add detailed ocean layer
    const oceanRadius = baseRadius * 1.01;
    const oceanGeometry = new THREE.SphereGeometry(oceanRadius, 256, 256);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        moonPosition: { value: new THREE.Vector3() },
        sunPosition: { value: new THREE.Vector3(100, 40, -200) },
        baseColor: { value: new THREE.Color(0x006994) },
        deepColor: { value: new THREE.Color(0x001933) },
        foamColor: { value: new THREE.Color(0xffffff) },
        cameraPosition: { value: new THREE.Vector3() },
        waveHeight: { value: 0.2 },
        waveFrequency: { value: 20.0 },
        waveSpeed: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float waveHeight;
        uniform float waveFrequency;
        uniform float waveSpeed;
        
        // Improved noise function
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
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          
          // Calculate wave displacement
          float noise = cnoise(vec3(vUv * waveFrequency, time * waveSpeed));
          vec3 newPosition = position + normal * noise * waveHeight;
          
          vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
          vWorldPosition = worldPosition.xyz;
          vPosition = newPosition;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 moonPosition;
        uniform vec3 sunPosition;
        uniform vec3 baseColor;
        uniform vec3 deepColor;
        uniform vec3 foamColor;
        uniform vec3 cameraPosition;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 5.0);
          
          // Sun reflection
          vec3 sunDir = normalize(sunPosition - vWorldPosition);
          float sunReflection = pow(max(0.0, dot(reflect(-sunDir, vNormal), viewDir)), 64.0);
          
          // Moon reflection (softer)
          vec3 moonDir = normalize(moonPosition - vWorldPosition);
          float moonReflection = pow(max(0.0, dot(reflect(-moonDir, vNormal), viewDir)), 32.0) * 0.3;
          
          // Depth effect
          float depth = pow(fresnel, 2.0);
          vec3 waterColor = mix(deepColor, baseColor, depth);
          
          // Add reflections
          vec3 finalColor = waterColor;
          finalColor += vec3(1.0, 0.95, 0.8) * sunReflection;
          finalColor += vec3(0.9, 0.9, 1.0) * moonReflection;
          finalColor += foamColor * fresnel * 0.2;
          
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
      transparent: true,
      side: THREE.FrontSide
    });

    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.frustumCulled = false;
    this.planet.add(ocean);

    // Add atmospheric scattering effect
    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.05, 128, 128);
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
          float intensity = pow(0.7 - dot(normalize(vPosition), vNormal), 2.0);
          vec3 atmosphere = vec3(0.3, 0.6, 1.0);
          
          // Add some variation based on height
          float heightFactor = vPosition.y * 0.001;
          atmosphere = mix(atmosphere, vec3(0.4, 0.7, 1.0), heightFactor);
          
          // Add time-based variation
          float variation = sin(time * 0.5 + vPosition.y * 0.01) * 0.1;
          intensity *= (1.0 + variation);
          
          gl_FragColor = vec4(atmosphere, intensity * 0.3);
        }
      `
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.frustumCulled = false;
    this.planet.add(atmosphere);

    this.planet.rotation.x = 0.2;
    this.planet.rotation.y = Math.PI;
    this.planet.frustumCulled = false;
    this.scene.add(this.planet);
  }

  animate() {
    const elapsedTime = this.clock.getElapsedTime();
    
    // Rotate planet
    this.planet.rotation.y += 0.001;

    // Update shaders
    this.planet.children.forEach(child => {
      if (child.material && child.material.uniforms) {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = elapsedTime;
        }
        if (child.material.uniforms.moonPosition) {
          child.material.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
        }
      }
    });
  }
}