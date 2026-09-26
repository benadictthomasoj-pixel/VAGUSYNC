import React, { useState, useEffect, useRef } from 'react';
import { useRehab } from '../../context/RehabContext';
import { soundManager } from '../../utils/audio';
import { getTranslation } from '../../utils/i18n';
import {
  Zap,
  Activity,
  Heart,
  Power,
  Sliders,
  ShieldCheck,
  Info,
  Clock,
  BatteryCharging,
  Radio,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export const VagusStimulatorSimulation: React.FC = () => {
  const { language } = useRehab();
  const t = getTranslation(language);

  // Simulation State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<number>(10); // 10 Hz
  const [intensityIndex, setIntensityIndex] = useState<number>(1); // 0 = Low, 1 = Med, 2 = High
  const [pulseWidth] = useState<number>(250); // 250 µs
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Simulated Heart Rate gently fluctuating
  const [simulatedHR, setSimulatedHR] = useState<number>(72);
  const hrBaseRef = useRef<number>(72);

  const intensityLevels = [
    { label: 'Low', labelTa: 'குறைவு', currentMa: '0.6 mA', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Medium', labelTa: 'நடுத்தரம்', currentMa: '1.2 mA', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'High', labelTa: 'அதிகம்', currentMa: '1.8 mA', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  const currentIntensity = intensityLevels[intensityIndex];

  // Gentle natural fluctuation of simulated heart rate (72 -> 73 -> 72 -> 71 -> 72)
  useEffect(() => {
    const hrInterval = setInterval(() => {
      // Natural vagal physiological variation (+/- 1-2 BPM)
      const delta = (Math.random() - 0.5) * 2;
      const targetBase = isActive ? 70 : 72; // slight parasympathetic deceleration simulation
      const nextHR = Math.round(targetBase + delta);
      setSimulatedHR(Math.max(68, Math.min(76, nextHR)));
    }, 2200);

    return () => clearInterval(hrInterval);
  }, [isActive]);

  // Session timer when active
  useEffect(() => {
    let timer: any;
    if (isActive) {
      timer = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive]);

  // Toggle stimulation power
  const togglePower = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    soundManager.playPop();
  };

  const handleFrequencyChange = (delta: number) => {
    setFrequency((prev) => Math.max(5, Math.min(30, prev + delta)));
    soundManager.playPop();
  };

  const handleIntensityChange = (delta: number) => {
    setIntensityIndex((prev) => Math.max(0, Math.min(intensityLevels.length - 1, prev + delta)));
    soundManager.playPop();
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Simulation Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-100/40 via-cyan-100/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{language === 'ta' ? 'வேகஸ் நரம்பு தூண்டி — மாதிரி இயக்கம் (Simulation)' : 'Vagus Nerve Stimulator — Simulation'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'ta' ? 'வேகஸ் நரம்பு தூண்டுதல் மாதிரி' : 'Vagus Nerve Stimulator — Demo'}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'ta'
                ? 'பக்கவாத மறுவாழ்வு பயிற்சிகளுடன் இணைந்த காதுவழி வேகஸ் நரம்பு தூண்டுதலின் (tVNS) ஊடாடும் மாதிரி உருவகப்படுத்தல்.'
                : 'Interactive UI simulation demonstrating non-invasive auricular vagus nerve stimulation (tVNS) coupled with stroke motor rehabilitation and cardiac safety monitoring.'}
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
            <div
              className={`px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <Radio className={`w-4 h-4 ${isActive ? 'text-cyan-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{isActive ? (language === 'ta' ? 'இயக்கத்தில் உள்ளது' : 'Simulation Active') : (language === 'ta' ? 'நிறுத்தப்பட்டுள்ளது' : 'Simulation Off')}</span>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              {language === 'ta' ? 'மாதிரி செயல்முறை மட்டுமே' : 'Visual Demo Only'}
            </span>
          </div>
        </div>

        {/* Clinical Simulation Disclaimer */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800 font-bold">
              {language === 'ta' ? 'முக்கிய அறிவிப்பு (Simulation Only): ' : 'Simulation Disclaimer: '}
            </strong>
            {language === 'ta'
              ? 'இது ஒரு மென்பொருள் உருவகப்படுத்தல் மட்டுமே. இது உண்மையான மருத்துவ வன்பொருளை இயக்காது மற்றும் மின்சார அதிர்வுகளை உருவாக்காது.'
              : 'This interface is a simulated demonstration tool for clinical research concepts. It does not deliver electrical stimulation or connect to live therapeutic medical hardware.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Device Visual & Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Device Illustration Card (Centerpiece) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between w-full">
            <span>{language === 'ta' ? 'அணியக்கூடிய சாதனம் (மாதிரி)' : 'Wearable Stimulator Unit'}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
              <span>96% Charged</span>
            </span>
          </div>

          {/* Central Medical Device Visual (SVG/CSS Illustration) */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Device Breathing Aura Glow when Active */}
            <div
              className={`absolute rounded-[40px] transition-all duration-1000 ${
                isActive
                  ? 'w-[280px] h-[340px] bg-gradient-to-tr from-cyan-400/25 via-blue-500/20 to-indigo-500/25 blur-2xl animate-pulse scale-105'
                  : 'w-[240px] h-[300px] bg-slate-200/30 blur-xl opacity-20'
              }`}
            />

            {/* Wearable Auricular Electrode Leads (Flexible silicone wires) */}
            <svg
              className="absolute -top-14 w-64 h-24 pointer-events-none z-0"
              viewBox="0 0 240 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left ear lead */}
              <path
                d="M 70 85 C 40 40, 20 50, 10 10"
                stroke={isActive ? '#06B6D4' : '#94A3B8'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={isActive ? '4 2' : undefined}
                className={isActive ? 'animate-pulse' : ''}
              />
              <circle cx="10" cy="10" r="7" fill={isActive ? '#06B6D4' : '#64748B'} />
              <circle cx="10" cy="10" r="3" fill="#FFFFFF" />

              {/* Right ear lead */}
              <path
                d="M 170 85 C 200 40, 220 50, 230 10"
                stroke={isActive ? '#06B6D4' : '#94A3B8'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={isActive ? '4 2' : undefined}
                className={isActive ? 'animate-pulse' : ''}
              />
              <circle cx="230" cy="10" r="7" fill={isActive ? '#06B6D4' : '#64748B'} />
              <circle cx="230" cy="10" r="3" fill="#FFFFFF" />
            </svg>

            {/* Main Pod Hardware Housing */}
            <div
              className={`relative z-10 w-60 sm:w-68 rounded-[36px] bg-gradient-to-b from-white via-slate-50 to-slate-100 p-5 border-4 transition-all duration-500 shadow-2xl flex flex-col items-center justify-between min-h-[330px] ${
                isActive
                  ? 'border-cyan-400/80 shadow-cyan-500/20'
                  : 'border-slate-300 shadow-slate-300/40'
              }`}
            >
              {/* Top Bevel & Brand Signature */}
              <div className="w-full flex items-center justify-between pt-1 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black">
                    V
                  </div>
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-800 uppercase">
                    VagusSync
                  </span>
                </div>

                {/* Subtle LED Status Indicator */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                      isActive
                        ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    {isActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
              </div>

              {/* OLED High-Contrast Display Window */}
              <div
                className={`w-full rounded-2xl p-4 transition-all duration-500 border my-3 ${
                  isActive
                    ? 'bg-slate-950 border-cyan-500/50 shadow-inner shadow-cyan-900/40 text-cyan-400'
                    : 'bg-slate-900 border-slate-700/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2 pb-1 border-b border-white/10">
                  <span>{isActive ? '● EMITTING tVNS' : '○ STANDBY'}</span>
                  <span>{formatTimer(sessionSeconds)}</span>
                </div>

                <div className="space-y-1 text-center py-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    Target Frequency
                  </div>
                  <div className="font-mono text-3xl font-extrabold tracking-tight">
                    {frequency}.0 <span className="text-xs font-normal">Hz</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono mt-1">
                  <div>
                    <span className="text-slate-400 block text-[9px]">PULSE</span>
                    <span className="font-bold text-white">{pulseWidth} µs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px]">AMPLITUDE</span>
                    <span className="font-bold text-white">{currentIntensity.currentMa}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Tactile Center Ring & Power Trigger Button */}
              <button
                type="button"
                onClick={togglePower}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-lg active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white ring-4 ring-cyan-400/40 shadow-cyan-500/40'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300 ring-2 ring-slate-300'
                }`}
                title={isActive ? 'Click to Stop Simulation' : 'Click to Start Simulation'}
              >
                <Power className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-semibold text-slate-400">
                  {language === 'ta' ? 'காது நரம்பு தொடர்பு: சரியானது' : 'Auricular Contact: Calibrated (Sim)'}
                </span>
              </div>
            </div>
          </div>

          {/* Large Tactile ON / OFF Control Bar */}
          <div className="w-full max-w-sm mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <button
              onClick={togglePower}
              className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer ${
                isActive
                  ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 hover:bg-rose-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {isActive
                  ? language === 'ta'
                    ? 'மாதிரி இயக்கத்தை நிறுத்து (Turn OFF)'
                    : 'Stop Simulation (Turn OFF)'
                  : language === 'ta'
                  ? 'மாதிரி இயக்கத்தைத் தொடங்கு (Turn ON)'
                  : 'Start Simulation (Turn ON)'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400">
              {language === 'ta' ? 'அழுத்தி இயக்கத்தை மாற்றலாம்' : 'Tap to toggle simulated neuro-stimulation state'}
            </span>
          </div>
        </div>

        {/* Right Column: Live Monitoring Card, Waveform & Adjustable Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Waveform & Monitoring Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  {language === 'ta' ? 'நேரடி அலைவரிசை கண்காணிப்பு' : 'Live Waveform Monitor'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                {isActive ? 'BIPHASIC' : 'REST'}
              </span>
            </div>

            {/* Continuous Smooth Waveform Animation Display */}
            <div className="relative h-28 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
              {/* Grid Background Overlay */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Dynamic Animated Pulse Waveform */}
              {isActive ? (
                <div className="relative w-full h-full flex items-center overflow-hidden">
                  <svg
                    className="w-[200%] h-full shrink-0 animate-waveform"
                    viewBox="0 0 600 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 0 40 L 40 40 L 45 15 L 55 65 L 60 40 L 100 40 L 140 40 L 145 15 L 155 65 L 160 40 L 200 40 L 240 40 L 245 15 L 255 65 L 260 40 L 300 40 L 340 40 L 345 15 L 355 65 L 360 40 L 400 40 L 440 40 L 445 15 L 455 65 L 460 40 L 500 40 L 540 40 L 545 15 L 555 65 L 560 40 L 600 40"
                      stroke="#22D3EE"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="drop-shadow(0 0 6px #06B6D4)"
                    />
                  </svg>
                </div>
              ) : (
                /* Flatline Calm Idle Wave */
                <svg className="w-full h-full" viewBox="0 0 300 80" fill="none">
                  <path
                    d="M 0 40 Q 75 42 150 40 T 300 40"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="opacity-60"
                  />
                </svg>
              )}

              {/* Overlay Watermark Readout */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-cyan-400/80 pointer-events-none">
                <span>{isActive ? `FREQ: ${frequency}Hz` : 'STATUS: IDLE'}</span>
                <span>{isActive ? `WIDTH: ${pulseWidth}µs` : '0.00 mA'}</span>
              </div>
            </div>

            {/* Telemetry Metrics Pair: Simulated HR + Frequency */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Simulated Heart Rate */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'ta' ? 'மாதிரி இதய துடிப்பு' : 'Simulated HR'}
                  </span>
                  <Heart
                    className={`w-3.5 h-3.5 text-[#FF375F] ${
                      isActive ? 'fill-[#FF375F] animate-ping' : 'fill-[#FF375F]/60'
                    }`}
                  />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {simulatedHR}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">BPM</span>
                </div>
                <div className="text-[10px] font-medium text-emerald-600 mt-0.5">
                  ● {language === 'ta' ? 'சீரான இதய பாதுகாப்பு' : 'Safe Cardiac Zone'}
                </div>
              </div>

              {/* Stimulation Frequency */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'ta' ? 'அதிர்வெண்' : 'Frequency'}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {frequency}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Hz</span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  {isActive ? (language === 'ta' ? 'பயிற்சிக்கு உகந்தது' : 'Neuro-Motor Paired') : (language === 'ta' ? 'அமைதி நிலை' : 'Inactive')}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Parameters Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                {language === 'ta' ? 'மாதிரி அமைப்புகள்' : 'Simulation Controls'}
              </h3>
            </div>

            {/* Frequency Adjustment Control */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'ta' ? 'அதிர்வெண் (Frequency)' : 'Stimulation Frequency'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'ta' ? 'வரம்பு: 5 Hz - 30 Hz' : 'Range: 5 Hz - 30 Hz (tVNS Target)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(-5)}
                  disabled={frequency <= 5}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm w-12 text-center text-slate-900">
                  {frequency} Hz
                </span>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(5)}
                  disabled={frequency >= 30}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Intensity / Amplitude Level Control */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'ta' ? 'தீவிரம் (Intensity)' : 'Simulated Intensity'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentIntensity.currentMa} • {language === 'ta' ? currentIntensity.labelTa : currentIntensity.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleIntensityChange(-1)}
                  disabled={intensityIndex <= 0}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                >
                  -
                </button>
                <span className="font-bold text-xs w-16 text-center text-slate-800">
                  {language === 'ta' ? currentIntensity.labelTa : currentIntensity.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleIntensityChange(1)}
                  disabled={intensityIndex >= intensityLevels.length - 1}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Safety Interlock Guarantee Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'ta'
                  ? 'இதய பாதுகாப்பு வரம்பு 130 BPM தாண்டினால் தூண்டுதல் தானாக நிறுத்தப்படும்.'
                  : 'Automated Cardiac Cut-off: Simulation halts if HR exceeds safety ceiling (130 BPM).'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
