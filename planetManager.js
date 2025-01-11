import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.planet = this.createPlanetLayers();
    this.scene.add(this.planet);
    
    // Earth's self-rotation parameters
    this.rotationSpeed = 0.001; // Adjusted for visualization
    this.rotationAngle = 0;
  }

  createPlanetLayers() {
    const group = new THREE.Group();
    const baseRadius = 6371; // Earth's actual radius in km

    // Core layer (inner core + outer core)
    const coreGeometry = new THREE.SphereGeometry(baseRadius * 0.3, 64, 64);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6633,
      emissive: 0x331111,
      shininess: 50
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Mantle layer
    const mantleGeometry = new THREE.SphereGeometry(baseRadius * 0.5, 64, 64);
    const mantleMaterial = new THREE.MeshPhongMaterial({
      color: 0xff9966,
      transparent: true,
      opacity: 0.7
    });
    const mantle = new THREE.Mesh(mantleGeometry, mantleMaterial);
    group.add(mantle);

    // Crust layer
    const crustGeometry = new THREE.SphereGeometry(baseRadius * 0.8, 64, 64);
    const crustMaterial = new THREE.MeshPhongMaterial({
      color: 0x996633,
      transparent: true,
      opacity: 0.9
    });
    const crust = new THREE.Mesh(crustGeometry, crustMaterial);
    group.add(crust);

    // Land layer with detailed texture
    const landGeometry = new THREE.SphereGeometry(baseRadius * 0.95, 64, 64);
    const landMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0x228833) }
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

        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          float n = noise(vUv * 10.0);
          vec3 color = mix(baseColor, baseColor * 1.2, n);
          float lighting = dot(vNormal, normalize(vec3(1.0)));
          color *= 0.5 + 0.5 * lighting;
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    const land = new THREE.Mesh(landGeometry, landMaterial);
    group.add(land);

    // Ocean layer
    const oceanGeometry = new THREE.SphereGeometry(baseRadius, 64, 64);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        cameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 cameraPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vec3 oceanColor = vec3(0.0, 0.3, 0.6);
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDirection), 3.0);
          vec3 color = mix(oceanColor, vec3(0.8, 0.9, 1.0), fresnel);
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    group.add(ocean);

    // Atmosphere layer
    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.05, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
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
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.2);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphere);

    // Ensure no culling of any planet components
    group.children.forEach(child => {
      child.frustumCulled = false;
    });
    group.frustumCulled = false;

    return group;
  }

  animate() {
    // Update Earth's rotation
    this.rotationAngle += this.rotationSpeed;
    this.planet.rotation.y = this.rotationAngle;

    // Update shaders
    const time = performance.now() * 0.001;
    this.planet.children.forEach(child => {
      if (child.material.uniforms) {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = time;
        }
      }
    });
  }
}