import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    
    // Update orbital parameters to match reality (scaled)
    this.orbitRadius = 384400 * 0.1; // Average Earth-Moon distance: 384,400 km
    this.orbitSpeed = 0.00005; // Adjusted for smoother animation
    this.orbitAngle = 0;
    
    // Prevent moon culling
    this.moon.frustumCulled = false;
  }

  createMoon() {
    // Moon's actual radius is 1,737 km
    const moonRadius = 81.7; // Scaled relative to Earth's new size
    const geometry = new THREE.SphereGeometry(moonRadius, 64, 64);
    
    // Create a more realistic moon material with crater-like texture
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform float time;

        float noise(vec2 p) {
          return fract(sin(dot(p.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float craterNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          // Base color (off-white/grey)
          vec3 baseColor = vec3(0.95, 0.95, 0.95);
          
          // Add crater-like texture
          float craters = 0.0;
          craters += craterNoise(vUv * 10.0) * 0.5;
          craters += craterNoise(vUv * 20.0) * 0.25;
          craters += craterNoise(vUv * 40.0) * 0.125;
          
          // Darken areas based on crater noise
          vec3 finalColor = mix(baseColor, baseColor * 0.7, craters);
          
          // Add some subtle shadows based on normals
          float light = max(0.0, dot(vNormal, normalize(vec3(1.0))));
          finalColor *= mix(0.7, 1.0, light);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const moon = new THREE.Mesh(geometry, material);
    moon.castShadow = true;
    moon.receiveShadow = true;
    moon.frustumCulled = false;
    return moon;
  }

  getPosition() {
    return this.moon.position;
  }

  animate() {
    this.orbitAngle += this.orbitSpeed;
    
    // Update moon position
    this.moon.position.x = Math.cos(this.orbitAngle) * this.orbitRadius;
    this.moon.position.z = Math.sin(this.orbitAngle) * this.orbitRadius;
    this.moon.position.y = Math.sin(this.orbitAngle * 0.5) * 100; // Add some vertical movement
    
    // Rotate the moon
    this.moon.rotation.y += 0.001;
    
    // Update shader time uniform
    if (this.moon.material.uniforms) {
      this.moon.material.uniforms.time.value = performance.now() * 0.001;
    }
  }
}