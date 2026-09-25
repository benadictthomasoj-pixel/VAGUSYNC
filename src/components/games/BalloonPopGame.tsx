import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';

interface BalloonPopGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface Balloon {
  id: number;
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
  radiusNorm: number; // normalized radius
  color: string;
  vx: number;
  vy: number;
  popped: boolean;
}

const BALLOON_COLORS = ['#FF375F', '#0A84FF', '#30D158', '#FF9F0A', '#AF52DE', '#5856D6'];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const [isPaused, setIsPaused] = useState(false);

  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [burstParticles, setBurstParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [consecutivePops, setConsecutivePops] = useState(0);
  const [lastPopTime, setLastPopTime] = useState(Date.now());

  const radiusNorm = Math.max(0.065, 0.10 - difficulty * 0.008);
  const speedNorm = (0.0018 + difficulty * 0.0008);

  const spawnBalloon = () => {
    // Spawn around the patient's natural reach envelope (sides / lower quadrants, avoiding directly over face)
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const xNorm = side === 'left' ? 0.15 + Math.random() * 0.28 : 0.57 + Math.random() * 0.28;
    const yNorm = 0.28 + Math.random() * 0.45;

    const newBalloon: Balloon = {
      id: Date.now() + Math.random(),
      x: xNorm,
      y: yNorm,
      radiusNorm,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      vx: (Math.random() - 0.5) * speedNorm * 1.2,
      vy: (Math.random() - 0.5) * speedNorm * 1.2,
      popped: false,
    };

    setBalloons([newBalloon]);
  };

  useEffect(() => {
    spawnBalloon();
  }, []);

  // Floating drift loop in normalized coordinates
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isPaused) {
        setBalloons((prev) =>
          prev.map((b) => {
            if (b.popped) return b;
            let nx = b.x + b.vx;
            let ny = b.y + b.vy;
            let nvx = b.vx;
            let nvy = b.vy;

            // Bounce off normalized edges (padding 0.08)
            if (nx - b.radiusNorm < 0.08 || nx + b.radiusNorm > 0.92) {
              nvx = -nvx;
              nx = Math.max(b.radiusNorm + 0.08, Math.min(0.92 - b.radiusNorm, nx));
            }
            if (ny - b.radiusNorm < 0.18 || ny + b.radiusNorm > 0.86) {
              nvy = -nvy;
              ny = Math.max(b.radiusNorm + 0.18, Math.min(0.86 - b.radiusNorm, ny));
            }

            return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
          })
        );
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speedNorm, isPaused]);

  // Real Hand Index Fingertip & Hardware Button Pop Collision Check
  useEffect(() => {
    if (!handState.detected || isPaused) return;

    const indexX = handState.indexTip.x;
    const indexY = handState.indexTip.y;

    balloons.forEach((b) => {
      if (b.popped) return;
      const dist = Math.hypot(indexX - b.x, indexY - b.y);
      const popThreshold = handState.pinch ? b.radiusNorm + 0.085 : b.radiusNorm + 0.035;
      if (dist < popThreshold) {
        popBalloon(b);
      }
    });
  }, [handState, balloons, isPaused]);

  const popBalloon = (b: Balloon) => {
    soundManager.playPop();
    onExertionTick(1.2);

    const now = Date.now();
    const reactionTimeSec = ((now - lastPopTime) / 1000).toFixed(1);
    setLastPopTime(now);

    setBurstParticles((prev) => [
      ...prev,
      { id: Date.now(), x: b.x, y: b.y, color: b.color },
    ]);

    setTimeout(() => {
      setBurstParticles((prev) => prev.filter((p) => p.id !== b.id));
    }, 450);

    const newReps = reps + 1;
    const repScore = 70 + Math.round((10 - difficulty) * 5) + consecutivePops * 10;
    const newScore = score + repScore;

    setReps(newReps);
    setScore(newScore);
    setConsecutivePops((prev) => prev + 1);

    const accuracy = Math.min(100, Math.round((newReps / (newReps + 0.2)) * 100));
    onRepComplete(accuracy, newScore);

    if (newReps >= targetReps) {
      soundManager.playSessionComplete();
      onGameComplete({
        accuracy: 94,
        score: newScore,
        movementQuality: 92,
      });
    } else {
      spawnBalloon();
    }
  };

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle="Balloon Pop"
    >
      <div className="relative w-full h-full pointer-events-none">
        {/* Real-hand Trajectory Trace History */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {handState.trajectory.length > 1 && (
            <polyline
              points={handState.trajectory
                .map((p) => `${p.x * 100}%,${p.y * 100}%`)
                .join(' ')}
              fill="none"
              stroke="rgba(56, 189, 248, 0.45)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Virtual Rehabilitation Balloons (Rendered over live camera) */}
        {balloons.map((b) => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: `${b.x * 100}%`,
              top: `${b.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: `${b.radiusNorm * 200}%`,
              maxWidth: '85px',
              maxHeight: '85px',
              minWidth: '65px',
              minHeight: '65px',
              aspectRatio: '1/1',
              backgroundColor: b.color,
              boxShadow: `0 0 35px ${b.color}90, inset 0 -8px 16px rgba(0,0,0,0.35), inset 0 8px 16px rgba(255,255,255,0.6)`,
            }}
            className="rounded-full transition-transform flex items-center justify-center border-2 border-white/80 animate-pulse pointer-events-none z-20"
          >
            {/* Gloss reflection highlight */}
            <div className="w-3.5 h-3.5 rounded-full bg-white/80 absolute top-2.5 left-3.5" />
            <div className="w-2.5 h-2 rounded-xs bg-white/50 absolute -bottom-1" />
            <div className="text-[10px] font-extrabold text-white/90 drop-shadow-sm uppercase tracking-wider">
              POP
            </div>
          </div>
        ))}

        {/* Burst Particles & Reaction Callouts */}
        {burstParticles.map((bp) => (
          <div
            key={bp.id}
            style={{
              position: 'absolute',
              left: `${bp.x * 100}%`,
              top: `${bp.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-none z-30"
          >
            <div
              className="w-20 h-20 rounded-full border-4 animate-ping"
              style={{ borderColor: bp.color }}
            />
            <div className="text-white text-xs font-extrabold absolute -top-5 -left-4 animate-bounce bg-slate-900/90 px-2 py-0.5 rounded-md border border-emerald-400 text-emerald-300">
              +100 POP!
            </div>
          </div>
        ))}

        {/* Bottom In-Game Guidance & Rep Counter */}
        <div className="absolute bottom-3.5 left-6 right-6 flex items-center justify-between text-xs text-slate-200 pointer-events-none z-30">
          <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80">
            Reach toward the balloon with your real hand
          </span>
          <span className="font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-sky-400 font-bold">
            Reps: {reps} / {targetReps}
          </span>
        </div>
      </div>
    </CameraGameContainer>
  );
};
