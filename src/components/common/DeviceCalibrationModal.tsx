import React, { useState } from 'react';
import { useHardware } from '../../hardware/HardwareContext';
import {
  X,
  Compass,
  CheckCircle2,
  RotateCcw,
  Activity,
  Shield,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DeviceCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceCalibrationModal: React.FC<DeviceCalibrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { hardwareState, calibrateNeutral, resetCalibration } = useHardware();
  const [step, setStep] = useState<number>(1);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirmNeutral = () => {
    calibrateNeutral();
    setCalibratedSuccess(true);
    setTimeout(() => {
      setCalibratedSuccess(false);
    }, 2000);
  };

  const handleReset = () => {
    resetCalibration();
    setCalibratedSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">IMU Sensor Calibration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Neutral Zeroing
                </span>
              </div>
              <p className="text-xs text-slate-400">3× MPU6050 Relative Kinematics Baseline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Transparency notice */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Prototype Movement Angle (Calibrated)</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Raw IMU readings are zeroed against your resting posture. Calculated reach and trunk angles represent relative movement from this neutral baseline.
              </p>
            </div>
          </div>

          {/* Neutral Posture Step Guidance */}
          <div className="medical-card p-4 space-y-3 bg-gradient-to-br from-slate-50 to-white">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Patient Neutral Position Checklist
            </span>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span><strong>Torso:</strong> Sit comfortably upright with shoulders relaxed against chair back.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span><strong>Upper Arm:</strong> Rest upper arm naturally alongside your torso.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span><strong>Forearm:</strong> Rest forearm and grip ball on table in front of you.</span>
              </div>
            </div>
          </div>

          {/* Live Calibrated Readings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Live Calibrated Angles (Relative to Neutral)
              </span>
              {hardwareState.isCalibrated && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> CALIBRATED
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {/* Torso */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Torso #1</span>
                <span className="text-base font-mono font-extrabold text-blue-600 block">
                  {hardwareState.calibratedImu.torso.pitch}°
                </span>
                <span className="text-[10px] text-slate-400 block">Pitch (Lean)</span>
              </div>

              {/* Upper Arm */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Upper Arm #2</span>
                <span className="text-base font-mono font-extrabold text-indigo-600 block">
                  {hardwareState.calibratedImu.upperArm.pitch}°
                </span>
                <span className="text-[10px] text-slate-400 block">Pitch (Reach)</span>
              </div>

              {/* Forearm */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Forearm #3</span>
                <span className="text-base font-mono font-extrabold text-emerald-600 block">
                  {hardwareState.calibratedImu.forearm.pitch}°
                </span>
                <span className="text-[10px] text-slate-400 block">Pitch (Flexion)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleConfirmNeutral}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Neutral Position & Calibrate</span>
            </button>

            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Clear neutral offsets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {calibratedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-in fade-in">
              ✓ Neutral Posture Calibrated Successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
