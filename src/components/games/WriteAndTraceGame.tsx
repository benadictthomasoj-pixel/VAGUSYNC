import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Point } from '../../services/handTracking/types';
import { CheckCircle2, PenTool, Sparkles } from 'lucide-react';

interface WriteAndTraceGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface StrokeTask {
  id: string;
  category: 'Lines' | 'Curves' | 'Shapes' | 'Letters' | 'Numbers';
  label: string;
  symbol: string;
  pointsGenerator: () => Point[];
}

const WRITE_TASKS: StrokeTask[] = [
  // Stage A: Lines
  {
    id: 'line-h',
    category: 'Lines',
    label: 'Horizontal Line',
    symbol: '—',
    pointsGenerator: () => {
      const pts: Point[] = [];
      for (let i = 0; i <= 50; i++) {
        pts.push({ x: 0.20 + (i / 50) * 0.60, y: 0.50 });
      }
      return pts;
    },
  },
  {
    id: 'line-v',
    category: 'Lines',
    label: 'Vertical Stroke',
    symbol: '|',
    pointsGenerator: () => {
      const pts: Point[] = [];
      for (let i = 0; i <= 50; i++) {
        pts.push({ x: 0.50, y: 0.22 + (i / 50) * 0.56 });
      }
      return pts;
    },
  },
  // Stage B: Curves
  {
    id: 'curve-s',
    category: 'Curves',
    label: 'S-Curve Flow',
    symbol: '~',
    pointsGenerator: () => {
      const pts: Point[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        pts.push({
          x: 0.20 + t * 0.60,
          y: 0.50 + Math.sin(t * Math.PI * 2) * 0.22,
        });
      }
      return pts;
    },
  },
  // Stage C: Shapes
  {
    id: 'shape-circle',
    category: 'Shapes',
    label: 'Circle Loop',
    symbol: '○',
    pointsGenerator: () => {
      const pts: Point[] = [];
      for (let i = 0; i <= 70; i++) {
        const rad = (i / 70) * Math.PI * 2;
        pts.push({
          x: 0.50 + Math.cos(rad) * 0.22,
          y: 0.50 + Math.sin(rad) * 0.28,
        });
      }
      return pts;
    },
  },
  {
    id: 'shape-triangle',
    category: 'Shapes',
    label: 'Triangle Stroke',
    symbol: '△',
    pointsGenerator: () => {
      const pts: Point[] = [];
      // Left side: (0.28, 0.75) to (0.50, 0.25)
      for (let i = 0; i <= 25; i++) {
        pts.push({ x: 0.28 + (i / 25) * 0.22, y: 0.75 - (i / 25) * 0.50 });
      }
      // Right side: (0.50, 0.25) to (0.72, 0.75)
      for (let i = 0; i <= 25; i++) {
        pts.push({ x: 0.50 + (i / 25) * 0.22, y: 0.25 + (i / 25) * 0.50 });
      }
      // Bottom: (0.72, 0.75) to (0.28, 0.75)
      for (let i = 0; i <= 25; i++) {
        pts.push({ x: 0.72 - (i / 25) * 0.44, y: 0.75 });
      }
      return pts;
    },
  },
  // Stage D: Letters
  {
    id: 'letter-a',
    category: 'Letters',
    label: 'Letter A Character',
    symbol: 'A',
    pointsGenerator: () => {
      const pts: Point[] = [];
      // Up-left to apex
      for (let i = 0; i <= 25; i++) {
        pts.push({ x: 0.30 + (i / 25) * 0.20, y: 0.76 - (i / 25) * 0.50 });
      }
      // Apex to bottom-right
      for (let i = 0; i <= 25; i++) {
        pts.push({ x: 0.50 + (i / 25) * 0.20, y: 0.26 + (i / 25) * 0.50 });
      }
      return pts;
    },
  },
  {
    id: 'letter-c',
    category: 'Letters',
    label: 'Letter C Arc',
    symbol: 'C',
    pointsGenerator: () => {
      const pts: Point[] = [];
      for (let i = 0; i <= 60; i++) {
        const rad = Math.PI * 0.25 + (i / 60) * Math.PI * 1.5;
        pts.push({
          x: 0.50 + Math.cos(rad) * 0.22,
          y: 0.50 + Math.sin(rad) * 0.28,
        });
      }
      return pts;
    },
  },
  // Stage E: Numbers
  {
    id: 'number-3',
    category: 'Numbers',
    label: 'Number 3 Flow',
    symbol: '3',
    pointsGenerator: () => {
      const pts: Point[] = [];
      // Top loop
      for (let i = 0; i <= 30; i++) {
        const rad = -Math.PI * 0.5 + (i / 30) * Math.PI;
        pts.push({ x: 0.50 + Math.cos(rad) * 0.16, y: 0.38 + Math.sin(rad) * 0.14 });
      }
      // Bottom loop
      for (let i = 0; i <= 30; i++) {
        const rad = -Math.PI * 0.5 + (i / 30) * Math.PI;
        pts.push({ x: 0.50 + Math.cos(rad) * 0.19, y: 0.64 + Math.sin(rad) * 0.16 });
      }
      return pts;
    },
  },
];

export const WriteAndTraceGame: React.FC<WriteAndTraceGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [deviations, setDeviations] = useState<number[]>([]);
  const [taskStartTime, setTaskStartTime] = useState(Date.now());
  const [assessmentModal, setAssessmentModal] = useState<{
    taskName: string;
    accuracy: number;
    smoothness: number;
    deviation: number;
    time: string;
  } | null>(null);

  const task = WRITE_TASKS[currentTaskIndex % WRITE_TASKS.length];
  const targetPoints = useRef<Point[]>([]);
  const patientTrail = useRef<Point[]>([]);

  // Initialize task target points
  useEffect(() => {
    targetPoints.current = task.pointsGenerator();
    patientTrail.current = [];
    setCurrentProgress(0);
    setDeviations([]);
    setTaskStartTime(Date.now());
  }, [currentTaskIndex]);

  // Main canvas animation & tracking loop over live camera
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = targetPoints.current;
      if (pts.length > 1) {
        // Draw Guide Target Track
        ctx.beginPath();
        ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
        }
        ctx.lineWidth = 26 - difficulty * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(10, 132, 255, 0.25)';
        ctx.stroke();

        // Inner reference spline
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#0A84FF';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Progress filled stroke in vibrant emerald
        const completedIdx = Math.floor((currentProgress / 100) * (pts.length - 1));
        if (completedIdx > 0) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
          for (let i = 1; i <= completedIdx; i++) {
            ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
          }
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#30D158';
          ctx.shadowColor = '#30D158';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Start point indicator
        ctx.beginPath();
        ctx.arc(pts[0].x * canvas.width, pts[0].y * canvas.height, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#30D158';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // End point indicator
        const endPt = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(endPt.x * canvas.width, endPt.y * canvas.height, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9F0A';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Patient's actual Hand Trajectory trail
      const trail = patientTrail.current;
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x * canvas.width, trail[0].y * canvas.height);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x * canvas.width, trail[i].y * canvas.height);
        }
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Process real index fingertip progression if detected
      if (handState.detected && !isPaused) {
        processHandTrace(handState.indexTip, canvas.width, canvas.height);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [handState, difficulty, task, currentProgress, isPaused]);

  // Process index fingertip progression along the path
  const processHandTrace = (indexTip: Point, width: number, height: number) => {
    const pts = targetPoints.current;
    if (pts.length === 0) return;

    let minDistance = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(indexTip.x - pts[i].x, indexTip.y - pts[i].y);
      if (d < minDistance) {
        minDistance = d;
        closestIdx = i;
      }
    }

    const deviationPx = Math.round(minDistance * Math.max(width, height));
    setDeviations((prev) => [...prev, deviationPx]);

    patientTrail.current.push({ x: indexTip.x, y: indexTip.y });
    if (patientTrail.current.length > 70) patientTrail.current.shift();

    const progress = Math.round((closestIdx / (pts.length - 1)) * 100);
    if (progress >= currentProgress && progress <= currentProgress + 18) {
      setCurrentProgress(progress);

      if (progress >= 96) {
        finishTraceTask();
      }
    }
  };

  const finishTraceTask = () => {
    soundManager.playTargetSuccess();
    onExertionTick(1.2);

    const durationSec = ((Date.now() - taskStartTime) / 1000).toFixed(1);
    const avgDev = deviations.length > 0 ? Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length) : 11;
    const accuracy = Math.max(72, Math.min(99, Math.round(100 - avgDev * 1.6)));
    const smoothness = handState.smoothness || 82;

    const result = {
      taskName: `${task.category}: ${task.label}`,
      accuracy,
      smoothness,
      deviation: avgDev,
      time: durationSec,
    };

    setAssessmentModal(result);

    const newReps = reps + 1;
    const repScore = Math.round(accuracy * 10);
    const newScore = score + repScore;

    setReps(newReps);
    setScore(newScore);
    onRepComplete(accuracy, newScore);

    if (newReps >= targetReps) {
      soundManager.playSessionComplete();
      onGameComplete({
        accuracy,
        score: newScore,
        movementQuality: accuracy,
      });
    } else {
      setTimeout(() => {
        setAssessmentModal(null);
        setCurrentTaskIndex((i) => i + 1);
      }, 2400);
    }
  };

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle="Write & Trace"
    >
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full block pointer-events-none"
        />

        {/* Top Right Stage Card */}
        <div className="absolute top-14 right-4 z-20 flex items-center gap-2 pointer-events-none">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg ${
              handState.pinch
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            {handState.pinch ? '● PEN DOWN (Writing)' : '○ PEN UP / Contact'}
          </span>

          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80 text-right shadow-lg">
            <div className="text-[9px] uppercase font-bold text-sky-400 tracking-wider">
              Handwriting Motor Preparation
            </div>
            <div className="text-xs font-extrabold text-white flex items-center gap-1.5 justify-end">
              <PenTool className="w-3 h-3 text-sky-400" />
              <span>{task.category}: {task.label}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 font-mono text-emerald-400 font-bold text-xs shadow-lg">
            {reps} / {targetReps}
          </div>
        </div>

        {/* Large Character Watermark Projected in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
          <span className="font-extrabold text-[150px] text-white select-none drop-shadow-2xl">
            {task.symbol}
          </span>
        </div>

        {/* WRITING MOTOR CONTROL ASSESSMENT MODAL */}
        {assessmentModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Handwriting Motor Preparation
                </span>
                <h3 className="text-lg font-extrabold text-white">WRITING MOTOR CONTROL</h3>
                <p className="text-xs text-slate-300 font-semibold">{assessmentModal.taskName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-left pt-1">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Accuracy</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{assessmentModal.accuracy}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Smoothness</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{assessmentModal.smoothness}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Path deviation</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{assessmentModal.deviation} px</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Completion</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{assessmentModal.time} sec</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                Loading next handwriting preparation exercise...
              </p>
            </div>
          </div>
        )}

        {/* In-Game Guidance text */}
        <div className="absolute bottom-3.5 left-6 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 pointer-events-none z-30">
          Trace the virtual character with your real index finger from green to orange
        </div>
      </div>
    </CameraGameContainer>
  );
};
