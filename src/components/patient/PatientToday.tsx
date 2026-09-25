import React from 'react';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import {
  Activity,
  Heart,
  Flame,
  TrendingUp,
  Play,
  Stethoscope,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Target,
  Hand,
  Award,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface PatientTodayProps {
  onStartSession: (gameId?: string) => void;
  onNavigate: (page: string) => void;
}

export const PatientToday: React.FC<PatientTodayProps> = ({ onStartSession, onNavigate }) => {
  const { activePatient, activeProgram, sessions, language, simulatedHR, safetyState } = useRehab();
  const t = getTranslation(language);

  // Filter sessions for active patient
  const patientSessions = sessions.filter((s) => s.patientId === activePatient.id);

  // Prepare chart data
  const progressChartData = patientSessions.slice(-6).map((s, idx) => ({
    sessionName: `S${idx + 1}`,
    date: s.date.slice(5),
    rom: s.movementQuality,
    hr: s.avgHR,
    grip: s.gripScore || 70,
    quality: s.rehabQualityScore,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-blue-50 border border-white/25">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Daily Prescribed Plan Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.goodMorning}, {activePatient.name}
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            {t.recoverySubtitle}
          </p>
        </div>

        {/* Level & XP Quick Badge */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md">
            L{activePatient.level}
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Experience</div>
            <div className="text-sm font-bold text-white font-mono">{activePatient.xp} XP</div>
          </div>
        </div>
      </div>

      {/* 4 Core Vital Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Readiness */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todayReadiness}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {activePatient.readinessScore}%
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Optimal for rehab
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            {t.demoAssessment}
          </div>
        </div>

        {/* Heart Rate */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.heartRate}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#FF375F] flex items-center justify-center">
              <Heart className="w-4 h-4 fill-[#FF375F] animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {simulatedHR} <span className="text-sm font-sans font-medium text-slate-400">BPM</span>
            </div>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${
                safetyState === 'SAFETY_EVENT'
                  ? 'text-rose-600'
                  : safetyState === 'WARNING'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              ● {safetyState === 'SAFETY_EVENT' ? t.safetyEvent : safetyState === 'WARNING' ? t.warning : t.safe}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            Simulated sensor
          </div>
        </div>

        {/* Range of Motion */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.rangeOfMotion}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {activePatient.currentROM}%
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              +16% baseline gain
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            Glenohumeral arc
          </div>
        </div>

        {/* Rehab Streak */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.rehabStreak}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {activePatient.streakDays} <span className="text-sm font-sans font-medium text-slate-400">{t.days}</span>
            </div>
            <p className="text-[11px] text-amber-600 font-semibold">
              {activePatient.completedSessionsThisWeek} / {activePatient.weeklyGoalSessions} sessions done
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            Adherence: High
          </div>
        </div>
      </div>

      {/* Main Prescribed Session Banner & Therapist Note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescribed Session Action Card (2 columns) */}
        <div className="lg:col-span-2 medical-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {t.todayRehabilitation}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {activeProgram?.category || 'Functional Reach & Grasp'}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Prescribed Level {activePatient.currentDifficulty}
              </span>
            </div>

            {/* Protocol Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  {t.recommendedSession}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {activeProgram?.sets || 3} sets × {activeProgram?.repsPerSet || 10} reps
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {t.estimatedDuration}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  12 minutes
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#FF375F]" />
                  Safety Ceiling
                </div>
                <div className="text-sm font-bold text-slate-900">
                  &lt; {activeProgram?.safetyThresholdBPM || 130} BPM
                </div>
              </div>
            </div>

            {/* Big START SESSION Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onStartSession('balloon-pop')}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                <span>{t.startSessionBtn}</span>
              </button>

              <button
                onClick={() => onNavigate('games')}
                className="py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>Browse All Games</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Therapist Note Card (1 column) */}
        <div className="medical-card p-6 flex flex-col justify-between space-y-4 bg-gradient-to-b from-indigo-50/40 to-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                {t.therapistNote}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600">
                {t.fromDrPriya}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-indigo-100/80 shadow-xs">
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                “{activeProgram?.customNotes || t.therapistNoteDefault}”
              </p>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Vagal stimulation: {activeProgram?.vagalStimulationEnabled ? 'Enabled for Clean Reps' : 'Standard Biofeedback'}
              </p>
              <p className="text-[10px] text-slate-400">
                Last modified: Today, 09:30 AM by Clinical Team
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('progress')}
            className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors text-center"
          >
            Review Clinical Chart →
          </button>
        </div>
      </div>

      {/* Progress Chart Preview */}
      <div className="medical-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.yourProgress}</h3>
            <p className="text-xs text-slate-500">
              Movement Quality, Cardiac Exertion & Grip Performance across recent sessions (Demo Data)
            </p>
          </div>
          <button
            onClick={() => onNavigate('progress')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start"
          >
            Full Analytics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressChartData}>
              <defs>
                <linearGradient id="romGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0A84FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30D158" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#30D158" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="sessionName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="rom" name="Movement Quality %" stroke="#0A84FF" strokeWidth={2.5} fillOpacity={1} fill="url(#romGradient)" />
              <Area type="monotone" dataKey="quality" name="Rehab Score" stroke="#30D158" strokeWidth={2.5} fillOpacity={1} fill="url(#qualityGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0A84FF]"></span>
            <span>Movement Smoothness (ROM)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#30D158]"></span>
            <span>Rehab Quality Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};
