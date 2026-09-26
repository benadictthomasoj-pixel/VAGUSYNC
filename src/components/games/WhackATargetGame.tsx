import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Crosshair, Zap, Award, AlertTriangle, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface WhackATargetGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

type TargetType = 'standard' | 'bonus' | 'hazard';

interface ActiveTarget {
  id: number;
  podIndex: number;
  type: TargetType;
  spawnTime: number;
  duration: number; // ms before retracting
  state: 'rising' | 'active' | 'hit' | 'missed';
  x: number; // center 0-1
  y: number; // center 0-1
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const POD_POSITIONS = [
  // 3x3 Grid centered in active interaction space
  { index: 0, x: 0.28, y: 0.32 },
  { index: 1, x: 0.50, y: 0.32 },
  { index: 2, x: 0.72, y: 0.32 },
  { index: 3, x: 0.28, y: 0.54 },
  { index: 4, x: 0.50, y: 0.54 },
  { index: 5, x: 0.72, y: 0.54 },
  { index: 6, x: 0.28, y: 0.76 },
  { index: 7, x: 0.50, y: 0.76 },
  { index: 8, x: 0.72, y: 0.76 },
];

export const WhackATargetGame: React.FC<WhackATargetGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const { language } = useRehab();
  const t = getTranslation(language);

  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [activeTargets, setActiveTargets] = useState<ActiveTarget[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastHitPod, setLastHitPod] = useState<number | null>(null);

  const nextTargetIdRef = useRef(1);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unified Cursor Coords
  const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
  const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
  const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

  const currentAccuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;
  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 450;

  // Particle animation loop
  useEffect(() => {
    const pInterval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0)
      );
    }, 1000 / 60);
    return () => clearInterval(pInterval);
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    const newP: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 0.003 + Math.random() * 0.006;
      newP.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 6,
        life: 25,
        maxLife: 25,
      });
    }
    setParticles((prev) => [...prev, ...newP]);
  };

  // Target Spawner
  useEffect(() => {
    if (isCompleted) return;

    const baseInterval = Math.max(1000, 2200 - difficulty * 300);
    const visibleDuration = Math.max(1200, 2500 - difficulty * 350);

    const spawnTarget = () => {
      setActiveTargets((prev) => {
        // Limit active targets
        const maxSimultaneous = difficulty >= 3 ? 2 : 1;
        const living = prev.filter((t) => t.state === 'active' || t.state === 'rising');
        if (living.length >= maxSimultaneous) return prev;

        const occupiedPods = new Set(living.map((t) => t.podIndex));
        const freePods = POD_POSITIONS.filter((p) => !occupiedPods.has(p.index));
        if (freePods.length === 0) return prev;

        const randomPod = freePods[Math.floor(Math.random() * freePods.length)];
        
        // Target type roll: 70% standard, 18% bonus, 12% hazard
        const roll = Math.random();
        let type: TargetType = 'standard';
        if (roll > 0.85) type = 'bonus';
        else if (roll > 0.72) type = 'hazard';

        const newTarget: ActiveTarget = {
          id: nextTargetIdRef.current++,
          podIndex: randomPod.index,
          type,
          spawnTime: Date.now(),
          duration: visibleDuration,
          state: 'rising',
          x: randomPod.x,
          y: randomPod.y,
        };

        return [...prev, newTarget];
      });
    };

    spawnTimerRef.current = setInterval(spawnTarget, baseInterval);
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [difficulty, isCompleted]);

  // Target Lifecycle / Timeout Monitor
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTargets((prev) => {
        let updated = false;
        const nextList: ActiveTarget[] = [];

        for (const t of prev) {
          if (t.state === 'rising' && now - t.spawnTime > 250) {
            nextList.push({ ...t, state: 'active' });
            updated = true;
          } else if (t.state === 'active' && now - t.spawnTime > t.duration) {
            // Target timed out
            if (t.type !== 'hazard') {
              setMisses((m) => m + 1);
              setStreak(0);
              // Small miss cue
              setScorePopups((sp) => [
                ...sp,
                { id: Math.random(), x: t.x, y: t.y, text: 'Miss', color: '#94A3B8' },
              ]);
            }
            nextList.push({ ...t, state: 'missed' });
            updated = true;
          } else if (t.state === 'hit' || t.state === 'missed') {
            // Remove after brief delay
            if (now - t.spawnTime > t.duration + 500) {
              updated = true;
              continue;
            }
            nextList.push(t);
          } else {
            nextList.push(t);
          }
        }

        return updated ? nextList : prev;
      });

      // Clear old score popups
      setScorePopups((prev) => prev.filter((p) => Date.now() - p.id < 900));
    }, 100);

    return () => clearInterval(interval);
  }, [isCompleted]);

  // Collision & Hit Check
  useEffect(() => {
    if (isCompleted) return;

    const hitRadius = 0.085; // Reach radius in normalized coords

    for (const target of activeTargets) {
      if (target.state !== 'active' && target.state !== 'rising') continue;

      const dist = Math.hypot(cursorX - target.x, cursorY - target.y);
      if (dist < hitRadius) {
        handleTargetHit(target);
        break;
      }
    }
  }, [cursorX, cursorY, isPressed, activeTargets, isCompleted]);

  const handleTargetHit = (target: ActiveTarget) => {
    const reactionMs = Date.now() - target.spawnTime;
    setLastHitPod(target.podIndex);
    setTimeout(() => setLastHitPod(null), 350);

    if (target.type === 'hazard') {
      // Hit an obstacle hazard
      soundManager.playWarning();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
      setStreak(0);
      setMisses((m) => m + 1);
      spawnParticles(target.x, target.y, '#EF4444', 12);
      setScorePopups((sp) => [
        ...sp,
        { id: Math.random(), x: target.x, y: target.y, text: '-50 (Obstacle)', color: '#EF4444' },
      ]);
      setScore((s) => Math.max(0, s - 50));
    } else {
      // Successful Hit!
      const isBonus = target.type === 'bonus';
      const streakBonus = Math.min(streak * 20, 100);
      const points = isBonus ? 250 : 100 + streakBonus;

      soundManager.playFruitCatch();
      spawnParticles(target.x, target.y, isBonus ? '#F59E0B' : '#10B981', isBonus ? 20 : 14);

      setScorePopups((sp) => [
        ...sp,
        {
          id: Math.random(),
          x: target.x,
          y: target.y,
          text: `+${points}${streak > 1 ? ` (${streak + 1}x)` : ''}`,
          color: isBonus ? '#F59E0B' : '#10B981',
        },
      ]);

      setHits((h) => h + 1);
      setStreak((st) => st + 1);
      setReactionTimes((rt) => [...rt.slice(-15), reactionMs]);
      setScore((s) => s + points);

      const nextReps = reps + 1;
      setReps(nextReps);
      onRepComplete(currentAccuracy, score + points);
      onExertionTick(0.8);

      if (nextReps >= targetReps && !isCompleted) {
        setIsCompleted(true);
        soundManager.playSessionComplete();
        setTimeout(() => {
          onGameComplete({
            accuracy: Math.min(100, Math.max(70, currentAccuracy)),
            score: score + points,
            movementQuality: 92,
          });
        }, 1200);
      }
    }

    // Mark as hit
    setActiveTargets((prev) =>
      prev.map((t) => (t.id === target.id ? { ...t, state: 'hit' } : t))
    );
  };

  return (
    <CameraGameContainer>
      <div className={`relative w-full h-[580px] bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl overflow-hidden select-none border border-slate-700/60 shadow-2xl transition-transform ${screenShake ? 'animate-shake' : ''}`}>
        
        {/* HUD Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          {/* Target / Rep Progress */}
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/70 flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Targets Neutralized
              </div>
              <div className="text-sm font-black text-white font-mono">
                {reps} <span className="text-slate-500">/ {targetReps}</span>
              </div>
            </div>
          </div>

          {/* Reaction Time & Accuracy */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/70 text-right shadow-lg">
              <div className="text-[9px] uppercase font-bold tracking-wider text-amber-400 flex items-center justify-end gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Reaction
              </div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                {avgReactionTime} ms
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/70 text-right shadow-lg">
              <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                Accuracy
              </div>
              <div className="text-xs font-bold text-emerald-300 font-mono">
                {currentAccuracy}%
              </div>
            </div>

            {/* Score Pill */}
            <div className="bg-blue-600/90 text-white px-4 py-2 rounded-2xl border border-blue-400/30 flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Award className="w-4 h-4 text-amber-300" />
              <div className="text-sm font-black font-mono">{score}</div>
            </div>
          </div>
        </div>

        {/* 3x3 Pods Field */}
        <div className="absolute inset-0 z-10">
          {POD_POSITIONS.map((pod) => {
            const isHitRecently = lastHitPod === pod.index;
            const targetInPod = activeTargets.find(
              (t) => t.podIndex === pod.index && (t.state === 'active' || t.state === 'rising' || t.state === 'hit')
            );

            return (
              <div
                key={pod.index}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{
                  left: `${pod.x * 100}%`,
                  top: `${pod.y * 100}%`,
                  width: '100px',
                  height: '100px',
                }}
              >
                {/* Pod Rim / Base Tube */}
                <div
                  className={`w-24 h-24 rounded-full border-4 transition-all duration-300 flex items-center justify-center ${
                    isHitRecently
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'border-slate-700/80 bg-slate-950/70 shadow-inner'
                  }`}
                >
                  {/* Subtle Target Reticle Rings */}
                  <div className="w-16 h-16 rounded-full border border-slate-800/80 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-slate-800/60 bg-slate-900/50" />
                  </div>
                </div>

                {/* Target Avatar / Entity */}
                {targetInPod && (
                  <div
                    className={`absolute z-20 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                      targetInPod.state === 'rising'
                        ? 'scale-75 translate-y-3 opacity-90'
                        : targetInPod.state === 'hit'
                        ? 'scale-x-125 scale-y-50 opacity-80'
                        : 'scale-100 translate-y-0 animate-bounce'
                    }`}
                  >
                    {/* STANDARD TARGET */}
                    {targetInPod.type === 'standard' && (
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 border-2 border-cyan-200 shadow-xl shadow-cyan-500/40 flex items-center justify-center text-white relative">
                        <div className="w-4 h-4 rounded-full bg-white/90 shadow-xs absolute top-2 left-2" />
                        <Crosshair className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                    )}

                    {/* BONUS TARGET */}
                    {targetInPod.type === 'bonus' && (
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-100 shadow-xl shadow-amber-500/50 flex items-center justify-center text-slate-950 relative">
                        <Sparkles className="w-9 h-9 text-amber-950 drop-shadow-sm animate-spin" />
                        <span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-[8px] font-black text-amber-950 uppercase">
                          Bonus
                        </span>
                      </div>
                    )}

                    {/* HAZARD TARGET */}
                    {targetInPod.type === 'hazard' && (
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-400 border-2 border-red-200 shadow-xl shadow-red-500/40 flex items-center justify-center text-white relative">
                        <AlertTriangle className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
                        <span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-red-700 text-[8px] font-black text-white uppercase">
                          Avoid
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-25"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.life / p.maxLife,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 8px ${p.color}`,
            }}
          />
        ))}

        {/* Floating Score Popups */}
        {scorePopups.map((sp) => (
          <div
            key={sp.id}
            className="absolute z-30 font-black text-base pointer-events-none transition-all duration-700 -translate-y-6 animate-bounce drop-shadow-lg"
            style={{
              left: `${sp.x * 100}%`,
              top: `${sp.y * 100}%`,
              color: sp.color,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {sp.text}
          </div>
        ))}

        {/* Virtual Limb Target Crosshair / Reticle */}
        <div
          className="absolute pointer-events-none z-40 transition-transform duration-75 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${cursorX * 100}%`,
            top: `${cursorY * 100}%`,
          }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/80 animate-ping opacity-30" />
            <div className="w-8 h-8 rounded-full border-2 border-white bg-cyan-500/20 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Completion Modal Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Protocol Completed
                </span>
                <h3 className="text-2xl font-black text-white">
                  Target Reaction Set Complete!
                </h3>
                <p className="text-xs text-slate-400">
                  Target tracking and rapid upper-limb deceleration recorded.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Accuracy</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{currentAccuracy}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Speed</div>
                  <div className="text-lg font-black text-amber-400 font-mono">{avgReactionTime}ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Score</div>
                  <div className="text-lg font-black text-blue-400 font-mono">{score}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
