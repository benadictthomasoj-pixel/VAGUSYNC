import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { useRehab } from '../../context/RehabContext';
import { Music, Sparkles, CheckCircle2, Play, Volume2, Award, Zap } from 'lucide-react';

interface NeuroPianoGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface PianoKey {
  id: number;
  note: string;
  name: string;
  nameTa?: string;
  freq: number;
  color: string;
  border: string;
  shadow: string;
}

const PIANO_KEYS: PianoKey[] = [
  { id: 0, note: 'C4', name: 'Do', nameTa: 'ஸ', freq: 261.63, color: '#EF4444', border: '#F87171', shadow: 'rgba(239, 68, 68, 0.4)' },
  { id: 1, note: 'D4', name: 'Re', nameTa: 'ரி', freq: 293.66, color: '#F97316', border: '#FB923C', shadow: 'rgba(249, 115, 22, 0.4)' },
  { id: 2, note: 'E4', name: 'Mi', nameTa: 'க', freq: 329.63, color: '#FBBF24', border: '#FCD34D', shadow: 'rgba(251, 191, 36, 0.4)' },
  { id: 3, note: 'F4', name: 'Fa', nameTa: 'ம', freq: 349.23, color: '#10B981', border: '#34D399', shadow: 'rgba(16, 185, 129, 0.4)' },
  { id: 4, note: 'G4', name: 'Sol', nameTa: 'ப', freq: 392.00, color: '#06B6D4', border: '#22D3EE', shadow: 'rgba(6, 182, 212, 0.4)' },
  { id: 5, note: 'A4', name: 'La', nameTa: 'த', freq: 440.00, color: '#3B82F6', border: '#60A5FA', shadow: 'rgba(59, 130, 246, 0.4)' },
  { id: 6, note: 'B4', name: 'Ti', nameTa: 'நி', freq: 493.88, color: '#8B5CF6', border: '#A78BFA', shadow: 'rgba(139, 92, 246, 0.4)' },
  { id: 7, note: 'C5', name: 'Do²', nameTa: 'ஸ²', freq: 523.25, color: '#EC4899', border: '#F472B6', shadow: 'rgba(236, 72, 153, 0.4)' },
];

interface NoteParticle {
  id: number;
  x: number;
  y: number;
  char: string;
  color: string;
  vx: number;
  vy: number;
  opacity: number;
}

export const NeuroPianoGame: React.FC<NeuroPianoGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const { language } = useRehab();

  const [mode, setMode] = useState<'follow' | 'free'>('follow');
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [activeKeyId, setActiveKeyId] = useState<number | null>(null);
  const [pressedKeyId, setPressedKeyId] = useState<number | null>(null);
  
  // Follow sequence state
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoKeyId, setDemoKeyId] = useState<number | null>(null);
  const [bestSequence, setBestSequence] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wrongKeyFlash, setWrongKeyFlash] = useState<number | null>(null);

  const [noteParticles, setNoteParticles] = useState<NoteParticle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTriggeredRef = useRef<{ keyId: number; time: number } | null>(null);

  // Unified Cursor
  const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
  const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
  const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

  // Initialize Web Audio Context with clean sine oscillator
  const playTone = (freq: number) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (!audioCtxRef.current) return;
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Smooth envelope attack and decay to prevent clicks
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch {
      // Fallback
      soundManager.playFruitCatch();
    }
  };

  // Spawn note floating particle
  const spawnNoteParticle = (x: number, y: number, color: string) => {
    const chars = ['♪', '♫', '♬', '♩', '✦'];
    const char = chars[Math.floor(Math.random() * chars.length)];
    const newP: NoteParticle = {
      id: Math.random(),
      x,
      y,
      char,
      color,
      vx: (Math.random() - 0.5) * 0.004,
      vy: -0.004 - Math.random() * 0.004,
      opacity: 1,
    };
    setNoteParticles((prev) => [...prev, newP]);
  };

  // Particle update loop
  useEffect(() => {
    const interval = setInterval(() => {
      setNoteParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.03,
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  // Sequence Generation for Follow Mode
  const startNewSequence = (length = 3) => {
    const newSeq: number[] = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * PIANO_KEYS.length));
    }
    setSequence(newSeq);
    setPlayerStep(0);
    playDemoSequence(newSeq);
  };

  const playDemoSequence = async (seq: number[]) => {
    setIsPlayingDemo(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const keyId = seq[i];
      const key = PIANO_KEYS[keyId];
      setDemoKeyId(keyId);
      playTone(key.freq);
      spawnNoteParticle(0.12 + (keyId + 0.5) * (0.76 / 8), 0.55, key.color);
      await new Promise((r) => setTimeout(r, 450));
      setDemoKeyId(null);
    }
    setIsPlayingDemo(false);
  };

  useEffect(() => {
    if (mode === 'follow') {
      const initialLen = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
      startNewSequence(initialLen);
    }
  }, [mode, difficulty]);

  // Cursor Key Collision Check
  useEffect(() => {
    if (isCompleted || isPlayingDemo) return;

    // Piano key area: Y from 0.40 to 0.88, X from 0.12 to 0.88
    const keyAreaTop = 0.40;
    const keyAreaBottom = 0.88;
    const keyAreaLeft = 0.10;
    const keyAreaRight = 0.90;

    if (cursorY >= keyAreaTop && cursorY <= keyAreaBottom && cursorX >= keyAreaLeft && cursorX <= keyAreaRight) {
      const relativeX = (cursorX - keyAreaLeft) / (keyAreaRight - keyAreaLeft);
      const keyIndex = Math.min(PIANO_KEYS.length - 1, Math.max(0, Math.floor(relativeX * PIANO_KEYS.length)));
      
      setActiveKeyId(keyIndex);

      // Trigger note on entry or press
      const now = Date.now();
      const isNewKey = !lastTriggeredRef.current || lastTriggeredRef.current.keyId !== keyIndex;
      const isRehit = isPressed && (!lastTriggeredRef.current || now - lastTriggeredRef.current.time > 400);

      if (isNewKey || isRehit) {
        handleKeyPress(keyIndex);
        lastTriggeredRef.current = { keyId: keyIndex, time: now };
      }
    } else {
      setActiveKeyId(null);
      if (lastTriggeredRef.current && nowExpired(lastTriggeredRef.current.time)) {
        lastTriggeredRef.current = null;
      }
    }
  }, [cursorX, cursorY, isPressed, isPlayingDemo, isCompleted]);

  const nowExpired = (time: number) => Date.now() - time > 300;

  const handleKeyPress = (keyId: number) => {
    const key = PIANO_KEYS[keyId];
    setPressedKeyId(keyId);
    setTimeout(() => setPressedKeyId(null), 250);

    playTone(key.freq);
    const keyX = 0.10 + (keyId + 0.5) * (0.80 / PIANO_KEYS.length);
    spawnNoteParticle(keyX, 0.45, key.color);

    onExertionTick(0.6);

    if (mode === 'free') {
      const newScore = score + 25;
      setScore(newScore);
      const newReps = reps + 1;
      setReps(newReps);
      onRepComplete(100, newScore);
      if (newReps >= targetReps && !isCompleted) {
        setIsCompleted(true);
        soundManager.playSessionComplete();
        setTimeout(() => {
          onGameComplete({ accuracy: 96, score: newScore, movementQuality: 94 });
        }, 1200);
      }
      return;
    }

    // FOLLOW MODE LOGIC
    if (sequence.length > 0) {
      const expectedKey = sequence[playerStep];
      if (keyId === expectedKey) {
        // Correct step!
        const nextStep = playerStep + 1;
        setPlayerStep(nextStep);
        const addedScore = score + 50 * nextStep;
        setScore(addedScore);

        if (nextStep >= sequence.length) {
          // Completed full sequence!
          soundManager.playTargetSuccess();
          const newReps = reps + 1;
          setReps(newReps);
          onRepComplete(100, addedScore);
          setBestSequence((b) => Math.max(b, sequence.length));

          if (newReps >= targetReps && !isCompleted) {
            setIsCompleted(true);
            soundManager.playSessionComplete();
            setTimeout(() => {
              onGameComplete({
                accuracy: 95,
                score: addedScore,
                movementQuality: 92,
              });
            }, 1200);
          } else {
            // Advance sequence length
            setTimeout(() => {
              startNewSequence(sequence.length + 1);
            }, 800);
          }
        }
      } else {
        // Wrong key in sequence
        soundManager.playWarning();
        setWrongKeyFlash(keyId);
        setTimeout(() => setWrongKeyFlash(null), 400);
        // Reset player progress in sequence
        setPlayerStep(0);
        setTimeout(() => {
          playDemoSequence(sequence);
        }, 600);
      }
    }
  };

  return (
    <CameraGameContainer gameTitle={language === 'ta' ? 'நியூரோ பியானோ' : 'Neuro Piano'}>
      <div className="relative w-full h-[580px] bg-gradient-to-b from-slate-900 via-purple-950/30 to-slate-900 rounded-3xl overflow-hidden select-none border border-slate-700/60 shadow-2xl">
        
        {/* Top HUD Bar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rep Counter */}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/70 flex items-center gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {language === 'ta' ? 'இசை சுற்றுகள்' : 'Melody Sets'}
                </div>
                <div className="text-sm font-black text-white font-mono">
                  {reps} <span className="text-slate-500">/ {targetReps}</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/70 flex items-center gap-1 shadow-lg pointer-events-auto">
              <button
                onClick={() => setMode('follow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'follow'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ta' ? 'இசையைப் பின்பற்று' : 'Follow Melody'}
              </button>
              <button
                onClick={() => setMode('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'free'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ta' ? 'சுயாதீன இசை' : 'Free Play'}
              </button>
            </div>
          </div>

          {/* Score & Streak */}
          <div className="flex items-center gap-2">
            {mode === 'follow' && (
              <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/70 text-right shadow-lg">
                <div className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                  {language === 'ta' ? 'வரிசை நீளம்' : 'Sequence Length'}
                </div>
                <div className="text-xs font-bold text-slate-200 font-mono">
                  {sequence.length} {language === 'ta' ? 'சுரங்கள்' : 'Notes'} ({playerStep}/{sequence.length})
                </div>
              </div>
            )}

            <div className="bg-purple-600/90 text-white px-4 py-2 rounded-2xl border border-purple-400/30 flex items-center gap-2 shadow-lg shadow-purple-500/20">
              <Award className="w-4 h-4 text-amber-300" />
              <div className="text-sm font-black font-mono">{score}</div>
            </div>
          </div>
        </div>

        {/* Melody Sequence Visualizer Pill */}
        {mode === 'follow' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700/80 shadow-xl">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 mr-2 flex items-center gap-1.5">
              {isPlayingDemo ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {language === 'ta' ? 'இசையைக் கேட்டு நினைவில் வையுங்கள்:' : 'Listen & Memorize:'}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  {language === 'ta' ? 'இப்போது உங்கள் முறை:' : 'Your Turn:'}
                </>
              )}
            </span>

            <div className="flex items-center gap-1.5">
              {sequence.map((noteIdx, i) => {
                const key = PIANO_KEYS[noteIdx];
                const isCurrent = !isPlayingDemo && playerStep === i;
                const isDone = !isPlayingDemo && playerStep > i;
                const displayName = language === 'ta' ? key.nameTa || key.name : key.name;

                return (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                        : isCurrent
                        ? 'border-2 border-white text-white animate-pulse scale-110 shadow-lg'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    style={{
                      backgroundColor: isDone ? undefined : isCurrent ? key.color : undefined,
                    }}
                  >
                    {displayName}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Piano Keyboard Base */}
        <div className="absolute bottom-6 left-[8%] right-[8%] h-[320px] bg-slate-950/80 backdrop-blur-lg rounded-3xl p-3 border border-slate-700/80 shadow-2xl flex gap-2">
          {PIANO_KEYS.map((key) => {
            const isHovered = activeKeyId === key.id;
            const isDemo = demoKeyId === key.id;
            const isPressedKey = pressedKeyId === key.id;
            const isWrong = wrongKeyFlash === key.id;
            const displayName = language === 'ta' ? key.nameTa || key.name : key.name;

            return (
              <div
                key={key.id}
                className={`relative flex-1 rounded-2xl transition-all duration-150 flex flex-col justify-between p-3 cursor-pointer select-none overflow-hidden ${
                  isWrong
                    ? 'bg-red-600 border-2 border-red-300 shadow-lg shadow-red-500/50 translate-y-2'
                    : isPressedKey || isDemo
                    ? 'translate-y-4 shadow-inner'
                    : isHovered
                    ? 'translate-y-1 shadow-2xl'
                    : 'translate-y-0 shadow-lg'
                }`}
                style={{
                  background: isWrong
                    ? '#EF4444'
                    : isPressedKey || isDemo
                    ? `linear-gradient(to bottom, ${key.color}dd, ${key.color})`
                    : `linear-gradient(to bottom, #1E293B, #0F172A)`,
                  borderColor: isHovered || isDemo ? key.border : 'rgba(255,255,255,0.1)',
                  borderWidth: '2px',
                  boxShadow: isHovered || isDemo ? `0 0 20px ${key.shadow}` : undefined,
                }}
              >
                {/* Note Glow Burst on Activation */}
                {(isHovered || isDemo || isPressedKey) && (
                  <div
                    className="absolute inset-0 opacity-40 blur-md pointer-events-none"
                    style={{ backgroundColor: key.color }}
                  />
                )}

                {/* Top Note Light Bar */}
                <div
                  className="w-full h-3 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: key.color,
                    boxShadow: isHovered || isDemo ? `0 0 12px ${key.color}` : 'none',
                  }}
                />

                {/* Key Label (Solfege & Note) */}
                <div className="text-center z-10">
                  <div
                    className="text-lg font-black tracking-tight drop-shadow-md"
                    style={{ color: isHovered || isDemo ? '#FFFFFF' : key.color }}
                  >
                    {displayName}
                  </div>
                  <div className="text-[10px] font-bold font-mono text-slate-400">
                    {key.note}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Note Particles */}
        {noteParticles.map((p) => (
          <div
            key={p.id}
            className="absolute font-black text-2xl pointer-events-none z-30 transition-transform"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              color: p.color,
              opacity: p.opacity,
              textShadow: `0 0 10px ${p.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {p.char}
          </div>
        ))}

        {/* Virtual Limb Reticle */}
        <div
          className="absolute pointer-events-none z-40 transition-transform duration-75 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${cursorX * 100}%`,
            top: `${cursorY * 100}%`,
          }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full border-2 border-purple-400 bg-purple-500/20 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-purple-500/40 animate-pulse">
              <Music className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* Session Complete Modal */}
        {isCompleted && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {language === 'ta' ? 'பயிற்சி நிறைவடைந்தது' : 'Protocol Completed'}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {language === 'ta' ? 'நியூரோ பியானோ இசைப் பயிற்சி முடிந்தது!' : 'Neuro Piano Melodic Set Complete!'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ta'
                    ? 'இரு கை செவி-இயக்க ஒருங்கிணைப்பு பதிவு செய்யப்பட்டது.'
                    : 'Bilateral auditory-motor mapping and sequential recall recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    {language === 'ta' ? 'சுற்றுகள்' : 'Repetitions'}
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{reps}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    {language === 'ta' ? 'அதிகபட்ச வரிசை' : 'Max Sequence'}
                  </div>
                  <div className="text-lg font-black text-purple-400 font-mono">
                    {bestSequence || sequence.length} {language === 'ta' ? 'சுரங்கள்' : 'Notes'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    {language === 'ta' ? 'மதிப்பெண்' : 'Score'}
                  </div>
                  <div className="text-lg font-black text-amber-400 font-mono">{score}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
