import { OrientationEuler } from '../types';
import { HandTrackingState } from '../services/handTracking/types';
import { HardwareState } from '../hardware/hardwareTypes';

export type InputModeSelection = 'hybrid' | 'camera' | 'hardware' | 'simulation';

export interface RehabInputState {
  connected: boolean;
  source: 'camera' | 'hardware' | 'hybrid' | 'simulation';
  x: number; // Normalized 0-1 (horizontal cursor)
  y: number; // Normalized 0-1 (vertical cursor)
  primaryPressed: boolean; // Grip Button (physical) or Pinch (camera gesture)
  velocity: number;
  orientation: {
    torso: OrientationEuler;
    upperArm: OrientationEuler;
    forearm: OrientationEuler;
  };
  heartRate: number | null;
  timestamp: number;
  // Diagnostics
  rawCamera?: HandTrackingState;
  rawHardware?: HardwareState;
}

export const INITIAL_REHAB_INPUT_STATE: RehabInputState = {
  connected: false,
  source: 'simulation',
  x: 0.5,
  y: 0.5,
  primaryPressed: false,
  velocity: 0,
  orientation: {
    torso: { roll: 0, pitch: 0, yaw: 0 },
    upperArm: { roll: 0, pitch: 0, yaw: 0 },
    forearm: { roll: 0, pitch: 0, yaw: 0 },
  },
  heartRate: 72,
  timestamp: Date.now(),
};
