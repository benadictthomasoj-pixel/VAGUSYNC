export interface Point {
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
  z?: number;
}

export type HandTrackingStatus =
  | 'camera-off'
  | 'camera-starting'
  | 'searching'
  | 'hand-detected'
  | 'tracking'
  | 'tracking-lost'
  | 'permission-denied'
  | 'camera-error';

export interface SecondaryHandState {
  detected: boolean;
  hand: 'left' | 'right';
  wrist: Point;
  palm: Point;
  indexTip: Point;
  thumbTip: Point;
  middleTip?: Point;
}

export interface HandTrackingState {
  detected: boolean;
  status: HandTrackingStatus;
  confidence: number;
  hand: 'left' | 'right' | 'unknown';
  wrist: Point;
  palm: Point; // Multi-landmark palm center
  indexTip: Point;
  thumbTip: Point;
  middleTip: Point;
  ringTip: Point;
  pinkyTip: Point;
  pinch: boolean;
  pinchDistance: number; // 0.0 to 1.0
  velocity: number;
  direction: number; // in radians
  handScale: number; // Normalized hand scale (distance wrist to middleTip)
  trajectory: Point[];
  stability: number; // 0 to 100%
  smoothness: number; // 0 to 100%
  timestamp: number;
  secondaryHand?: SecondaryHandState;
  rawLandmarks?: Point[];
  source: 'camera' | 'simulation' | 'wearable';
}

export interface HandCalibrationStatus {
  hasCameraPermission: boolean;
  isModelLoaded: boolean;
  isHandInFrame: boolean;
  isTrackingStable: boolean;
  stabilityScore: number;
  feedbackMessage: string;
}

export interface IHandInputProvider {
  start(): Promise<boolean>;
  stop(): void;
  getState(): HandTrackingState;
  onUpdate(callback: (state: HandTrackingState) => void): () => void;
  getCalibrationStatus(): HandCalibrationStatus;
  getVideoElement(): HTMLVideoElement | null;
  getStream?(): MediaStream | null;
}
