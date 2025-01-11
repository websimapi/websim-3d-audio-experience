import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class AudioManager {
  constructor(camera) {
    // Initialize audio context
    THREE.AudioContext.getContext().suspend();
    
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    // Create main sound
    this.sound = new THREE.Audio(this.listener);
    
    // Create gain node for smooth volume control
    this.gainNode = THREE.AudioContext.getContext().createGain();
    this.gainNode.gain.value = 0;
    
    this.audioLoader = new THREE.AudioLoader();
    this.isLoaded = false;
    this.targetVolume = 0.8; // Slightly lower max volume
    this.fadeTime = 2.0; // Fade in over 2 seconds
  }

  async loadAndPlayAudio() {
    if (this.isLoaded) return;
    
    try {
      // Resume audio context on user interaction
      await THREE.AudioContext.getContext().resume();
      
      // Load the audio file
      const buffer = await new Promise((resolve, reject) => {
        this.audioLoader.load('/lostbanger.wav', resolve, undefined, reject);
      });
      
      // Configure audio nodes
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      
      // Connect through gain node
      this.sound.connect(this.gainNode);
      this.gainNode.connect(THREE.AudioContext.getContext().destination);
      
      // Start playback with volume at 0
      this.gainNode.gain.setValueAtTime(0, THREE.AudioContext.getContext().currentTime);
      this.sound.play();
      
      // Smooth fade in
      this.gainNode.gain.linearRampToValueAtTime(
        this.targetVolume,
        THREE.AudioContext.getContext().currentTime + this.fadeTime
      );
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  }
}