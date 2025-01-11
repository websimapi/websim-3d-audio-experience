import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.createPlanetLayers();
    this.clock = new THREE.Clock();
  }

  createPlanetLayers() {
    // Earth's actual radius is 6,371 km
    // Using scale factor while maintaining relative proportions
    const baseRadius = 300; // Increased for better visibility at scale

    // Update core sizes to match actual proportions
    const innerCoreRadius = baseRadius * 0.192; // 1,220 km
    const outerCoreRadius = baseRadius * 0.546; // 3,480 km
    const mantleRadius = baseRadius * 0.995; // 6,340 km
    const crustRadius = baseRadius; // 6,371 km

    // Inner Core 
    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(innerCoreRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xff3300,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0xff4400,
        emissiveIntensity: 0.2
      })
    );

    // Outer Core 
    const outerCore = new THREE.Mesh(
      new THREE.SphereGeometry(outerCoreRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xff6600,
        metalness: 0.6,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9
      })
    );

    // Mantle 
    const mantle = new THREE.Mesh(
      new THREE.SphereGeometry(mantleRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.2,
        roughness: 0.8,
        transparent: true,
        opacity: 0.9
      })
    );

    // Crust 
    const crust = new THREE.Mesh(
      new THREE.SphereGeometry(crustRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x696969,
        metalness: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity: 0.95
      })
    );

    // Update the ocean shader for a more primordial, mystical appearance
    const oceanGeometry = new THREE.SphereGeometry(baseRadius * 1.02, 256, 256);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        moonPosition: { value: new THREE.Vector3() },
        sunPosition: { value: new THREE.Vector3(100, 40, -200) },
        baseColor: { value: new THREE.Color(0x001933) }, // Darker base color
        highlightColor: { value: new THREE.Color(0x3366ff) }, // Divine light color
        deepColor: { value: new THREE.Color(0x000066) }, // Deeper abyss color
        foamColor: { value: new THREE.Color(0x4477ff) }, // Ethereal foam color
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
        
        // Improved noise function for more chaotic water
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float voronoi(vec2 x) {
          vec2 p = floor(x);
          vec2 f = fract(x);
          float min_dist = 1.0;
          
          for(int i = -1; i <= 1; i++) {
            for(int j = -1; j <= 1; j++) {
              vec2 b = vec2(float(j), float(i));
              vec2 r = b - f + noise(p + b);
              float d = dot(r, r);
              min_dist = min(min_dist, d);
            }
          }
          
          return sqrt(min_dist);
        }
        
        // Create swirling effect for the "Spirit hovering over the waters"
        float spiritEffect(vec2 uv) {
          float t = time * 0.2;
          vec2 center = vec2(0.5 + sin(t) * 0.1, 0.5 + cos(t) * 0.1);
          float dist = length(uv - center);
          float angle = atan(uv.y - center.y, uv.x - center.x);
          float spiral = sin(dist * 20.0 - time * 2.0 + angle * 2.0);
          return smoothstep(0.0, 1.0, spiral * (1.0 - dist * 2.0));
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          
          // Create deep, chaotic waters
          vec2 uv = vUv * 10.0;
          float chaos = voronoi(uv + time * 0.1) * 0.5;
          chaos += voronoi(uv * 2.0 - time * 0.15) * 0.25;
          chaos += voronoi(uv * 4.0 + time * 0.2) * 0.125;
          
          // Add divine illumination effect
          float spirit = spiritEffect(vUv);
          
          // Create the dark void effect
          vec3 waterColor = mix(deepColor, baseColor, chaos);
          waterColor = mix(waterColor, highlightColor, spirit * 0.3);
          
          // Add mysterious glow from the deep
          float depthGlow = pow(chaos, 2.0) * (1.0 + sin(time * 0.5) * 0.2);
          waterColor += deepColor * depthGlow * 0.3;
          
          // Divine light reflection
          vec3 sunDir = normalize(sunPosition - vWorldPosition);
          float sunReflection = pow(max(0.0, dot(reflect(-sunDir, vNormal), viewDir)), 32.0);
          
          // Combine all effects
          vec3 finalColor = waterColor;
          finalColor += highlightColor * fresnel * 0.7;
          finalColor += vec3(0.3, 0.4, 1.0) * sunReflection * 0.5;
          finalColor += foamColor * spirit * 0.15;
          
          // Add slight transparency to suggest depth
          float alpha = mix(0.95, 1.0, fresnel);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide
    });

    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.frustumCulled = false;

    // Set up shadows for all meshes
    const meshes = [innerCore, outerCore, mantle, crust];
    meshes.forEach(mesh => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    // Create planet container and add all layers
    this.planet = new THREE.Group();
    this.planet.add(innerCore);
    this.planet.add(outerCore);
    this.planet.add(mantle);
    this.planet.add(crust);
    this.planet.add(ocean);

    // Add atmosphere with adjusted size
    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.05, 128, 128);
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

    // Set initial rotation and position
    this.planet.rotation.x = 0.2;
    this.planet.rotation.y = Math.PI;

    // Ensure no culling for the planet group
    this.planet.frustumCulled = false;
    this.planet.children.forEach(child => {
      child.frustumCulled = false;
    });

    this.scene.add(this.planet);
  }

  animate() {
    this.planet.rotation.y += 0.001;
    const oceanMaterial = this.planet.children[4].material; // Ocean is the 5th child
    oceanMaterial.uniforms.time.value = this.clock.getElapsedTime();
    oceanMaterial.uniforms.moonPosition.value.copy(this.moonManager.getPosition());
  }
}