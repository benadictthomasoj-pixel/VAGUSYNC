import React, { createContext, useContext, useEffect, useState } from 'react';
import { HardwareState, INITIAL_HARDWARE_STATE } from './hardwareTypes';
import { hardwareConnection } from './HardwareConnection';
import { simulationHardware } from './SimulationHardware';

interface HardwareContextType {
  hardwareState: HardwareState;
  connectWebSocket: (url?: string) => void;
  disconnect: () => void;
  setSimulationMode: (enabled: boolean) => void;
  triggerSimulatedButton: (durationMs?: number) => void;
  setSimulatedHeartRate: (bpm: number) => void;
  setSimulatedTorsoCompensation: (pitchDegrees: number) => void;
  calibrateNeutral: () => void;
  resetCalibration: () => void;
}

const HardwareContext = createContext<HardwareContextType | undefined>(undefined);

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hardwareState, setHardwareState] = useState<HardwareState>(hardwareConnection.getState());

  useEffect(() => {
    const unsub = hardwareConnection.subscribe((state) => {
      setHardwareState(state);
    });
    return () => unsub();
  }, []);

  const connectWebSocket = (url?: string) => {
    hardwareConnection.connectWebSocket(url);
  };

  const disconnect = () => {
    hardwareConnection.disconnect();
  };

  const setSimulationMode = (enabled: boolean) => {
    hardwareConnection.setSimulationMode(enabled);
  };

  const triggerSimulatedButton = (durationMs = 400) => {
    simulationHardware.triggerButtonPulse(durationMs);
  };

  const setSimulatedHeartRate = (bpm: number) => {
    simulationHardware.setTargetHeartRate(bpm);
  };

  const setSimulatedTorsoCompensation = (pitchDegrees: number) => {
    simulationHardware.setTorsoCompensation(pitchDegrees);
  };

  const calibrateNeutral = () => {
    hardwareConnection.calibrateNeutral();
  };

  const resetCalibration = () => {
    hardwareConnection.resetCalibration();
  };

  return (
    <HardwareContext.Provider
      value={{
        hardwareState,
        connectWebSocket,
        disconnect,
        setSimulationMode,
        triggerSimulatedButton,
        setSimulatedHeartRate,
        setSimulatedTorsoCompensation,
        calibrateNeutral,
        resetCalibration,
      }}
    >
      {children}
    </HardwareContext.Provider>
  );
};

export const useHardware = (): HardwareContextType => {
  const context = useContext(HardwareContext);
  if (!context) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
};
