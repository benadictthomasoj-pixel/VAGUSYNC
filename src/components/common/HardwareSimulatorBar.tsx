import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { simulationHardware } from '../../hardware/SimulationHardware';
import {
  Sliders,
  Heart,
  AlertTriangle,
  Flame,
  Activity,
  ShieldAlert,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Radio,
  UserX,
  X,
} from 'lucide-react';

export const HardwareSimulatorBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    simulatedHR,
    safetyState,
    triggerHRSpike,
    triggerSafetyEvent,
    resetHRToBaseline,
    triggerCompensation,
    activePatient,
    createAlert,
  } = useRehab();

  return (
    <aside aria-label="Demo Simulation Controller" className="fixed bottom-3 right-3 z-50 transition-all font-sans">
      {!isOpen ? (
        /* Collapsed Minimal Floating Badge */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700/90 shadow-2xl backdrop-blur-md text-xs font-bold transition-all cursor-pointer hover:scale-105 group"
          title="Open Developer / Jury Simulator Controls"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 group-hover:text-white">Jury Controls</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded Non-Obstructive Drawer */
        <div className="bg-slate-900/98 backdrop-blur-md text-white rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden w-84 sm:w-96 animate-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-extrabold tracking-wider uppercase text-slate-200">
                Developer / Jury Controls
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/60 cursor-pointer"
              title="Collapse drawer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 space-y-3 text-xs">
            {/* Cardiac Simulation */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Heart className="w-3.5 h-3.5 text-[#FF375F] fill-[#FF375F]" />
                  HR: <span className="font-mono font-bold text-white">{simulatedHR} BPM</span>
                </span>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    safetyState === 'SAFETY_EVENT'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                      : safetyState === 'WARNING'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {safetyState}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 font-mono">
                <button
                  onClick={() => resetHRToBaseline()}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-colors text-center cursor-pointer"
                >
                  72
                </button>
                <button
                  onClick={() => triggerHRSpike(88)}
                  className="px-2 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/50 text-[11px] font-bold transition-colors text-center cursor-pointer"
                >
                  88
                </button>
                <button
                  onClick={() => triggerHRSpike(118)}
                  className="px-2 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border border-amber-800/50 text-[11px] font-bold transition-colors text-center cursor-pointer"
                >
                  118
                </button>
                <button
                  onClick={() => triggerSafetyEvent()}
                  className="px-2 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[11px] font-bold transition-colors text-center shadow-xs cursor-pointer"
                >
                  132
                </button>
              </div>
            </div>

            {/* Movement & Posture Simulation */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Movement Compensations
                </span>
                <span className="text-[10px] text-slate-400">Demo IMU</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => triggerCompensation('Trunk Lean')}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  Trunk Lean
                </button>
                <button
                  onClick={() => triggerCompensation('Shoulder Hike')}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  Shoulder Hike
                </button>
                <button
                  onClick={() => simulationHardware.triggerButtonPulse(600)}
                  className="px-2 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/70 text-purple-300 border border-purple-800/50 text-[11px] font-medium transition-colors text-center cursor-pointer"
                  title="Simulate pressing physical Grip Button"
                >
                  Grip Grab
                </button>
                <button
                  onClick={() => {
                    createAlert({
                      patientId: activePatient.id,
                      patientName: activePatient.name,
                      type: 'sos',
                      title: 'Manual Assistance Request',
                      description: 'Patient requested assistance during exercise session.',
                      severity: 'high',
                    });
                  }}
                  className="px-2 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  SOS
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic">
              Hardware readings simulated for hackathon demonstration.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
