import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { GAMES_CATALOG } from '../../data/games';
import { getTranslation } from '../../utils/i18n';
import {
  Sparkles,
  Target,
  Apple,
  Activity,
  Boxes,
  Layers,
  Clock,
  Zap,
  ArrowRight,
  Filter,
  Shield,
  Play,
} from 'lucide-react';

interface GameSelectProps {
  onSelectGame: (gameId: string) => void;
}

export const GameSelect: React.FC<GameSelectProps> = ({ onSelectGame }) => {
  const { language, activePatient } = useRehab();
  const t = getTranslation(language);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Functional Reach & Grasp',
    'Range of Motion',
    'Compensation Correction',
    'Cardiac-Paced Endurance',
    'Pain-Safe Positioning',
  ];

  const filteredGames =
    selectedCategory === 'All'
      ? GAMES_CATALOG
      : GAMES_CATALOG.filter((g) => g.category === selectedCategory);

  const getGameIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6" style={{ color }} />;
      case 'Target':
        return <Target className="w-6 h-6" style={{ color }} />;
      case 'Apple':
        return <Apple className="w-6 h-6" style={{ color }} />;
      case 'Activity':
        return <Activity className="w-6 h-6" style={{ color }} />;
      case 'Boxes':
        return <Boxes className="w-6 h-6" style={{ color }} />;
      case 'Layers':
        return <Layers className="w-6 h-6" style={{ color }} />;
      default:
        return <Play className="w-6 h-6" style={{ color }} />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Active Clinical Protocols
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rehabilitation Game Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Select a targeted game protocol. Every exercise pairs motor tasks with real-time posture compensation analysis and cardiac rate pacing.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs self-start md:self-auto">
          <span className="text-xs text-slate-500">Current Level:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Level {activePatient.currentDifficulty}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className="medical-card p-6 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group"
          >
            <div className="space-y-4">
              {/* Card Top Row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
                  style={{
                    backgroundColor: `${game.accentColor}15`,
                    borderColor: `${game.accentColor}30`,
                  }}
                >
                  {getGameIcon(game.iconName, game.accentColor)}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Level {activePatient.currentDifficulty}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {game.estimatedDuration}
                  </span>
                </div>
              </div>

              {/* Game Title & Category */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {game.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {game.name}
                </h3>
              </div>

              {/* Purpose & Description */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-normal">Focus: </span>
                  {game.purpose}
                </div>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {game.description}
                </p>
              </div>
            </div>

            {/* Target Muscle & Play Button */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>{game.targetFocus}</span>
              </div>

              <button
                onClick={() => onSelectGame(game.id)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group-hover:bg-blue-600"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t.playGameBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
