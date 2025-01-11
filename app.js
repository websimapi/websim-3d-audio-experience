import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';
import { SolarSystemManager } from './solarSystemManager.js';
import { PhysicsManager } from './physicsManager.js';

class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.audioManager = new AudioManager(this.sceneManager.camera);
    this.physicsManager = new PhysicsManager();
    this.solarSystemManager = new SolarSystemManager(this.sceneManager.scene, this.physicsManager);
    this.bindEvents();
    this.lastTime = 0;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.sceneManager.onWindowResize());
    document.getElementById('startButton').addEventListener('click', () => this.startExperience());
  }

  startExperience() {
    this.audioManager.loadAndPlayAudio();
    this.sceneManager.show();
    document.getElementById('startButton').style.display = 'none';
  }

  animate(currentTime) {
    requestAnimationFrame((time) => this.animate(time));
    
    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.physicsManager.update(deltaTime);
    this.solarSystemManager.animate(deltaTime);
    this.sceneManager.render();
  }

  init() {
    this.animate(0);
  }
}

const app = new App();
app.init();