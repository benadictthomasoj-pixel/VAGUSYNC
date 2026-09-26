import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { useHardware } from '../../hardware/HardwareContext';
import {
  Cpu,
  Wifi,
  Radio,
  Activity,
  Heart,
  Hand,
  Compass,
  Zap,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Power,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DeviceCalibrationModal } from './DeviceCalibrationModal';

export const DeviceHubSection: React.FC = () => {
  const { simulatedHR, safetyState, toggleVagalStimulation, deviceStatus } = useRehab();
  const {
    hardwareState,
    connectWebSocket,
    disconnect,
    setSimulationMode,
    triggerSimulatedButton,
    setSimulatedHeartRate,
    setSimulatedTorsoCompensation,
  } = useHardware();

  const [wsUrl, setWsUrl] = useState('ws://192.168.4.1:81');
  const [showCalibration, setShowCalibration] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Wearable Hardware & Device Center
              </h2>
              {hardwareState.connected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {hardwareState.isSimulated ? 'SIMULATOR ACTIVE' : 'ESP-12E ONLINE'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  DISCONNECTED
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Real-time telemetry from ESP-12E Wi-Fi controller, 3× MPU6050 IMUs, MAX30102 cardiac sensor & grip trigger.
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => setShowCalibration(true)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>IMU Calibration</span>
          {hardwareState.isCalibrated && (
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
          )}
        </button>
      </div>

      {/* 2-Column Device Control & Sensor Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Connection & Hardware Controller */}
        <div className="space-y-6">
          {/* Wi-Fi WebSocket Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                ESP-12E Wi-Fi Connection
              </span>
              <span className="text-[11px] font-mono text-slate-500">Port 81</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">
                WebSocket Gateway URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="ws://192.168.4.1:81"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {hardwareState.connected && !hardwareState.isSimulated ? (
                  <button
                    onClick={disconnect}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectWebSocket(wsUrl)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
              {hardwareState.errorMessage && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {hardwareState.errorMessage}
                </p>
              )}
            </div>

            {/* Signal & Performance Specs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block mb-0.5">Stream Rate</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {hardwareState.packetRateHz} <span className="text-xs font-normal text-slate-500">Hz</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block mb-0.5">Latency</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {hardwareState.latencyMs} <span className="text-xs font-normal text-slate-500">ms</span>
                </span>
              </div>
            </div>

            {/* Hardware Simulator Mode Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Hardware Simulator
                </span>
                <span className="text-[11px] text-slate-500">
                  Run kinematics without physical unit
                </span>
              </div>
              <button
                onClick={() => setSimulationMode(!hardwareState.isSimulated)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  hardwareState.isSimulated
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {hardwareState.isSimulated ? 'Running' : 'Start'}
              </button>
            </div>
          </div>

          {/* Vagal Stimulation Module Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Vagal Nerve Stimulation</h3>
              </div>
              <button
                onClick={toggleVagalStimulation}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  deviceStatus.vagalStimulationActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {deviceStatus.vagalStimulationActive ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synchronous vagus stimulation pulses deliver during smooth, non-compensatory reaching movements to enhance motor neuroplasticity.
            </p>
          </div>
        </div>

        {/* Column 2 & 3: Live Sensor Readings & 3x MPU6050 IMU Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Hardware Triggers & PPG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grip Button Trigger */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Hand className="w-4 h-4 text-purple-600" />
                  Push Button Grip Trigger
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                    hardwareState.buttonPressed
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {hardwareState.buttonPressed ? 'PRESSED (GRAB / PEN DOWN)' : 'RELEASED (OPEN / PEN UP)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Maps directly to game actions: popping balloons, grabbing puzzle pieces, and pen touch.
              </p>
              <button
                onClick={() => triggerSimulatedButton(700)}
                className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Test Simulated Grip Pulse (0.7s)
              </button>
            </div>

            {/* MAX30102 Heart Rate (PPG) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#FF375F] fill-[#FF375F]" />
                  MAX30102 Cardiac PPG
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    safetyState === 'SAFETY_EVENT'
                      ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                      : safetyState === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  ● {safetyState}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-extrabold text-slate-900">
                  {simulatedHR} <span className="text-sm font-sans font-medium text-slate-500">BPM</span>
                </div>
                <div className="text-xs text-slate-500">
                  Safety Threshold: &lt; 130 BPM
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                <button
                  onClick={() => setSimulatedHeartRate(72)}
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-center cursor-pointer"
                >
                  72 Rest
                </button>
                <button
                  onClick={() => setSimulatedHeartRate(95)}
                  className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-center cursor-pointer"
                >
                  95 Active
                </button>
                <button
                  onClick={() => setSimulatedHeartRate(132)}
                  className="py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-center cursor-pointer"
                >
                  132 Spike
                </button>
              </div>
            </div>
          </div>

          {/* 3x MPU6050 IMU Orientation Cluster */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  3× MPU6050 Multi-Joint IMU Telemetry
                </h3>
                <p className="text-xs text-slate-500">
                  Relative kinematic tracking for trunk compensation, shoulder reach, and forearm orientation.
                </p>
              </div>
              {hardwareState.isCalibrated ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated
                </span>
              ) : (
                <button
                  onClick={() => setShowCalibration(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Zero Posture →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Torso IMU #1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Torso IMU #1
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      Math.abs(hardwareState.calibratedImu.torso.pitch) > 18
                        ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {Math.abs(hardwareState.calibratedImu.torso.pitch) > 18
                      ? 'LEAN DETECTED'
                      : 'ALIGNED'}
                  </span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-blue-600">
                  {hardwareState.calibratedImu.torso.pitch}°
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>R: {hardwareState.imu.torso.roll}°</span>
                  <span>Y: {hardwareState.imu.torso.yaw}°</span>
                </div>
                <button
                  onClick={() => setSimulatedTorsoCompensation(22.0)}
                  className="w-full py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Simulate Trunk Lean
                </button>
              </div>

              {/* Upper Arm IMU #2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Upper Arm IMU #2
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-indigo-600">
                  {hardwareState.calibratedImu.upperArm.pitch}°
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>R: {hardwareState.imu.upperArm.roll}°</span>
                  <span>Y: {hardwareState.imu.upperArm.yaw}°</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium pt-1">
                  Shoulder Elevation Arc
                </div>
              </div>

              {/* Forearm IMU #3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Forearm IMU #3
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600">
                  {hardwareState.calibratedImu.forearm.pitch}°
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>R: {hardwareState.imu.forearm.roll}°</span>
                  <span>Y: {hardwareState.imu.forearm.yaw}°</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium pt-1">
                  Elbow Extension Angle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded IMU Calibration Modal */}
      <DeviceCalibrationModal
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
      />
    </div>
  );
};
