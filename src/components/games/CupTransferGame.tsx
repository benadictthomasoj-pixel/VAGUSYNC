import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { GlassWater, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

interface CupTransferGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface TargetCup {
  id: number;
  x: number; // 0-1
  y: number; // 0-1
  currentLevel: number; // 0 to 100
  targetLevel: number; // e.g. 75
  tolerance: number; // e.g. 10
  status: 'empty' | 'filling' | 'perfect' | 'overfilled';
}

export const CupTransferGame: React.FC<CupTransferGameProps> = ({
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

  const [cups, setCups] = useState<TargetCup[]>([]);
  const [pitcherX, setPitcherX] = useState(0.5);
  const [pitcherY, setPitcherY] = useState(0.32);
  const [tiltAngle, setTiltAngle] = useState(0); // degrees (-45 to 45)
  const [isPouring, setIsPouring] = useState(false);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [spillWarning, setSpillWarning] = useState(false);

  const numCups = Math.min(4, 2 + Math.floor(difficulty / 2));

  const initCups = () => {
    const spacing = 0.70 / (numCups || 1);
    const newCups: TargetCup[] = Array.from({ length: numCups }).map((_, idx) => ({
      id: idx,
      x: 0.20 + idx * spacing + spacing / 2,
      y: 0.76,
      currentLevel: 0,
      targetLevel: 75,
      tolerance: Math.max(8, 15 - difficulty * 2),
      status: 'empty',
    }));
    setCups(newCups);
  };

  useEffect(() => {
    initCups();
  }, [difficulty]);

  // Unified Input Tracking
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    // Position pitcher
    setPitcherX(cursorX);
    setPitcherY(Math.max(0.18, Math.min(0.55, cursorY)));

    // Calculate Tilt: use hardware forearm roll/pitch if available, or horizontal velocity/press
    let angle = 0;
    if (inputState.source === 'hardware' || inputState.source === 'hybrid') {
      angle = Math.max(-45, Math.min(45, inputState.orientation.forearm.roll * 1.5));
    } else {
      // In camera mode: pressing or moving slightly tilts pitcher toward nearest target
      angle = isPressed ? 32 : (cursorX - 0.5) * 30;
    }
    setTiltAngle(angle);

    // Pouring logic: isPouring when tilted > 18 deg or primaryPressed
    const pouring = isPressed || Math.abs(angle) > 18;
    setIsPouring(pouring);

    if (pouring) {
      onExertionTick(0.3);

      // Check which cup is beneath the pitcher spout (offset slightly right or left based on tilt)
      const spoutX = cursorX + (angle > 0 ? 0.06 : -0.06);

      setCups((prev) =>
        prev.map((cup) => {
          if (cup.status === 'perfect' || cup.status === 'overfilled') return cup;

          const distanceToSpout = Math.abs(spoutX - cup.x);
          if (distanceToSpout < 0.08) {
            // Pouring into this cup!
            const nextLevel = Math.min(110, cup.currentLevel + 1.2);
            const isPerfect = Math.abs(nextLevel - cup.targetLevel) <= cup.tolerance;
            const isOver = nextLevel > cup.targetLevel + cup.tolerance;

            if (isOver) {
              soundManager.playWarning();
              setSpillWarning(true);
              setTimeout(() => setSpillWarning(false), 500);
              return { ...cup, currentLevel: nextLevel, status: 'overfilled' };
            }

            if (isPerfect && nextLevel >= cup.targetLevel - 2) {
              soundManager.playTargetSuccess();
              return { ...cup, currentLevel: nextLevel, status: 'perfect' };
            }

            return { ...cup, currentLevel: nextLevel, status: 'filling' };
          }
          return cup;
        })
      );
    }
  }, [handState, inputState]);

  // Check round completion
  useEffect(() => {
    if (cups.length > 0 && cups.every((c) => c.status === 'perfect' || c.status === 'overfilled')) {
      const perfectCount = cups.filter((c) => c.status === 'perfect').length;
      const roundScore = perfectCount * 120;
      const newScore = score + roundScore;
      const newReps = reps + 1;

      setScore(newScore);
      setReps(newReps);

      const accuracy = Math.round((perfectCount / cups.length) * 100);
      onRepComplete(accuracy, newScore);

      if (newReps >= targetReps) {
        soundManager.playSessionComplete();
        setTimeout(() => {
          onGameComplete({
            accuracy: Math.max(80, accuracy),
            score: newScore,
            movementQuality: 92,
          });
        }, 1200);
      } else {
        setTimeout(initCups, 1500);
      }
    }
  }, [cups, reps, score, targetReps]);

  return (
    <CameraGameContainer gameTitle="Cup Transfer">
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Top HUD */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <GlassWater className="w-5 h-5 text-sky-400" />
            <div>
              <span className="text-xs font-bold block">Water Balance</span>
              <span className="text-[10px] text-slate-400">
                Sets: {reps + 1} / {targetReps} • Target: 75% Line
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {spillWarning && (
              <div className="bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                ⚠ Spill Alert
              </div>
            )}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold">
              {score} PTS
            </div>
          </div>
        </div>

        {/* Dynamic Source Pitcher / Water Vessel */}
        <div
          className="absolute z-40 transition-transform duration-75 pointer-events-none"
          style={{
            left: `${pitcherX * 100}%`,
            top: `${pitcherY * 100}%`,
            transform: `translate(-50%, -50%) rotate(${tiltAngle}deg)`,
          }}
        >
          {/* Pitcher Body */}
          <div className="w-20 h-28 rounded-b-3xl rounded-t-lg bg-gradient-to-r from-sky-400/80 via-blue-500/80 to-sky-600/80 border-2 border-white/80 shadow-2xl backdrop-blur-md flex flex-col justify-between p-2 relative">
            {/* Handle */}
            <div className="absolute -left-5 top-4 w-6 h-14 rounded-l-2xl border-3 border-white/70" />
            {/* Liquid Level inside Pitcher */}
            <div className="w-full h-16 rounded-b-2xl bg-cyan-400/60 mt-auto flex items-center justify-center">
              <span className="text-xs font-bold text-white">💧</span>
            </div>
          </div>

          {/* Liquid Stream Animation when pouring */}
          {isPouring && (
            <div
              className="absolute top-12 left-1/2 w-2 bg-gradient-to-b from-cyan-300 to-blue-500 rounded-full shadow-md animate-pulse"
              style={{
                height: '180px',
                transform: `translateX(${tiltAngle > 0 ? '30px' : '-30px'})`,
              }}
            />
          )}
        </div>

        {/* Target Cups on Counter Table */}
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-6 px-8">
          {cups.map((cup) => (
            <div
              key={cup.id}
              className={`relative flex flex-col justify-end w-24 h-40 rounded-b-3xl rounded-t-md border-3 transition-all duration-200 shadow-2xl backdrop-blur-md overflow-hidden ${
                cup.status === 'perfect'
                  ? 'border-emerald-400 shadow-emerald-500/40 bg-emerald-950/30'
                  : cup.status === 'overfilled'
                  ? 'border-rose-400 shadow-rose-500/40 bg-rose-950/30'
                  : 'border-slate-400/80 bg-slate-900/60'
              }`}
            >
              {/* Target 75% Fill Guideline Line */}
              <div
                className="absolute inset-x-0 border-t-2 border-dashed border-emerald-400/80 z-20 flex justify-end pr-1"
                style={{ bottom: `${cup.targetLevel}%` }}
              >
                <span className="text-[9px] font-mono font-bold text-emerald-300">
                  {language === 'ta' ? 'இலக்கு 75%' : 'Target 75%'}
                </span>
              </div>

              {/* Rising Liquid */}
              <div
                className={`w-full transition-all duration-100 rounded-b-2xl flex items-center justify-center relative ${
                  cup.status === 'overfilled'
                    ? 'bg-rose-500/80'
                    : cup.status === 'perfect'
                    ? 'bg-emerald-400/80'
                    : 'bg-cyan-400/70'
                }`}
                style={{ height: `${Math.min(100, cup.currentLevel)}%` }}
              >
                {cup.status === 'perfect' && (
                  <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CameraGameContainer>
  );
};
