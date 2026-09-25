import React from 'react';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import {
  Activity,
  Heart,
  Globe,
  Volume2,
  VolumeX,
  Cpu,
  LogOut,
  User,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  Layers,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    language,
    toggleLanguage,
    voiceGuidance,
    setVoiceGuidance,
    simulatedHR,
    safetyState,
    deviceStatus,
    setShowArchitectureModal,
    setShowDeviceStatusModal,
    activePatient,
  } = useRehab();

  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                VagusSync
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                ● {t.hackathonDemoBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

          {/* Live Cardiac Status Badge & Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Hardware Status Pill */}
            <button
              onClick={() => setShowDeviceStatusModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                deviceStatus.bleStatus.includes('Connected')
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
              title="VagusSync Device Status - Click to open Device Center"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  deviceStatus.bleStatus.includes('Connected')
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-medium">
                {deviceStatus.bleStatus.includes('ESP-12E')
                  ? 'Device Connected'
                  : deviceStatus.bleStatus.includes('Demo')
                  ? 'Device (Simulated)'
                  : 'Device Disconnected'}
              </span>
            </button>

            {/* Live Cardiac HR Pill */}
            <button
              onClick={() => setShowDeviceStatusModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                safetyState === 'SAFETY_EVENT'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : safetyState === 'WARNING'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
              title="Click to view Wearable Hardware & Cardiac Telemetry"
            >
              <Heart
                className={`w-4 h-4 ${
                  safetyState === 'SAFETY_EVENT'
                    ? 'text-[#FF375F] fill-[#FF375F] animate-ping'
                    : 'text-[#FF375F] fill-[#FF375F]'
                }`}
              />
              <span className="font-mono font-bold text-sm">{simulatedHR}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">BPM</span>
            </button>

            {/* Hardware Tech Architecture Modal Trigger */}
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
              title="Proposed Hardware Architecture & Signal Pipeline"
            >
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{t.navArchitecture}</span>
            </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            title="Toggle Tamil / English"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
          </button>

          {/* Voice Guidance Toggle */}
          <button
            onClick={() => setVoiceGuidance(!voiceGuidance)}
            className={`p-1.5 rounded-xl border transition-colors ${
              voiceGuidance
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={`Voice Guidance: ${voiceGuidance ? 'Enabled' : 'Disabled'}`}
          >
            {voiceGuidance ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Role Indicator & Switch Dropdown */}
          <div className="flex items-center pl-2 border-l border-slate-200">
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
              <button
                onClick={() => setRole('patient')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === 'patient'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Patient</span>
                <span className="md:hidden">Patient</span>
              </button>

              <button
                onClick={() => setRole('therapist')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === 'therapist'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Therapist Portal</span>
                <span className="md:hidden">Therapist</span>
              </button>

              <button
                onClick={() => setRole('caregiver')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === 'caregiver'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Caregiver Portal</span>
                <span className="md:hidden">Caregiver</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
