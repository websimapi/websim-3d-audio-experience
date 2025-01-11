import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';
import { PlanetManager } from './planetManager.js';
import { SunManager } from './sunManager.js';
import { MoonManager } from './moonManager.js';

class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.audioManager = new AudioManager(this.sceneManager.camera);
    this.sunManager = new SunManager(this.sceneManager.scene);
    this.moonManager = new MoonManager(this.sceneManager.scene);
    this.planetManager = new PlanetManager(this.sceneManager.scene, this.moonManager);
    this.bindEvents();
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

  animate() {
    requestAnimationFrame(() => this.animate());
    this.planetManager.animate();
    this.moonManager.animate();
    this.sunManager.animate(this.sceneManager.camera);
    this.sceneManager.render();
  }

  init() {
    this.animate();
  }
}

const app = new App();
app.init();