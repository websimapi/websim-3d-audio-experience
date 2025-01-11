import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene) {
    // Real values (in km):
    // Earth diameter: 12,742
    // Earth-Sun distance: 149,600,000
    // We'll use a scale factor to make this workable in Three.js
    // 1 unit = 100,000 km
    this.SCALE_FACTOR = 1/100000;
    this.EARTH_RADIUS = (12742/2) * this.SCALE_FACTOR; // About 0.064 units
    this.EARTH_SUN_DISTANCE = 149600000 * this.SCALE_FACTOR; // About 1496 units
    this.EARTH_ROTATION_SPEED = 0.001; // One rotation per day (scaled for animation)
    this.EARTH_REVOLUTION_SPEED = 0.00001; // One revolution per year (scaled for animation)
    
    this.scene = scene;
    this.planet = this.createPlanet();
    this.planetOrbit = new THREE.Group();
    this.planetOrbit.add(this.planet);
    this.scene.add(this.planetOrbit);
    this.clock = new THREE.Clock();

    // Position Earth at correct distance from Sun
    this.planet.position.x = this.EARTH_SUN_DISTANCE;
  }

  createPlanet() {
    const geometry = new THREE.SphereGeometry(this.EARTH_RADIUS, 128, 128);
    
    // Create dynamic ocean material using custom shader
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0x2233ff) },
        highlightColor: { value: new THREE.Color(0x4477ff) },
        deepColor: { value: new THREE.Color(0x001133) }
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
        uniform vec3 baseColor;
        uniform vec3 highlightColor;
        uniform vec3 deepColor;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        // Simplex 2D noise
        vec3 permute(vec3 x) { 
          return mod(((x*34.0)+1.0)*x, 289.0); 
        }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          // Create dynamic wave pattern
          float waves = snoise(vUv * 10.0 + time * 0.2) * 0.5 +
                       snoise(vUv * 20.0 - time * 0.1) * 0.25 +
                       snoise(vUv * 40.0 + time * 0.05) * 0.125;
          
          // Fresnel effect
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
          
          // Combine colors based on waves and fresnel
          vec3 color = mix(deepColor, baseColor, waves * 0.5 + 0.5);
          color = mix(color, highlightColor, fresnel * 0.7);
          
          // Add specular highlights
          float specular = pow(max(dot(normalize(vec3(1.0)), reflect(-viewDirection, vNormal)), 0.0), 32.0);
          color += highlightColor * specular * 0.5;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.FrontSide
    });

    const planet = new THREE.Mesh(geometry, oceanMaterial);
    planet.rotation.x = 0.2; // Earth's axial tilt is about 23.5 degrees
    planet.castShadow = true;
    planet.receiveShadow = true;
    
    // Add atmosphere effect
    const atmosphereGeometry = new THREE.SphereGeometry(this.EARTH_RADIUS * 1.05, 128, 128);
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
    // Rotate Earth on its axis
    this.planet.rotation.y += this.EARTH_ROTATION_SPEED;
    
    // Revolve Earth around the Sun
    this.planetOrbit.rotation.y += this.EARTH_REVOLUTION_SPEED;
    
    // Update ocean shader time uniform
    const oceanMaterial = this.planet.material;
    oceanMaterial.uniforms.time.value = this.clock.getElapsedTime();
  }
}