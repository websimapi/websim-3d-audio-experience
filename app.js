import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';
import { PlanetManager } from './planetManager.js';
import { SunManager } from './sunManager.js';
import { MoonManager } from './moonManager.js';

class App {
  constructor() {
    // Check for WebGL support first
    if (!this.isWebGLAvailable()) {
      document.getElementById('webglError').style.display = 'block';
      document.getElementById('startButton').style.display = 'none';
      document.getElementById('zoomInstructions').style.display = 'none';
      throw new Error('WebGL not supported');
    }

    try {
      this.sceneManager = new SceneManager();
      this.audioManager = new AudioManager(this.sceneManager.camera);
      this.sunManager = new SunManager(this.sceneManager.scene);
      this.moonManager = new MoonManager(this.sceneManager.scene);
      this.planetManager = new PlanetManager(this.sceneManager.scene, this.moonManager);
      this.bindEvents();

      // Force an immediate render to check if planet is visible
      this.sceneManager.render();
      
      // Make canvas visible immediately for debugging
      this.sceneManager.show();
    } catch (error) {
      console.error('Error initializing app:', error);
      document.getElementById('webglError').style.display = 'block';
      document.getElementById('startButton').style.display = 'none';
      document.getElementById('zoomInstructions').style.display = 'none';
    }
  }

  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (error) {
      return false;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.sceneManager.onWindowResize());
    document.getElementById('startButton').addEventListener('click', () => this.startExperience());
  }

  startExperience() {
    this.audioManager.loadAndPlayAudio();
    document.getElementById('startButton').style.display = 'none';
  }

  animate() {
    if (!this.sceneManager) return;
    
    requestAnimationFrame(() => this.animate());
    this.planetManager.animate();
    this.moonManager.animate();
    this.sunManager.animate(this.sceneManager.camera);
    this.sceneManager.render();
  }

  init() {
    if (this.sceneManager) {
      this.animate();
    }
  }
}

try {
  const app = new App();
  app.init();
} catch (error) {
  console.error('Failed to initialize app:', error);
}