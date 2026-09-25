import React, { useState } from 'react';
import { useHardware } from './HardwareContext';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  Sliders, 
  PlayCircle, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface HardwareStatusPanelProps {
  showDevControls?: boolean;
  className?: string;
}

export const HardwareStatusPanel: React.FC<HardwareStatusPanelProps> = ({
  showDevControls = true,
  className = '',
}) => {
  const { 
    hardwareState, 
    connectWebSocket, 
    disconnect, 
    setSimulationMode, 
    triggerSimulatedButton,
    setSimulatedHeartRate,
    setSimulatedTorsoCompensation
  } = useHardware();

  const [wsUrl, setWsUrl] = useState('ws://192.168.4.1:81');
  const [testHeartRate, setTestHeartRate] = useState(78);
  const [torsoLean, setTorsoLean] = useState(4);

  const handleHeartRateSlider = (val: number) => {
    setTestHeartRate(val);
    setSimulatedHeartRate(val);
  };

  const handleTorsoLeanSlider = (val: number) => {
    setTorsoLean(val);
    setSimulatedTorsoCompensation(val);
  };

  const isConnected = hardwareState.connected && !hardwareState.isStale;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 space-y-6 ${className}`}>
      {/* Header with Title & Live Connection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">VagusSync Device Center</h2>
            {hardwareState.isSimulated && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Simulation Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ESP-12E Wi-Fi Telemetry & IMU Biomechanics Engine
          </p>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-soft-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Device Connected</span>
            </div>
          ) : hardwareState.connectionState === 'connecting' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>Connecting to ESP-12E...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Device Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Stale Warning Banner if lost */}
      {hardwareState.isStale && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Device Connection Stale:</strong> No sensor packets received in the last 1.5 seconds. Reconnect your VagusSync hardware to resume.
          </div>
        </div>
      )}

      {/* Metrics Grid: Packet Rate, Latency, Grip Button, Heart Rate */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Packet Rate */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Packet Rate</span>
            <Radio className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {isConnected ? hardwareState.packetRateHz : 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">Hz</span>
          </div>
        </div>

        {/* Latency */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Network Latency</span>
            <Activity className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {isConnected ? hardwareState.latencyMs : '--'}
            </span>
            <span className="text-xs text-slate-500 ml-1">ms</span>
          </div>
        </div>

        {/* Physical Button / Grip */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Grip Button</span>
            <Cpu className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                hardwareState.buttonPressed
                  ? 'bg-emerald-500 text-white shadow-glow-green scale-105'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {hardwareState.buttonPressed ? 'PRESSED (GRAB)' : 'RELEASED'}
            </span>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cardiac Sensor</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-heartbeat" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {isConnected && hardwareState.heartRate ? hardwareState.heartRate : '--'}
            </span>
            <span className="text-xs text-slate-500 ml-1">BPM</span>
          </div>
        </div>
      </div>

      {/* 3 x MPU6050 IMU Multi-Sensor Telemetry */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3 × MPU6050 Kinematic IMU Channels
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Roll / Pitch / Yaw</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* MPU #1: Torso */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-slate-800">MPU #1: Torso</span>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-medium">
                Trunk Control
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Roll</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.torso.roll > 0 ? `+${hardwareState.imu.torso.roll}°` : `${hardwareState.imu.torso.roll}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Pitch</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.torso.pitch > 0 ? `+${hardwareState.imu.torso.pitch}°` : `${hardwareState.imu.torso.pitch}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Yaw</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.torso.yaw > 0 ? `+${hardwareState.imu.torso.yaw}°` : `${hardwareState.imu.torso.yaw}°`}
                </div>
              </div>
            </div>
          </div>

          {/* MPU #2: Upper Arm */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-xs font-bold text-slate-800">MPU #2: Upper Arm</span>
              </div>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                Shoulder Reach
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Roll</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.upperArm.roll > 0 ? `+${hardwareState.imu.upperArm.roll}°` : `${hardwareState.imu.upperArm.roll}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Pitch</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.upperArm.pitch > 0 ? `+${hardwareState.imu.upperArm.pitch}°` : `${hardwareState.imu.upperArm.pitch}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Yaw</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.upperArm.yaw > 0 ? `+${hardwareState.imu.upperArm.yaw}°` : `${hardwareState.imu.upperArm.yaw}°`}
                </div>
              </div>
            </div>
          </div>

          {/* MPU #3: Forearm */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-slate-800">MPU #3: Forearm</span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                Elbow / Pronation
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Roll</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.forearm.roll > 0 ? `+${hardwareState.imu.forearm.roll}°` : `${hardwareState.imu.forearm.roll}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Pitch</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.forearm.pitch > 0 ? `+${hardwareState.imu.forearm.pitch}°` : `${hardwareState.imu.forearm.pitch}°`}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Yaw</div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {hardwareState.imu.forearm.yaw > 0 ? `+${hardwareState.imu.forearm.yaw}°` : `${hardwareState.imu.forearm.yaw}°`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer / Simulation Controls Panel */}
      {showDevControls && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hardware Connection & Simulator Controls
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">Developer & QA Tools</span>
          </div>

          {/* WebSocket URL Input & Connect Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Wifi className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://192.168.4.1:81"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => connectWebSocket(wsUrl)}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-all shadow-soft-sm active:scale-95"
              >
                Connect ESP-12E
              </button>

              <button
                onClick={() => setSimulationMode(!hardwareState.isSimulated)}
                className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  hardwareState.isSimulated
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {hardwareState.isSimulated ? 'Simulation: Active' : 'Start Simulation'}
              </button>

              <button
                onClick={disconnect}
                className="px-3 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Interactive Simulator Sliders (when simulation is active) */}
          {hardwareState.isSimulated && (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Button Pulse Tester */}
              <div className="flex flex-col justify-between">
                <span className="text-xs text-slate-600 font-medium mb-1.5">Grip Button Trigger:</span>
                <button
                  onMouseDown={() => triggerSimulatedButton(600)}
                  onTouchStart={() => triggerSimulatedButton(600)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-soft-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Press Grip Button</span>
                </button>
              </div>

              {/* Heart Rate Simulator */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Simulate HR:</span>
                  <strong className="font-mono text-slate-900">{testHeartRate} BPM</strong>
                </div>
                <input
                  type="range"
                  min="55"
                  max="140"
                  value={testHeartRate}
                  onChange={(e) => handleHeartRateSlider(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Trunk Compensation Simulator */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Trunk Lean:</span>
                  <strong className="font-mono text-slate-900">{torsoLean}°</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={torsoLean}
                  onChange={(e) => handleTorsoLeanSlider(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medical Disclaimer Note */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          <strong>Prototype Notice:</strong> Sensor streams and heart rate metrics are generated by research hardware (ESP-12E / MAX30102 / MPU6050) and are not intended for clinical diagnosis.
        </span>
      </div>
    </div>
  );
};
