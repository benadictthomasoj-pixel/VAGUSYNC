import { OrientationEuler } from '../types';

export interface RawHardwarePacket {
  device?: string;
  connected?: boolean;
  button?: boolean; // Push button: pressed = GRAB, released = RELEASE
  heartRate?: number | null; // MAX30102 prototype reading
  imu?: {
    torso?: Partial<OrientationEuler>;
    upperArm?: Partial<OrientationEuler>;
    forearm?: Partial<OrientationEuler>;
  };
  timestamp?: number;
}

export interface HardwareState {
  connected: boolean;
  isSimulated: boolean;
  deviceType: string;
  buttonPressed: boolean;
  heartRate: number | null;
  imu: {
    torso: OrientationEuler;
    upperArm: OrientationEuler;
    forearm: OrientationEuler;
  };
  calibrationOffsets: {
    torso: OrientationEuler;
    upperArm: OrientationEuler;
    forearm: OrientationEuler;
  };
  calibratedImu: {
    torso: OrientationEuler;
    upperArm: OrientationEuler;
    forearm: OrientationEuler;
  };
  isCalibrated: boolean;
  packetRateHz: number;
  latencyMs: number;
  lastPacketTimestamp: number;
  isStale: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
}

export const DEFAULT_ORIENTATION: OrientationEuler = { roll: 0, pitch: 0, yaw: 0 };

export const INITIAL_HARDWARE_STATE: HardwareState = {
  connected: false,
  isSimulated: false,
  deviceType: 'vagus-grip-ball',
  buttonPressed: false,
  heartRate: null,
  imu: {
    torso: { ...DEFAULT_ORIENTATION },
    upperArm: { ...DEFAULT_ORIENTATION },
    forearm: { ...DEFAULT_ORIENTATION },
  },
  calibrationOffsets: {
    torso: { ...DEFAULT_ORIENTATION },
    upperArm: { ...DEFAULT_ORIENTATION },
    forearm: { ...DEFAULT_ORIENTATION },
  },
  calibratedImu: {
    torso: { ...DEFAULT_ORIENTATION },
    upperArm: { ...DEFAULT_ORIENTATION },
    forearm: { ...DEFAULT_ORIENTATION },
  },
  isCalibrated: false,
  packetRateHz: 0,
  latencyMs: 0,
  lastPacketTimestamp: 0,
  isStale: false,
  connectionState: 'disconnected',
  errorMessage: null,
};
