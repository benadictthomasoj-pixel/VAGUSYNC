import React from 'react';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import {
  User,
  Heart,
  Stethoscope,
  Globe,
  Volume2,
  Zap,
  Shield,
  Activity,
  Calendar,
  Phone,
  Flame,
  Award,
} from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const {
    activePatient,
    activeProgram,
    language,
    toggleLanguage,
    voiceGuidance,
    setVoiceGuidance,
    toggleVagalStimulation,
    deviceStatus,
  } = useRehab();

  const t = getTranslation(language);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans animate-in fade-in duration-200">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-500/20">
          {activePatient.name[0]}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{activePatient.name}</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {activePatient.age} years • {activePatient.affectedSide}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600">{activePatient.condition}</p>
          <p className="text-xs text-slate-400">
            Stroke Onset Date: {activePatient.strokeDate} • Supervised by {activePatient.therapistName}
          </p>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Clinical Parameters */}
        <div className="medical-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Heart className="w-4 h-4 text-[#FF375F]" />
            Clinical Safety Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Baseline Resting HR</span>
              <span className="font-mono font-bold text-slate-900">{activePatient.baselineHR} BPM</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Configured Safety Ceiling</span>
              <span className="font-mono font-bold text-rose-600">&lt; {activeProgram?.safetyThresholdBPM || 130} BPM</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Supervising Clinician</span>
              <span className="font-bold text-indigo-700">{activePatient.therapistName}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Primary Caregiver Contact</span>
              <span className="font-bold text-slate-900">{activePatient.caregiverName} ({activePatient.caregiverPhone})</span>
            </div>
          </div>
        </div>

        {/* System & Accessibility Settings */}
        <div className="medical-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-blue-600" />
            Language & Accessibility
          </h3>

          <div className="space-y-3">
            {/* Language Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Interface Language</p>
                  <p className="text-[10px] text-slate-500">English / தமிழ்</p>
                </div>
              </div>
              <button
                onClick={toggleLanguage}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Switch to தமிழ்' : 'Switch to English'}
              </button>
            </div>

            {/* Voice Guidance Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Audio Voice Guidance</p>
                  <p className="text-[10px] text-slate-500">Spoken posture cues & countdowns</p>
                </div>
              </div>
              <button
                onClick={() => setVoiceGuidance(!voiceGuidance)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  voiceGuidance
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {voiceGuidance ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Vagus Stimulation Module */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold">Vagal Nerve Stimulation</p>
                  <p className="text-[10px] text-slate-400">Pairing mode (Simulation)</p>
                </div>
              </div>
              <button
                onClick={toggleVagalStimulation}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  deviceStatus.vagalStimulationActive
                    ? 'bg-amber-400 text-slate-950 font-extrabold'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {deviceStatus.vagalStimulationActive ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
