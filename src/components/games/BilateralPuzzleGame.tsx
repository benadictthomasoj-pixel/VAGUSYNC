import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';

interface BilateralPuzzleGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

export const BilateralPuzzleGame: React.FC<BilateralPuzzleGameProps> = ({
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
  const [leftTarget, setLeftTarget] = useState({ x: 0.25, y: 0.45 });
  const [rightTarget, setRightTarget] = useState({ x: 0.75, y: 0.45 });
  const [holdProgress, setHoldProgress] = useState(0);

  const generateTargets = () => {
    const offset = 0.22 + Math.random() * 0.16;
    const targetY = 0.32 + Math.random() * 0.38;

    setLeftTarget({ x: 0.50 - offset, y: targetY });
    setRightTarget({ x: 0.50 + offset, y: targetY });
    setHoldProgress(0);
  };

  useEffect(() => {
    generateTargets();
  }, []);

  // Determine positions of Left Hand and Right Hand
  let leftHandPos = { x: 0.25, y: 0.70 };
  let rightHandPos = { x: 0.75, y: 0.70 };

  if (handState.detected) {
    if (handState.secondaryHand?.detected) {
      // Two physical hands detected simultaneously in camera!
      if (handState.hand === 'left') {
        leftHandPos = { x: handState.indexTip.x, y: handState.indexTip.y };
        rightHandPos = { x: handState.secondaryHand.indexTip.x, y: handState.secondaryHand.indexTip.y };
      } else {
        rightHandPos = { x: handState.indexTip.x, y: handState.indexTip.y };
        leftHandPos = { x: handState.secondaryHand.indexTip.x, y: handState.secondaryHand.indexTip.y };
      }
    } else {
      // Single hand detected: primary hand direct + bilateral coupled mirror
      const primaryX = handState.indexTip.x;
      const primaryY = handState.indexTip.y;

      if (primaryX < 0.50) {
        leftHandPos = { x: primaryX, y: primaryY };
        rightHandPos = { x: 1.0 - primaryX, y: primaryY };
      } else {
        rightHandPos = { x: primaryX, y: primaryY };
        leftHandPos = { x: 1.0 - primaryX, y: primaryY };
      }
    }
  }

  // Check simultaneous proximity to dual targets
  useEffect(() => {
    if (isPaused) return;

    const leftDist = Math.hypot(leftHandPos.x - leftTarget.x, leftHandPos.y - leftTarget.y);
    const rightDist = Math.hypot(rightHandPos.x - rightTarget.x, rightHandPos.y - rightTarget.y);

    const leftInRange = leftDist < 0.10;
    const rightInRange = rightDist < 0.10;

    let timer: any;

    if (leftInRange && rightInRange) {
      timer = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            soundManager.playTargetSuccess();
            onExertionTick(1.0);

            const newReps = reps + 1;
            const newScore = score + 120;
            setReps(newReps);
            setScore(newScore);
            onRepComplete(95, newScore);

            if (newReps >= targetReps) {
              soundManager.playSessionComplete();
              onGameComplete({
                accuracy: 95,
                score: newScore,
                movementQuality: 92,
              });
            } else {
              generateTargets();
            }
            return 0;
          }
          return prev + 25;
        });
      }, 100);
    } else {
      setHoldProgress(0);
    }

    return () => clearInterval(timer);
  }, [leftHandPos.x, leftHandPos.y, rightHandPos.x, rightHandPos.y, leftTarget, rightTarget, reps, score, targetReps, isPaused]);

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle="Bilateral Puzzle"
    >
      <div className="relative w-full h-full pointer-events-none">
        {/* Midline Symmetry Axis */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-r border-dashed border-indigo-400/40 pointer-events-none z-10" />

        {/* Top Status */}
        <div className="absolute top-14 right-4 z-20 flex items-center gap-2 pointer-events-none">
          <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 font-semibold text-indigo-300 text-xs shadow-lg">
            {handState.secondaryHand?.detected ? '🖐🖐 2 Hands In Camera' : '🖐 Single Hand (Coupled)'}
          </span>
          <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 font-mono text-white font-bold text-xs shadow-lg">
            Symmetry Syncs: {reps} / {targetReps}
          </span>
        </div>

        {/* Left Target Anchor */}
        <div
          style={{
            position: 'absolute',
            left: `${leftTarget.x * 100}%`,
            top: `${leftTarget.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="w-16 h-16 rounded-full border-2 border-indigo-400/90 bg-indigo-950/70 backdrop-blur-xs flex items-center justify-center animate-pulse z-20 shadow-xl shadow-indigo-950/60"
        >
          <span className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider">
            Left Anchor
          </span>
        </div>

        {/* Right Target Anchor */}
        <div
          style={{
            position: 'absolute',
            left: `${rightTarget.x * 100}%`,
            top: `${rightTarget.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="w-16 h-16 rounded-full border-2 border-purple-400/90 bg-purple-950/70 backdrop-blur-xs flex items-center justify-center animate-pulse z-20 shadow-xl shadow-purple-950/60"
        >
          <span className="text-[10px] font-extrabold text-purple-200 uppercase tracking-wider">
            Right Anchor
          </span>
        </div>

        {/* Left Hand Indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${leftHandPos.x * 100}%`,
            top: `${leftHandPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-30 transition-all duration-75"
        >
          <div className="w-14 h-14 rounded-full border-2 border-sky-400 bg-sky-500/30 backdrop-blur-xs flex items-center justify-center shadow-xl shadow-sky-500/50">
            <span className="text-[10px] font-bold text-sky-200 uppercase">L-Hand</span>
          </div>
        </div>

        {/* Right Hand Indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${rightHandPos.x * 100}%`,
            top: `${rightHandPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-30 transition-all duration-75"
        >
          <div className="w-14 h-14 rounded-full border-2 border-purple-400 bg-purple-500/30 backdrop-blur-xs flex items-center justify-center shadow-xl shadow-purple-500/50">
            <span className="text-[10px] font-bold text-purple-200 uppercase">R-Hand</span>
          </div>
        </div>

        {/* Synchrony Progress Ring in Center */}
        {holdProgress > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none text-center space-y-2 bg-slate-900/95 p-4 rounded-3xl border border-indigo-500/60 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mx-auto flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-white">{holdProgress}%</span>
            </div>
            <div className="text-xs font-bold text-emerald-400">HOLDING BILATERAL SYMMETRY</div>
          </div>
        )}

        {/* Bottom guidance */}
        <div className="absolute bottom-3.5 left-6 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 pointer-events-none z-30">
          Position both left and right hand indicators onto their anchor targets simultaneously
        </div>
      </div>
    </CameraGameContainer>
  );
};
