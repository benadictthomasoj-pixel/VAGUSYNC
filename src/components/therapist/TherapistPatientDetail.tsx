import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  ArrowLeft,
  User,
  Heart,
  TrendingUp,
  Hand,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Edit3,
  Save,
  Zap,
  Sparkles,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface TherapistPatientDetailProps {
  patientId: string;
  onBack: () => void;
}

export const TherapistPatientDetail: React.FC<TherapistPatientDetailProps> = ({
  patientId,
  onBack,
}) => {
  const {
    patients,
    programs,
    sessions,
    approveDifficultyRecommendation,
    updateProgram,
    updateTherapistNotes,
  } = useRehab();

  const patient = patients.find((p) => p.id === patientId) || patients[0];
  const program = programs[patientId] || programs['p-meera'];
  const patientSessions = sessions.filter((s) => s.patientId === patientId);

  // Program Editor form state
  const [sets, setSets] = useState(program?.sets || 3);
  const [repsPerSet, setRepsPerSet] = useState(program?.repsPerSet || 10);
  const [difficultyLevel, setDifficultyLevel] = useState(program?.difficultyLevel || 2);
  const [category, setCategory] = useState(program?.category || 'Functional Reach & Grasp');
  const [sessionFrequency, setSessionFrequency] = useState(program?.sessionFrequencyWeekly || 5);
  const [safetyThresholdBPM, setSafetyThresholdBPM] = useState(program?.safetyThresholdBPM || 130);
  const [vagalStimEnabled, setVagalStimEnabled] = useState(program?.vagalStimulationEnabled || false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Therapist note state
  const [noteText, setNoteText] = useState(program?.customNotes || '');
  const [noteSavedNotice, setNoteSavedNotice] = useState(false);

  const handleSaveProgram = () => {
    updateProgram(patientId, {
      sets,
      repsPerSet,
      difficultyLevel,
      category,
      sessionFrequencyWeekly: sessionFrequency,
      safetyThresholdBPM,
      vagalStimulationEnabled: vagalStimEnabled,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleSaveNotes = () => {
    updateTherapistNotes(patientId, noteText);
    setNoteSavedNotice(true);
    setTimeout(() => setNoteSavedNotice(false), 3000);
  };

  const chartData = patientSessions.slice(-6).map((s, idx) => ({
    name: `S${idx + 1}`,
    rom: s.movementQuality,
    avgHR: s.avgHR,
    peakHR: s.peakHR,
    grip: s.gripScore || 70,
    quality: s.rehabQualityScore,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs self-start cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cohort Overview</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Supervising ID: Dr. Priya • Patient ID:</span>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            {patient.id}
          </span>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="medical-card p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {patient.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{patient.name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {patient.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {patient.age} yrs • {patient.condition} • {patient.affectedSide}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Caregiver: {patient.caregiverName} ({patient.caregiverPhone}) • Baseline HR: {patient.baselineHR} BPM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-center pr-3 border-r border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Level</div>
            <div className="text-xl font-extrabold text-blue-600 font-mono">Level {patient.currentDifficulty}</div>
          </div>
          <div className="text-center pr-3 border-r border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Streak</div>
            <div className="text-xl font-extrabold text-amber-500 font-mono">{patient.streakDays}d</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">XP Points</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{patient.xp}</div>
          </div>
        </div>
      </div>

      {/* DIFFICULTY RECOMMENDATION & APPROVAL PANEL */}
      {program?.hasPendingDifficultyChange && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-blue-400/30 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                <Sparkles className="w-3 h-3" />
                CLINICAL DIFFICULTY RECOMMENDATION
              </div>
              <h3 className="text-lg font-bold text-white">
                Advance {patient.name} to Difficulty Level {program.recommendedDifficulty}?
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed max-w-2xl">
                {program.recommendationRationale}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-blue-300">Requires Clinician Authorization</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => approveDifficultyRecommendation(patient.id)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Progression to Level {program.recommendedDifficulty}</span>
            </button>

            <button
              onClick={() => {
                updateProgram(patient.id, { hasPendingDifficultyChange: false });
              }}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Not Yet (Maintain Level {patient.currentDifficulty})
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Charts & Program Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress Analytics (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kinematic Quality & HR Chart */}
          <div className="medical-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Multi-Session Kinematics & Exertion Trend
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="rom" name="Movement Smoothness %" stroke="#0A84FF" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="quality" name="Rehab Quality Score" stroke="#30D158" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="grip" name="Grip Strength %" stroke="#AF52DE" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session History Table */}
          <div className="medical-card overflow-hidden">
            <div className="p-4 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900">Completed Sessions History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-3">Protocol</th>
                    <th className="py-2.5 px-3">Reps</th>
                    <th className="py-2.5 px-3">Quality</th>
                    <th className="py-2.5 px-3">Avg/Peak HR</th>
                    <th className="py-2.5 px-3">Pain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-900">{s.date}</td>
                      <td className="py-3 px-3 text-slate-600">{s.gameName}</td>
                      <td className="py-3 px-3 font-mono">{s.completedReps}/{s.targetReps}</td>
                      <td className="py-3 px-3 font-bold font-mono text-emerald-600">{s.rehabQualityScore}/100</td>
                      <td className="py-3 px-3 font-mono">{s.avgHR} / {s.peakHR} BPM</td>
                      <td className="py-3 px-3 text-slate-600">{s.painBefore} → {s.painAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Program Editor & Clinical Notes (1 col) */}
        <div className="space-y-6">
          {/* Program Prescription Editor */}
          <div className="medical-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                Prescription Editor
              </h3>
              {isSavedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded animate-pulse">
                  ✓ Saved
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Target Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold"
                >
                  <option value="Functional Reach & Grasp">Functional Reach & Grasp</option>
                  <option value="Range of Motion">Range of Motion</option>
                  <option value="Compensation Correction">Compensation Correction</option>
                  <option value="Cardiac-Paced Endurance">Cardiac-Paced Endurance</option>
                  <option value="Pain-Safe Positioning">Pain-Safe Positioning</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Sets</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    min={1}
                    max={6}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Reps / Set</label>
                  <input
                    type="number"
                    value={repsPerSet}
                    onChange={(e) => setRepsPerSet(Number(e.target.value))}
                    min={4}
                    max={20}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Difficulty Level</label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Safety BPM Limit</label>
                  <input
                    type="number"
                    value={safetyThresholdBPM}
                    onChange={(e) => setSafetyThresholdBPM(Number(e.target.value))}
                    min={100}
                    max={160}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-rose-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vagalStimEnabled}
                    onChange={(e) => setVagalStimEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Vagal Nerve Stimulation</span>
                    <span className="text-[10px] text-slate-500 block">Pair stimulation on clean reps (Simulated)</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handleSaveProgram}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Prescription</span>
              </button>
            </div>
          </div>

          {/* Therapist Notes to Patient */}
          <div className="medical-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Clinician Note to Patient
              </h3>
              {noteSavedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded animate-pulse">
                  ✓ Synced to Patient
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              This instruction will immediately display at the top of {patient.name}’s daily dashboard.
            </p>

            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Focus on controlled reaching today. Avoid leaning your trunk forward."
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <button
              onClick={handleSaveNotes}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Patient Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
