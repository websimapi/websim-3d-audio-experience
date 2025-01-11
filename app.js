import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { SceneManager } from './sceneManager.js';
import { AudioManager } from './audioManager.js';
import { PlanetManager } from './planetManager.js';
import { SunManager } from './sunManager.js';
import { MoonManager } from './moonManager.js';

class App {
  constructor() {
    if (!this.isWebGLAvailable()) {
      document.getElementById('webglError').style.display = 'block';
      document.getElementById('startButton').style.display = 'none';
      document.getElementById('zoomInstructions').style.display = 'none';
      throw new Error('WebGL not supported');
    }

    try {
      this.setup();
    } catch (error) {
      console.error('Error initializing app:', error);
      document.getElementById('webglError').style.display = 'block';
      document.getElementById('startButton').style.display = 'none';
      document.getElementById('zoomInstructions').style.display = 'none';
    }
  }

  setup() {
    this.sceneManager = new SceneManager();
    
    // Initialize managers in the correct order
    this.moonManager = new MoonManager(this.sceneManager.scene);
    this.sunManager = new SunManager(this.sceneManager.scene);
    this.planetManager = new PlanetManager(this.sceneManager.scene, this.moonManager);
    this.audioManager = new AudioManager(this.sceneManager.camera);
    
    this.bindEvents();
    this.sceneManager.show();
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
    if (!this.sceneManager || !this.planetManager || !this.moonManager || !this.sunManager) {
      console.warn('Required components not initialized');
      return;
    }

    requestAnimationFrame(() => this.animate());

    try {
      this.planetManager.animate();
      this.moonManager.animate();
      this.sunManager.animate(this.sceneManager.camera);
      this.sceneManager.render();
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  init() {
    if (this.sceneManager) {
      this.animate();
    }
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new App();
    app.init();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});