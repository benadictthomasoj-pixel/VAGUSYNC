import React from 'react';
import { useHardware } from './HardwareContext';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Heart, 
  Radio, 
  Activity, 
  Sliders, 
  X, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface DeviceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceCenterModal: React.FC<DeviceCenterModalProps> = ({ isOpen, onClose }) => {
  const { 
    hardwareState, 
    setSimulationMode, 
    triggerSimulatedButton,
    setSimulatedHeartRate,
    setSimulatedTorsoCompensation
  } = useHardware();

  if (!isOpen) return null;

  const isConnected = hardwareState.connected && !hardwareState.isStale;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">VagusSync Device Center</h2>
              <p className="text-xs text-slate-500">Hardware & Sensor Connection Status</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Status Grid */}
        <div className="space-y-3 text-xs">
          {/* Main Connection Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <div>
                <div className="font-bold text-slate-900">VagusSync Grip Controller</div>
                <div className="text-[11px] text-slate-500">
                  {isConnected ? (hardwareState.isSimulated ? 'Simulation Mode' : 'ESP-12E Wi-Fi Connected') : 'Disconnected'}
                </div>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-700">
              {isConnected ? `${hardwareState.packetRateHz} Hz` : '0 Hz'}
            </span>
          </div>

          {/* 4 Telemetry Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[11px]">Heart Rate</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{isConnected ? `${hardwareState.heartRate || 76} BPM` : '--'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[11px]">Grip Button</span>
              <div className="text-xs font-bold font-mono mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    hardwareState.buttonPressed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {hardwareState.buttonPressed ? 'PRESSED' : 'READY'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[11px]">Kinematic IMUs</span>
              <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3/3 Sensors Ready</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[11px]">Latency</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {isConnected ? `${hardwareState.latencyMs} ms` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Simulation / QA Controls */}
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-900">Hardware Simulation Mode</span>
            <button
              onClick={() => setSimulationMode(!hardwareState.isSimulated)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                hardwareState.isSimulated
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {hardwareState.isSimulated ? 'Enabled' : 'Enable Simulation'}
            </button>
          </div>

          {hardwareState.isSimulated && (
            <div className="flex items-center gap-2 pt-2 border-t border-sky-200/60">
              <button
                onMouseDown={() => triggerSimulatedButton(500)}
                onTouchStart={() => triggerSimulatedButton(500)}
                className="flex-1 py-2 bg-white hover:bg-sky-100 text-sky-700 font-bold rounded-xl border border-sky-200 text-xs shadow-soft-sm active:scale-95 transition-all"
              >
                Trigger Grip Button
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft transition-all active:scale-[0.98]"
        >
          Close Device Center
        </button>
      </div>
    </div>
  );
};
