import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js';

export class ControlsManager {
  constructor(camera, domElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.setupControls();
  }

  setupControls() {
    // Configure controls for smooth operation
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;

    // Set distance limits
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;

    // Set rotation limits
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.minPolarAngle = Math.PI * 0.15;

    // Enable touch rotation for mobile
    this.controls.enableTouchRotate = true;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Smooth out the controls
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 0.8;
  }

  update() {
    this.controls.update();
  }
}