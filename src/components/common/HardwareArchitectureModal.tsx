import React from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  X,
  Cpu,
  Radio,
  Activity,
  Heart,
  Hand,
  Layers,
  Smartphone,
  ShieldCheck,
  Zap,
  Server,
  Stethoscope,
  ArrowRight,
  ArrowDown,
  Info,
} from 'lucide-react';

export const HardwareArchitectureModal: React.FC = () => {
  const { showArchitectureModal, setShowArchitectureModal } = useRehab();

  if (!showArchitectureModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              PROPOSED HARDWARE ARCHITECTURE
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              How VagusSync Will Work With the Wearable
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Closed-loop biomechanical sensing, edge cardiac safety processing, and movement-paired neuroplasticity stimulation.
            </p>
          </div>
          <button
            onClick={() => setShowArchitectureModal(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Scientific Disclaimer Notice */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">System Architecture Note: </span>
              This web application implements the complete software and clinical supervision layer. The embedded sensors, ESP32/ESP8266 BLE/Wi-Fi pipeline, and transcutaneous vagal stimulation electrodes described below represent the target hardware design.
            </div>
          </div>

          {/* SECTION 1: HARDWARE & SENSING PIPELINE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                1. Wearable Sensing & Edge Processing Architecture
              </h3>
              <span className="text-[11px] font-medium text-slate-500">Proposed Edge Device</span>
            </div>

            {/* Visual Pipeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Patient Sensors */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group hover:border-blue-300 transition-all">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Body Sensors</h4>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <strong>2× 6-DoF IMUs</strong> (Arm + Trunk)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF375F]"></span>
                      <strong>MAX30102 PPG</strong> (Pulse/HR)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <strong>FSR 402 Sensor</strong> (Grip Force)
                    </li>
                  </ul>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                  I2C / ADC @ 100 Hz
                </div>
              </div>

              {/* Step 2: ESP32 Edge Core */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group hover:border-indigo-300 transition-all">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">ESP32-S3 Edge Hub</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dual-core Xtensa running FreeRTOS. Performs real-time Madgwick sensor fusion, Butterworth filtering, and emergency cardiac threshold watchdog.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                  Edge Kinematics & Filter
                </div>
              </div>

              {/* Step 3: BLE Transmission */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group hover:border-sky-300 transition-all">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">BLE 5.2 Transmission</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Custom GATT profile streams orientation quaternions, smoothed PPG pulse intervals, and FSR grasp strain with &lt;15ms latency.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                  Encrypted GATT Stream
                </div>
              </div>

              {/* Step 4: Closed Loop Stimulation */}
              <div className="p-4 rounded-2xl bg-indigo-900 text-white space-y-3 relative group shadow-md">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <h4 className="text-xs font-bold text-white">Vagal Nerve Stimulation</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Closed-loop auricular transcutaneous stimulation (taVNS) triggers precisely during successful target touch without torso compensation.
                  </p>
                </div>
                <div className="text-[10px] text-amber-300 font-mono pt-1 border-t border-indigo-800">
                  25 Hz, 0.8 mA, 200 µs
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SOFTWARE REHABILITATION ENGINE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                2. Software Engine Architecture (Currently Active in Prototype)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Prototype Stack
              </span>
            </div>

            {/* Software Flow Diagram */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-center text-xs items-center">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="font-bold text-blue-400">Patient UI</div>
                  <div className="text-[10px] text-slate-400 mt-1">Rehab Games & Guidance</div>
                </div>

                <div className="text-slate-500 font-bold hidden md:block">→</div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="font-bold text-amber-400">Kinematic Engine</div>
                  <div className="text-[10px] text-slate-400 mt-1">Compensation Detector</div>
                </div>

                <div className="text-slate-500 font-bold hidden md:block">→</div>

                <div className="p-3 bg-slate-800 rounded-xl border border-rose-500/40 bg-rose-950/40">
                  <div className="font-bold text-rose-400">Safety Governor</div>
                  <div className="text-[10px] text-rose-200 mt-1">Cardiac Exertion Guard</div>
                </div>

                <div className="text-slate-500 font-bold hidden md:block">→</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-center text-xs items-center mt-3 pt-3 border-t border-slate-800">
                <div className="col-span-2 p-3 bg-slate-800 rounded-xl border border-slate-700 text-left">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Session Scoring Engine
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Quality = 35% ROM + 25% Grip + 20% Cardiac Headroom + 20% Pain
                  </div>
                </div>

                <div className="text-slate-500 font-bold hidden md:block">⇄</div>

                <div className="col-span-3 p-3 bg-slate-800 rounded-xl border border-indigo-500/50 bg-indigo-950/40 text-left">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Clinician Supervision & Adaptive Prescription
                  </div>
                  <div className="text-[10px] text-indigo-200 mt-1">
                    Therapist difficulty approval, custom notes & emergency alerts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            VagusSync Engineering & Clinical Architecture Brief
          </span>
          <button
            onClick={() => setShowArchitectureModal(false)}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
