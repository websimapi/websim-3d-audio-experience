import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.sound = new THREE.Audio(this.listener);
    this.audioLoader = new THREE.AudioLoader();
    this.volume = 0;
    this.targetVolume = 1;
    this.fadeSpeed = 0.005;
  }

  loadAndPlayAudio() {
    this.audioLoader.load('/lostbanger.wav', (buffer) => {
      // Create a new AudioBuffer with the trimmed data
      const sampleRate = buffer.sampleRate;
      const numberOfChannels = buffer.numberOfChannels;
      const startOffset = sampleRate; // Start 1 second in
      const newLength = buffer.length - startOffset;
      
      const trimmedBuffer = this.context.createBuffer(
        numberOfChannels,
        newLength,
        sampleRate
      );

      // Copy the trimmed portion of the audio data
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const oldData = buffer.getChannelData(channel);
        const newData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) {
          newData[i] = oldData[i + startOffset];
        }
      }

      this.sound.setBuffer(trimmedBuffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0); // Start with volume at 0
      this.sound.play();
      this.startFade();
    });
  }

  startFade() {
    const fadeInterval = setInterval(() => {
      if (this.volume < this.targetVolume) {
        this.volume += this.fadeSpeed;
        this.sound.setVolume(this.volume);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  get context() {
    return this.listener.context;
  }
}