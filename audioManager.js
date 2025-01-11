loadAndPlayAudio() {
  this.audioLoader.load('./lostbanger.wav', (buffer) => {
    this.sound.setBuffer(buffer);
    this.sound.setLoop(true);
    this.sound.setVolume(0); // Start with volume at 0
    this.sound.play();
    this.startFade();
  });
}