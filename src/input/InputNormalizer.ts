// InputNormalizer: The single entry point for all game input
// Converts Camera, Hardware, and Simulation signals into unified RehabInputState with adaptive smoothing

import { RehabInputState, InputModeSelection, INITIAL_REHAB_INPUT_STATE } from './inputTypes';
import { HandTrackingState } from '../services/handTracking/types';
import { HardwareState } from '../hardware/hardwareTypes';
import { hardwareConnection } from '../hardware/HardwareConnection';

type InputListener = (state: RehabInputState) => void;

export class InputNormalizer {
  private currentState: RehabInputState = { ...INITIAL_REHAB_INPUT_STATE };
  private mode: InputModeSelection = 'hybrid';
  private listeners: Set<InputListener> = new Set();
  private mousePos = { x: 0.5, y: 0.5 };
  private mousePressed = false;
  private animId: number | null = null;
  private isRunning = false;
  private latestCameraState: HandTrackingState | null = null;

  // Smoothing filters for jitter-free, comfortable post-stroke control
  private smoothedX = 0.5;
  private smoothedY = 0.5;
  private smoothingAlpha = 0.32; // Higher value = faster response, lower = smoother

  constructor() {
    this.setupWindowListeners();
  }

  private setupWindowListeners(): void {
    if (typeof window === 'undefined') return;

    // Mouse & Touch fallback for accessibility & testing
    window.addEventListener('mousemove', (e) => {
      this.mousePos = {
        x: Math.max(0, Math.min(1, e.clientX / window.innerWidth)),
        y: Math.max(0, Math.min(1, e.clientY / window.innerHeight)),
      };
    });

    window.addEventListener('mousedown', () => {
      this.mousePressed = true;
    });

    window.addEventListener('mouseup', () => {
      this.mousePressed = false;
    });

    // Spacebar triggers primary action for accessible testing
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['input', 'textarea'].includes((e.target as any)?.tagName?.toLowerCase())) {
        this.mousePressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.mousePressed = false;
      }
    });
  }

  public updateCameraState(state: HandTrackingState): void {
    this.latestCameraState = state;
    this.processInputs();
  }

  public setMode(mode: InputModeSelection): void {
    this.mode = mode;
  }

  public getMode(): InputModeSelection {
    return this.mode;
  }

  public setSmoothingAlpha(alpha: number): void {
    this.smoothingAlpha = Math.max(0.1, Math.min(0.9, alpha));
  }

  public subscribe(cb: InputListener): () => void {
    this.listeners.add(cb);
    cb(this.currentState);
    return () => this.listeners.delete(cb);
  }

  public getState(): RehabInputState {
    return this.currentState;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    this.processInputs();
    this.animId = requestAnimationFrame(this.loop);
  };

  public processInputs(): RehabInputState {
    const camState = this.latestCameraState;
    const hwState: HardwareState = hardwareConnection.getState();
    const timestamp = performance.now();

    let rawTargetX = 0.5;
    let rawTargetY = 0.5;
    let primaryPressed = false;
    let velocity = 0;
    let connected = false;
    let effectiveSource: 'camera' | 'hardware' | 'hybrid' | 'simulation' = this.mode;

    const camDetected = camState ? camState.detected : false;

    // 1. Determine Spatial Coordinates (X, Y)
    if (camDetected && camState) {
      // Camera Hand Position takes priority for spatial "WHERE"
      rawTargetX = camState.indexTip.x;
      rawTargetY = camState.indexTip.y;
      velocity = camState.velocity;
      connected = true;
    } else if (this.mode === 'hardware' && hwState.connected && !hwState.isStale) {
      // Hardware-derived spatial position from Forearm + Upper Arm Pitch & Roll
      const mappedX = Math.max(0, Math.min(1, (hwState.imu.forearm.roll + 45) / 90));
      const mappedY = Math.max(0, Math.min(1, 1.0 - (hwState.imu.forearm.pitch / 90)));
      rawTargetX = mappedX;
      rawTargetY = mappedY;
      connected = true;
    } else {
      // Virtual / Mouse Fallback
      rawTargetX = this.mousePos.x;
      rawTargetY = this.mousePos.y;
      connected = hwState.connected || camDetected || true;
    }

    // Apply Exponential Moving Average (EMA) smoothing for comfortable reach control
    this.smoothedX = this.smoothedX + (rawTargetX - this.smoothedX) * this.smoothingAlpha;
    this.smoothedY = this.smoothedY + (rawTargetY - this.smoothedY) * this.smoothingAlpha;

    // 2. Determine Action Trigger (primaryPressed = GRAB / RELEASE)
    if (hwState.connected && !hwState.isStale) {
      // Physical Button: pressed = true (GRAB), released = false (RELEASE)
      primaryPressed = hwState.buttonPressed;
      // Allow camera pinch as secondary trigger if button not pressed
      if (!primaryPressed && camDetected && camState?.pinch) {
        primaryPressed = true;
      }
    } else if (camDetected && camState?.pinch) {
      // Camera Pinch Gesture (thumb & index close)
      primaryPressed = true;
    } else {
      // Mouse Click / Spacebar Fallback
      primaryPressed = this.mousePressed;
    }

    // 3. Determine Mode & Biometric Signals
    if (camDetected && hwState.connected && !hwState.isStale) {
      effectiveSource = 'hybrid';
    } else if (hwState.isSimulated) {
      effectiveSource = 'simulation';
    } else if (camDetected) {
      effectiveSource = 'camera';
    } else if (hwState.connected && !hwState.isStale) {
      effectiveSource = 'hardware';
    } else {
      effectiveSource = 'simulation';
    }

    this.currentState = {
      connected,
      source: effectiveSource,
      x: Number(this.smoothedX.toFixed(4)),
      y: Number(this.smoothedY.toFixed(4)),
      primaryPressed,
      velocity: Number(velocity.toFixed(3)),
      orientation: {
        torso: { ...hwState.imu.torso },
        upperArm: { ...hwState.imu.upperArm },
        forearm: { ...hwState.imu.forearm },
      },
      heartRate: hwState.heartRate,
      timestamp,
      rawCamera: camState || undefined,
      rawHardware: hwState,
    };

    this.listeners.forEach(cb => cb(this.currentState));
    return this.currentState;
  }
}

export const inputNormalizer = new InputNormalizer();
