import React from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  FileCode,
  Sliders,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';

interface TherapistProgramsProps {
  onSelectPatient: (patientId: string) => void;
}

export const TherapistPrograms: React.FC<TherapistProgramsProps> = ({ onSelectPatient }) => {
  const { patients, programs } = useRehab();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
          <Layers className="w-3.5 h-3.5" />
          Clinical Prescription Protocols
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Active Rehabilitation Programs
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Review and modify individualized motor categories, repetition prescriptions, and cardiac threshold ceilings across the cohort.
        </p>
      </div>

      {/* Grid of Patient Programs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {patients.map((patient) => {
          const program = programs[patient.id] || programs['p-meera'];

          return (
            <div
              key={patient.id}
              className="medical-card p-6 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {patient.name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                      <p className="text-[11px] text-slate-400">{patient.affectedSide}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Level {program?.difficultyLevel || patient.currentDifficulty}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prescribed Protocol:</span>
                    <span className="font-bold text-slate-900">{program?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume:</span>
                    <span className="font-bold font-mono text-slate-900">{program?.sets} sets × {program?.repsPerSet} reps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frequency:</span>
                    <span className="font-bold text-slate-900">{program?.sessionFrequencyWeekly} days / week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Safety BPM Limit:</span>
                    <span className="font-bold font-mono text-rose-600">&lt; {program?.safetyThresholdBPM} BPM</span>
                  </div>
                </div>

                {program?.vagalStimulationEnabled && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Vagal Stimulation Active for Clean Reps</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectPatient(patient.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Prescription</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
