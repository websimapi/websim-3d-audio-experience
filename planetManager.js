import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.planet = this.createPlanet();
    this.scene.add(this.planet);
    this.clock = new THREE.Clock();

    // Adjusted planet position and scale
    this.planet.position.set(0, 0, 0);
    this.planet.scale.set(3, 3, 3); // Made planet even larger
  }

  createPlanet() {
    const geometry = new THREE.SphereGeometry(12, 256, 256); // Increased base size

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
        varying vec3 vViewPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vPosition = position;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
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
        varying vec3 vViewPosition;
        
        // Enhanced noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
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

        float getGravitationalEffect(vec3 pos, vec3 celestialBody) {
          float distance = length(celestialBody - pos);
          return 1.0 / (distance * distance + 0.1);
        }

        vec3 oceanColor(vec3 position, vec3 viewDir, vec3 normal, float waves) {
          float moonEffect = getGravitationalEffect(vWorldPosition, moonPosition) * 2.0;
          float sunEffect = getGravitationalEffect(vWorldPosition, sunPosition);
          
          // Enhanced fresnel effect
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
          fresnel = mix(0.1, 1.0, fresnel);
          
          // Caustics simulation
          float causticPattern = snoise(position.xz * 0.1 + time * 0.05) * 
                                snoise(position.yz * 0.1 + time * 0.07);
          causticPattern = max(0.0, causticPattern);
          
          // Deep water color based on waves and depth
          vec3 waterColor = mix(deepColor, baseColor, waves * 0.5 + 0.5);
          
          // Add sun and moon reflections
          vec3 sunDir = normalize(sunPosition - position);
          vec3 moonDir = normalize(moonPosition - position);
          float sunReflection = pow(max(0.0, dot(reflect(-sunDir, normal), viewDir)), 64.0);
          float moonReflection = pow(max(0.0, dot(reflect(-moonDir, normal), viewDir)), 32.0);
          
          // Combine all effects
          vec3 finalColor = waterColor;
          finalColor += highlightColor * fresnel;
          finalColor += vec3(1.0, 0.95, 0.8) * sunReflection * (1.0 + sunEffect);
          finalColor += vec3(0.8, 0.85, 1.0) * moonReflection * moonEffect;
          finalColor += causticPattern * highlightColor * 0.1;
          
          return finalColor;
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Generate complex wave patterns
          float waves = 0.0;
          vec2 uv = vUv * 20.0;
          float moonEffect = getGravitationalEffect(vWorldPosition, moonPosition);
          float t = time * (1.0 + moonEffect * 0.5);
          
          for(float i = 1.0; i <= 4.0; i++) {
            float scale = pow(2.0, i);
            waves += snoise(uv * scale + t * (0.1 * i)) * (1.0 / scale);
          }
          
          // Calculate wave normal
          vec2 waveOffset = vec2(
            snoise(uv + vec2(0.01, 0.0)) - snoise(uv - vec2(0.01, 0.0)),
            snoise(uv + vec2(0.0, 0.01)) - snoise(uv - vec2(0.0, 0.01))
          ) * (1.0 + moonEffect);
          
          vec3 waveNormal = normalize(vNormal + vec3(waveOffset.x, 0.0, waveOffset.y));
          
          // Calculate foam
          float foamFactor = smoothstep(0.7, 0.9, waves * (1.0 + moonEffect));
          
          // Final color
          vec3 waterColor = oceanColor(vWorldPosition, viewDir, waveNormal, waves);
          vec3 finalColor = mix(waterColor, foamColor, foamFactor * 0.3);
          
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
      transparent: true,
      side: THREE.FrontSide
    });

    const planet = new THREE.Mesh(geometry, oceanMaterial);
    planet.rotation.x = 0.2;
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.rotation.y = Math.PI;

    // Adjusted atmosphere size
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
          vec3 finalColor = atmosphereColor * intensity;
          gl_FragColor = vec4(finalColor, intensity * 0.5);
        }
      `,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere);

    return planet;
  }

  animate() {
    this.planet.rotation.y += 0.001;
    const oceanMaterial = this.planet.material;
    oceanMaterial.uniforms.time.value = this.clock.getElapsedTime();
    oceanMaterial.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
  }
}