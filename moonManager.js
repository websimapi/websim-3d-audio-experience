import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class MoonManager {
  constructor(scene) {
    this.scene = scene;
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    
    // Moon's orbital parameters
    this.orbitRadius = 384400 * 0.5; // Adjusted scale for better visibility while maintaining proportions
    this.orbitSpeed = 0.00001; // Adjusted for visualization
    this.angle = 0;
    
    // Moon's rotation parameters
    this.rotationSpeed = 0.000001;
    this.rotationAngle = 0;
  }

  createMoon() {
    const moonGeometry = new THREE.SphereGeometry(1737, 64, 64); // Moon's actual radius in km
    
    // Create a more realistic moon material with custom shading
    const moonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0xaaaaaa) }
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
        uniform float time;
        uniform vec3 baseColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          // Create crater-like texture
          float n = noise(vUv * 20.0) * 0.5;
          n += noise(vUv * 40.0) * 0.25;
          n += noise(vUv * 80.0) * 0.125;

          // Add some variation to the base color
          vec3 color = baseColor * (0.8 + n * 0.4);

          // Add limb darkening
          float limb = pow(max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.5);
          color *= mix(0.5, 1.0, limb);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    moon.frustumCulled = false; // Prevent moon culling

    return moon;
  }

  getPosition() {
    return this.moon.position;
  }

  animate() {
    // Update orbital position
    this.angle += this.orbitSpeed;
    const x = Math.cos(this.angle) * this.orbitRadius;
    const z = Math.sin(this.angle) * this.orbitRadius;
    this.moon.position.set(x, 0, z);

    // Update moon's rotation
    this.rotationAngle += this.rotationSpeed;
    this.moon.rotation.y = this.rotationAngle;

    // Update moon shader
    if (this.moon.material.uniforms) {
      this.moon.material.uniforms.time.value = performance.now() * 0.001;
    }
  }
}