import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class AudioManager {
  constructor(camera) {
    // Create audio context only after user interaction
    this.audioContext = null;
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.sound = new THREE.Audio(this.listener);
    this.audioLoader = new THREE.AudioLoader();
    this.volume = 0;
    this.targetVolume = 1;
    this.fadeSpeed = 0.005;
    this.buffer = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Create audio context with modern factory method
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Handle suspended state
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.isInitialized = true;
  }

  async loadAndPlayAudio() {
    try {
      // Initialize audio context on user interaction
      await this.initialize();

      // Load audio only if not already loaded
      if (!this.buffer) {
        this.buffer = await new Promise((resolve, reject) => {
          this.audioLoader.load('/lostbanger.wav', 
            (buffer) => resolve(buffer),
            null,
            (error) => reject(error)
          );
        });
      }

      // Set up and play the sound
      this.sound.setBuffer(this.buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0);
      
      // Check if context is running
      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }
      
      this.sound.play();
      this.startFade();
    } catch (error) {
      console.error('Error loading or playing audio:', error);
    }
  }

  startFade() {
    const fadeInterval = setInterval(() => {
      if (this.volume < this.targetVolume) {
        this.volume += this.fadeSpeed;
        this.sound.setVolume(Math.min(this.volume, this.targetVolume));
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  stop() {
    if (this.sound.isPlaying) {
      this.sound.stop();
    }
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}