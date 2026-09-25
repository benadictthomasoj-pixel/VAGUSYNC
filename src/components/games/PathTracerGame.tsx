import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Point } from '../../services/handTracking/types';
import { CheckCircle2 } from 'lucide-react';

interface PathTracerGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

export const PathTracerGame: React.FC<PathTracerGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [movementQuality, setMovementQuality] = useState(90);
  const [deviations, setDeviations] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [traceCompleteModal, setTraceCompleteModal] = useState<{
    accuracy: number;
    smoothness: number;
    deviation: number;
    time: string;
  } | null>(null);

  const pathPoints = useRef<Point[]>([]);
  const patientTrail = useRef<Point[]>([]);

  const generatePath = () => {
    const pts: Point[] = [];
    const steps = 80;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = 0.15 + t * 0.70;
      const y =
        0.52 +
        Math.sin(t * Math.PI * 2) * 0.22 +
        Math.cos(t * Math.PI * 4) * (0.06 * (difficulty > 2 ? 1 : 0.5));
      pts.push({ x, y });
    }
    pathPoints.current = pts;
    patientTrail.current = [];
    setCurrentProgress(0);
    setDeviations([]);
    setStartTime(Date.now());
  };

  useEffect(() => {
    generatePath();
  }, [difficulty]);

  // Main canvas animation loop rendering path directly over live camera
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = pathPoints.current;
      if (pts.length > 1) {
        // 1. Draw outer glowing guide track
        ctx.beginPath();
        ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
        }
        ctx.lineWidth = 32 - difficulty * 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(10, 132, 255, 0.25)';
        ctx.stroke();

        // 2. Inner target core spline
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0A84FF';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Completed progress segment in emerald
        const completedIdx = Math.floor((currentProgress / 100) * (pts.length - 1));
        if (completedIdx > 0) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
          for (let i = 1; i <= completedIdx; i++) {
            ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
          }
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#30D158';
          ctx.shadowColor = '#30D158';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Start landmark node
        ctx.beginPath();
        ctx.arc(pts[0].x * canvas.width, pts[0].y * canvas.height, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#30D158';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // End / Goal landmark node
        const last = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(last.x * canvas.width, last.y * canvas.height, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9F0A';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 4. Draw Patient's actual Hand Trajectory Trail
      const trail = patientTrail.current;
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x * canvas.width, trail[0].y * canvas.height);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x * canvas.width, trail[i].y * canvas.height);
        }
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Process real index fingertip progression if detected
      if (handState.detected && !isPaused) {
        processHandOnPath(handState.indexTip, canvas.width, canvas.height);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [handState, currentProgress, difficulty, isPaused]);

  const processHandOnPath = (indexTip: Point, width: number, height: number) => {
    const pts = pathPoints.current;
    if (pts.length === 0) return;

    let closestDist = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(indexTip.x - pts[i].x, indexTip.y - pts[i].y);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }

    // Record trail point
    patientTrail.current.push({ x: indexTip.x, y: indexTip.y });
    if (patientTrail.current.length > 50) patientTrail.current.shift();

    const deviationPx = Math.round(closestDist * Math.max(width, height));
    setDeviations((prev) => [...prev, deviationPx]);

    const tolerance = 0.14;

    if (closestDist <= tolerance) {
      const progressPercent = Math.round((closestIndex / (pts.length - 1)) * 100);

      if (progressPercent >= currentProgress && progressPercent <= currentProgress + 18) {
        setCurrentProgress(progressPercent);

        if (progressPercent >= 96) {
          finishTrace();
        }
      }
    }
  };

  const finishTrace = () => {
    soundManager.playTargetSuccess();
    onExertionTick(1.2);

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgDev = deviations.length > 0 ? Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length) : 9;
    const accuracy = Math.max(75, Math.min(99, Math.round(100 - avgDev * 1.5)));
    const smoothness = handState.smoothness || 84;

    const modalData = {
      accuracy,
      smoothness,
      deviation: avgDev,
      time: durationSec,
    };
    setTraceCompleteModal(modalData);

    const newReps = reps + 1;
    const repScore = Math.round(accuracy * 9);
    const newScore = score + repScore;

    setReps(newReps);
    setScore(newScore);
    onRepComplete(accuracy, newScore);

    if (newReps >= targetReps) {
      soundManager.playSessionComplete();
      onGameComplete({
        accuracy,
        score: newScore,
        movementQuality: smoothness,
      });
    } else {
      setTimeout(() => {
        setTraceCompleteModal(null);
        generatePath();
      }, 2200);
    }
  };

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle="Path Tracer"
    >
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full block pointer-events-none"
        />

        {/* Start / Goal Labels */}
        <div className="absolute bottom-12 left-10 text-xs font-extrabold text-emerald-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-emerald-500/40 pointer-events-none z-20">
          ● START
        </div>
        <div className="absolute bottom-12 right-10 text-xs font-extrabold text-amber-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-amber-500/40 pointer-events-none z-20">
          ★ GOAL
        </div>

        {/* TRACE COMPLETE SUMMARY MODAL OVERLAY */}
        {traceCompleteModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Kinematic Trajectory Assessment
                </span>
                <h3 className="text-xl font-extrabold text-white">TRACE COMPLETE</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-left pt-1">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Accuracy</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{traceCompleteModal.accuracy}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Smoothness</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{traceCompleteModal.smoothness}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Deviation</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{traceCompleteModal.deviation} px</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Time</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{traceCompleteModal.time} sec</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom HUD */}
        <div className="absolute bottom-3.5 left-6 right-6 flex items-center justify-between text-xs text-slate-200 pointer-events-none z-30">
          <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-sky-300">
            Trace from START to GOAL using your real index finger
          </span>
          <span className="font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-emerald-400 font-bold">
            Progress: {currentProgress}% | Reps: {reps} / {targetReps}
          </span>
        </div>
      </div>
    </CameraGameContainer>
  );
};
