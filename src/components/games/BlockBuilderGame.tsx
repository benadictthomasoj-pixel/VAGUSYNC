import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Boxes, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface BlockBuilderGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface Block {
  id: string;
  type: 'cube' | 'rect' | 'cylinder';
  color: string;
  width: number;
  height: number;
  x: number; // 0-1
  y: number; // 0-1
  homeX: number;
  homeY: number;
  placed: boolean;
  targetSlot: { x: number; y: number; width: number; height: number };
}

const BLUEPRINTS = [
  {
    name: 'Arch Tower',
    slots: [
      { type: 'rect' as const, color: '#3B82F6', width: 44, height: 70, x: 0.44, y: 0.70 },
      { type: 'rect' as const, color: '#3B82F6', width: 44, height: 70, x: 0.56, y: 0.70 },
      { type: 'cube' as const, color: '#10B981', width: 50, height: 50, x: 0.50, y: 0.54 },
      { type: 'cylinder' as const, color: '#F59E0B', width: 42, height: 42, x: 0.50, y: 0.41 },
    ],
  },
  {
    name: 'Pyramid Castle',
    slots: [
      { type: 'cube' as const, color: '#EC4899', width: 48, height: 48, x: 0.43, y: 0.72 },
      { type: 'cube' as const, color: '#EC4899', width: 48, height: 48, x: 0.57, y: 0.72 },
      { type: 'rect' as const, color: '#8B5CF6', width: 90, height: 38, x: 0.50, y: 0.59 },
      { type: 'cylinder' as const, color: '#06B6D4', width: 40, height: 40, x: 0.50, y: 0.47 },
    ],
  },
  {
    name: 'Sky Beacon',
    slots: [
      { type: 'rect' as const, color: '#6366F1', width: 80, height: 40, x: 0.50, y: 0.73 },
      { type: 'cylinder' as const, color: '#10B981', width: 44, height: 44, x: 0.50, y: 0.60 },
      { type: 'rect' as const, color: '#F59E0B', width: 44, height: 60, x: 0.50, y: 0.45 },
      { type: 'cube' as const, color: '#EF4444', width: 40, height: 40, x: 0.50, y: 0.31 },
    ],
  },
];

export const BlockBuilderGame: React.FC<BlockBuilderGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState(0);
  const [currentBlueprintIdx, setCurrentBlueprintIdx] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [grabbedBlockId, setGrabbedBlockId] = useState<string | null>(null);
  const [wobble, setWobble] = useState(false);
  const [structureComplete, setStructureComplete] = useState(false);
  const [roundStats, setRoundStats] = useState({ correct: 0, total: 0 });

  const activeBlueprint = BLUEPRINTS[currentBlueprintIdx % BLUEPRINTS.length];

  const initBlueprint = () => {
    const slots = activeBlueprint.slots;
    const trayY = 0.22;
    const traySpacing = 0.80 / slots.length;

    const newBlocks: Block[] = slots.map((s, idx) => {
      const homeX = 0.12 + idx * traySpacing;
      const homeY = trayY + (idx % 2 === 0 ? -0.02 : 0.02);
      return {
        id: `block-${idx}-${Date.now()}`,
        type: s.type,
        color: s.color,
        width: s.width,
        height: s.height,
        x: homeX,
        y: homeY,
        homeX,
        homeY,
        placed: false,
        targetSlot: s,
      };
    });

    setBlocks(newBlocks);
    setGrabbedBlockId(null);
    setStructureComplete(false);
  };

  useEffect(() => {
    initBlueprint();
  }, [currentBlueprintIdx, difficulty]);

  // Unified Input Tracking: Use either hand index cursor or normalized input coordinates
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    if (isPressed) {
      if (!grabbedBlockId) {
        // Pick block within reach radius
        const target = blocks.find(
          (b) => !b.placed && Math.hypot(cursorX - b.x, cursorY - b.y) < 0.12
        );
        if (target) {
          setGrabbedBlockId(target.id);
          soundManager.playPop();
          onExertionTick(0.8);
        }
      } else {
        // Drag grabbed block
        setBlocks((prev) =>
          prev.map((b) => (b.id === grabbedBlockId ? { ...b, x: cursorX, y: cursorY } : b))
        );
      }
    } else {
      // Release action
      if (grabbedBlockId) {
        const block = blocks.find((b) => b.id === grabbedBlockId);
        if (block) {
          const distToTarget = Math.hypot(
            block.x - block.targetSlot.x,
            block.y - block.targetSlot.y
          );

          if (distToTarget < 0.10) {
            // Snapped into place!
            soundManager.playShapeMatch();
            onExertionTick(1.2);

            const nextBlocks = blocks.map((b) =>
              b.id === grabbedBlockId
                ? { ...b, x: b.targetSlot.x, y: b.targetSlot.y, placed: true }
                : b
            );
            setBlocks(nextBlocks);
            setRoundStats((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));

            const newScore = score + 100;
            setScore(newScore);

            // Check if all blocks in blueprint are placed
            const allPlaced = nextBlocks.every((b) => b.placed);
            if (allPlaced) {
              setStructureComplete(true);
              soundManager.playTargetSuccess();

              const newReps = reps + 1;
              setReps(newReps);
              const accuracy = Math.round(((roundStats.correct + 1) / (roundStats.total + 1)) * 100);
              onRepComplete(accuracy, newScore);

              if (newReps >= targetReps) {
                soundManager.playSessionComplete();
                setTimeout(() => {
                  onGameComplete({
                    accuracy: Math.max(88, accuracy),
                    score: newScore,
                    movementQuality: 92,
                  });
                }, 1200);
              } else {
                setTimeout(() => {
                  setCurrentBlueprintIdx((i) => i + 1);
                }, 1400);
              }
            }
          } else {
            // Incorrect drop -> Spring back home with wobble
            soundManager.playWarning();
            setWobble(true);
            setTimeout(() => setWobble(false), 400);
            setRoundStats((s) => ({ ...s, total: s.total + 1 }));

            setBlocks((prev) =>
              prev.map((b) =>
                b.id === grabbedBlockId ? { ...b, x: b.homeX, y: b.homeY } : b
              )
            );
          }
        }
        setGrabbedBlockId(null);
      }
    }
  }, [handState, inputState, grabbedBlockId, blocks]);

  return (
    <CameraGameContainer gameTitle="Block Builder">
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Top Header Card */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <Boxes className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-xs font-bold block">{activeBlueprint.name}</span>
              <span className="text-[10px] text-slate-400">
                Structure {reps + 1} of {targetReps}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold flex items-center gap-2">
            <span className="text-amber-400">★</span>
            <span>{score} PTS</span>
          </div>
        </div>

        {/* Blueprint Silhouettes & Building Platform */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Construction Foundation Table */}
          <div
            className="absolute bg-slate-800/80 border-t-4 border-blue-500 rounded-t-2xl backdrop-blur-xs shadow-2xl"
            style={{
              left: '32%',
              right: '32%',
              bottom: '16%',
              height: '32px',
            }}
          >
            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
              Building Platform
            </div>
          </div>

          {/* Blueprint Target Sockets */}
          {activeBlueprint.slots.map((slot, idx) => (
            <div
              key={`slot-${idx}`}
              className={`absolute border-2 border-dashed border-sky-400/50 bg-sky-500/10 transition-all duration-300 ${
                slot.type === 'cylinder' ? 'rounded-full' : 'rounded-xl'
              } ${structureComplete ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30' : ''}`}
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.width}px`,
                height: `${slot.height}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Blocks (Draggable & Placed) */}
        {blocks.map((block) => {
          const isGrabbed = block.id === grabbedBlockId;
          return (
            <div
              key={block.id}
              className={`absolute transition-transform cursor-grab active:cursor-grabbing ${
                block.type === 'cylinder' ? 'rounded-full' : 'rounded-xl'
              } ${isGrabbed ? 'scale-115 shadow-2xl z-40 rotate-3' : 'shadow-md z-30'} ${
                block.placed ? 'z-20 scale-100' : ''
              } ${wobble && !block.placed ? 'animate-wiggle' : ''}`}
              style={{
                left: `${block.x * 100}%`,
                top: `${block.y * 100}%`,
                width: `${block.width}px`,
                height: `${block.height}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: block.color,
                boxShadow: isGrabbed
                  ? `0 20px 30px ${block.color}66`
                  : `0 6px 12px rgba(0,0,0,0.3)`,
              }}
            >
              {/* 3D Highlight Gradient Overlay */}
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-black/20 via-transparent to-white/40 pointer-events-none" />
              {block.placed && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold animate-in zoom-in">
                  ✓
                </div>
              )}
            </div>
          );
        })}

        {/* Structure Complete Celebration Banner */}
        {structureComplete && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-950/40 backdrop-blur-xs animate-in zoom-in-95">
            <div className="bg-slate-900 border-2 border-emerald-400 p-6 rounded-3xl shadow-2xl text-center space-y-2 text-white">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Structure Complete!</h3>
              <p className="text-xs text-emerald-300 font-semibold">+100 Points • Perfect Assembly</p>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
