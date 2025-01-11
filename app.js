import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';
import { PlanetManager } from './planetManager.js';

class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.audioManager = new AudioManager(this.sceneManager.camera);
    this.planetManager = new PlanetManager(this.sceneManager.scene);
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.sceneManager.onWindowResize());
    document.getElementById('startButton').addEventListener('click', async () => {
      try {
        await this.startExperience();
      } catch (error) {
        console.error('Error starting experience:', error);
      }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.audioManager.dispose();
    });
  }

  async startExperience() {
    await this.audioManager.loadAndPlayAudio();
    this.sceneManager.show();
    document.getElementById('startButton').style.display = 'none';
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.planetManager.animate();
    this.sceneManager.render();
  }

  init() {
    this.animate();
  }
}

const app = new App();
app.init();