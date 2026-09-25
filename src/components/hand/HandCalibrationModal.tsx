import React, { useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Shield,
  Sliders,
  Eye,
  Activity,
  Lightbulb,
  User,
} from 'lucide-react';

interface HandCalibrationModalProps {
  onCalibrationComplete: () => void;
  gameName: string;
}

export const HandCalibrationModal: React.FC<HandCalibrationModalProps> = ({
  onCalibrationComplete,
  gameName,
}) => {
  const {
    handState,
    calibrationStatus,
    trackingMode,
    setTrackingMode,
    startTracking,
    videoElement,
    setIsCalibrated,
  } = useHandTracking();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startTracking();
  }, [trackingMode]);

  // Render mirrored video frame and 21 hand landmarks on canvas
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw camera video feed mirrored
      if (videoElement && videoElement.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Dark tech gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Guide Target Box
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(canvas.width * 0.18, canvas.height * 0.12, canvas.width * 0.64, canvas.height * 0.76);
      ctx.setLineDash([]);

      // Draw Hand Landmarks if detected
      if (handState.detected && handState.rawLandmarks && handState.rawLandmarks.length >= 21) {
        const lm = handState.rawLandmarks;
        const w = canvas.width;
        const h = canvas.height;

        // Skeleton connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // index
          [5, 9], [9, 10], [10, 11], [11, 12], // middle
          [9, 13], [13, 14], [14, 15], [15, 16], // ring
          [13, 17], [17, 18], [18, 19], [19, 20], // pinky
          [0, 17],
        ];

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        connections.forEach(([i, j]) => {
          const p1 = lm[i];
          const p2 = lm[j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }
        });

        // Joint nodes
        lm.forEach((l, idx) => {
          if (idx === 8) return;
          ctx.beginPath();
          ctx.arc(l.x * w, l.y * h, idx === 0 ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? '#ffffff' : '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Prominent index tip marker ◉
        const tip = lm[8];
        ctx.save();
        ctx.beginPath();
        ctx.arc(tip.x * w, tip.y * h, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 55, 95, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#FF375F';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tip.x * w, tip.y * h, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [handState, videoElement]);

  const handleStartGame = () => {
    setIsCalibrated(true);
    onCalibrationComplete();
  };

  const isReady = trackingMode === 'simulation' || calibrationStatus.isTrackingStable;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Camera className="w-3.5 h-3.5" />
              Vision Kinematics Calibration
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Camera & Hand Calibration
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTrackingMode('camera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trackingMode === 'camera'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Camera (Live)
            </button>
            <button
              onClick={() => setTrackingMode('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trackingMode === 'simulation'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulation Mode
            </button>
          </div>
        </div>

        {/* Live Camera Feed Canvas */}
        <div className="relative h-72 sm:h-84 bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between">
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-cover block"
          />

          {/* Center Guide Cue */}
          {!handState.detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none bg-slate-950/40 backdrop-blur-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-3xl mb-2 animate-pulse">
                🖐
              </div>
              <p className="text-white font-bold text-sm">
                Raise your affected hand into the camera frame
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                VagusSync will detect 21 anatomical landmarks in real-time
              </p>
            </div>
          )}

          {/* Live Tracking Status Pill Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md border ${
                calibrationStatus.isTrackingStable
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300'
                  : handState.detected
                  ? 'bg-amber-950/85 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/85 border-slate-700 text-slate-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  calibrationStatus.isTrackingStable
                    ? 'bg-emerald-400 animate-ping'
                    : handState.detected
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              <span>{calibrationStatus.feedbackMessage}</span>
            </div>

            {handState.detected && (
              <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/85 border border-slate-700 text-blue-300 backdrop-blur-md">
                Hand: {handState.hand.toUpperCase()} • {Math.round(handState.stability)}% Stability
              </div>
            )}
          </div>
        </div>

        {/* Patient Positioning Guidance Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Camera Setup & Positioning Guidance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
              <span>Sit approximately 50–100 cm from camera</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
              <span>Keep upper body & face visible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
              <span>Raise the rehabilitation hand</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
              <span>Ensure room has sufficient lighting</span>
            </div>
          </div>
        </div>

        {/* Start Game Action */}
        <button
          onClick={handleStartGame}
          disabled={!isReady}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            isReady
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to {gameName} (Immersive Camera Mode)</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-slate-400 text-center italic">
          Privacy Guarantee: 100% in-browser processing. No camera frames or facial data are uploaded to servers.
        </p>
      </div>
    </div>
  );
};
