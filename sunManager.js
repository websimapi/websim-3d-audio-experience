import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class SunManager {
  constructor(scene) {
    this.scene = scene;
    this.sun = this.createSun();
    this.scene.add(this.sun);
    this.setupSunLight();
    
    // Ensure the sun and its glow are never culled
    this.sun.frustumCulled = false;
    this.sun.traverse(child => {
      child.frustumCulled = false;
    });
  }

  createSun() {
    // Sun's radius is about 696,340 km, Earth's is 6,371 km
    // Using scale factor to maintain relative proportions while keeping visualizable distances
    const geometry = new THREE.SphereGeometry(500, 128, 128); // Increased resolution and size
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

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(123.45, 67.89))) * 12345.67);
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

        void main() {
          // Multiple layers of noise for solar surface detail
          float n = 0.0;
          n += noise((vUv + time * 0.05) * 10.0) * 0.5;
          n += noise((vUv - time * 0.1) * 20.0) * 0.25;
          n += noise((vUv + time * 0.15) * 40.0) * 0.125;
          
          // Solar flare effect
          float flare = pow(noise((vUv + time * 0.2) * 5.0), 3.0) * 2.0;
          
          // Combine base colors with noise
          vec3 color = mix(surfaceColor, sunColor, n);
          
          // Add bright spots and flares
          color += sunColor * flare;
          
          // Add limb darkening effect
          float limb = pow(max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.5);
          color *= mix(0.7, 1.0, limb);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    const sun = new THREE.Mesh(geometry, material);
    sun.frustumCulled = false;
    
    // Enhanced glow effect
    const glowGeometry = new THREE.SphereGeometry(510, 128, 128);
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
          vec3 glow = vec3(1.0, 0.7, 0.3) * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.frustumCulled = false;
    sun.add(glowMesh);

    // Position sun at a more realistic scaled distance
    sun.position.set(15000, 200, -20000);
    
    return sun;
  }

  setupSunLight() {
    // Main directional light for sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.copy(this.sun.position);
    sunLight.castShadow = true;
    
    // Increase shadow camera frustum to handle larger distances
    const d = 50000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.far = 100000;
    
    this.scene.add(sunLight);

    // Add point light with increased range
    const pointLight = new THREE.PointLight(0xffdd44, 5, 100000);
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