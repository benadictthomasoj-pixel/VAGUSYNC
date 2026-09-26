import React, { useState, useEffect } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { Library, CheckCircle2, Sparkles, FolderCheck } from 'lucide-react';

interface ShelfOrganiserGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface ShelfItem {
  id: string;
  name: string;
  nameTa: string;
  category: string;
  emoji: string;
  x: number; // 0-1
  y: number; // 0-1
  homeX: number;
  homeY: number;
  placed: boolean;
  grabbed: boolean;
}

interface ShelfSection {
  category: string;
  label: string;
  labelTa: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const CATEGORIES = [
  {
    category: 'Books',
    label: '📚 Books',
    labelTa: '📚 புத்தகங்கள்',
    color: '#3B82F6',
    items: [
      { name: 'Red Novel', nameTa: 'நாவல்', emoji: '📕' },
      { name: 'Blue Guide', nameTa: 'கையேடு', emoji: '📘' },
      { name: 'Green Diary', nameTa: 'நாட்குறிப்பு', emoji: '📗' },
    ],
  },
  {
    category: 'Plants',
    label: '🌿 Plants',
    labelTa: '🌿 செடிகள்',
    color: '#10B981',
    items: [
      { name: 'Cactus', nameTa: 'கள்ளிச்செடி', emoji: '🌵' },
      { name: 'Potted Fern', nameTa: 'தொட்டிச் செடி', emoji: '🪴' },
      { name: 'Tulip', nameTa: 'துலிப் மலர்', emoji: '🌷' },
    ],
  },
  {
    category: 'Toys',
    label: '🧸 Toys',
    labelTa: '🧸 பொம்மைகள்',
    color: '#F59E0B',
    items: [
      { name: 'Teddy Bear', nameTa: 'கரடி பொம்மை', emoji: '🧸' },
      { name: 'Yo-Yo', nameTa: 'யோ-யோ', emoji: '🪀' },
      { name: 'Dice', nameTa: 'தாயக்கட்டை', emoji: '🎲' },
    ],
  },
];

export const ShelfOrganiserGame: React.FC<ShelfOrganiserGameProps> = ({
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

  const [items, setItems] = useState<ShelfItem[]>([]);
  const [sections, setSections] = useState<ShelfSection[]>([]);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [organizeComplete, setOrganizeComplete] = useState(false);

  const numCategories = Math.min(3, 2 + Math.floor(difficulty / 2));
  const activeCategories = CATEGORIES.slice(0, numCategories);

  const initShelf = () => {
    // Top shelves (one shelf per category)
    const shelfSpacing = 0.84 / numCategories;
    const newSections: ShelfSection[] = activeCategories.map((cat, idx) => ({
      category: cat.category,
      label: cat.label,
      labelTa: cat.labelTa,
      color: cat.color,
      x: 0.12 + idx * shelfSpacing + shelfSpacing / 2,
      y: 0.35,
      width: Math.max(120, 180 - numCategories * 15),
      height: 110,
    }));
    setSections(newSections);

    // Build mixed items pile at bottom
    const allItems: ShelfItem[] = [];
    activeCategories.forEach((cat) => {
      cat.items.slice(0, 2).forEach((it) => {
        allItems.push({
          id: `item-${it.name}-${Date.now() + Math.random()}`,
          name: it.name,
          nameTa: it.nameTa,
          category: cat.category,
          emoji: it.emoji,
          x: 0,
          y: 0,
          homeX: 0,
          homeY: 0,
          placed: false,
          grabbed: false,
        });
      });
    });

    const shuffled = allItems.sort(() => Math.random() - 0.5);
    const itemSpacing = 0.84 / shuffled.length;
    const placedItems = shuffled.map((it, idx) => {
      const hx = 0.10 + idx * itemSpacing + itemSpacing / 2;
      const hy = 0.82;
      return {
        ...it,
        x: hx,
        y: hy,
        homeX: hx,
        homeY: hy,
      };
    });

    setItems(placedItems);
    setOrganizeComplete(false);
  };

  useEffect(() => {
    initShelf();
  }, [difficulty]);

  // Unified Input Tracking
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    if (isPressed) {
      const activeGrabbed = items.find((i) => i.grabbed);
      if (!activeGrabbed) {
        // Find unplaced item near cursor
        const target = items.find(
          (i) => !i.placed && Math.hypot(cursorX - i.x, cursorY - i.y) < 0.11
        );
        if (target) {
          soundManager.playPop();
          onExertionTick(0.8);
          setItems((prev) =>
            prev.map((i) => (i.id === target.id ? { ...i, grabbed: true, x: cursorX, y: cursorY } : i))
          );
        }
      } else {
        // Drag item
        setItems((prev) =>
          prev.map((i) => (i.id === activeGrabbed.id ? { ...i, x: cursorX, y: cursorY } : i))
        );
      }
    } else {
      // Release action
      const activeGrabbed = items.find((i) => i.grabbed);
      if (activeGrabbed) {
        // Check which shelf section it was dropped onto
        const targetSection = sections.find(
          (s) => Math.hypot(activeGrabbed.x - s.x, activeGrabbed.y - s.y) < 0.18
        );

        if (targetSection) {
          if (targetSection.category === activeGrabbed.category) {
            // Correct shelf!
            soundManager.playShapeMatch();
            onExertionTick(1.2);

            // Auto-align within the section
            const countOnShelf = items.filter(
              (i) => i.placed && i.category === targetSection.category
            ).length;
            const alignedX = targetSection.x + (countOnShelf === 0 ? -0.04 : 0.04);
            const alignedY = targetSection.y + 0.02;

            const nextItems = items.map((i) =>
              i.id === activeGrabbed.id
                ? { ...i, placed: true, grabbed: false, x: alignedX, y: alignedY }
                : i
            );
            setItems(nextItems);

            const newScore = score + 90;
            setScore(newScore);

            // Check if all items are organized
            const allPlaced = nextItems.every((i) => i.placed);
            if (allPlaced) {
              setOrganizeComplete(true);
              soundManager.playSessionComplete();

              const newReps = reps + 1;
              setReps(newReps);
              onRepComplete(95, newScore);

              if (newReps >= targetReps) {
                setTimeout(() => {
                  onGameComplete({
                    accuracy: 95,
                    score: newScore,
                    movementQuality: 92,
                  });
                }, 1400);
              } else {
                setTimeout(initShelf, 1600);
              }
            }
          } else {
            // Incorrect shelf -> Spring back
            soundManager.playWarning();
            setItems((prev) =>
              prev.map((i) =>
                i.id === activeGrabbed.id
                  ? { ...i, grabbed: false, x: i.homeX, y: i.homeY }
                  : i
              )
            );
          }
        } else {
          // Dropped outside -> Return home
          setItems((prev) =>
            prev.map((i) =>
              i.id === activeGrabbed.id
                ? { ...i, grabbed: false, x: i.homeX, y: i.homeY }
                : i
            )
          );
        }
      }
    }
  }, [handState, inputState, items, sections, score, reps]);

  return (
    <CameraGameContainer gameTitle="Shelf Organiser">
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Top HUD */}
        <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white flex items-center gap-3">
            <Library className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-xs font-bold block">
                {language === 'ta' ? 'அடுக்கு அமைத்தல்' : 'Shelf Organizer'}
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'ta'
                  ? `சுற்று ${reps + 1} / ${targetReps} • விதி: வகை வாரியாக அடுக்கவும்`
                  : `Round ${reps + 1} of ${targetReps} • Rule: Sort by Category`}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 text-white font-mono text-sm font-bold">
            {score} PTS
          </div>
        </div>

        {/* Shelf Structure */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {sections.map((section) => {
            const displayLabel = language === 'ta' ? section.labelTa || section.label : section.label;
            return (
              <div
                key={section.category}
                className="absolute rounded-3xl border-2 border-dashed bg-slate-900/80 shadow-2xl flex flex-col justify-between p-3"
                style={{
                  left: `${section.x * 100}%`,
                  top: `${section.y * 100}%`,
                  width: `${section.width}px`,
                  height: `${section.height}px`,
                  transform: 'translate(-50%, -50%)',
                  borderColor: section.color,
                  boxShadow: `0 10px 25px ${section.color}30`,
                }}
              >
                <span
                  className="text-xs font-black uppercase tracking-wider text-center"
                  style={{ color: section.color }}
                >
                  {displayLabel}
                </span>
                <div
                  className="h-2 w-full rounded-full mt-auto opacity-70"
                  style={{ backgroundColor: section.color }}
                />
              </div>
            );
          })}
        </div>

        {/* Mixed Items (Draggable & Placed) */}
        {items.map((item) => {
          const displayName = language === 'ta' ? item.nameTa || item.name : item.name;
          return (
            <div
              key={item.id}
              className={`absolute transition-transform duration-75 flex flex-col items-center justify-center p-2 rounded-2xl bg-white/95 border border-slate-200 shadow-md ${
                item.grabbed ? 'scale-125 z-40 shadow-2xl rotate-2 ring-4 ring-purple-400' : 'scale-100 z-30'
              } ${item.placed ? 'ring-2 ring-emerald-400 z-25' : ''}`}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: '68px',
                height: '68px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-[8px] font-bold text-slate-700 truncate max-w-[56px]">
                {displayName}
              </span>
            </div>
          );
        })}

        {/* Organized Complete Banner */}
        {organizeComplete && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-950/40 backdrop-blur-xs animate-in zoom-in-95">
            <div className="bg-slate-900 border-2 border-emerald-400 p-6 rounded-3xl shadow-2xl text-center space-y-2 text-white">
              <FolderCheck className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-extrabold text-white">
                {language === 'ta' ? 'அடுக்கு அமைத்தல் முடிந்தது!' : 'Perfect Shelf Organization!'}
              </h3>
              <p className="text-xs text-emerald-300 font-bold">
                {language === 'ta' ? '+90 மதிப்பெண்கள்!' : '+90 Points Clean Sort'}
              </p>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
