import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
  }

  createPlanetLayers() {
    // Earth's actual radius is 6,371 km
    // Using scale factor while maintaining relative proportions
    const baseRadius = 300; // For visibility at scale

    // Geographic data uniforms
    const terrainUniforms = {
      time: { value: 0 },
      elevation: { value: 1.0 },
      oceanLevel: { value: 0.65 }
    };

    // Create detailed terrain material with heightmap
    const terrainMaterial = new THREE.ShaderMaterial({
      uniforms: terrainUniforms,
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vElevation;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for(int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          
          // Generate terrain displacement
          float elevation = fbm(vUv * 10.0);
          elevation = pow(elevation, 1.5); // Enhance peaks
          vElevation = elevation;
          
          // Apply displacement along normal
          vec3 newPosition = position + normal * elevation * 10.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vElevation;
        uniform float oceanLevel;
        
        void main() {
          // Base terrain colors
          vec3 deepColor = vec3(0.4, 0.3, 0.2);
          vec3 highColor = vec3(0.8, 0.7, 0.6);
          vec3 snowColor = vec3(0.95, 0.95, 0.95);
          
          // Terrain coloring based on elevation
          vec3 terrainColor = mix(deepColor, highColor, vElevation);
          terrainColor = mix(terrainColor, snowColor, smoothstep(0.8, 0.9, vElevation));
          
          // Apply basic lighting
          float light = max(0.0, dot(vNormal, normalize(vec3(1.0))));
          terrainColor *= mix(0.5, 1.0, light);
          
          gl_FragColor = vec4(terrainColor, 1.0);
        }
      `,
      wireframe: false
    });

    // Create the planet's crust with terrain
    const terrainGeometry = new THREE.SphereGeometry(baseRadius, 256, 256);
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);

    // Create realistic ocean material
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        oceanColor: { value: new THREE.Color(0x006994) },
        deepColor: { value: new THREE.Color(0x001933) },
        foamColor: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vDepth;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vDepth = -worldPos.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 oceanColor;
        uniform vec3 deepColor;
        uniform vec3 foamColor;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vDepth;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Ocean waves
          float waves = 0.0;
          vec2 uv = vUv * 20.0 + time * 0.1;
          
          for(float i = 1.0; i < 5.0; i++) {
            waves += noise(uv * i) / i;
          }
          
          // Mix deep and surface colors based on depth and waves
          vec3 color = mix(deepColor, oceanColor, waves);
          
          // Add foam at wave peaks
          color = mix(color, foamColor, smoothstep(0.8, 1.0, waves) * 0.2);
          
          // Basic fresnel effect
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          color = mix(color, vec3(1.0), fresnel * 0.3);
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true
    });

    // Create ocean mesh slightly larger than terrain
    const oceanGeometry = new THREE.SphereGeometry(baseRadius * 1.01, 256, 256);
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);

    // Create atmosphere
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float atmosphere = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 4.0);
          vec3 atmosphereColor = mix(vec3(0.1, 0.3, 0.6), vec3(0.4, 0.6, 0.8), atmosphere);
          gl_FragColor = vec4(atmosphereColor, atmosphere * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.1, 128, 128);
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    // Create planet container and add all components
    this.planet = new THREE.Group();
    this.planet.add(terrain);
    this.planet.add(ocean);
    this.planet.add(atmosphere);

    // Ensure no culling
    this.planet.frustumCulled = false;
    this.planet.children.forEach(child => {
      child.frustumCulled = false;
    });

    this.scene.add(this.planet);
  }

  animate() {
    const time = performance.now() * 0.001;
    
    // Update all shader materials
    this.planet.children.forEach(child => {
      if (child.material && child.material.uniforms) {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = time;
        }
        if (child.material.uniforms.moonPosition) {
          child.material.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
        }
      }
    });
    
    // Rotate planet
    this.planet.rotation.y += 0.001;
  }
}