import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { useHardware } from '../../hardware/HardwareContext';
import {
  X,
  Radio,
  Cpu,
  Heart,
  Hand,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Shield,
  Wifi,
  WifiOff,
  RotateCcw,
  Sliders,
  Play,
  Square,
  Compass,
} from 'lucide-react';
import { DeviceCalibrationModal } from './DeviceCalibrationModal';

export const DeviceStatusModal: React.FC = () => {
  const {
    showDeviceStatusModal,
    setShowDeviceStatusModal,
    deviceStatus,
    toggleVagalStimulation,
    simulatedHR,
    safetyState,
  } = useRehab();

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
  const [activeTab, setActiveTab] = useState<'status' | 'diagnostics' | 'simulator'>('status');
  const [showCalibration, setShowCalibration] = useState(false);

  if (!showDeviceStatusModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">VagusSync Device Center</h3>
                {hardwareState.isSimulated ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    SIMULATION MODE
                  </span>
                ) : hardwareState.connected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ESP-12E ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Physical Hardware & Sensor Telemetry Hub</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeviceStatusModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100/90 px-6 py-2 border-b border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Device Status
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live IMU & Sensors
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hardware Simulator
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Scientific Disclaimer */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Physical Device Integration</p>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                Connects via Wi-Fi WebSocket to the ESP-12E / ESP8266 controller streaming 3x MPU6050 IMUs, MAX30102 PPG, and Grip push button.
              </p>
            </div>
          </div>

          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Primary Connection Card */}
              <div className="medical-card p-4 space-y-3 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className={`w-4 h-4 ${hardwareState.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">ESP-12E Wi-Fi WebSocket</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hardwareState.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    ● {hardwareState.connected ? (hardwareState.isSimulated ? 'SIMULATED' : 'CONNECTED') : 'DISCONNECTED'}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://192.168.4.1:81"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {hardwareState.connected && !hardwareState.isSimulated ? (
                    <button
                      onClick={disconnect}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => connectWebSocket(wsUrl)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Connect Wi-Fi
                    </button>
                  )}
                </div>

                {hardwareState.errorMessage && (
                  <p className="text-[11px] text-rose-600 font-medium">{hardwareState.errorMessage}</p>
                )}
              </div>

              {/* Hardware Sensors Overview Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Grip Button */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5 text-emerald-600" />
                      Grip Button
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        hardwareState.buttonPressed
                          ? 'bg-purple-100 text-purple-800 border border-purple-300 animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {hardwareState.buttonPressed ? 'PRESSED (GRAB)' : 'RELEASED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Physical Grip / Ball Trigger</p>
                </div>

                {/* Heart Rate MAX30102 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#FF375F]" />
                      Heart Rate (PPG)
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      {hardwareState.heartRate ? `${hardwareState.heartRate} BPM` : 'No Signal'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-xs font-bold text-slate-900 font-mono">{simulatedHR} BPM</span>
                    <span className="text-[10px] text-slate-500 font-bold">{safetyState}</span>
                  </div>
                </div>

                {/* Packet Rate */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-500" />
                      Packet Rate
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-800">
                      {hardwareState.packetRateHz} Hz
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Target: 50 Hz Wi-Fi stream</p>
                </div>

                {/* Latency */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      Latency
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-800">
                      {hardwareState.latencyMs} ms
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Round-trip WebSocket ping</p>
                </div>
              </div>

              {/* Vagal Stimulation Module */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Vagal Nerve Stimulation Module</span>
                  </div>
                  <button
                    onClick={toggleVagalStimulation}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      deviceStatus.vagalStimulationActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {deviceStatus.vagalStimulationActive ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {deviceStatus.vagalStimulationActive
                    ? 'Stimulation pairing active: In the proposed device, micro-current pulses trigger synchronously during clean non-compensatory reaching motions.'
                    : 'Module inactive. Can be prescribed and enabled by the supervising therapist.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">3x MPU6050 Orientation Telemetry</h4>
              
              {/* Torso IMU */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Torso IMU #1 (Trunk & Compensation)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    Math.abs(hardwareState.imu.torso.pitch) > 18
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {Math.abs(hardwareState.imu.torso.pitch) > 18 ? 'TRUNK LEAN DETECTED' : 'ALIGNED'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Roll</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.torso.roll}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Pitch</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.torso.pitch}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Yaw</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.torso.yaw}°</span>
                  </div>
                </div>
              </div>

              {/* Upper Arm IMU */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    Upper Arm IMU #2 (Humerus & Shoulder)
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Roll</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.upperArm.roll}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Pitch</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.upperArm.pitch}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Yaw</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.upperArm.yaw}°</span>
                  </div>
                </div>
              </div>

              {/* Forearm IMU */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Forearm IMU #3 (Elbow & Forearm Angle)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Roll</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.forearm.roll}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Pitch</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.forearm.pitch}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Yaw</span>
                    <span className="font-bold text-slate-800">{hardwareState.imu.forearm.yaw}°</span>
                  </div>
                </div>
              </div>

              {/* Calibration Button */}
              <button
                onClick={() => setShowCalibration(true)}
                className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Open IMU Neutral Calibration Tool</span>
                {hardwareState.isCalibrated && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold ml-1">
                    ✓ Calibrated
                  </span>
                )}
              </button>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Hardware Simulator Mode</span>
                  <span className="text-[11px] text-slate-500">Emulate physical prototype telemetry without hardware</span>
                </div>
                <button
                  onClick={() => setSimulationMode(!hardwareState.isSimulated)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hardwareState.isSimulated
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {hardwareState.isSimulated ? 'Stop Simulator' : 'Start Simulator'}
                </button>
              </div>

              {/* Simulation Quick Triggers */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Simulate Hardware Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerSimulatedButton(800)}
                    className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Hand className="w-4 h-4 text-purple-600" />
                    <span>Press Grip Button (0.8s)</span>
                  </button>

                  <button
                    onClick={() => setSimulatedTorsoCompensation(24.0)}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>Trigger Torso Lean (24°)</span>
                  </button>
                </div>
              </div>

              {/* Simulated Heart Rate presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Simulated Heart Rate</span>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                  <button
                    onClick={() => setSimulatedHeartRate(72)}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-800 cursor-pointer"
                  >
                    72 BPM
                  </button>
                  <button
                    onClick={() => setSimulatedHeartRate(88)}
                    className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold text-emerald-800 cursor-pointer"
                  >
                    88 BPM
                  </button>
                  <button
                    onClick={() => setSimulatedHeartRate(118)}
                    className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold text-amber-800 cursor-pointer"
                  >
                    118 BPM
                  </button>
                  <button
                    onClick={() => setSimulatedHeartRate(132)}
                    className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 font-bold text-rose-800 cursor-pointer"
                  >
                    132 BPM
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400">
            {hardwareState.connected ? `Status: Active (${hardwareState.isSimulated ? 'Simulated' : 'ESP-12E'})` : 'Status: Disconnected'}
          </span>
          <button
            onClick={() => setShowDeviceStatusModal(false)}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Device Center
          </button>
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

