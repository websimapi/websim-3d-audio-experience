import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
  constructor(scene) {
    this.scene = scene;
    this.sun = this.createSun();
    this.scene.add(this.sun);
    this.setupSunLight();
    
    // Position sun at a more realistic scaled distance (roughly 150 million km scale factor)
    this.sun.position.set(1500, 200, -2000);

    // Ensure the sun is always rendered by setting renderOrder
    this.sun.renderOrder = 1000;
    this.sun.children[0].renderOrder = 999; // For the glow effect
  }

  createSun() {
    // Sun's radius is about 696,340 km, Earth's is 6,371 km
    // Using scale factor to keep it visually interesting while maintaining relative size
    const geometry = new THREE.SphereGeometry(180, 64, 64); 
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunColor: { value: new THREE.Color(0xffdd44) },
        surfaceColor: { value: new THREE.Color(0xff8800) }
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
        uniform vec3 surfaceColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        // Improved noise function for sun surface
        float noise(vec2 p) {
          return sin(p.x * 10.0 + time) * cos(p.y * 10.0 + time) * 0.5 + 0.5;
        }

        void main() {
          float n = noise(vUv + time * 0.1);
          n += noise((vUv + vec2(0.4)) * 2.0 + time * 0.15) * 0.5;
          n += noise((vUv + vec2(0.8)) * 4.0 + time * 0.2) * 0.25;

          vec3 color = mix(surfaceColor, sunColor, n);
          
          // Add emissive glow
          color += sunColor * 0.5;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true
    });

    const sun = new THREE.Mesh(geometry, material);
    
    // Enhanced glow effect
    const glowGeometry = new THREE.SphereGeometry(185, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        viewVector: { value: new THREE.Vector3() },
        time: { value: 0 }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormalize = normalize(viewVector);
          intensity = pow(1.0 - abs(dot(vNormal, vNormalize)), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying float intensity;
        void main() {
          vec3 glow = vec3(1.0, 0.8, 0.3) * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glowMesh);

    return sun;
  }

  setupSunLight() {
    // Main directional light for sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.copy(this.sun.position);
    sunLight.castShadow = true;
    
    // Improve shadow quality
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 5000;
    sunLight.shadow.bias = -0.0001;
    
    // Increase shadow camera frustum
    const d = 1000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    
    this.scene.add(sunLight);

    // Add point light for volumetric lighting effects
    const pointLight = new THREE.PointLight(0xffdd44, 5, 3000);
    pointLight.position.copy(this.sun.position);
    this.scene.add(pointLight);

    // Add secondary fill light
    const fillLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    this.scene.add(fillLight);
  }

  animate(camera) {
    const glowMesh = this.sun.children[0];
    glowMesh.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, this.sun.position);
    glowMesh.material.uniforms.time.value = performance.now() * 0.001;
    this.sun.material.uniforms.time.value = performance.now() * 0.001;
  }
}