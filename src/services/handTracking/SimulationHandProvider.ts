import { HandTrackingState, HandCalibrationStatus, IHandInputProvider, Point } from './types';

export class SimulationHandProvider implements IHandInputProvider {
  private isRunning: boolean = false;
  private listeners: Array<(state: HandTrackingState) => void> = [];
  private currentPos: Point = { x: 0.5, y: 0.5 };
  private isPinching: boolean = false;
  private trajectory: Point[] = [];
  private animFrameId: number | null = null;
  private lastTime = Date.now();

  private currentState: HandTrackingState = {
    detected: true,
    status: 'tracking',
    confidence: 1.0,
    hand: 'right',
    wrist: { x: 0.5, y: 0.8 },
    palm: { x: 0.5, y: 0.6 },
    indexTip: { x: 0.5, y: 0.5 },
    thumbTip: { x: 0.45, y: 0.55 },
    middleTip: { x: 0.52, y: 0.48 },
    ringTip: { x: 0.54, y: 0.52 },
    pinkyTip: { x: 0.56, y: 0.56 },
    pinch: false,
    pinchDistance: 0.15,
    velocity: 0.5,
    direction: 0,
    handScale: 0.25,
    trajectory: [],
    stability: 95,
    smoothness: 92,
    timestamp: Date.now(),
    source: 'simulation',
  };

  public async start(): Promise<boolean> {
    this.isRunning = true;
    this.attachPointerListeners();
    this.startLoop();
    return true;
  }

  private attachPointerListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('pointermove', (e) => {
      this.currentPos = {
        x: Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth)),
        y: Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight)),
      };
    });

    window.addEventListener('pointerdown', () => {
      this.isPinching = true;
    });

    window.addEventListener('pointerup', () => {
      this.isPinching = false;
    });
  }

  private startLoop(): void {
    const tick = () => {
      if (!this.isRunning) return;

      const now = Date.now();
      const dt = Math.max(1, (now - this.lastTime) / 1000);
      this.lastTime = now;

      // Update trajectory
      this.trajectory.push({ x: this.currentPos.x, y: this.currentPos.y });
      if (this.trajectory.length > 20) this.trajectory.shift();

      const wristY = Math.min(1.0, this.currentPos.y + 0.25);
      const palmY = Math.min(1.0, this.currentPos.y + 0.1);

      this.currentState = {
        detected: true,
        status: 'tracking',
        confidence: 1.0,
        hand: 'right',
        wrist: { x: this.currentPos.x, y: wristY },
        palm: { x: this.currentPos.x, y: palmY },
        indexTip: { x: this.currentPos.x, y: this.currentPos.y },
        thumbTip: {
          x: this.isPinching ? this.currentPos.x : this.currentPos.x - 0.05,
          y: this.isPinching ? this.currentPos.y : this.currentPos.y + 0.05,
        },
        middleTip: { x: this.currentPos.x + 0.02, y: this.currentPos.y - 0.02 },
        ringTip: { x: this.currentPos.x + 0.04, y: this.currentPos.y + 0.02 },
        pinkyTip: { x: this.currentPos.x + 0.06, y: this.currentPos.y + 0.06 },
        pinch: this.isPinching,
        pinchDistance: this.isPinching ? 0.02 : 0.12,
        velocity: 1.2,
        direction: 0,
        handScale: 0.25,
        trajectory: [...this.trajectory],
        stability: 98,
        smoothness: 94,
        timestamp: now,
        source: 'simulation',
      };

      this.listeners.forEach((fn) => fn(this.currentState));
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
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
    return {
      hasCameraPermission: true,
      isModelLoaded: true,
      isHandInFrame: true,
      isTrackingStable: true,
      stabilityScore: 100,
      feedbackMessage: 'Simulation Mode • Mouse/Touch Input Active',
    };
  }

  public getVideoElement(): HTMLVideoElement | null {
    return null;
  }
}
