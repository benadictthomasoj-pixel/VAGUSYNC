import React, { useState, useEffect } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { useRehab } from '../../context/RehabContext';
import { Brain, Sparkles, Eye, Trophy, RotateCcw } from 'lucide-react';

interface MemoryFlipGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface Card {
  id: number;
  symbol: string;
  name: string;
  nameTa?: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOL_POOL = [
  { symbol: '🍎', name: 'Apple', nameTa: 'ஆப்பிள்', color: '#EF4444' },
  { symbol: '⭐', name: 'Star', nameTa: 'நட்சத்திரம்', color: '#F59E0B' },
  { symbol: '🌿', name: 'Leaf', nameTa: 'இலை', color: '#10B981' },
  { symbol: '💧', name: 'Drop', nameTa: 'துளி', color: '#3B82F6' },
  { symbol: '💜', name: 'Heart', nameTa: 'இதயம்', color: '#8B5CF6' },
  { symbol: '🔔', name: 'Bell', nameTa: 'மணி', color: '#EC4899' },
  { symbol: '⚡', name: 'Bolt', nameTa: 'மின்னல்', color: '#EAB308' },
  { symbol: '🌙', name: 'Moon', nameTa: 'நிலா', color: '#06B6D4' },
];

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  difficulty,
  targetReps,
  onRepComplete,
  onGameComplete,
  onExertionTick,
}) => {
  const { handState } = useHandTracking();
  const { inputState } = useRehabInput();
  const { language } = useRehab();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekAvailable, setPeekAvailable] = useState(true);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);

  const numPairs = difficulty >= 3 ? 6 : 4; // 8 or 12 cards

  const initGame = () => {
    const selected = SYMBOL_POOL.slice(0, numPairs);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        id: idx,
        symbol: item.symbol,
        name: item.name,
        nameTa: item.nameTa,
        color: item.color,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setRoundStartTime(Date.now());
    setPeekAvailable(true);
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const handleCardClick = (index: number) => {
    if (isPeeking || flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    soundManager.playPop();
    onExertionTick(0.6);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newCards[firstIdx].symbol === newCards[secondIdx].symbol) {
        // MATCH!
        soundManager.playTargetSuccess();
        onExertionTick(1.2);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);

          const newMatched = matchedPairs + 1;
          const newScore = score + 120;
          setMatchedPairs(newMatched);
          setScore(newScore);

          if (newMatched >= numPairs) {
            soundManager.playSessionComplete();
            const accuracy = Math.max(70, Math.round((numPairs / Math.max(numPairs, moves + 1)) * 100));
            onRepComplete(accuracy, newScore);

            setTimeout(() => {
              onGameComplete({
                accuracy,
                score: newScore,
                movementQuality: 92,
              });
            }, 1200);
          }
        }, 400);
      } else {
        // MISMATCH!
        soundManager.playWarning();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handlePeek = () => {
    if (!peekAvailable || isPeeking) return;
    setPeekAvailable(false);
    setIsPeeking(true);
    soundManager.playFruitCatch();

    // Reveal all unmatched cards for 1.8 seconds
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: c.isMatched })));
      setIsPeeking(false);
    }, 1800);
  };

  // Cursor hover & activation via unified input
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    // Detect which card is intersected
    const cols = numPairs === 6 ? 4 : 4;
    const rows = numPairs === 6 ? 3 : 2;

    let foundIdx: number | null = null;
    cards.forEach((_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const cardCenterX = 0.20 + (col / (cols - 1 || 1)) * 0.60;
      const cardCenterY = 0.35 + (row / (rows - 1 || 1)) * 0.45;

      if (Math.hypot(cursorX - cardCenterX, cursorY - cardCenterY) < 0.10) {
        foundIdx = idx;
      }
    });

    setHoveredCardIdx(foundIdx);

    if (isPressed && foundIdx !== null) {
      handleCardClick(foundIdx);
    }
  }, [handState, inputState, cards, isPeeking, flippedIndices]);

  const cols = numPairs === 6 ? 4 : 4;
  const rows = numPairs === 6 ? 3 : 2;

  return (
    <CameraGameContainer gameTitle={language === 'ta' ? 'நினைவாற்றல் அட்டை' : 'Memory Flip'}>
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Top HUD */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <Brain className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs font-bold block">
                {language === 'ta' ? 'நினைவாற்றல் கட்டம்' : 'Memory Grid'}
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'ta'
                  ? `இணைகள்: ${matchedPairs} / ${numPairs} • நகர்வுகள்: ${moves}`
                  : `Pairs: ${matchedPairs} / ${numPairs} • Moves: ${moves}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {peekAvailable && (
              <button
                onClick={handlePeek}
                className="bg-indigo-600/90 hover:bg-indigo-500 pointer-events-auto text-white text-xs font-bold px-3.5 py-2 rounded-2xl border border-indigo-400/40 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'காண் (1 முறை)' : 'Peek (1x)'}</span>
              </button>
            )}

            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold">
              {score} {language === 'ta' ? 'புள்ளிகள்' : 'PTS'}
            </div>
          </div>
        </div>

        {/* Card Grid Layout */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className="grid gap-3 sm:gap-4 max-w-xl w-full"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cards.map((card, idx) => {
              const isHovered = hoveredCardIdx === idx;
              const isFaceUp = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`pointer-events-auto aspect-3/4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center cursor-pointer relative shadow-lg ${
                    isFaceUp
                      ? 'bg-white border-white rotate-y-180 scale-100'
                      : 'bg-slate-900/90 border-slate-700 hover:border-indigo-400'
                  } ${isHovered ? 'ring-4 ring-indigo-400 scale-105' : ''} ${
                    card.isMatched ? 'ring-2 ring-emerald-400 shadow-emerald-500/30' : ''
                  }`}
                  style={{
                    perspective: '1000px',
                  }}
                >
                  {isFaceUp ? (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-95">
                      <span className="text-3xl sm:text-4xl">{card.symbol}</span>
                      <span className="text-[10px] font-bold text-slate-700 mt-1">
                        {language === 'ta' ? card.nameTa || card.name : card.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Brain className="w-6 h-6 text-indigo-400/60" />
                      <span className="text-[9px] font-bold mt-1 text-slate-500 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CameraGameContainer>
  );
};
