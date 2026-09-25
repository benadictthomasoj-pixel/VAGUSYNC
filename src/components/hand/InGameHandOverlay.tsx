import React, { useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { Camera, Eye, EyeOff, AlertTriangle, ShieldCheck, Hand } from 'lucide-react';

interface InGameHandOverlayProps {
  isPaused: boolean;
  onTrackingLostPause?: (lost: boolean) => void;
}

export const InGameHandOverlay: React.FC<InGameHandOverlayProps> = ({
  isPaused,
  onTrackingLostPause,
}) => {
  const {
    handState,
    trackingMode,
  } = useHandTracking();

  // Notify parent if hand is lost
  useEffect(() => {
    if (trackingMode === 'camera') {
      if (!handState.detected) {
        onTrackingLostPause?.(true);
      } else {
        onTrackingLostPause?.(false);
      }
    }
  }, [handState.detected, trackingMode, onTrackingLostPause]);

  let statusLabel = '● CAMERA ACTIVE';
  if (trackingMode === 'simulation') {
    statusLabel = '● SIMULATION MODE';
  } else if (handState.detected) {
    statusLabel = handState.status === 'tracking' ? '● Tracking' : '● Hand detected';
  } else if (handState.status === 'tracking-lost') {
    statusLabel = '● Move your hand into view';
  } else {
    statusLabel = '● Looking for your hand...';
  }

  return (
    <>
      {/* Top Left Hand Tracking Status Bar */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-md transition-all ${
            trackingMode === 'simulation'
              ? 'bg-indigo-950/90 border-indigo-500/50 text-indigo-300'
              : handState.detected
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/90 border-sky-500/50 text-sky-300'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              trackingMode === 'simulation'
                ? 'bg-indigo-400'
                : handState.detected
                ? 'bg-emerald-400 animate-ping'
                : 'bg-sky-400 animate-pulse'
            }`}
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Non-Blocking Floating Prompt when searching or hand temporarily out of view */}
      {trackingMode === 'camera' && !handState.detected && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-slate-900/95 border border-sky-500/60 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sky-200 text-xs font-bold">
            <span className="text-base animate-bounce">🖐</span>
            <span>
              {handState.status === 'tracking-lost'
                ? 'Move your hand into view'
                : 'Looking for your hand...'}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
