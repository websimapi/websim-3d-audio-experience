import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    // Moon's orbit is about 384,400 km from Earth
    // Scaled down but maintaining relative proportions
    this.orbitRadius = 200;
    this.orbitSpeed = 0.0001;
    this.orbitAngle = 0;
  }

  createMoon() {
    // Moon's radius is about 1,737 km (Earth's is 6,371 km)
    // Maintain relative size proportion
    const moonRadius = 8.2; // Scaled relative to Earth's 30 unit radius
    const geometry = new THREE.SphereGeometry(moonRadius, 64, 64);

    // Create a more realistic moon texture using procedural noise
    const moonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0xCCCCCC) },
        craterColor: { value: new THREE.Color(0x999999) }
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
        uniform vec3 baseColor;
        uniform vec3 craterColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        // Improved noise function for better crater distribution
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = sin(i.x + i.y * 43.0) * 43758.5453123;
          return mix(mix(sin(a), sin(a + 1.0), f.x),
                    mix(sin(a + 43.0), sin(a + 44.0), f.x), f.y);
        }

        void main() {
          // Create multiple layers of noise for crater detail
          float n = 0.0;
          n += noise(vUv * 50.0) * 0.5;
          n += noise(vUv * 100.0) * 0.25;
          n += noise(vUv * 200.0) * 0.125;
          
          // Create crater-like features
          float crater = smoothstep(0.4, 0.5, n);
          
          // Add surface detail variation
          float detail = noise(vUv * 400.0) * 0.1;
          
          // Combine colors for final appearance
          vec3 color = mix(craterColor, baseColor, crater + detail);
          
          // Add lighting based on normal
          float light = dot(vNormal, normalize(vec3(1.0)));
          color *= 0.5 + 0.5 * light;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const moon = new THREE.Mesh(geometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;

    return moon;
  }

  animate() {
    // Update moon's orbital position
    this.orbitAngle += this.orbitSpeed;
    const x = Math.cos(this.orbitAngle) * this.orbitRadius;
    const z = Math.sin(this.orbitAngle) * this.orbitRadius;
    this.moon.position.set(x, 0, z);
  }

  getPosition() {
    return this.moon.position;
  }
}