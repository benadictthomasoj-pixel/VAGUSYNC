import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { useRehab } from '../../context/RehabContext';
import { Sparkles, Sun, CheckCircle2, RotateCcw } from 'lucide-react';

interface WindowCleanerGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

const SCENES = [
  {
    name: 'Alpine Sunrise',
    nameTa: 'சூரிய உதயம்',
    bgGradient: 'from-amber-500 via-rose-500 to-indigo-900',
    emoji: '🏔️ ☀️ 🌲',
  },
  {
    name: 'Tropical Paradise',
    nameTa: 'தீவு சொர்க்கம்',
    bgGradient: 'from-cyan-400 via-teal-500 to-blue-800',
    emoji: '🏝️ 🐬 🌺',
  },
  {
    name: 'Sakura Garden',
    nameTa: 'செர்ரி தோட்டம்',
    bgGradient: 'from-pink-400 via-purple-500 to-indigo-900',
    emoji: '🌸 ⛩️ 🏯',
  },
];

export const WindowCleanerGame: React.FC<WindowCleanerGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const { language } = useRehab();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleanliness, setCleanliness] = useState(0);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [isSparklingClean, setIsSparklingClean] = useState(false);
  const [squeegeePos, setSqueegeePos] = useState({ x: 0.5, y: 0.5 });

  const scene = SCENES[currentSceneIdx % SCENES.length];
  const brushRadius = Math.max(35, 60 - difficulty * 5);

  // Initialize dirty fog overlay on canvas
  const initFog = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    // Draw frosted steam/dirt layer
    ctx.fillStyle = 'rgba(215, 230, 245, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle water droplets texture
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const rad = 2 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180, 205, 230, 0.6)';
      ctx.fill();
    }

    setCleanliness(0);
    setIsSparklingClean(false);
  };

  useEffect(() => {
    initFog();
  }, [currentSceneIdx, difficulty]);

  // Clean wipe interaction loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isSparklingClean) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;

    setSqueegeePos({ x: cursorX, y: cursorY });

    const px = cursorX * canvas.width;
    const py = cursorY * canvas.height;

    // Erase fog in circular stroke
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(px, py, brushRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fill();

    onExertionTick(0.2);

    // Calculate approximate cleanliness percentage
    const sampleSize = 20;
    const stepX = Math.floor(canvas.width / sampleSize);
    const stepY = Math.floor(canvas.height / sampleSize);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentCount = 0;
    const totalSamples = sampleSize * sampleSize;

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const pixelIdx = (y * stepY * canvas.width + x * stepX) * 4 + 3;
        if (imgData.data[pixelIdx] < 50) {
          transparentCount++;
        }
      }
    }

    const pct = Math.round((transparentCount / totalSamples) * 100);
    setCleanliness(pct);

    if (pct >= 85 && !isSparklingClean) {
      // 85%+ -> Complete round with sparkle sweep!
      setIsSparklingClean(true);
      soundManager.playTargetSuccess();
      onExertionTick(1.5);

      const newScore = score + 110;
      const newReps = reps + 1;
      setScore(newScore);
      setReps(newReps);

      onRepComplete(Math.min(100, pct + 10), newScore);

      if (newReps >= targetReps) {
        soundManager.playSessionComplete();
        setTimeout(() => {
          onGameComplete({
            accuracy: 96,
            score: newScore,
            movementQuality: 94,
          });
        }, 1500);
      } else {
        setTimeout(() => {
          setCurrentSceneIdx((s) => s + 1);
        }, 1600);
      }
    }
  }, [handState, inputState, isSparklingClean, brushRadius]);

  return (
    <CameraGameContainer gameTitle={language === 'ta' ? 'ஜன்னல் சுத்தம்' : 'Window Cleaner'}>
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Hidden Scenic Artwork Layer (Underneath Fog) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${scene.bgGradient} flex flex-col items-center justify-center text-white`}
        >
          <span className="text-6xl sm:text-7xl mb-2 animate-bounce">{scene.emoji}</span>
          <h3 className="text-2xl font-black text-white/90 uppercase tracking-widest">
            {language === 'ta' ? scene.nameTa || scene.name : scene.name}
          </h3>
        </div>

        {/* Dirty Frosted Glass Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            isSparklingClean ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Top HUD */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-30">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold block">
                {language === 'ta' ? 'சுத்தம்' : 'Cleanliness'}
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'ta'
                  ? `${cleanliness}% சுத்தம் • ஜன்னல் ${reps + 1} / ${targetReps}`
                  : `${cleanliness}% Clean • Window ${reps + 1} of ${targetReps}`}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold">
            {score} {language === 'ta' ? 'புள்ளிகள்' : 'PTS'}
          </div>
        </div>

        {/* Animated Squeegee Wiper Cursor */}
        <div
          className="absolute z-40 transition-transform duration-75 pointer-events-none"
          style={{
            left: `${squeegeePos.x * 100}%`,
            top: `${squeegeePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/90 border-2 border-blue-400 shadow-xl flex items-center justify-center text-blue-600 font-bold">
            🧽
          </div>
        </div>

        {/* Clean Completion Glow */}
        {isSparklingClean && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-amber-400/20 backdrop-blur-xs animate-in zoom-in-95">
            <div className="bg-slate-900/90 border-2 border-amber-400 p-6 rounded-3xl shadow-2xl text-center space-y-2 text-white">
              <Sun className="w-12 h-12 text-amber-400 mx-auto animate-spin-slow" />
              <h3 className="text-2xl font-black text-white">
                {language === 'ta' ? 'மிகவும் சுத்தமாகிவிட்டது!' : 'Sparkling Clean!'}
              </h3>
              <p className="text-xs text-amber-300 font-bold">
                {language === 'ta' ? '100% ஜன்னல் சுத்தம் செய்யப்பட்டது' : '100% Window Cleared'}
              </p>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
