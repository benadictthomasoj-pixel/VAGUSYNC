import {
  HandTrackingState,
  HandTrackingStatus,
  HandCalibrationStatus,
  IHandInputProvider,
  Point,
  SecondaryHandState,
} from './types';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export class CameraHandProvider implements IHandInputProvider {
  private video: HTMLVideoElement | null = null;
  private handsInstance: any = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private listeners: Array<(state: HandTrackingState) => void> = [];

  // Status & Timing
  private status: HandTrackingStatus = 'camera-starting';
  private hasPermission: boolean = false;
  private isModelLoaded: boolean = false;
  private lastSeenHandTime: number = 0;
  private stableFramesCount: number = 0;
  private lastTimestamp: number = Date.now();

  // Smoothing memory
  private prevIndex: Point = { x: 0.5, y: 0.5 };
  private prevWrist: Point = { x: 0.5, y: 0.8 };
  private prevPalm: Point = { x: 0.5, y: 0.6 };
  private prevThumb: Point = { x: 0.45, y: 0.55 };
  private prevMiddle: Point = { x: 0.52, y: 0.48 };
  private prevRing: Point = { x: 0.54, y: 0.52 };
  private prevPinky: Point = { x: 0.56, y: 0.56 };
  private trajectoryPoints: Point[] = [];
  private velocityHistory: number[] = [];

  private currentState: HandTrackingState = {
    detected: false,
    status: 'camera-starting',
    confidence: 0,
    hand: 'unknown',
    wrist: { x: 0.5, y: 0.8 },
    palm: { x: 0.5, y: 0.6 },
    indexTip: { x: 0.5, y: 0.5 },
    thumbTip: { x: 0.45, y: 0.55 },
    middleTip: { x: 0.52, y: 0.48 },
    ringTip: { x: 0.54, y: 0.52 },
    pinkyTip: { x: 0.56, y: 0.56 },
    pinch: false,
    pinchDistance: 0.2,
    velocity: 0,
    direction: 0,
    handScale: 0.25,
    trajectory: [],
    stability: 0,
    smoothness: 85,
    timestamp: Date.now(),
    source: 'camera',
  };

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      this.status = 'camera-starting';
      this.emitState();

      // 1. Create hidden video element if needed
      if (!this.video) {
        this.video = document.createElement('video');
        this.video.playsInline = true;
        this.video.muted = true;
        this.video.autoplay = true;
        this.video.style.transform = 'scaleX(-1)';
      }

      // 2. Request userMedia with ideal 1280x720 resolution
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.hasPermission = true;
      this.status = 'searching';
      this.emitState();

      // 3. Initialize MediaPipe Hands
      await this.initMediaPipe();

      this.isRunning = true;
      this.startProcessingLoop();
      return true;
    } catch (err: any) {
      console.warn('Camera access error:', err);
      this.hasPermission = false;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.status = 'permission-denied';
      } else {
        this.status = 'camera-error';
      }
      this.emitState();
      return false;
    }
  }

  private async initMediaPipe(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && !window.Hands) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      }

      if (window.Hands) {
        this.handsInstance = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        this.handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        this.handsInstance.onResults(this.onMediaPipeResults.bind(this));
        this.isModelLoaded = true;
      }
    } catch (e) {
      console.warn('MediaPipe hands load fallback:', e);
      this.isModelLoaded = false;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  private startProcessingLoop(): void {
    const processFrame = async () => {
      if (!this.isRunning || !this.video) return;

      if (this.video.readyState >= 2 && this.handsInstance) {
        try {
          await this.handsInstance.send({ image: this.video });
        } catch {
          // Frame process catch - continue searching next frame
        }
      }

      if (this.isRunning) {
        requestAnimationFrame(processFrame);
      }
    };

    requestAnimationFrame(processFrame);
  }

  private onMediaPipeResults(results: any): void {
    const now = Date.now();
    const dt = Math.max(1, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.lastSeenHandTime = now;
      this.stableFramesCount = Math.min(60, this.stableFramesCount + 1);

      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness?.[0]?.label === 'Left' ? 'left' : 'right';

      // Landmark indices:
      // 0: Wrist
      // 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 16: Ring Tip, 20: Pinky Tip
      // 5: Index MCP, 9: Middle MCP, 13: Ring MCP, 17: Pinky MCP
      const rawWrist = { x: 1.0 - landmarks[0].x, y: landmarks[0].y, z: landmarks[0].z };
      const rawThumb = { x: 1.0 - landmarks[4].x, y: landmarks[4].y, z: landmarks[4].z };
      const rawIndex = { x: 1.0 - landmarks[8].x, y: landmarks[8].y, z: landmarks[8].z };
      const rawMiddle = { x: 1.0 - landmarks[12].x, y: landmarks[12].y, z: landmarks[12].z };
      const rawRing = { x: 1.0 - landmarks[16].x, y: landmarks[16].y, z: landmarks[16].z };
      const rawPinky = { x: 1.0 - landmarks[20].x, y: landmarks[20].y, z: landmarks[20].z };

      // Calculate stable multi-landmark Palm Center
      // (Wrist + Index MCP + Middle MCP + Ring MCP + Pinky MCP) / 5
      const rawPalm = {
        x:
          (rawWrist.x +
            (1.0 - landmarks[5].x) +
            (1.0 - landmarks[9].x) +
            (1.0 - landmarks[13].x) +
            (1.0 - landmarks[17].x)) /
          5,
        y: (rawWrist.y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5,
        z: landmarks[9].z,
      };

      // Hand scale estimation (distance wrist to middle tip)
      const handScale = Math.hypot(rawWrist.x - rawMiddle.x, rawWrist.y - rawMiddle.y) || 0.25;

      // Exponential Smoothing
      const smoothIndex: Point = {
        x: this.prevIndex.x * 0.7 + rawIndex.x * 0.3,
        y: this.prevIndex.y * 0.7 + rawIndex.y * 0.3,
      };
      const smoothWrist: Point = {
        x: this.prevWrist.x * 0.7 + rawWrist.x * 0.3,
        y: this.prevWrist.y * 0.7 + rawWrist.y * 0.3,
      };
      const smoothPalm: Point = {
        x: this.prevPalm.x * 0.7 + rawPalm.x * 0.3,
        y: this.prevPalm.y * 0.7 + rawPalm.y * 0.3,
      };
      const smoothThumb: Point = {
        x: this.prevThumb.x * 0.7 + rawThumb.x * 0.3,
        y: this.prevThumb.y * 0.7 + rawThumb.y * 0.3,
      };
      const smoothMiddle: Point = {
        x: this.prevMiddle.x * 0.7 + rawMiddle.x * 0.3,
        y: this.prevMiddle.y * 0.7 + rawMiddle.y * 0.3,
      };
      const smoothRing: Point = {
        x: this.prevRing.x * 0.7 + rawRing.x * 0.3,
        y: this.prevRing.y * 0.7 + rawRing.y * 0.3,
      };
      const smoothPinky: Point = {
        x: this.prevPinky.x * 0.7 + rawPinky.x * 0.3,
        y: this.prevPinky.y * 0.7 + rawPinky.y * 0.3,
      };

      this.prevIndex = smoothIndex;
      this.prevWrist = smoothWrist;
      this.prevPalm = smoothPalm;
      this.prevThumb = smoothThumb;
      this.prevMiddle = smoothMiddle;
      this.prevRing = smoothRing;
      this.prevPinky = smoothPinky;

      // Pinch calculation (thumb tip to index tip)
      const pinchDist = Math.hypot(rawThumb.x - rawIndex.x, rawThumb.y - rawIndex.y);
      const isPinching = pinchDist < 0.085;

      // Velocity & trajectory
      const dx = smoothIndex.x - (this.trajectoryPoints[this.trajectoryPoints.length - 1]?.x || smoothIndex.x);
      const dy = smoothIndex.y - (this.trajectoryPoints[this.trajectoryPoints.length - 1]?.y || smoothIndex.y);
      const distTraveled = Math.hypot(dx, dy);
      const velocity = distTraveled / dt;
      const direction = Math.atan2(dy, dx);

      this.trajectoryPoints.push({ x: smoothIndex.x, y: smoothIndex.y });
      if (this.trajectoryPoints.length > 25) this.trajectoryPoints.shift();

      this.velocityHistory.push(velocity);
      if (this.velocityHistory.length > 15) this.velocityHistory.shift();
      const avgVel = this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length;
      const velVariance = this.velocityHistory.reduce((acc, v) => acc + Math.pow(v - avgVel, 2), 0) / this.velocityHistory.length;
      const smoothness = Math.max(50, Math.min(98, Math.round(95 - velVariance * 120)));
      const stability = Math.min(100, Math.round((this.stableFramesCount / 20) * 100));

      // Secondary Hand (if 2 hands detected)
      let secondaryHandState: SecondaryHandState | undefined = undefined;
      if (results.multiHandLandmarks.length > 1) {
        const secLandmarks = results.multiHandLandmarks[1];
        const secHandedness = results.multiHandedness?.[1]?.label === 'Left' ? 'left' : 'right';
        secondaryHandState = {
          detected: true,
          hand: secHandedness as 'left' | 'right',
          wrist: { x: 1.0 - secLandmarks[0].x, y: secLandmarks[0].y },
          palm: { x: 1.0 - secLandmarks[9].x, y: secLandmarks[9].y },
          indexTip: { x: 1.0 - secLandmarks[8].x, y: secLandmarks[8].y },
          thumbTip: { x: 1.0 - secLandmarks[4].x, y: secLandmarks[4].y },
          middleTip: { x: 1.0 - secLandmarks[12].x, y: secLandmarks[12].y },
        };
      }

      this.status = this.stableFramesCount >= 5 ? 'tracking' : 'hand-detected';

      this.currentState = {
        detected: true,
        status: this.status,
        confidence: 0.94,
        hand: handedness,
        wrist: smoothWrist,
        palm: smoothPalm,
        indexTip: smoothIndex,
        thumbTip: smoothThumb,
        middleTip: smoothMiddle,
        ringTip: smoothRing,
        pinkyTip: smoothPinky,
        pinch: isPinching,
        pinchDistance: pinchDist,
        velocity,
        direction,
        handScale,
        trajectory: [...this.trajectoryPoints],
        stability,
        smoothness,
        timestamp: now,
        secondaryHand: secondaryHandState,
        rawLandmarks: landmarks.map((l: any) => ({ x: 1.0 - l.x, y: l.y, z: l.z })),
        source: 'camera',
      };
    } else {
      // Hand not visible in current frame
      const elapsedSinceSeen = now - this.lastSeenHandTime;
      this.stableFramesCount = Math.max(0, this.stableFramesCount - 1);

      if (this.lastSeenHandTime > 0 && elapsedSinceSeen < 500) {
        // 0 - 500 ms: Grace period, retain last known tracking state smoothly
        this.status = 'tracking';
        this.currentState = {
          ...this.currentState,
          status: 'tracking',
          timestamp: now,
        };
      } else if (this.lastSeenHandTime > 0 && elapsedSinceSeen < 1500) {
        // 500 - 1500 ms: Hand temporarily lost, searching actively
        this.status = 'tracking-lost';
        this.currentState = {
          ...this.currentState,
          status: 'tracking-lost',
          timestamp: now,
        };
      } else {
        // > 1500 ms: Active continuous searching for palm
        this.status = 'searching';
        this.currentState = {
          ...this.currentState,
          detected: false,
          status: 'searching',
          confidence: 0,
          stability: 0,
          timestamp: now,
        };
      }
    }

    this.emitState();
  }

  private emitState(): void {
    this.listeners.forEach((fn) => fn(this.currentState));
  }

  public stop(): void {
    this.isRunning = false;
    this.status = 'camera-off';
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.currentState = {
      ...this.currentState,
      detected: false,
      status: 'camera-off',
    };
    this.emitState();
  }

  public getState(): HandTrackingState {
    return this.currentState;
  }

  public onUpdate(callback: (state: HandTrackingState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  public getCalibrationStatus(): HandCalibrationStatus {
    let feedback = 'Show your palm to the camera';
    if (!this.hasPermission) {
      feedback = 'Waiting for camera permission...';
    } else if (!this.isModelLoaded) {
      feedback = 'Starting vision detector...';
    } else if (this.currentState.detected) {
      if (this.stableFramesCount >= 10) {
        feedback = '✓ Tracking active';
      } else {
        feedback = 'Palm detected • Tracking';
      }
    }

    return {
      hasCameraPermission: this.hasPermission,
      isModelLoaded: this.isModelLoaded,
      isHandInFrame: this.currentState.detected,
      isTrackingStable: this.stableFramesCount >= 10,
      stabilityScore: Math.min(100, Math.round((this.stableFramesCount / 10) * 100)),
      feedbackMessage: feedback,
    };
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }
}
