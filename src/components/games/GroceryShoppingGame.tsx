import React, { useState, useEffect } from 'react';
import { useHandTracking } from '../../context/HandTrackingContext';
import { useRehabInput } from '../../input/InputContext';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import { CameraGameContainer } from '../hand/CameraGameContainer';
import { soundManager } from '../../utils/audio';
import { ShoppingCart, CheckCircle2, Receipt, Sparkles, HelpCircle } from 'lucide-react';

interface GroceryShoppingGameProps {
  difficulty: number;
  targetReps: number;
  onRepComplete: (accuracy: number, score: number) => void;
  onGameComplete: (finalStats: { accuracy: number; score: number; movementQuality: number }) => void;
  onExertionTick: (hrDelta: number) => void;
}

interface GroceryItem {
  id: string;
  name: string;
  nameTa: string;
  emoji: string;
  price: string;
  isRequired: boolean;
  collected: boolean;
  x: number; // 0-1
  y: number; // 0-1
  shelfRow: number;
  grabbed: boolean;
}

const GROCERY_CATALOG = [
  { name: 'Fresh Milk', nameTa: 'பசும்பால்', emoji: '🥛', price: '₹25' },
  { name: 'Red Apples', nameTa: 'ஆப்பிள்', emoji: '🍎', price: '₹30' },
  { name: 'Whole Wheat Bread', nameTa: 'ரொட்டி', emoji: '🍞', price: '₹35' },
  { name: 'Orange Juice', nameTa: 'ஆரஞ்சு சாறு', emoji: '🧃', price: '₹40' },
  { name: 'Swiss Cheese', nameTa: 'பாலாடைக்கட்டி', emoji: '🧀', price: '₹50' },
  { name: 'Fresh Bananas', nameTa: 'வாழைப்பழம்', emoji: '🍌', price: '₹20' },
  { name: 'Organic Eggs', nameTa: 'நாட்டு முட்டை', emoji: '🥚', price: '₹45' },
  { name: 'Crunchy Carrot', nameTa: 'கேரட்', emoji: '🥕', price: '₹15' },
];

export const GroceryShoppingGame: React.FC<GroceryShoppingGameProps> = ({
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
  const [shelfItems, setShelfItems] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [reps, setReps] = useState(0);

  const numRequired = Math.min(5, 3 + Math.floor(difficulty / 2));

  const initStore = () => {
    const shuffled = [...GROCERY_CATALOG].sort(() => Math.random() - 0.5);
    const requiredItems = shuffled.slice(0, numRequired).map((i) => i.name);
    setShoppingList(requiredItems);

    // Populate shelves with required items + distractors
    const storeItems: GroceryItem[] = shuffled.slice(0, 8).map((item, idx) => {
      const row = Math.floor(idx / 4); // 2 rows of 4
      const col = idx % 4;
      const x = 0.38 + col * 0.14;
      const y = row === 0 ? 0.36 : 0.58;

      return {
        id: `grocery-${idx}-${Date.now()}`,
        name: item.name,
        nameTa: item.nameTa,
        emoji: item.emoji,
        price: item.price,
        isRequired: requiredItems.includes(item.name),
        collected: false,
        x,
        y,
        shelfRow: row,
        grabbed: false,
      };
    });

    setShelfItems(storeItems);
    setCartCount(0);
    setShowReceipt(false);
  };

  useEffect(() => {
    initStore();
  }, [difficulty]);

  // Unified Input Tracking
  useEffect(() => {
    const cursorX = handState.detected ? handState.indexTip.x : inputState.x;
    const cursorY = handState.detected ? handState.indexTip.y : inputState.y;
    const isPressed = handState.detected ? handState.pinch : inputState.primaryPressed;

    const cartZone = { x: 0.20, y: 0.78, radius: 0.18 };

    if (isPressed) {
      const activeGrabbed = shelfItems.find((i) => i.grabbed);
      if (!activeGrabbed) {
        // Pick an uncollected item
        const candidate = shelfItems.find(
          (item) => !item.collected && Math.hypot(cursorX - item.x, cursorY - item.y) < 0.10
        );
        if (candidate) {
          soundManager.playPop();
          onExertionTick(0.8);
          setShelfItems((prev) =>
            prev.map((i) => (i.id === candidate.id ? { ...i, grabbed: true, x: cursorX, y: cursorY } : i))
          );
        }
      } else {
        // Drag item
        setShelfItems((prev) =>
          prev.map((i) => (i.id === activeGrabbed.id ? { ...i, x: cursorX, y: cursorY } : i))
        );
      }
    } else {
      // Release check
      const activeGrabbed = shelfItems.find((i) => i.grabbed);
      if (activeGrabbed) {
        const inCart = Math.hypot(activeGrabbed.x - cartZone.x, activeGrabbed.y - cartZone.y) < cartZone.radius;

        if (inCart) {
          if (activeGrabbed.isRequired) {
            // Correct item in shopping list!
            soundManager.playFruitCatch();
            onExertionTick(1.2);

            setCartBouncing(true);
            setTimeout(() => setCartBouncing(false), 400);

            const nextItems = shelfItems.map((i) =>
              i.id === activeGrabbed.id ? { ...i, collected: true, grabbed: false } : i
            );
            setShelfItems(nextItems);

            const newCount = cartCount + 1;
            const newScore = score + 95;
            setCartCount(newCount);
            setScore(newScore);

            if (newCount >= numRequired) {
              soundManager.playSessionComplete();
              setShowReceipt(true);

              const newReps = reps + 1;
              setReps(newReps);
              onRepComplete(95, newScore);

              setTimeout(() => {
                if (newReps >= targetReps) {
                  onGameComplete({
                    accuracy: 95,
                    score: newScore,
                    movementQuality: 90,
                  });
                } else {
                  initStore();
                }
              }, 2000);
            }
          } else {
            // Wrong item (not on shopping list)
            soundManager.playWarning();
            // Return to shelf
            const col = parseInt(activeGrabbed.id.split('-')[1]) % 4;
            const row = activeGrabbed.shelfRow;
            setShelfItems((prev) =>
              prev.map((i) =>
                i.id === activeGrabbed.id
                  ? { ...i, grabbed: false, x: 0.38 + col * 0.14, y: row === 0 ? 0.36 : 0.58 }
                  : i
              )
            );
          }
        } else {
          // Dropped outside cart -> return to shelf
          const col = parseInt(activeGrabbed.id.split('-')[1]) % 4;
          const row = activeGrabbed.shelfRow;
          setShelfItems((prev) =>
            prev.map((i) =>
              i.id === activeGrabbed.id
                ? { ...i, grabbed: false, x: 0.38 + col * 0.14, y: row === 0 ? 0.36 : 0.58 }
                : i
            )
          );
        }
      }
    }
  }, [handState, inputState, shelfItems, cartCount, score, reps]);

  return (
    <CameraGameContainer gameTitle="Grocery Shopping">
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Left Side: Shopping List Clipboard */}
        <div className="absolute top-16 left-6 w-52 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200 shadow-xl z-30">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              {language === 'ta' ? 'பட்டியல்' : 'Shopping List'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {cartCount}/{numRequired}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            {shoppingList.map((reqName) => {
              const isFound = shelfItems.some((i) => i.name === reqName && i.collected);
              const catItem = GROCERY_CATALOG.find((c) => c.name === reqName);
              const displayName = language === 'ta' ? catItem?.nameTa || reqName : reqName;
              return (
                <div
                  key={reqName}
                  className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${
                    isFound ? 'bg-emerald-50 text-emerald-800 font-bold line-through' : 'bg-slate-50'
                  }`}
                >
                  <span className="text-sm">
                    {catItem?.emoji}
                  </span>
                  <span className="truncate flex-1">{displayName}</span>
                  {isFound && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Shelves (Right side background structures) */}
        <div className="absolute top-28 right-6 left-60 bottom-12 flex flex-col justify-around pointer-events-none">
          {/* Top Shelf Bar */}
          <div className="h-4 bg-amber-900/60 rounded-full border-t-2 border-amber-500/80 shadow-md backdrop-blur-xs" />
          {/* Bottom Shelf Bar */}
          <div className="h-4 bg-amber-900/60 rounded-full border-t-2 border-amber-500/80 shadow-md backdrop-blur-xs" />
        </div>

        {/* Shelf Items */}
        {shelfItems.map((item) => {
          if (item.collected) return null;
          const displayName = language === 'ta' ? item.nameTa : item.name;
          return (
            <div
              key={item.id}
              className={`absolute transition-transform duration-75 flex flex-col items-center justify-center p-2 rounded-2xl bg-white/95 border border-slate-200 shadow-md ${
                item.grabbed ? 'scale-125 z-40 shadow-2xl rotate-2 ring-4 ring-emerald-400' : 'scale-100 z-30'
              } ${hintActive && item.isRequired ? 'animate-bounce ring-2 ring-amber-400' : ''}`}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: '74px',
                height: '74px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-[9px] font-bold text-slate-700 truncate max-w-[64px]">
                {displayName}
              </span>
            </div>
          );
        })}

        {/* Bottom Left: Shopping Cart Destination Drop Target */}
        <div
          className={`absolute bottom-6 left-6 w-44 h-36 rounded-3xl border-3 border-dashed transition-transform duration-200 flex flex-col items-center justify-center shadow-2xl ${
            cartBouncing
              ? 'scale-115 -translate-y-2 border-emerald-400 bg-emerald-950/80'
              : 'border-emerald-500/60 bg-slate-900/90'
          }`}
          style={{
            transform: cartBouncing ? 'scale(1.1) translateY(-8px)' : 'scale(1)',
          }}
        >
          <ShoppingCart className="w-10 h-10 text-emerald-400 mb-1 animate-pulse" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            {language === 'ta' ? 'ஷாப்பிங் கூடை' : 'Shopping Cart'}
          </span>
          <span className="text-[10px] text-emerald-300 font-bold">
            {language === 'ta' ? 'பொருளை இங்கே வைக்கவும்' : 'Drop Required Items Here'}
          </span>
        </div>

        {/* Receipt Completion Popup */}
        {showReceipt && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-950/50 backdrop-blur-xs animate-in zoom-in-95">
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 max-w-xs w-full text-center space-y-3">
              <Receipt className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900 uppercase">
                {language === 'ta' ? 'ரசீது விவரம்' : 'Shopping Receipt'}
              </h3>
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-xs text-left">
                {shoppingList.map((name) => {
                  const catItem = GROCERY_CATALOG.find((c) => c.name === name);
                  const displayName = language === 'ta' ? catItem?.nameTa || name : name;
                  return (
                    <div key={name} className="flex justify-between font-mono">
                      <span>{displayName}</span>
                      <span className="font-bold">✓ READY</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs font-bold text-emerald-600">
                {language === 'ta' ? '+100 மதிப்பெண்கள்!' : '+100 Points Complete!'}
              </div>
            </div>
          </div>
        )}
      </div>
    </CameraGameContainer>
  );
};
