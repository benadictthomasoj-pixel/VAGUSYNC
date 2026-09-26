import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { useRehab } from '../../context/RehabContext';

interface FruitCatchGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface FallingItem {
  id: number;
  type: 'fruit' | 'hazard';
  emoji: string;
  name: string;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  speed: number;
}

const FRUITS = [
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🍊', name: 'Orange' },
  { emoji: '🍌', name: 'Banana' },
  { emoji: '🍇', name: 'Grapes' },
  { emoji: '🍓', name: 'Strawberry' },
];

const HAZARDS = [
  { emoji: '🪨', name: 'Rock' },
  { emoji: '⚡', name: 'Static' },
];

export const FruitCatchGame: React.FC<FruitCatchGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { language } = useRehab();
  const [isPaused, setIsPaused] = useState(false);

  const [basketX, setBasketX] = useState(0.5);
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catchParticles, setCatchParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);

  const baseSpeedNorm = 0.0035 + difficulty * 0.001;
  const basketWidthNorm = Math.max(0.18, 0.28 - difficulty * 0.02);

  // Sync hand catcher position with real hand palm / index horizontal translation
  useEffect(() => {
    if (!handState.detected || isPaused) return;
    const targetX = handState.palm.x || handState.indexTip.x;
    setBasketX(Math.max(basketWidthNorm / 2 + 0.05, Math.min(0.95 - basketWidthNorm / 2, targetX)));
  }, [handState, basketWidthNorm, isPaused]);

  // Spawn loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const isHazard = Math.random() < 0.20;
      const itemConfig = isHazard
        ? HAZARDS[Math.floor(Math.random() * HAZARDS.length)]
        : FRUITS[Math.floor(Math.random() * FRUITS.length)];

      const newItem: FallingItem = {
        id: Date.now() + Math.random(),
        type: isHazard ? 'hazard' : 'fruit',
        emoji: itemConfig.emoji,
        name: itemConfig.name,
        x: 0.15 + Math.random() * 0.70,
        y: 0.12,
        speed: baseSpeedNorm + (Math.random() - 0.5) * 0.0008,
      };

      setItems((prev) => [...prev, newItem]);
    }, 1500 - difficulty * 120);

    return () => clearInterval(interval);
  }, [difficulty, baseSpeedNorm, isPaused]);

  // Physics animation loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isPaused) {
        const basketY = 0.82;

        setItems((prev) => {
          const remaining: FallingItem[] = [];

          prev.forEach((item) => {
            const nextY = item.y + item.speed;

            // Check catch collision with hand catcher
            if (
              nextY >= basketY - 0.06 &&
              nextY <= basketY + 0.06 &&
              item.x >= basketX - basketWidthNorm / 2 &&
              item.x <= basketX + basketWidthNorm / 2
            ) {
              if (item.type === 'fruit') {
                soundManager.playFruitCatch();
                onExertionTick(1.0);

                const newScore = score + 80;
                const newReps = reps + 1;
                setScore(newScore);
                setReps(newReps);

                setCatchParticles((p) => [
                  ...p,
                  { id: Date.now() + Math.random(), x: item.x, y: basketY - 0.04, text: '+80 🍎' },
                ]);

                const accuracy = Math.round((newReps / (newReps + misses)) * 100);
                onRepComplete(accuracy, newScore);

                if (newReps >= targetReps) {
                  soundManager.playSessionComplete();
                  onGameComplete({
                    accuracy: Math.max(80, accuracy),
                    score: newScore,
                    movementQuality: 90,
                  });
                }
              } else {
                soundManager.playWarning();
                setScore((s) => Math.max(0, s - 40));
                setMisses((m) => m + 1);
              }
            } else if (nextY > 0.95) {
              if (item.type === 'fruit') {
                setMisses((m) => m + 1);
              }
            } else {
              remaining.push({ ...item, y: nextY });
            }
          });

          return remaining;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [basketX, reps, score, misses, targetReps, basketWidthNorm, isPaused]);

  useEffect(() => {
    if (catchParticles.length > 0) {
      const timer = setTimeout(() => {
        setCatchParticles((prev) => prev.slice(1));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [catchParticles]);

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle={language === 'ta' ? 'பழங்கள் பிடித்தல்' : 'Fruit Catch'}
    >
      <div className="relative w-full h-full pointer-events-none">
        {/* Falling Fruits rendered over live camera */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="text-4xl filter drop-shadow-2xl select-none pointer-events-none animate-pulse z-20"
          >
            {item.emoji}
          </div>
        ))}

        {/* Catch floating sparkles */}
        {catchParticles.map((cp) => (
          <div
            key={cp.id}
            style={{
              position: 'absolute',
              left: `${cp.x * 100}%`,
              top: `${cp.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="text-emerald-300 font-extrabold text-sm animate-bounce pointer-events-none bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-400 z-30"
          >
            {cp.text}
          </div>
        ))}

        {/* Real Hand Catcher Basket overlay */}
        <div
          style={{
            position: 'absolute',
            left: `${basketX * 100}%`,
            top: '82%',
            width: `${basketWidthNorm * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="h-12 rounded-2xl bg-gradient-to-r from-emerald-500/90 via-teal-400/90 to-emerald-500/90 border-2 border-white shadow-xl shadow-emerald-500/50 flex items-center justify-center text-slate-950 font-extrabold text-xs tracking-wider uppercase select-none transition-all duration-75 z-20 backdrop-blur-xs"
        >
          <span>🖐 {language === 'ta' ? 'பிடி கூடை' : 'Hand Catcher'}</span>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-3.5 left-6 right-6 flex items-center justify-between text-xs text-slate-200 pointer-events-none z-30">
          <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-emerald-300">
            {language === 'ta'
              ? 'விழும் பழங்களைப் பிடிக்க உங்கள் கையை கிடைமட்டமாக நகர்த்துங்கள்'
              : 'Sweep your real hand horizontally beneath falling fruits'}
          </span>
          <span className="font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-white font-bold">
            {language === 'ta' ? 'பிடித்தவை:' : 'Caught:'} {reps} / {targetReps}
          </span>
        </div>
      </div>
    </CameraGameContainer>
  );
};
