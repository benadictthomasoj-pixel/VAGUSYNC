import React, { useState, useEffect, useRef } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Circle, Square, Triangle, Star, Hexagon, CheckCircle2 } from 'lucide-react';

interface ShapeMatchGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface ShapeItem {
  id: string;
  type: 'circle' | 'square' | 'triangle' | 'star' | 'hexagon';
  color: string;
  matched: boolean;
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
  slotX: number;
  slotY: number;
}

const AVAILABLE_SHAPES: Array<{ type: ShapeItem['type']; color: string }> = [
  { type: 'circle', color: '#0A84FF' },
  { type: 'square', color: '#30D158' },
  { type: 'triangle', color: '#FF9F0A' },
  { type: 'star', color: '#FF375F' },
  { type: 'hexagon', color: '#AF52DE' },
];

export const ShapeMatchGame: React.FC<ShapeMatchGameProps> = ({
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
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [grabbedShapeId, setGrabbedShapeId] = useState<string | null>(null);
  const [placedToast, setPlacedToast] = useState(false);

  const numShapes = Math.min(4, 3 + Math.floor(difficulty / 2));

  const setupRound = () => {
    const selected = AVAILABLE_SHAPES.slice(0, numShapes).map((s, idx) => {
      const rowY = 0.30 + (idx / (numShapes - 1 || 1)) * 0.44;
      return {
        id: `shape-${idx}-${Date.now()}`,
        type: s.type,
        color: s.color,
        matched: false,
        x: 0.22,
        y: rowY,
        slotX: 0.78,
        slotY: rowY,
      };
    });
    setShapes(selected);
    setGrabbedShapeId(null);
  };

  useEffect(() => {
    setupRound();
  }, [difficulty]);

  // Thumb + Index Pinch to Drag Interaction over live camera
  useEffect(() => {
    if (!handState.detected || isPaused) return;

    const finger = handState.indexTip;

    if (handState.pinch) {
      if (!grabbedShapeId) {
        // Check if index finger is touching an unmatched shape
        const target = shapes.find(
          (s) => !s.matched && Math.hypot(finger.x - s.x, finger.y - s.y) < 0.12
        );
        if (target) {
          setGrabbedShapeId(target.id);
          soundManager.playPop();
        }
      } else {
        // Drag grabbed shape with moving hand
        setShapes((prev) =>
          prev.map((s) => (s.id === grabbedShapeId ? { ...s, x: finger.x, y: finger.y } : s))
        );
      }
    } else {
      // Pinch released! Check if dropped onto matching target slot
      if (grabbedShapeId) {
        const shape = shapes.find((s) => s.id === grabbedShapeId);
        if (shape) {
          const distToSlot = Math.hypot(finger.x - shape.slotX, finger.y - shape.slotY);
          if (distToSlot < 0.14) {
            // MATCH SUCCESS -> SHAPE PLACED!
            soundManager.playShapeMatch();
            onExertionTick(1.0);
            setPlacedToast(true);
            setTimeout(() => setPlacedToast(false), 1200);

            const updatedShapes = shapes.map((s) =>
              s.id === grabbedShapeId ? { ...s, matched: true, x: s.slotX, y: s.slotY } : s
            );
            setShapes(updatedShapes);

            const newScore = score + 90;
            setScore(newScore);

            const allMatched = updatedShapes.every((s) => s.matched);
            if (allMatched) {
              const newReps = reps + 1;
              setReps(newReps);
              onRepComplete(96, newScore);

              if (newReps >= targetReps) {
                soundManager.playSessionComplete();
                onGameComplete({
                  accuracy: 96,
                  score: newScore,
                  movementQuality: 94,
                });
              } else {
                setTimeout(() => setupRound(), 800);
              }
            }
          } else {
            // Return to left origin
            setShapes((prev) =>
              prev.map((s) => (s.id === grabbedShapeId ? { ...s, x: 0.22 } : s))
            );
          }
        }
        setGrabbedShapeId(null);
      }
    }
  }, [handState, grabbedShapeId, shapes, reps, score, targetReps, isPaused]);

  const renderShapeIcon = (type: ShapeItem['type'], color: string, className = 'w-8 h-8') => {
    switch (type) {
      case 'circle':
        return <Circle className={className} style={{ color }} />;
      case 'square':
        return <Square className={className} style={{ color }} />;
      case 'triangle':
        return <Triangle className={className} style={{ color }} />;
      case 'star':
        return <Star className={className} style={{ color }} />;
      case 'hexagon':
        return <Hexagon className={className} style={{ color }} />;
    }
  };

  return (
    <CameraGameContainer
      isPaused={isPaused}
      onTrackingStateChange={(detected) => setIsPaused(!detected)}
      gameTitle="Shape Match"
    >
      <div className="relative w-full h-full pointer-events-none">
        {/* Top Status */}
        <div className="absolute top-14 right-4 z-20 flex items-center gap-2 pointer-events-none">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg ${
              handState.pinch
                ? 'bg-purple-950/90 border-purple-500/60 text-purple-300 animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            {handState.pinch ? '🖐 PINCH ACTIVE (Dragging)' : 'Pinch (Thumb + Index) to Grab'}
          </span>
          <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 font-mono text-emerald-400 font-bold text-xs shadow-lg">
            Sets: {reps} / {targetReps}
          </span>
        </div>

        {/* Shape Placed Toast */}
        {placedToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/90 border border-emerald-400/60 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in zoom-in-95 duration-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHAPE PLACED</span>
          </div>
        )}

        {/* Target Sockets (Right side over camera) */}
        {shapes.map((s) => (
          <div
            key={`slot-${s.id}`}
            style={{
              position: 'absolute',
              left: `${s.slotX * 100}%`,
              top: `${s.slotY * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all z-20 ${
              s.matched
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/50 scale-105'
                : 'border-slate-400/70 bg-slate-900/60 backdrop-blur-xs'
            }`}
          >
            {s.matched ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <div className="opacity-50">
                {renderShapeIcon(s.type, '#94a3b8')}
              </div>
            )}
          </div>
        ))}

        {/* Source Draggable Shapes (Left side over camera) */}
        {shapes.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center shadow-2xl z-20 ${
              s.matched
                ? 'opacity-20 border-slate-700 bg-slate-900 pointer-events-none'
                : grabbedShapeId === s.id
                ? 'bg-slate-900 border-white scale-125 ring-4 ring-purple-400/60 z-30'
                : 'bg-slate-900/85 backdrop-blur-md border-slate-600'
            }`}
          >
            {renderShapeIcon(s.type, s.color)}
          </div>
        ))}

        {/* Bottom guidance */}
        <div className="absolute bottom-3.5 left-6 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 pointer-events-none z-30">
          Pinch thumb and index finger to pick up shape, move to right slot, then release
        </div>
      </div>
    </CameraGameContainer>
  );
};
