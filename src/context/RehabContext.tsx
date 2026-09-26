import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  Language,
  SafetyState,
  PatientProfile,
  RehabSession,
  AlertItem,
  TherapistProgram,
  CompensationEvent,
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_SESSIONS,
  INITIAL_PROGRAMS,
  INITIAL_ALERTS,
} from '../data/seedData';
import { soundManager } from '../utils/audio';
import { getTranslation, translations } from '../utils/i18n';
import { hardwareConnection } from '../hardware/HardwareConnection';

export interface DeviceHardwareStatus {
  armIMU: 'Not Connected' | 'Connected (Demo)' | 'Connected (ESP-12E)';
  trunkIMU: 'Not Connected' | 'Connected (Demo)' | 'Connected (ESP-12E)';
  heartRateSensor: 'Simulated' | 'Not Connected' | 'MAX30102 Connected';
  gripSensor: 'Simulated' | 'Not Connected' | 'Push Button Active';
  batteryPercent: number;
  bleStatus: 'Demo Connected' | 'Scanning' | 'Disconnected' | 'ESP-12E Wi-Fi Connected';
  vagalStimulationActive: boolean;
}

interface RehabContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activePatientId: string;
  setActivePatientId: (id: string) => void;
  activePatient: PatientProfile;
  patients: PatientProfile[];
  sessions: RehabSession[];
  programs: Record<string, TherapistProgram>;
  activeProgram: TherapistProgram;
  alerts: AlertItem[];
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  voiceGuidance: boolean;
  setVoiceGuidance: (enabled: boolean) => void;
  deviceStatus: DeviceHardwareStatus;
  
  // Live Simulation state
  simulatedHR: number;
  setSimulatedHR: (bpm: number) => void;
  safetyState: SafetyState;
  activeCompensation: CompensationEvent | null;
  
  // Actions
  triggerCompensation: (type?: CompensationEvent['type']) => void;
  clearCompensation: () => void;
  triggerHRSpike: (bpm: number) => void;
  triggerSafetyEvent: () => void;
  resetHRToBaseline: () => void;
  
  // Data actions
  saveSession: (session: Omit<RehabSession, 'id' | 'patientId' | 'date'>) => RehabSession;
  approveDifficultyRecommendation: (patientId: string) => void;
  updateProgram: (patientId: string, updates: Partial<TherapistProgram>) => void;
  updateTherapistNotes: (patientId: string, notes: string) => void;
  resolveAlert: (alertId: string) => void;
  createAlert: (alert: Omit<AlertItem, 'id' | 'timestamp' | 'resolved'>) => void;
  completePatientOnboarding: (patientId: string) => void;
  toggleVagalStimulation: () => void;
  resetDemoData: () => void;
  
  // Navigation / Modal helpers
  showArchitectureModal: boolean;
  setShowArchitectureModal: (show: boolean) => void;
  showDeviceStatusModal: boolean;
  setShowDeviceStatusModal: (show: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  selectedGameForSession: string | null;
  setSelectedGameForSession: (gameId: string | null) => void;
}

const RehabContext = createContext<RehabContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vagussync_v2_store';

export const RehabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state or localStorage
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role`);
    return (saved as UserRole) || 'patient';
  });

  const [activePatientId, setActivePatientIdState] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activePatient`);
    return saved || 'p-meera';
  });

  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_patients`);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [sessions, setSessions] = useState<RehabSession[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sessions`);
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [programs, setPrograms] = useState<Record<string, TherapistProgram>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_programs`);
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_alerts`);
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_lang`);
    return (saved as Language) || 'en';
  });

  const [voiceGuidance, setVoiceGuidanceState] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_voice`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [deviceStatus, setDeviceStatus] = useState<DeviceHardwareStatus>({
    armIMU: 'Not Connected',
    trunkIMU: 'Not Connected',
    heartRateSensor: 'Simulated',
    gripSensor: 'Simulated',
    batteryPercent: 82,
    bleStatus: 'Demo Connected',
    vagalStimulationActive: false,
  });

  // Live simulation variables
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const activeProgram = programs[activePatientId] || programs['p-meera'];

  const [simulatedHR, setSimulatedHRState] = useState<number>(activePatient ? activePatient.baselineHR : 72);
  const [safetyState, setSafetyState] = useState<SafetyState>('SAFE');
  const [activeCompensation, setActiveCompensation] = useState<CompensationEvent | null>(null);

  // Modals & Navigation
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [showDeviceStatusModal, setShowDeviceStatusModal] = useState(false);
  const [activePage, setActivePage] = useState('today');
  const [selectedGameForSession, setSelectedGameForSession] = useState<string | null>(null);

  const lastCompTime = useRef<number>(0);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_activePatient`, activePatientId);
  }, [activePatientId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_sessions`, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_programs`, JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_alerts`, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_lang`, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_voice`, JSON.stringify(voiceGuidance));
  }, [voiceGuidance]);

  // Subscribe to hardware telemetry and synchronization
  useEffect(() => {
    const unsub = hardwareConnection.subscribe((hw) => {
      // 1. Sync Heart Rate if valid reading available
      if (hw.connected && hw.heartRate !== null && !hw.isStale) {
        setSimulatedHRState(hw.heartRate);
      }

      // 2. Automated IMU Compensation detection for Torso Trunk Lean & Shoulder Hike
      if (hw.connected && !hw.isStale) {
        const torsoPitch = Math.abs(hw.imu.torso.pitch);
        const torsoRoll = Math.abs(hw.imu.torso.roll);
        const now = Date.now();

        if (torsoPitch > 18 && now - lastCompTime.current > 5000) {
          lastCompTime.current = now;
          triggerCompensation('Trunk Lean');
        } else if (torsoRoll > 16 && now - lastCompTime.current > 5000) {
          lastCompTime.current = now;
          triggerCompensation('Shoulder Hike');
        }
      }

      // 3. Sync Device Status
      setDeviceStatus((prev) => ({
        ...prev,
        armIMU: hw.connected ? (hw.isSimulated ? 'Connected (Demo)' : 'Connected (ESP-12E)') : 'Not Connected',
        trunkIMU: hw.connected ? (hw.isSimulated ? 'Connected (Demo)' : 'Connected (ESP-12E)') : 'Not Connected',
        heartRateSensor: hw.heartRate !== null ? (hw.isSimulated ? 'Simulated' : 'MAX30102 Connected') : 'Not Connected',
        gripSensor: hw.connected ? (hw.isSimulated ? 'Simulated' : 'Push Button Active') : 'Not Connected',
        batteryPercent: hw.connected ? 88 : 0,
        bleStatus: hw.connected ? (hw.isSimulated ? 'Demo Connected' : 'ESP-12E Wi-Fi Connected') : 'Disconnected',
      }));
    });

    return () => unsub();
  }, [language, voiceGuidance]);

  // Handle HR safety evaluation
  useEffect(() => {
    const maxThreshold = activeProgram?.safetyThresholdBPM || 130;
    const warningThreshold = maxThreshold - 15; // e.g. 115 BPM

    if (simulatedHR >= maxThreshold) {
      if (safetyState !== 'SAFETY_EVENT') {
        setSafetyState('SAFETY_EVENT');
        soundManager.playSafetyAlarm();
      }
    } else if (simulatedHR >= warningThreshold) {
      if (safetyState !== 'WARNING') {
        setSafetyState('WARNING');
        soundManager.playWarning();
      }
    } else {
      if (safetyState !== 'SAFE') {
        setSafetyState('SAFE');
      }
    }
  }, [simulatedHR, activeProgram, safetyState]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'patient') {
      setActivePage('today');
    } else if (newRole === 'therapist') {
      setActivePage('overview');
    } else if (newRole === 'caregiver') {
      setActivePage('status');
    }
  };

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
    const p = patients.find((pat) => pat.id === id);
    if (p) {
      setSimulatedHRState(p.baselineHR);
      setSafetyState('SAFE');
      setActiveCompensation(null);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ta' : 'en'));
  };

  const setVoiceGuidance = (enabled: boolean) => {
    setVoiceGuidanceState(enabled);
  };

  const setSimulatedHR = (bpm: number) => {
    setSimulatedHRState(bpm);
  };

  const triggerCompensation = (type: CompensationEvent['type'] = 'Trunk Lean') => {
    const t = getTranslation(language);
    const localizedMsg =
      t.compensationAlerts?.[type as keyof typeof t.compensationAlerts] ||
      (language === 'ta' ? 'உடலை நேராக வைக்கவும்.' : 'Maintain posture alignment.');

    const englishSpokenMsg =
      translations.en.compensationAlerts?.[type as keyof typeof translations.en.compensationAlerts] ||
      'Maintain posture alignment.';

    const event: CompensationEvent = {
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      correctionMsg: localizedMsg,
    };

    setActiveCompensation(event);
    soundManager.playWarning();
    soundManager.speak(englishSpokenMsg, 'en', voiceGuidance);

    // Auto-clear after 4.5 seconds
    setTimeout(() => {
      setActiveCompensation((curr) => (curr?.timestamp === event.timestamp ? null : curr));
    }, 4500);
  };

  const clearCompensation = () => {
    setActiveCompensation(null);
  };

  const triggerHRSpike = (bpm: number) => {
    setSimulatedHRState(bpm);
  };

  const triggerSafetyEvent = () => {
    const threshold = activeProgram?.safetyThresholdBPM || 130;
    const safetyBpm = threshold + 2;
    setSimulatedHRState(safetyBpm);
    
    // Auto-generate caregiver/therapist alert
    createAlert({
      patientId: activePatient.id,
      patientName: activePatient.name,
      type: 'safety',
      title: 'Cardiac Safety Exceeded',
      description: `Simulated HR spiked to ${safetyBpm} BPM exceeding safe threshold (${threshold} BPM). Session auto-paused. Caregiver notified.`,
      severity: 'critical',
    });
  };

  const resetHRToBaseline = () => {
    setSimulatedHRState(activePatient ? activePatient.baselineHR : 72);
    setSafetyState('SAFE');
  };

  const createAlert = (alertData: Omit<AlertItem, 'id' | 'timestamp' | 'resolved'>) => {
    const newAlert: AlertItem = {
      ...alertData,
      id: `alt-${Date.now()}`,
      timestamp: 'Just now',
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  const approveDifficultyRecommendation = (patientId: string) => {
    const prog = programs[patientId];
    if (!prog) return;

    const newDiff = prog.recommendedDifficulty;

    // Update program
    setPrograms((prev) => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        difficultyLevel: newDiff,
        hasPendingDifficultyChange: false,
        customNotes: `Approved progression to Level ${newDiff}. Focus on controlled reach amplitude.`,
      },
    }));

    // Update patient currentDifficulty & notify
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              currentDifficulty: newDiff,
            }
          : p
      )
    );

    soundManager.playTargetSuccess();
  };

  const updateProgram = (patientId: string, updates: Partial<TherapistProgram>) => {
    setPrograms((prev) => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        ...updates,
      },
    }));
  };

  const updateTherapistNotes = (patientId: string, notes: string) => {
    setPrograms((prev) => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        customNotes: notes,
      },
    }));
  };

  const completePatientOnboarding = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              hasCompletedOnboarding: true,
            }
          : p
      )
    );
  };

  const toggleVagalStimulation = () => {
    const newState = !deviceStatus.vagalStimulationActive;
    setDeviceStatus((prev) => ({
      ...prev,
      vagalStimulationActive: newState,
    }));
    setPrograms((prev) => ({
      ...prev,
      [activePatientId]: {
        ...prev[activePatientId],
        vagalStimulationEnabled: newState,
      },
    }));
  };

  const saveSession = (sessionData: Omit<RehabSession, 'id' | 'patientId' | 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newSession: RehabSession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      patientId: activePatientId,
      date: todayStr,
    };

    setSessions((prev) => [newSession, ...prev]);

    // Update patient XP, Streak, Level, and readiness
    const xpGain = sessionData.rehabQualityScore;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== activePatientId) return p;
        const newXp = p.xp + xpGain;
        const newLevel = Math.floor(newXp / 350) + 1;
        const newStreak = p.streakDays + 1;
        const newCompleted = Math.min(p.weeklyGoalSessions, p.completedSessionsThisWeek + 1);
        const newRom = Math.min(100, p.currentROM + Math.floor(sessionData.rehabQualityScore / 25));
        const newGrip = Math.min(100, Math.round(sessionData.gripScore || p.currentGrip));

        return {
          ...p,
          xp: newXp,
          level: newLevel,
          streakDays: newStreak,
          completedSessionsThisWeek: newCompleted,
          currentROM: newRom,
          currentGrip: newGrip,
          readinessScore: Math.min(95, Math.round((p.readinessScore + sessionData.rehabQualityScore) / 2)),
          status: 'On Track',
        };
      })
    );

    return newSession;
  };

  const resetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setSessions(INITIAL_SESSIONS);
    setPrograms(INITIAL_PROGRAMS);
    setAlerts(INITIAL_ALERTS);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_patients`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_sessions`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_programs`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_alerts`);
    setSimulatedHRState(72);
    setSafetyState('SAFE');
    setActiveCompensation(null);
  };

  return (
    <RehabContext.Provider
      value={{
        role,
        setRole,
        activePatientId,
        setActivePatientId,
        activePatient,
        patients,
        sessions,
        programs,
        activeProgram,
        alerts,
        language,
        setLanguage,
        toggleLanguage,
        voiceGuidance,
        setVoiceGuidance,
        deviceStatus,
        simulatedHR,
        setSimulatedHR,
        safetyState,
        activeCompensation,
        triggerCompensation,
        clearCompensation,
        triggerHRSpike,
        triggerSafetyEvent,
        resetHRToBaseline,
        saveSession,
        approveDifficultyRecommendation,
        updateProgram,
        updateTherapistNotes,
        resolveAlert,
        createAlert,
        completePatientOnboarding,
        toggleVagalStimulation,
        resetDemoData,
        showArchitectureModal,
        setShowArchitectureModal,
        showDeviceStatusModal,
        setShowDeviceStatusModal,
        activePage,
        setActivePage,
        selectedGameForSession,
        setSelectedGameForSession,
      }}
    >
      {children}
    </RehabContext.Provider>
  );
};

export const useRehab = () => {
  const context = useContext(RehabContext);
  if (!context) {
    throw new Error('useRehab must be used within a RehabProvider');
  }
  return context;
};
