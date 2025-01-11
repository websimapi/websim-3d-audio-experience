import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
    this.clock = new THREE.Clock();
  }

  createPlanetLayers() {
    // Inner Core - red-orange metal
    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(8, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xff3300,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0xff4400,
        emissiveIntensity: 0.2
      })
    );

    // Outer Core - lighter orange, liquid metal
    const outerCore = new THREE.Mesh(
      new THREE.SphereGeometry(9, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xff6600,
        metalness: 0.6,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9
      })
    );

    // Mantle - rocky brown
    const mantle = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.2,
        roughness: 0.8,
        transparent: true,
        opacity: 0.9
      })
    );

    // Crust - darker rocky surface
    const crust = new THREE.Mesh(
      new THREE.SphereGeometry(11, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x696969,
        metalness: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity: 0.95
      })
    );

    // Ocean layer
    const oceanGeometry = new THREE.SphereGeometry(12, 256, 256);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        moonPosition: { value: new THREE.Vector3() },
        sunPosition: { value: new THREE.Vector3(100, 40, -200) },
        baseColor: { value: new THREE.Color(0x006994) },
        highlightColor: { value: new THREE.Color(0x8acdff) },
        deepColor: { value: new THREE.Color(0x001933) },
        foamColor: { value: new THREE.Color(0xffffff) },
        cameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vPosition = position;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 moonPosition;
        uniform vec3 sunPosition;
        uniform vec3 baseColor;
        uniform vec3 highlightColor;
        uniform vec3 deepColor;
        uniform vec3 foamColor;
        uniform vec3 cameraPosition;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float getWaves(vec2 uv) {
          float waves = 0.0;
          waves += snoise(uv * 2.0 + time * 0.5) * 0.5;
          waves += snoise(uv * 4.0 + time * 0.8) * 0.25;
          waves += snoise(uv * 8.0 + time * 1.2) * 0.125;
          return waves;
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          
          vec2 uv = vUv * 20.0;
          float waves = getWaves(uv);
          
          // Tidal effect from moon
          float moonDist = length(moonPosition - vWorldPosition);
          float tidalEffect = 1.0 / (moonDist * moonDist * 0.0001);
          waves *= (1.0 + tidalEffect * 0.2);
          
          // Depth color
          vec3 waterColor = mix(deepColor, baseColor, waves * 0.5 + 0.5);
          
          // Lighting and reflections
          vec3 sunDir = normalize(sunPosition - vWorldPosition);
          float sunReflection = pow(max(0.0, dot(reflect(-sunDir, vNormal), viewDir)), 32.0);
          
          // Final color composition
          vec3 finalColor = waterColor;
          finalColor += highlightColor * fresnel * 0.5;
          finalColor += vec3(1.0, 0.95, 0.8) * sunReflection;
          finalColor += foamColor * smoothstep(0.7, 1.0, waves) * 0.2;
          
          gl_FragColor = vec4(finalColor, 0.85);
        }
      `,
      transparent: true,
      side: THREE.FrontSide
    });

    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);

    // Create planet container
    this.planet = new THREE.Group();
    this.planet.add(innerCore);
    this.planet.add(outerCore);
    this.planet.add(mantle);
    this.planet.add(crust);
    this.planet.add(ocean);

    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(12.4, 128, 128);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
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
        void main() {
          float intensity = pow(0.7 - dot(normalize(vPosition), vNormal), 2.0);
          vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.3);
        }
      `
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.planet.add(atmosphere);

    // Set initial rotation and scale
    this.planet.rotation.x = 0.2;
    this.planet.rotation.y = Math.PI;
    this.planet.scale.set(3, 3, 3);

    this.scene.add(this.planet);
  }

  animate() {
    this.planet.rotation.y += 0.001;
    const oceanMaterial = this.planet.children[4].material; // Ocean is the 5th child
    oceanMaterial.uniforms.time.value = this.clock.getElapsedTime();
    oceanMaterial.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
  }
}