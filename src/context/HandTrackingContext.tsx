import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  HandTrackingState,
  HandCalibrationStatus,
  IHandInputProvider,
} from '../services/handTracking/types';
import { CameraHandProvider } from '../services/handTracking/CameraHandProvider';
import { SimulationHandProvider } from '../services/handTracking/SimulationHandProvider';
import { hardwareConnection } from '../hardware/HardwareConnection';
import { inputNormalizer } from '../input/InputNormalizer';
import { HardwareState } from '../hardware/hardwareTypes';

interface HandTrackingContextType {
  handState: HandTrackingState;
  calibrationStatus: HandCalibrationStatus;
  trackingMode: 'camera' | 'simulation';
  setTrackingMode: (mode: 'camera' | 'simulation') => void;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  showCameraOverlay: boolean;
  setShowCameraOverlay: (show: boolean) => void;
  videoElement: HTMLVideoElement | null;
  stream: MediaStream | null;
  isCalibrated: boolean;
  setIsCalibrated: (val: boolean) => void;
}

const HandTrackingContext = createContext<HandTrackingContextType | undefined>(undefined);

export const HandTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trackingMode, setTrackingModeState] = useState<'camera' | 'simulation'>('camera');
  const [showCameraOverlay, setShowCameraOverlay] = useState<boolean>(true);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(true); // Auto-calibrated by default

  const providerRef = useRef<IHandInputProvider | null>(null);

  const [handState, setHandState] = useState<HandTrackingState>({
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
  });

  const [calibrationStatus, setCalibrationStatus] = useState<HandCalibrationStatus>({
    hasCameraPermission: false,
    isModelLoaded: false,
    isHandInFrame: false,
    isTrackingStable: false,
    stabilityScore: 0,
    feedbackMessage: 'Show your palm to the camera',
  });

  // Switch provider when mode changes
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.stop();
    }

    if (trackingMode === 'camera') {
      providerRef.current = new CameraHandProvider();
    } else {
      providerRef.current = new SimulationHandProvider();
    }

    const unsubscribe = providerRef.current.onUpdate((state) => {
      // Check if physical hardware push button is pressed
      const hw = hardwareConnection.getState();
      const combinedPinch = state.pinch || (hw.connected && !hw.isStale && hw.buttonPressed);

      const effectiveState: HandTrackingState = {
        ...state,
        pinch: combinedPinch,
        source: hw.connected && state.detected ? 'wearable' : state.source,
      };

      setHandState(effectiveState);
      inputNormalizer.updateCameraState(effectiveState);

      if (providerRef.current) {
        setCalibrationStatus(providerRef.current.getCalibrationStatus());
      }
    });

    // Also subscribe to hardware state changes to update button press immediately even between camera frames
    const unsubHw = hardwareConnection.subscribe((hw: HardwareState) => {
      if (hw.connected && !hw.isStale) {
        setHandState((prev) => {
          const nextPinch = prev.pinch || hw.buttonPressed;
          if (prev.pinch !== nextPinch) {
            const nextState = { ...prev, pinch: nextPinch };
            inputNormalizer.updateCameraState(nextState);
            return nextState;
          }
          return prev;
        });
      }
    });

    // Automatically start tracking
    providerRef.current.start();

    return () => {
      unsubscribe();
      unsubHw();
      if (providerRef.current) {
        providerRef.current.stop();
      }
    };
  }, [trackingMode]);

  const startTracking = async (): Promise<boolean> => {
    if (!providerRef.current) return false;
    return await providerRef.current.start();
  };

  const stopTracking = () => {
    if (providerRef.current) {
      providerRef.current.stop();
    }
  };

  const setTrackingMode = (mode: 'camera' | 'simulation') => {
    setTrackingModeState(mode);
  };

  const videoElement = providerRef.current ? providerRef.current.getVideoElement() : null;
  const stream = providerRef.current && providerRef.current.getStream ? providerRef.current.getStream() : null;

  return (
    <HandTrackingContext.Provider
      value={{
        handState,
        calibrationStatus,
        trackingMode,
        setTrackingMode,
        startTracking,
        stopTracking,
        showCameraOverlay,
        setShowCameraOverlay,
        videoElement,
        stream,
        isCalibrated,
        setIsCalibrated,
      }}
    >
      {children}
    </HandTrackingContext.Provider>
  );
};

export const useHandTracking = () => {
  const context = useContext(HandTrackingContext);
  if (!context) {
    throw new Error('useHandTracking must be used within a HandTrackingProvider');
  }
  return context;
};
