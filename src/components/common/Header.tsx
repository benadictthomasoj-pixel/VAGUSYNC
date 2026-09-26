import React from 'react';
import { useRehab } from '../../context/RehabContext';
import { useHardware } from '../../hardware/HardwareContext';
import { getTranslation } from '../../utils/i18n';
import {
  Heart,
  Globe,
  Volume2,
  VolumeX,
  Cpu,
  Wifi,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    toggleLanguage,
    voiceGuidance,
    setVoiceGuidance,
    simulatedHR,
    safetyState,
    setShowArchitectureModal,
    setShowDeviceStatusModal,
  } = useRehab();

  const { hardwareState } = useHardware();
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E62872] via-[#AC28A6] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-pink-500/20 shrink-0">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M3.5 11.5h4.2l1.8-3.2 2.8 7 2.2-4.8 1.5 2h4.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              VagusSync
            </span>
            <p className="text-xs text-slate-500 hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Live Cardiac Status Badge & Quick Controls (Role switcher removed as requested) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Hardware Status Pill */}
          <button
            onClick={() => setShowDeviceStatusModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              hardwareState.connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
            title="Wearable Device Status - Click to open Device Center"
          >
            <Wifi className={`w-3.5 h-3.5 ${hardwareState.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span
              className={`w-2 h-2 rounded-full ${
                hardwareState.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-medium">
              {hardwareState.connected
                ? hardwareState.isSimulated
                  ? 'Device (Simulator)'
                  : 'ESP-12E Connected'
                : 'Connect Device'}
            </span>
          </button>

          {/* Live Cardiac HR Pill */}
          <button
            onClick={() => setShowDeviceStatusModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs cursor-pointer"
            title="Hardware Architecture & Signal Pipeline"
          >
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">{t.navArchitecture}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Toggle Tamil / English"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
          </button>

          {/* Voice Guidance Toggle */}
          <button
            onClick={() => setVoiceGuidance(!voiceGuidance)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              voiceGuidance
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={`Voice Guidance: ${voiceGuidance ? 'Enabled' : 'Disabled'}`}
          >
            {voiceGuidance ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
