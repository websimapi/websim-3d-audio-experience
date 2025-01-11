import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class PlanetManager {
  constructor(scene, moonManager) {
    this.scene = scene;
    this.moonManager = moonManager;
    this.clock = new THREE.Clock();
    this.createPlanet();
  }

  createPlanet() {
    const baseRadius = 300; // Visual scale factor

    // Load Earth textures
    const textureLoader = new THREE.TextureLoader();

    const earthColorMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmosphere.jpg');
    const earthDisplacementMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_displacement.jpg');
    const earthNormalMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal.jpg');
    const earthSpecularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular.jpg');

    // Create Earth geometry
    const geometry = new THREE.SphereGeometry(baseRadius, 256, 256);

    // Create Earth material with accurate UV mapping and physical mesh
    const material = new THREE.MeshPhongMaterial({
      map: earthColorMap,
      displacementMap: earthDisplacementMap,
      displacementScale: 5,
      normalMap: earthNormalMap,
      specularMap: earthSpecularMap,
      specular: new THREE.Color(0x222222),
      shininess: 15
    });

    // Create Earth mesh
    const earthMesh = new THREE.Mesh(geometry, material);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    earthMesh.frustumCulled = false;

    this.planet = earthMesh;
    this.scene.add(this.planet);

    // Add atmosphere
    this.createAtmosphere(baseRadius);
  }

  createAtmosphere(baseRadius) {
    const atmosphereGeometry = new THREE.SphereGeometry(baseRadius * 1.02, 128, 128);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        time: { value: 0 },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 sunDirection;

        void main() {
          float intensity = pow(0.65 - dot(vNormal, sunDirection), 2.0);
          vec3 atmosphereColor = vec3(0.3, 0.5, 1.0);
          gl_FragColor = vec4(atmosphereColor, intensity);
        }
      `
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.frustumCulled = false;
    this.scene.add(atmosphere);
  }

  animate() {
    // Rotate planet slowly to simulate Earth's rotation
    this.planet.rotation.y += 0.0003;

    // Update atmosphere shader if needed
    const atmosphere = this.scene.children.find(obj => obj === this.planet).children[0];
    if (atmosphere && atmosphere.material.uniforms.time) {
      atmosphere.material.uniforms.time.value = this.clock.getElapsedTime();
    }
  }
}