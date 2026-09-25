import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { PatientToday } from './PatientToday';
import { GameSelect } from './GameSelect';
import { PatientProgress } from './PatientProgress';
import { PatientProfile } from './PatientProfile';
import { OnboardingFlow } from './OnboardingFlow';
import { SessionRunner } from '../session/SessionRunner';
import { getTranslation } from '../../utils/i18n';
import {
  Calendar,
  PlayCircle,
  Gamepad2,
  TrendingUp,
  User,
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const {
    activePatient,
    language,
    activePage,
    setActivePage,
    selectedGameForSession,
    setSelectedGameForSession,
  } = useRehab();

  const t = getTranslation(language);
  const [inSession, setInSession] = useState(false);

  // If patient hasn't finished onboarding
  if (!activePatient.hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setActivePage('today');
        }}
      />
    );
  }

  // Active Session Runner Mode
  if (inSession) {
    return (
      <SessionRunner
        gameId={selectedGameForSession || 'balloon-pop'}
        onExit={() => {
          setInSession(false);
          setActivePage('today');
        }}
        onViewProgress={() => {
          setInSession(false);
          setActivePage('progress');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Sub-Navigation Tabs */}
      <nav aria-label="Patient portal navigation" className="bg-white/80 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/90 shadow-xs max-w-2xl mx-auto flex items-center justify-between gap-1 overflow-x-auto">
        <button
          onClick={() => setActivePage('today')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'today'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.navToday}</span>
        </button>

        <button
          onClick={() => {
            setSelectedGameForSession('balloon-pop');
            setInSession(true);
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{t.navStartSession}</span>
        </button>

        <button
          onClick={() => setActivePage('games')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'games'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{t.navGames}</span>
        </button>

        <button
          onClick={() => setActivePage('progress')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'progress'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t.navProgress}</span>
        </button>

        <button
          onClick={() => setActivePage('profile')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t.navProfile}</span>
        </button>
      </nav>

      {/* Render selected page */}
      {activePage === 'today' && (
        <PatientToday
          onStartSession={(gameId) => {
            setSelectedGameForSession(gameId || 'balloon-pop');
            setInSession(true);
          }}
          onNavigate={(page) => setActivePage(page)}
        />
      )}

      {activePage === 'games' && (
        <GameSelect
          onSelectGame={(gameId) => {
            setSelectedGameForSession(gameId);
            setInSession(true);
          }}
        />
      )}

      {activePage === 'progress' && <PatientProgress />}

      {activePage === 'profile' && <PatientProfile />}
    </div>
  );
};
