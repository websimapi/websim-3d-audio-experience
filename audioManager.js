import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.sound = new THREE.Audio(this.listener);
    this.audioLoader = new THREE.AudioLoader();
  }

  loadAndPlayAudio() {
    this.audioLoader.load('/lostbanger.wav', (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.play();
    });
  }
}