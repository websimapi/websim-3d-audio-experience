import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
  constructor(scene) {
    this.scene = scene;
    this.sun = this.createSun();
    this.scene.add(this.sun);
    this.setupSunLight();
  }

  createSun() {
    // Sun's actual radius is about 696,340 km
    const sunRadius = 696340 * 0.1; // Scale factor to match Earth scale
    const geometry = new THREE.SphereGeometry(sunRadius, 128, 128);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunColor: { value: new THREE.Color(0xffdd44) },
        surfaceColor: { value: new THREE.Color(0xff8800) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 sunColor;
        uniform vec3 surfaceColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          float plasma = 0.0;
          for(float i = 1.0; i < 6.0; i++) {
            vec2 coord = vUv * (10.0 * i);
            coord += vec2(time * (0.1 * i), time * (0.2 * i));
            plasma += noise(coord) * (1.0 / i);
          }
          
          vec3 color = mix(surfaceColor, sunColor, plasma);
          
          // Add bright spots
          float spots = pow(noise(vUv * 20.0 + time), 3.0) * 2.0;
          color += sunColor * spots;
          
          // Add limb darkening
          float limb = pow(max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.5);
          color = mix(color * 0.8, color, limb);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    const sun = new THREE.Mesh(geometry, material);
    sun.frustumCulled = false;

    // Position sun at realistic scaled distance from Earth
    const astronomicalUnit = 149597870.7 * 0.1; // 1 AU in km, scaled
    sun.position.set(astronomicalUnit, 0, -astronomicalUnit);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(sunRadius * 1.2, 128, 128);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffdd44) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.frustumCulled = false;
    sun.add(glow);

    return sun;
  }

  setupSunLight() {
    // Intense directional light from sun position
    const sunLight = new THREE.DirectionalLight(0xffffff, 5);
    sunLight.position.copy(this.sun.position);
    sunLight.frustumCulled = false;
    
    // Improve shadow quality
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000000;
    sunLight.shadow.bias = -0.0001;
    
    const d = 10000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    
    this.scene.add(sunLight);

    // Add ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
  }

  animate(camera) {
    if (this.sun) {
      // Update sun shader time
      this.sun.material.uniforms.time.value = performance.now() * 0.001;
      
      // Update glow effect
      const glow = this.sun.children[0];
      if (glow) {
        glow.material.uniforms.time.value = performance.now() * 0.001;
      }
    }
  }
}