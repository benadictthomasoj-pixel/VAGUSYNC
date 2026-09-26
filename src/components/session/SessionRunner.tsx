import React, { useState, useEffect, useRef } from 'react';
import { useRehab } from '../../context/RehabContext';
import { useHandTracking } from '../../context/HandTrackingContext';
import { GAMES_CATALOG } from '../../data/games';
import { getTranslation } from '../../utils/i18n';
import { soundManager } from '../../utils/audio';
import { BalloonPopGame } from '../games/BalloonPopGame';
import { TargetTouchGame } from '../games/TargetTouchGame';
import { FruitCatchGame } from '../games/FruitCatchGame';
import { PathTracerGame } from '../games/PathTracerGame';
import { ShapeMatchGame } from '../games/ShapeMatchGame';
import { BilateralPuzzleGame } from '../games/BilateralPuzzleGame';
import { WriteAndTraceGame } from '../games/WriteAndTraceGame';
import { BlockBuilderGame } from '../games/BlockBuilderGame';
import { ColorMatchGame } from '../games/ColorMatchGame';
import { MemoryFlipGame } from '../games/MemoryFlipGame';
import { GroceryShoppingGame } from '../games/GroceryShoppingGame';
import { CupTransferGame } from '../games/CupTransferGame';
import { WindowCleanerGame } from '../games/WindowCleanerGame';
import { ShelfOrganiserGame } from '../games/ShelfOrganiserGame';
import { WhackATargetGame } from '../games/WhackATargetGame';
import { NeuroPianoGame } from '../games/NeuroPianoGame';
import { HandCalibrationModal } from '../hand/HandCalibrationModal';
import { DeviceCalibrationModal } from '../common/DeviceCalibrationModal';
import { useHardware } from '../../hardware/HardwareContext';
import {
  Heart,
  Activity,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Hand,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HRPoint, SafetyState } from '../../types';

interface SessionRunnerProps {
  gameId: string;
  onExit: () => void;
  onViewProgress: () => void;
}

type SessionStage =
  | 'calibration'
  | 'pre_pain'
  | 'active_game'
  | 'rpe_check'
  | 'grip_challenge'
  | 'post_pain'
  | 'summary';


export const SessionRunner: React.FC<SessionRunnerProps> = ({
  gameId,
  onExit,
  onViewProgress,
}) => {
  const {
    activePatient,
    activeProgram,
    language,
    voiceGuidance,
    simulatedHR,
    setSimulatedHR,
    safetyState,
    activeCompensation,
    triggerCompensation,
    saveSession,
    createAlert,
  } = useRehab();

  const { stopTracking } = useHandTracking();
  const { hardwareState } = useHardware();

  const t = getTranslation(language);
  const gameDef = GAMES_CATALOG.find((g) => g.id === gameId) || GAMES_CATALOG[0];

  // Stages & Assessment state (Start directly at pre_pain -> active_game with automatic palm detection)
  const [stage, setStage] = useState<SessionStage>('pre_pain');
  const [showImuCalibration, setShowImuCalibration] = useState(false);
  const [painBefore, setPainBefore] = useState<number>(3);
  const [painAfter, setPainAfter] = useState<number>(2);
  const [rpe, setRpe] = useState<number>(3); // 1-5 Borg
  const [isPausedForSafety, setIsPausedForSafety] = useState<boolean>(false);
  const [isPausedForPain, setIsPausedForPain] = useState<boolean>(false);

  // Live in-game stats
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [targetReps] = useState<number>(activeProgram?.repsPerSet || 10);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(85);
  const [liveDifficulty, setLiveDifficulty] = useState<number>(activePatient.currentDifficulty || 2);
  const [movementQuality, setMovementQuality] = useState<number>(90);
  const [safetyEventsCount, setSafetyEventsCount] = useState<number>(0);

  // HR tracking during session
  const [hrHistory, setHrHistory] = useState<HRPoint[]>([
    { time: '00:00', bpm: simulatedHR, state: 'SAFE' },
  ]);
  const [peakHR, setPeakHR] = useState<number>(simulatedHR);
  const [startTime] = useState<number>(Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number>(0);


  // Grip task state
  const [isHoldingGrip, setIsHoldingGrip] = useState(false);
  const [gripHoldDuration, setGripHoldDuration] = useState(0);
  const [gripTargetReached, setGripTargetReached] = useState(false);
  const [gripScore, setGripScore] = useState(78);

  // Final summary state
  const [finalRehabScore, setFinalRehabScore] = useState<number>(87);

  // HR Safety monitor
  useEffect(() => {
    if (safetyState === 'SAFETY_EVENT' && !isPausedForSafety) {
      setIsPausedForSafety(true);
      setSafetyEventsCount((c) => c + 1);
      soundManager.playSafetyAlarm();
      soundManager.speak(t.sessionPausedDesc, language, voiceGuidance);
    }
    if (safetyState === 'WARNING' && liveDifficulty > 1) {
      // Auto throttle difficulty
      setLiveDifficulty((d) => Math.max(1, d - 1));
    }
  }, [safetyState, liveDifficulty, isPausedForSafety, language, voiceGuidance, t.sessionPausedDesc]);

  // Track elapsed duration & periodic HR log
  useEffect(() => {
    if (stage !== 'active_game' || isPausedForSafety || isPausedForPain) return;

    const interval = setInterval(() => {
      setDurationSeconds((d) => d + 1);

      // Record peak HR
      if (simulatedHR > peakHR) {
        setPeakHR(simulatedHR);
      }

      // Append periodic point
      if (durationSeconds % 8 === 0) {
        const mm = String(Math.floor(durationSeconds / 60)).padStart(2, '0');
        const ss = String(durationSeconds % 60).padStart(2, '0');
        setHrHistory((prev) => [
          ...prev,
          { time: `${mm}:${ss}`, bpm: simulatedHR, state: safetyState },
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isPausedForSafety, isPausedForPain, simulatedHR, peakHR, durationSeconds, safetyState]);

  // Handlers
  const handleExertionTick = (delta: number) => {
    // Only elevate HR slightly if below warning threshold
    if (simulatedHR < (activeProgram?.safetyThresholdBPM || 130) - 10) {
      setSimulatedHR(Math.min(135, Math.round(simulatedHR + delta)));
    }
  };

  const handleRepComplete = (accuracy: number, score: number) => {
    setCurrentReps((r) => r + 1);
    setLiveAccuracy(accuracy);
    setLiveScore(score);
  };

  const handleGameComplete = (finalStats: { accuracy: number; score: number; movementQuality: number }) => {
    setLiveAccuracy(finalStats.accuracy);
    setLiveScore(finalStats.score);
    setMovementQuality(finalStats.movementQuality);
    setStage('rpe_check');
    soundManager.playSessionComplete();
  };

  const handleRpeSelect = (val: number) => {
    setRpe(val);
    setStage('grip_challenge');
    soundManager.speak(t.gripChallengeTitle, language, voiceGuidance);
  };

  // Grip Task Press-and-Hold
  const gripTimerRef = useRef<any>(null);


  const startGripHold = () => {
    setIsHoldingGrip(true);
    soundManager.playPop();

    gripTimerRef.current = setInterval(() => {
      setGripHoldDuration((prev) => {
        const next = prev + 0.1;
        if (next >= 4.0) {
          setGripTargetReached(true);
        }
        return next;
      });
    }, 100);
  };

  const releaseGripHold = () => {
    if (gripTimerRef.current) {
      clearInterval(gripTimerRef.current);
    }
    setIsHoldingGrip(false);

    if (gripHoldDuration >= 2.5) {
      soundManager.playTargetSuccess();
      const scoreCalc = Math.min(100, Math.round(65 + gripHoldDuration * 6));
      setGripScore(scoreCalc);
      setTimeout(() => {
        setStage('post_pain');
      }, 600);
    }
  };

  const finishSession = (postPainVal: number) => {
    setPainAfter(postPainVal);

    // Calculate official Rehab Quality Score (0 - 100)
    // 35% Movement / ROM
    // 25% Grip / task performance
    // 20% Cardiac headroom (safe HR distance from ceiling)
    // 20% Pain response (lower pain = higher score)
    const romComponent = (movementQuality / 100) * 35;
    const gripComponent = (gripScore / 100) * 25;
    const maxThreshold = activeProgram?.safetyThresholdBPM || 130;
    const cardiacHeadroom = Math.max(0, (maxThreshold - peakHR) / (maxThreshold - 70));
    const cardiacComponent = Math.min(1, cardiacHeadroom) * 20;
    const painDelta = Math.max(0, 10 - postPainVal);
    const painComponent = (painDelta / 10) * 20;

    const calculatedScore = Math.min(
      98,
      Math.max(50, Math.round(romComponent + gripComponent + cardiacComponent + painComponent))
    );

    setFinalRehabScore(calculatedScore);

    // Save session to context & storage
    saveSession({
      gameId: gameDef.id,
      gameName: gameDef.name,
      category: gameDef.category,
      durationSeconds: Math.max(60, durationSeconds),
      targetReps,
      completedReps: currentReps || targetReps,
      accuracy: liveAccuracy,
      score: liveScore,
      rehabQualityScore: calculatedScore,
      movementQuality,
      avgHR: Math.round((72 + peakHR) / 2),
      peakHR,
      painBefore,
      painAfter: postPainVal,
      rpe,
      gripScore,
      gripHoldSeconds: parseFloat(gripHoldDuration.toFixed(1)),
      compensations: activeCompensation ? [activeCompensation] : [],
      hrHistory,
      safetyEventsCount,
      inputSource: hardwareState.isSimulated ? 'simulation' : hardwareState.connected ? 'hybrid' : 'camera',
      deviceConnected: hardwareState.connected,
      torsoCompensationCount: activeCompensation ? 1 : 0,
    });

    stopTracking();
    setStage('summary');
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    soundManager.playSessionComplete();
  };

  return (
    <div className="max-w-6xl mx-auto font-sans pb-12 animate-in fade-in duration-200">
      {/* Top Header HUD (Available during active stages) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-md mb-5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Exit & Game info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopTracking();
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.exitSession}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">{gameDef.name}</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Level {liveDifficulty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{gameDef.category}</p>
          </div>
        </div>

        {/* Center: Live HR and Safety State */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
          <Heart
            className={`w-5 h-5 ${
              safetyState === 'SAFETY_EVENT'
                ? 'text-[#FF375F] fill-[#FF375F] animate-ping'
                : 'text-[#FF375F] fill-[#FF375F]'
            }`}
          />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-base font-extrabold text-slate-900">{simulatedHR}</span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">BPM</span>
            </div>
            <span
              className={`text-[10px] font-extrabold uppercase ${
                safetyState === 'SAFETY_EVENT'
                  ? 'text-rose-600'
                  : safetyState === 'WARNING'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              ● {safetyState === 'SAFETY_EVENT' ? t.safetyEvent : safetyState === 'WARNING' ? t.warning : t.safe}
            </span>
          </div>
        </div>

        {/* Right: Reps, Score, and Pain Stop Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 font-medium">Repetitions</div>
            <div className="text-sm font-bold font-mono text-slate-900">
              {currentReps} / {targetReps}
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 font-medium">Accuracy</div>
            <div className="text-sm font-bold font-mono text-emerald-600">
              {liveAccuracy}%
            </div>
          </div>

          <button
            onClick={() => setIsPausedForPain(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#FF375F] border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden md:inline">{t.painStopBtn}</span>
            <span className="md:hidden">Pain Stop</span>
          </button>
        </div>
      </div>

      {/* STAGE 0: HAND CALIBRATION */}
      {stage === 'calibration' && (
        <HandCalibrationModal
          gameName={gameDef.name}
          onCalibrationComplete={() => setStage('pre_pain')}
        />
      )}

      {/* STAGE 1: PRE-SESSION PAIN CHECK */}
      {stage === 'pre_pain' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Activity className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Pre-Rehabilitation Assessment
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t.painBeforeTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.painScaleLabel}
            </p>
          </div>

          {/* Pain 0-10 Selector Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 pt-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setPainBefore(num)}
                className={`py-3 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
                  painBefore === num
                    ? num <= 3
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110'
                      : num <= 6
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                      : 'bg-[#FF375F] text-white shadow-lg shadow-rose-500/30 scale-110'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setShowImuCalibration(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Calibrate Neutral Posture</span>
              {hardwareState.isCalibrated && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  ✓ Calibrated
                </span>
              )}
            </button>
            <span className="text-[11px] font-semibold text-slate-500">
              {hardwareState.connected ? (hardwareState.isSimulated ? '● Sim Device Active' : '● ESP-12E Active') : '○ Camera Ready'}
            </span>
          </div>

          <button
            onClick={() => {
              setStage('active_game');
              soundManager.speak(`Starting ${gameDef.name}. Maintain comfortable reach.`, language, voiceGuidance);
            }}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            Start Exercise Set
          </button>
        </div>
      )}

      {/* STAGE 2: ACTIVE GAME PLAY AREA */}
      {stage === 'active_game' && (
        <div className="space-y-4">
          {/* Kinematic Compensation Overlay Banner */}
          {activeCompensation && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-lg animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  ⚠
                </div>
                <div>
                  <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <span>{activeCompensation.type} Compensation Detected</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/80 font-mono text-amber-900">
                      Demo IMU Analysis
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    {activeCompensation.correctionMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Heart Rate Warning Banner */}
          {safetyState === 'WARNING' && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">{t.hrTrendingHigh}</span> Heart rate at {simulatedHR} BPM (Warning Zone). Difficulty throttled to Level {liveDifficulty}.
              </div>
            </div>
          )}

          {/* Render Active Game Component */}
          {gameDef.id === 'balloon-pop' && (
            <BalloonPopGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'target-touch' && (
            <TargetTouchGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'fruit-catch' && (
            <FruitCatchGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'path-tracer' && (
            <PathTracerGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'shape-match' && (
            <ShapeMatchGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'bilateral-puzzle' && (
            <BilateralPuzzleGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'write-and-trace' && (
            <WriteAndTraceGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'block-builder' && (
            <BlockBuilderGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'color-match' && (
            <ColorMatchGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'memory-flip' && (
            <MemoryFlipGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'grocery-shopping' && (
            <GroceryShoppingGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'cup-transfer' && (
            <CupTransferGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'window-cleaner' && (
            <WindowCleanerGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'shelf-organiser' && (
            <ShelfOrganiserGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'whack-a-target' && (
            <WhackATargetGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}

          {gameDef.id === 'neuro-piano' && (
            <NeuroPianoGame
              difficulty={liveDifficulty}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onGameComplete={handleGameComplete}
              onExertionTick={handleExertionTick}
            />
          )}
        </div>
      )}


      {/* STAGE 3: POST-SET RPE CHECK */}
      {stage === 'rpe_check' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Set Completed Successfully
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t.rpeTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Rate your perceived physical exertion (Borg CR10 Scale).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { val: 1, label: t.rpeVeryEasy, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
              { val: 2, label: t.rpeEasy, color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
              { val: 3, label: t.rpeModerate, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
              { val: 4, label: t.rpeHard, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
              { val: 5, label: t.rpeVeryHard, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => handleRpeSelect(item.val)}
                className={`p-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${item.color}`}
              >
                <span className="text-lg font-mono font-extrabold">{item.val}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 4: VIRTUAL FSR GRIP CHALLENGE */}
      {stage === 'grip_challenge' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-150">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {t.gripSensorSim}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t.gripChallengeTitle}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.gripChallengeDesc}
            </p>
          </div>

          {/* Interactive Grip Ball */}
          <div className="py-6 flex flex-col items-center justify-center">
            <button
              onMouseDown={startGripHold}
              onMouseUp={releaseGripHold}
              onTouchStart={startGripHold}
              onTouchEnd={releaseGripHold}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl transition-all select-none cursor-pointer ${
                isHoldingGrip
                  ? 'scale-90 bg-emerald-600 border-white ring-8 ring-emerald-400/30'
                  : 'scale-100 bg-gradient-to-tr from-purple-600 to-indigo-600 border-white/80 ring-4 ring-purple-300/30 hover:scale-105'
              }`}
            >
              <Hand className="w-10 h-10 text-white animate-pulse" />
              <span className="text-white text-xs font-bold mt-1">
                {isHoldingGrip ? 'HOLDING!' : 'PRESS & HOLD'}
              </span>
            </button>

            {/* Hold duration gauge */}
            <div className="mt-6 space-y-1 w-64">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Hold Duration:</span>
                <span className="font-mono text-blue-600">{gripHoldDuration.toFixed(1)}s</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (gripHoldDuration / 4.0) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-75"
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {isHoldingGrip ? t.keepHolding : 'Press and sustain isometric grasp for >3 seconds'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 5: POST-SESSION PAIN CHECK */}
      {stage === 'post_pain' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Heart className="w-7 h-7 fill-blue-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Post-Session Safety Check
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t.painAfterTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Compare your joint comfort following the exercise session.
            </p>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 pt-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => finishSession(num)}
                className="py-3 rounded-2xl font-extrabold text-sm bg-slate-100 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 6: COMPREHENSIVE SESSION SUMMARY */}
      {stage === 'summary' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              {t.sessionSaved}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t.sessionCompleteTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.excellentSession}
            </p>
          </div>

          {/* Large Rehab Quality Score Badge */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white text-center shadow-xl shadow-blue-500/20 space-y-3 relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-200">
              {t.rehabQualityScore}
            </div>
            <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight">
              {finalRehabScore}
              <span className="text-xl font-normal text-blue-200"> / 100</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
              <Award className="w-4 h-4 text-amber-300" />
              <span>+{finalRehabScore} XP Earned</span>
            </div>
          </div>

          {/* 6-Metric Detailed Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Repetitions</div>
              <div className="text-lg font-bold font-mono text-slate-900">{currentReps} / {targetReps}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Movement Quality</div>
              <div className="text-lg font-bold font-mono text-blue-600">{movementQuality}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Avg / Peak HR</div>
              <div className="text-lg font-bold font-mono text-rose-600">{Math.round((72 + peakHR) / 2)} / {peakHR} <span className="text-xs font-normal text-slate-400">BPM</span></div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Pain (Before → After)</div>
              <div className="text-lg font-bold font-mono text-slate-900">{painBefore} → {painAfter}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Grip Strength Score</div>
              <div className="text-lg font-bold font-mono text-emerald-600">{gripScore}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Exertion (RPE)</div>
              <div className="text-lg font-bold font-mono text-slate-900">{rpe} / 5</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onViewProgress}
              className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer text-center"
            >
              {t.viewProgressBtn}
            </button>
            <button
              onClick={onExit}
              className="py-4 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer text-center"
            >
              {t.returnHomeBtn}
            </button>
          </div>
        </div>
      )}

      {/* SAFETY EVENT EMERGENCY MODAL */}
      {isPausedForSafety && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-rose-500 shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                SIMULATED SAFETY EVENT
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {t.sessionPausedTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.sessionPausedDesc}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 font-medium">
              Caregiver alert automatically dispatched to <strong>{activePatient.caregiverName}</strong> ({activePatient.caregiverPhone}).
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsPausedForSafety(false);
                  setSimulatedHR(78); // Cool down HR
                }}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                {t.resumeBtn}
              </button>
              <button
                onClick={() => {
                  setIsPausedForSafety(false);
                  finishSession(painBefore);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                {t.endSessionBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAIN STOP MODAL */}
      {isPausedForPain && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 text-center">
            <h3 className="text-xl font-bold text-slate-900">Pause Rehabilitation?</h3>
            <p className="text-xs text-slate-600">
              You clicked the pain stop trigger. Take a moment to rest your arm and shoulder.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsPausedForPain(false)}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  setIsPausedForPain(false);
                  finishSession(Math.min(10, painBefore + 2));
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMU Calibration Modal */}
      <DeviceCalibrationModal
        isOpen={showImuCalibration}
        onClose={() => setShowImuCalibration(false)}
      />
    </div>
  );
};
