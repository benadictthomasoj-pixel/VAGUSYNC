import React, { useEffect, useRef, useState } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehab } from '../../context/RehabContext';
import {
  Camera,
  CameraOff,
  Hand,
  ShieldCheck,
  AlertTriangle,
  Heart,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface CameraGameContainerProps {
  children: React.ReactNode;
  isPaused?: boolean;
  onTrackingStateChange?: (detected: boolean) => void;
  className?: string;
  gameTitle?: string;
}

export const CameraGameContainer: React.FC<CameraGameContainerProps> = ({
  children,
  isPaused = false,
  onTrackingStateChange,
  className = '',
  gameTitle,
}) => {
  const {
    handState,
    trackingMode,
    setTrackingMode,
    videoElement,
    stream,
    stopTracking,
    startTracking,
  } = useHandTracking();

  const { simulatedHR, safetyState } = useRehab();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showDetectedToast, setShowDetectedToast] = useState(false);
  const prevDetectedRef = useRef(false);

  // Attach media stream to video element for mirrored live background
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && trackingMode === 'camera') {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else if (videoElement && trackingMode === 'camera') {
      if (videoElement.srcObject) {
        video.srcObject = videoElement.srcObject;
        video.play().catch(() => {});
      }
    } else {
      video.srcObject = null;
    }
  }, [stream, videoElement, trackingMode]);

  // Flash subtle "Hand Detected" toast when newly found
  useEffect(() => {
    if (trackingMode === 'camera') {
      if (handState.detected && !prevDetectedRef.current) {
        setShowDetectedToast(true);
        const t = setTimeout(() => setShowDetectedToast(false), 1600);
        onTrackingStateChange?.(true);
        prevDetectedRef.current = true;
        return () => clearTimeout(t);
      } else if (!handState.detected && prevDetectedRef.current) {
        onTrackingStateChange?.(false);
        prevDetectedRef.current = false;
      }
    }
  }, [handState.detected, trackingMode, onTrackingStateChange]);

  // Canvas loop for MediaPipe 21 Hand Landmarks & Skeleton
  useEffect(() => {
    let animId: number;

    const renderSkeleton = () => {
      const canvas = skeletonCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 500;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw primary hand 21 landmarks if detected
      if (handState.detected && handState.rawLandmarks && handState.rawLandmarks.length >= 21) {
        const lm = handState.rawLandmarks;
        const w = canvas.width;
        const h = canvas.height;

        // MediaPipe connections:
        // Thumb: 0-1-2-3-4
        // Index: 0-5-6-7-8
        // Middle: 5-9-10-11-12
        // Ring: 9-13-14-15-16
        // Pinky: 13-17-18-19-20
        // Palm base: 0-17, 0-5
        const bones = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [5, 9], [9, 10], [10, 11], [11, 12], // Middle
          [9, 13], [13, 14], [14, 15], [15, 16], // Ring
          [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [0, 17], // Palm base
        ];

        // Draw bone lines
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;

        bones.forEach(([i, j]) => {
          if (lm[i] && lm[j]) {
            ctx.beginPath();
            ctx.moveTo(lm[i].x * w, lm[i].y * h);
            ctx.lineTo(lm[j].x * w, lm[j].y * h);
            ctx.stroke();
          }
        });
        ctx.restore();

        // Draw joint nodes
        lm.forEach((pt, idx) => {
          if (idx === 8) return; // Index tip is drawn with custom interaction marker
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, idx === 0 ? 5 : idx === 4 ? 4 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? '#ffffff' : idx === 4 ? '#38bdf8' : '#7dd3fc';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Index Fingertip Interaction Cursor ◉ (Landmark 8)
        const tip = lm[8];
        const tipX = tip.x * w;
        const tipY = tip.y * h;

        // Outer pulsing ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 55, 95, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glowing disc
        ctx.beginPath();
        ctx.arc(tipX, tipY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 55, 95, 0.45)';
        ctx.fill();
        ctx.strokeStyle = '#FF375F';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#FF375F';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Center solid crosshair dot
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // Draw secondary hand if 2 hands detected (Bilateral mode)
      if (handState.secondaryHand?.detected && handState.secondaryHand) {
        const sec = handState.secondaryHand;
        const w = canvas.width;
        const h = canvas.height;

        const secTipX = sec.indexTip.x * w;
        const secTipY = sec.indexTip.y * h;

        ctx.save();
        ctx.beginPath();
        ctx.arc(secTipX, secTipY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(secTipX, secTipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(renderSkeleton);
    };

    animId = requestAnimationFrame(renderSkeleton);
    return () => cancelAnimationFrame(animId);
  }, [handState]);

  const handleStopCamera = () => {
    stopTracking();
    setTrackingMode('simulation');
  };

  const handleStartCamera = () => {
    setTrackingMode('camera');
    startTracking();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[480px] sm:h-[540px] md:h-[580px] rounded-3xl overflow-hidden select-none touch-none shadow-2xl border-2 border-slate-800/80 bg-slate-950 font-sans ${className}`}
    >
      {/* 1. LIVE MIRRORED CAMERA VIDEO BACKGROUND */}
      {trackingMode === 'camera' && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* Simulation Mode Background (when user explicitly chooses simulation) */}
      {trackingMode === 'simulation' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        </div>
      )}

      {/* Subtle contrast tint for crisp virtual game element visibility */}
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />

      {/* 2. MEDIAPIPE 21-LANDMARK SKELETON CANVAS */}
      <canvas
        ref={skeletonCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 3. VIRTUAL GAME OBJECTS & INTERACTION LAYER */}
      <div className="absolute inset-0 z-20">{children}</div>

      {/* 4. NON-BLOCKING TOP HUD BAR */}
      <div className="absolute top-3.5 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Dynamic Status Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all ${
              trackingMode === 'simulation'
                ? 'bg-indigo-950/90 border-indigo-500/50 text-indigo-300'
                : handState.detected
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
                : handState.status === 'permission-denied'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-300'
                : 'bg-slate-900/90 border-sky-500/50 text-sky-300'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                trackingMode === 'simulation'
                  ? 'bg-indigo-400'
                  : handState.detected
                  ? 'bg-emerald-400 animate-ping'
                  : handState.status === 'permission-denied'
                  ? 'bg-rose-400'
                  : 'bg-sky-400 animate-pulse'
              }`}
            />
            <span>
              {trackingMode === 'simulation'
                ? '● SIMULATION MODE'
                : handState.detected
                ? '● HAND TRACKING'
                : handState.status === 'permission-denied'
                ? '⚠ CAMERA PERMISSION REQUIRED'
                : '● CAMERA ACTIVE • Looking for hand...'}
            </span>
          </div>

          {/* Privacy Badge */}
          {trackingMode === 'camera' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-sky-300 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Processing Locally</span>
            </div>
          )}
        </div>

        {/* Right: Cardiac HUD & Mode Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Cardiac Status */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white shadow-lg">
            <Heart
              className={`w-4 h-4 ${
                safetyState === 'SAFETY_EVENT'
                  ? 'text-[#FF375F] fill-[#FF375F] animate-ping'
                  : 'text-[#FF375F] fill-[#FF375F]'
              }`}
            />
            <span className="font-mono text-xs font-bold">{simulatedHR} BPM</span>
            <span
              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                safetyState === 'SAFETY_EVENT'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : safetyState === 'WARNING'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
              }`}
            >
              ● {safetyState === 'SAFETY_EVENT' ? 'SAFETY EVENT' : safetyState === 'WARNING' ? 'WARNING' : 'SAFE'}
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          {trackingMode === 'camera' ? (
            <button
              onClick={handleStopCamera}
              className="px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Stop Camera Stream and switch to simulation fallback"
            >
              <CameraOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Stop Camera</span>
            </button>
          ) : (
            <button
              onClick={handleStartCamera}
              className="px-3.5 py-1.5 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white border border-blue-400/40 backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Enable live camera hand tracking"
            >
              <Camera className="w-3.5 h-3.5 text-blue-200" />
              <span>Enable Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. SUBTLE SEARCHING GUIDANCE PILL (NON-BLOCKING) */}
      {trackingMode === 'camera' && !handState.detected && handState.status !== 'permission-denied' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900/90 border border-sky-500/50 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sky-200 text-xs font-bold">
            <span className="text-base animate-bounce">🖐</span>
            <span>Show your palm to the camera to begin</span>
          </div>
        </div>
      )}

      {/* 6. SUBTLE "HAND DETECTED" TOAST */}
      {showDetectedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border border-emerald-400/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>✓ HAND DETECTED</span>
        </div>
      )}

      {/* 7. DEDICATED PERMISSION ERROR CARD (ONLY IF CAMERA PERMISSION DENIED) */}
      {trackingMode === 'camera' && handState.status === 'permission-denied' && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-7 max-w-sm w-full border-2 border-rose-500/70 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <CameraOff className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Camera Access Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Please allow camera access in your browser settings to use hand tracking.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => startTracking()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => setTrackingMode('simulation')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Use Simulation Mode Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CARDIAC SAFETY PAUSE FREEZE */}
      {safetyState === 'SAFETY_EVENT' && (
        <div className="absolute inset-0 z-40 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 text-white rounded-3xl p-7 max-w-md w-full border-2 border-rose-500 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
              <Heart className="w-9 h-9 fill-rose-500" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Safety Protection Engaged
              </div>
              <h3 className="text-xl font-extrabold text-white">
                STOP — CARDIAC SAFETY EVENT
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Heart rate reached <span className="font-bold text-rose-400 font-mono">{simulatedHR} BPM</span> exceeding safe ceiling. Rest comfortably. Keep your hand relaxed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
