export type UserRole = 'patient' | 'therapist' | 'caregiver';

export type Language = 'en' | 'ta';

export type SafetyState = 'SAFE' | 'WARNING' | 'SAFETY_EVENT';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  condition: string;
  affectedSide: 'Left Arm' | 'Right Arm' | 'Bilateral';
  strokeDate: string;
  baselineHR: number;
  maxSafeHR: number;
  therapistId: string;
  therapistName: string;
  caregiverName: string;
  caregiverPhone: string;
  language: Language;
  voiceGuidance: boolean;
  vagalStimulationEnabled: boolean;
  currentDifficulty: number; // 1 to 5
  streakDays: number;
  xp: number;
  level: number;
  weeklyGoalSessions: number;
  completedSessionsThisWeek: number;
  readinessScore: number;
  currentROM: number;
  currentGrip: number;
  status: 'On Track' | 'Needs Attention' | 'Review Required';
  hasCompletedOnboarding: boolean;
}

export interface CompensationEvent {
  type: 'Trunk Lean' | 'Shoulder Hike' | 'Elbow Flare' | 'Speed Fluctuation';
  timestamp: string;
  correctionMsg: string;
}

export interface HRPoint {
  time: string;
  bpm: number;
  state: SafetyState;
}

export interface RehabSession {
  id: string;
  patientId: string;
  date: string;
  gameId: string;
  gameName: string;
  category: string;
  durationSeconds: number;
  targetReps: number;
  completedReps: number;
  accuracy: number; // %
  score: number;
  rehabQualityScore: number; // 0-100
  movementQuality: number; // %
  avgHR: number;
  peakHR: number;
  painBefore: number; // 0-10
  painAfter: number; // 0-10
  rpe: number; // 1-5
  gripScore: number; // %
  gripHoldSeconds: number;
  compensations: CompensationEvent[];
  hrHistory: HRPoint[];
  safetyEventsCount: number;
  inputSource?: 'camera' | 'hardware' | 'hybrid' | 'simulation';
  deviceConnected?: boolean;
  torsoCompensationCount?: number;
  therapistNotes?: string;
}

export interface AlertItem {
  id: string;
  patientId: string;
  patientName: string;
  type: 'safety' | 'warning' | 'sos' | 'pain';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TherapistProgram {
  patientId: string;
  category: string;
  sets: number;
  repsPerSet: number;
  difficultyLevel: number;
  sessionFrequencyWeekly: number;
  safetyThresholdBPM: number;
  vagalStimulationEnabled: boolean;
  recommendedDifficulty: number;
  recommendationRationale: string;
  hasPendingDifficultyChange: boolean;
  customNotes: string;
}

export interface OrientationEuler {
  roll: number;
  pitch: number;
  yaw: number;
}

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
  packetRateHz: number;
  latencyMs: number;
  lastPacketTimestamp: number;
  isStale: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
}

export interface RehabInputState {
  source: 'camera' | 'hardware' | 'hybrid' | 'simulation';
  x: number;
  y: number;
  primaryPressed: boolean; // Button grab / pinch / pop
  velocity: number;
  orientation?: {
    torso?: OrientationEuler;
    upperArm?: OrientationEuler;
    forearm?: OrientationEuler;
  };
  heartRate?: number | null;
  connected: boolean;
  timestamp: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  category: 'Range of Motion' | 'Functional Reach & Grasp' | 'Compensation Correction' | 'Cardiac-Paced Endurance' | 'Pain-Safe Positioning';
  purpose: string;
  description: string;
  difficulty: number;
  estimatedDuration: string;
  iconName: string;
  accentColor: string;
  targetFocus: string;
}
