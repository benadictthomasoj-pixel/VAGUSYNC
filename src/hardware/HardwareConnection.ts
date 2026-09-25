// HardwareConnection Manager
// Coordinates WebSocket transport and Simulation fallback, calculates packet rates and stale timeouts

import { HardwareState, INITIAL_HARDWARE_STATE, RawHardwarePacket } from './hardwareTypes';
import { WebSocketTransport } from './WebSocketTransport';
import { simulationHardware, SimulationHardware } from './SimulationHardware';

type HardwareStateListener = (state: HardwareState) => void;

export class HardwareConnection {
  private state: HardwareState = { ...INITIAL_HARDWARE_STATE };
  private listeners: Set<HardwareStateListener> = new Set();
  private wsTransport: WebSocketTransport = new WebSocketTransport();
  private simHardware: SimulationHardware = simulationHardware;
  private isSimMode: boolean = false;
  private packetCount = 0;
  private lastRateCheck = performance.now();
  private staleCheckTimer: any = null;
  private readonly STALE_TIMEOUT_MS = 1500;

  constructor() {
    this.setupTransports();
    this.startStaleWatchdog();
  }

  private setupTransports(): void {
    // Setup WebSocket
    this.wsTransport.onPacket((packet, latency) => {
      if (!this.isSimMode) {
        this.processPacket(packet, latency, false);
      }
    });

    this.wsTransport.onStatus((status, error) => {
      if (!this.isSimMode) {
        this.state = {
          ...this.state,
          connectionState: status,
          connected: status === 'connected',
          errorMessage: error || null,
        };
        this.notify();
      }
    });

    // Setup Simulator
    this.simHardware.onPacket((packet, latency) => {
      if (this.isSimMode) {
        this.processPacket(packet, latency, true);
      }
    });
  }

  public subscribe(cb: HardwareStateListener): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb(this.state));
  }

  public getState(): HardwareState {
    return this.state;
  }

  public setSimulationMode(enabled: boolean): void {
    this.isSimMode = enabled;
    if (enabled) {
      this.wsTransport.disconnect();
      this.simHardware.start();
      this.state = {
        ...this.state,
        isSimulated: true,
        connectionState: 'connected',
        connected: true,
        errorMessage: null,
      };
    } else {
      this.simHardware.stop();
      this.state = {
        ...this.state,
        isSimulated: false,
        connectionState: 'disconnected',
        connected: false,
      };
    }
    this.notify();
  }

  public isSimulation(): boolean {
    return this.isSimMode;
  }

  public connectWebSocket(url: string = 'ws://192.168.4.1:81'): void {
    this.setSimulationMode(false);
    this.wsTransport.connect(url);
  }

  public disconnect(): void {
    this.wsTransport.disconnect();
    this.simHardware.stop();
    this.state = {
      ...this.state,
      connected: false,
      connectionState: 'disconnected',
      packetRateHz: 0,
    };
    this.notify();
  }

  public calibrateNeutral(): void {
    this.state = {
      ...this.state,
      calibrationOffsets: {
        torso: { ...this.state.imu.torso },
        upperArm: { ...this.state.imu.upperArm },
        forearm: { ...this.state.imu.forearm },
      },
      calibratedImu: {
        torso: { roll: 0, pitch: 0, yaw: 0 },
        upperArm: { roll: 0, pitch: 0, yaw: 0 },
        forearm: { roll: 0, pitch: 0, yaw: 0 },
      },
      isCalibrated: true,
    };
    this.notify();
  }

  public resetCalibration(): void {
    const zero = { roll: 0, pitch: 0, yaw: 0 };
    this.state = {
      ...this.state,
      calibrationOffsets: {
        torso: { ...zero },
        upperArm: { ...zero },
        forearm: { ...zero },
      },
      calibratedImu: {
        torso: { ...this.state.imu.torso },
        upperArm: { ...this.state.imu.upperArm },
        forearm: { ...this.state.imu.forearm },
      },
      isCalibrated: false,
    };
    this.notify();
  }

  private processPacket(packet: RawHardwarePacket, latencyMs: number, isSim: boolean): void {
    const now = Date.now();
    this.packetCount++;

    // Calculate Packet Rate (Hz)
    const nowPerf = performance.now();
    if (nowPerf - this.lastRateCheck >= 1000) {
      this.state.packetRateHz = Math.round((this.packetCount * 1000) / (nowPerf - this.lastRateCheck));
      this.packetCount = 0;
      this.lastRateCheck = nowPerf;
    }

    const torso = packet.imu?.torso;
    const upperArm = packet.imu?.upperArm;
    const forearm = packet.imu?.forearm;

    const rawTorso = {
      roll: torso?.roll ?? this.state.imu.torso.roll,
      pitch: torso?.pitch ?? this.state.imu.torso.pitch,
      yaw: torso?.yaw ?? this.state.imu.torso.yaw,
    };
    const rawUpperArm = {
      roll: upperArm?.roll ?? this.state.imu.upperArm.roll,
      pitch: upperArm?.pitch ?? this.state.imu.upperArm.pitch,
      yaw: upperArm?.yaw ?? this.state.imu.upperArm.yaw,
    };
    const rawForearm = {
      roll: forearm?.roll ?? this.state.imu.forearm.roll,
      pitch: forearm?.pitch ?? this.state.imu.forearm.pitch,
      yaw: forearm?.yaw ?? this.state.imu.forearm.yaw,
    };

    const offsets = this.state.calibrationOffsets;
    const calibratedTorso = {
      roll: Number((rawTorso.roll - offsets.torso.roll).toFixed(2)),
      pitch: Number((rawTorso.pitch - offsets.torso.pitch).toFixed(2)),
      yaw: Number((rawTorso.yaw - offsets.torso.yaw).toFixed(2)),
    };
    const calibratedUpperArm = {
      roll: Number((rawUpperArm.roll - offsets.upperArm.roll).toFixed(2)),
      pitch: Number((rawUpperArm.pitch - offsets.upperArm.pitch).toFixed(2)),
      yaw: Number((rawUpperArm.yaw - offsets.upperArm.yaw).toFixed(2)),
    };
    const calibratedForearm = {
      roll: Number((rawForearm.roll - offsets.forearm.roll).toFixed(2)),
      pitch: Number((rawForearm.pitch - offsets.forearm.pitch).toFixed(2)),
      yaw: Number((rawForearm.yaw - offsets.forearm.yaw).toFixed(2)),
    };

    this.state = {
      ...this.state,
      connected: true,
      isSimulated: isSim,
      deviceType: packet.device || 'vagus-grip-ball',
      buttonPressed: Boolean(packet.button),
      heartRate: packet.heartRate ?? null,
      imu: {
        torso: rawTorso,
        upperArm: rawUpperArm,
        forearm: rawForearm,
      },
      calibratedImu: {
        torso: calibratedTorso,
        upperArm: calibratedUpperArm,
        forearm: calibratedForearm,
      },
      latencyMs,
      lastPacketTimestamp: now,
      isStale: false,
      connectionState: 'connected',
      errorMessage: null,
    };

    this.notify();
  }

  private startStaleWatchdog(): void {
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);

    this.staleCheckTimer = setInterval(() => {
      if (this.state.connected && this.state.lastPacketTimestamp > 0) {
        const timeSinceLast = Date.now() - this.state.lastPacketTimestamp;
        if (timeSinceLast > this.STALE_TIMEOUT_MS && !this.state.isStale) {
          this.state = {
            ...this.state,
            isStale: true,
            packetRateHz: 0,
          };
          this.notify();
        }
      }
    }, 500);
  }
}

export const hardwareConnection = new HardwareConnection();
