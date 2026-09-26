import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { useRehab } from '../../context/RehabContext';
import { Palette, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface ColorMatchGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface ColorItem {
  id: string;
  colorName: string;
  colorHex: string;
  emoji: string;
  x: number; // 0-1
  y: number; // 0-1
  vx: number;
  vy: number;
  grabbed: boolean;
}

interface ColorBin {
  id: string;
  colorName: string;
  colorHex: string;
  x: number; // 0-1
  y: number; // 0-1
  width: number;
  bouncing: boolean;
  shaking: boolean;
}

const COLOR_DEFS = [
  { name: 'Red', nameTa: 'சிகப்பு', hex: '#EF4444', emoji: '🔴' },
  { name: 'Blue', nameTa: 'நீலம்', hex: '#3B82F6', emoji: '🔵' },
  { name: 'Green', nameTa: 'பச்சை', hex: '#10B981', emoji: '🟢' },
  { name: 'Yellow', nameTa: 'மஞ்சள்', hex: '#F59E0B', emoji: '🟡' },
  { name: 'Purple', nameTa: 'ஊதா', hex: '#8B5CF6', emoji: '🟣' },
];

export const ColorMatchGame: React.FC<ColorMatchGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const { language } = useRehab();
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [activeItem, setActiveItem] = useState<ColorItem | null>(null);
  const [bins, setBins] = useState<ColorBin[]>([]);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [suctionEffect, setSuctionEffect] = useState<{ x: number; y: number; color: string } | null>(null);

  const numBins = Math.min(5, 3 + Math.floor(difficulty / 2));
  const activeColorDefs = COLOR_DEFS.slice(0, numBins);

  // Setup bottom bins
  useEffect(() => {
    const spacing = 0.88 / numBins;
    const newBins: ColorBin[] = activeColorDefs.map((def, idx) => ({
      id: `bin-${def.name}`,
      colorName: def.name,
      colorHex: def.hex,
      x: 0.12 + idx * spacing + spacing / 2,
      y: 0.82,
      width: Math.max(70, 110 - numBins * 6),
      bouncing: false,
      shaking: false,
    }));
    setBins(newBins);
  }, [difficulty]);

  // Spawn new falling color object
  const spawnItem = () => {
    const randomDef = activeColorDefs[Math.floor(Math.random() * activeColorDefs.length)];
    const newItem: ColorItem = {
      id: `item-${Date.now()}`,
      colorName: randomDef.name,
      colorHex: randomDef.hex,
      emoji: randomDef.emoji,
      x: 0.25 + Math.random() * 0.50,
      y: 0.22,
      vx: (Math.random() - 0.5) * 0.001,
      vy: 0.0015 + difficulty * 0.0006,
      grabbed: false,
    };
    setActiveItem(newItem);
  };

  useEffect(() => {
    spawnItem();
  }, [difficulty]);

  // Physics drift when not grabbed
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setActiveItem((prev) => {
        if (!prev || prev.grabbed) return prev;
        const nextY = prev.y + prev.vy;
        // If it reaches bottom without user interaction, reset
        if (nextY > 0.85) {
          spawnItem();
          return null;
        }
        return { ...prev, y: nextY, x: Math.max(0.15, Math.min(0.85, prev.x + prev.vx)) };
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [difficulty]);

  // Unified Input Handling
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    if (activeItem) {
      if (isPressed) {
        if (!activeItem.grabbed) {
          // Check proximity
          if (Math.hypot(cursorX - activeItem.x, cursorY - activeItem.y) < 0.14) {
            setActiveItem({ ...activeItem, grabbed: true, x: cursorX, y: cursorY });
            soundManager.playPop();
            onExertionTick(0.8);
          }
        } else {
          // Drag item with cursor
          setActiveItem({ ...activeItem, x: cursorX, y: cursorY });
        }
      } else {
        // Drop confirmation check
        if (activeItem.grabbed) {
          // Check which bin it was dropped onto
          const targetBin = bins.find(
            (b) => Math.hypot(activeItem.x - b.x, activeItem.y - b.y) < 0.15
          );

          if (targetBin) {
            setTotalAttempts((t) => t + 1);
            if (targetBin.colorName === activeItem.colorName) {
              // Correct match!
              soundManager.playFruitCatch();
              onExertionTick(1.2);
              setSuctionEffect({ x: targetBin.x, y: targetBin.y, color: targetBin.colorHex });
              setTimeout(() => setSuctionEffect(null), 400);

              // Bounce bin
              setBins((prev) =>
                prev.map((b) => (b.id === targetBin.id ? { ...b, bouncing: true } : b))
              );
              setTimeout(() => {
                setBins((prev) =>
                  prev.map((b) => (b.id === targetBin.id ? { ...b, bouncing: false } : b))
                );
              }, 400);

              const newScore = score + 90 + streak * 10;
              const newReps = reps + 1;
              const newCorrect = correctCount + 1;
              setScore(newScore);
              setReps(newReps);
              setStreak((s) => s + 1);
              setCorrectCount(newCorrect);

              const accuracy = Math.round((newCorrect / (totalAttempts + 1)) * 100);
              onRepComplete(accuracy, newScore);

              if (newReps >= targetReps) {
                soundManager.playSessionComplete();
                setTimeout(() => {
                  onGameComplete({
                    accuracy: Math.max(85, accuracy),
                    score: newScore,
                    movementQuality: 90,
                  });
                }, 800);
              } else {
                setTimeout(spawnItem, 350);
              }
            } else {
              // Incorrect match
              soundManager.playWarning();
              setStreak(0);

              // Shake bin
              setBins((prev) =>
                prev.map((b) => (b.id === targetBin.id ? { ...b, shaking: true } : b))
              );
              setTimeout(() => {
                setBins((prev) =>
                  prev.map((b) => (b.id === targetBin.id ? { ...b, shaking: false } : b))
                );
              }, 400);

              // Return item to top
              setActiveItem({ ...activeItem, grabbed: false, y: 0.22, x: 0.5 });
            }
          } else {
            setActiveItem({ ...activeItem, grabbed: false });
          }
        }
      }
    }
  }, [handState, inputState, activeItem, bins, score, reps, streak]);

  return (
    <CameraGameContainer gameTitle={language === 'ta' ? 'நிறப் பொருத்தம்' : 'Color Match'}>
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Top Status HUD */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <Palette className="w-5 h-5 text-pink-400" />
            <div>
              <span className="text-xs font-bold block">
                {language === 'ta' ? 'நிற வரிசையாளர்' : 'Color Sorter'}
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'ta' ? 'வரிசைப்படுத்தியது:' : 'Sorted:'} {reps} / {targetReps}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full animate-bounce">
                🔥 {streak}x {language === 'ta' ? 'தொடர்!' : 'Streak!'}
              </div>
            )}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold">
              {score} {language === 'ta' ? 'புள்ளிகள்' : 'PTS'}
            </div>
          </div>
        </div>

        {/* Active Draggable Color Ball */}
        {activeItem && (
          <div
            className={`absolute transition-transform duration-75 flex items-center justify-center rounded-full shadow-2xl ${
              activeItem.grabbed ? 'scale-125 z-40' : 'scale-100 z-30 animate-pulse'
            }`}
            style={{
              left: `${activeItem.x * 100}%`,
              top: `${activeItem.y * 100}%`,
              width: '68px',
              height: '68px',
              transform: 'translate(-50%, -50%)',
              backgroundColor: activeItem.colorHex,
              boxShadow: `0 12px 24px ${activeItem.colorHex}80`,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/40 pointer-events-none" />
            <span className="text-2xl">{activeItem.emoji}</span>
          </div>
        )}

        {/* Particle Suction Wave Effect */}
        {suctionEffect && (
          <div
            className="absolute rounded-full border-4 border-white animate-ping z-50 pointer-events-none"
            style={{
              left: `${suctionEffect.x * 100}%`,
              top: `${suctionEffect.y * 100}%`,
              width: '90px',
              height: '90px',
              transform: 'translate(-50%, -50%)',
              borderColor: suctionEffect.color,
            }}
          />
        )}

        {/* Bottom Destination Color Bins */}
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 px-6">
          {bins.map((bin) => {
            const def = COLOR_DEFS.find((d) => d.name === bin.colorName);
            const displayName = language === 'ta' && def ? def.nameTa : bin.colorName;

            return (
              <div
                key={bin.id}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 transition-transform duration-200 shadow-xl ${
                  bin.bouncing ? 'scale-115 -translate-y-3' : ''
                } ${bin.shaking ? 'animate-wiggle border-rose-500' : 'border-white/30'}`}
                style={{
                  width: `${bin.width}px`,
                  height: '96px',
                  backgroundColor: `${bin.colorHex}30`,
                  borderColor: bin.colorHex,
                  boxShadow: `0 8px 20px ${bin.colorHex}40`,
                }}
              >
                {/* Glow Rim */}
                <div
                  className="w-full h-3 rounded-t-2xl opacity-80"
                  style={{ backgroundColor: bin.colorHex }}
                />
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-white/80 font-semibold">
                    {language === 'ta' ? 'இங்கு போடுங்கள்' : 'Drop Here'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CameraGameContainer>
  );
};
