import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.planet = this.createPlanet();
    this.scene.add(this.planet);
    this.clock = new THREE.Clock();
  }

  createPlanet() {
    const geometry = new THREE.SphereGeometry(8, 256, 256);
    
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        moonPosition: { value: new THREE.Vector3() },
        sunPosition: { value: new THREE.Vector3(100, 40, -200) },
        baseColor: { value: new THREE.Color(0x006994) },
        highlightColor: { value: new THREE.Color(0x8acdff) },
        deepColor: { value: new THREE.Color(0x001933) },
        foamColor: { value: new THREE.Color(0xffffff) }
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
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
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
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        // Improved noise functions
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
          return 1.0 / (distance * distance);
        }

        float oceanNoise(vec2 uv) {
          float moonEffect = getGravitationalEffect(vWorldPosition, moonPosition) * 2.0;
          float sunEffect = getGravitationalEffect(vWorldPosition, sunPosition) * 1.0;
          
          float scale1 = 8.0 + moonEffect * 4.0;
          float scale2 = 16.0 + moonEffect * 8.0;
          float scale3 = 32.0 + moonEffect * 16.0;
          float scale4 = 64.0 + moonEffect * 32.0;
          
          vec2 timeOffset = vec2(time * 0.1);
          timeOffset += vec2(moonEffect * 0.5, sunEffect * 0.3);
          
          float wave1 = snoise(uv * scale1 + timeOffset);
          float wave2 = snoise(uv * scale2 - timeOffset * 1.4 + wave1);
          float wave3 = snoise(uv * scale3 + timeOffset * 0.8 + wave2);
          float wave4 = snoise(uv * scale4 - timeOffset * 1.2 + wave3);
          
          return wave1 * 0.5 + wave2 * 0.25 + wave3 * 0.125 + wave4 * 0.0625;
        }
        
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          
          float waves = oceanNoise(vUv);
          float moonEffect = getGravitationalEffect(vWorldPosition, moonPosition);
          float sunEffect = getGravitationalEffect(vWorldPosition, sunPosition);
          
          float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 4.0);
          fresnel *= 1.0 + moonEffect * 2.0 + sunEffect;
          
          vec2 waveOffset = vec2(
            oceanNoise(vUv + vec2(0.01, 0.0)) - oceanNoise(vUv - vec2(0.01, 0.0)),
            oceanNoise(vUv + vec2(0.0, 0.01)) - oceanNoise(vUv - vec2(0.0, 0.01))
          );
          
          vec3 adjustedNormal = normalize(vNormal + vec3(waveOffset.x, 0.0, waveOffset.y) * (0.5 + moonEffect));
          
          vec3 lightDir = normalize(sunPosition - vWorldPosition);
          vec3 halfDir = normalize(lightDir + viewDirection);
          float specular = pow(max(dot(adjustedNormal, halfDir), 0.0), 64.0);
          
          float tidalHeight = (moonEffect + sunEffect) * 0.5;
          float foamEdge = smoothstep(0.4 - tidalHeight, 0.5 + tidalHeight, waves);
          float foamTip = smoothstep(0.7 - tidalHeight, 0.8 + tidalHeight, waves);
          
          vec3 waterColor = mix(deepColor, baseColor, waves * 0.5 + 0.5 + tidalHeight);
          waterColor = mix(waterColor, highlightColor, fresnel * 0.8);
          waterColor += highlightColor * specular * (0.6 + moonEffect + sunEffect);
          
          waterColor = mix(waterColor, foamColor, foamEdge * 0.3);
          waterColor = mix(waterColor, foamColor, foamTip * 0.2);
          
          gl_FragColor = vec4(waterColor, 1.0);
        }
      `,
      side: THREE.FrontSide
    });

    const planet = new THREE.Mesh(geometry, oceanMaterial);
    planet.rotation.x = 0.2;
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.rotation.y = Math.PI;
    
    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(8.4, 128, 128);
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