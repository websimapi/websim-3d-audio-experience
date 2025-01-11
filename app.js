import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';

class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.audioManager = new AudioManager(this.sceneManager.camera);
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
    this.sceneManager.render();
  }

  init() {
    this.animate();
  }
}

const app = new App();
app.init();