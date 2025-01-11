import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
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

  createSun() {
    const sunGeometry = new THREE.SphereGeometry(100, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunColor: { value: new THREE.Color(0xffdd44) },
        glowColor: { value: new THREE.Color(0xff5511) }
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
        uniform vec3 sunColor;
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          float noise = sin(vUv.x * 20.0 + time) * cos(vUv.y * 20.0 + time) * 0.5 + 0.5;
          vec3 finalColor = mix(sunColor, glowColor, noise);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100000, 40000, -200000); // Position far away
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(105, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0xff7700) }
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
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
    
    return sun;
  }

  setupSunLight() {
    const sunLight = new THREE.PointLight(0xfffbf0, 2, 1000000);
    sunLight.position.copy(this.sun.position);
    this.scene.add(sunLight);
  }

  getPosition() {
    return this.sun.position;
  }

  animate(camera) {
    // Update sun shader
    if (this.sun.material.uniforms) {
      this.sun.material.uniforms.time.value += 0.01;
    }
    
    // Update glow shader
    if (this.sun.children[0]?.material.uniforms) {
      this.sun.children[0].material.uniforms.time.value += 0.01;
    }
  }
}