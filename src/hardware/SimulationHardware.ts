// Hardware Simulator for Local Development & Testing
// Generates realistic multi-IMU orientation, button triggers, and heart rate telemetry

import { RawHardwarePacket } from './hardwareTypes';

type PacketCallback = (packet: RawHardwarePacket, latencyMs: number) => void;

export class SimulationHardware {
  private isRunning = false;
  private intervalId: any = null;
  private packetCallback: PacketCallback | null = null;
  private packetRateHz: number = 50;
  private targetHeartRate: number = 76;
  private currentHeartRate: number = 76;
  private buttonState: boolean = false;
  private simulatedLatencyMs: number = 24;
  private timeStep = 0;

  // IMU orientation baseline & wave offsets
  private torsoPitch = 4.0;
  private torsoRoll = 2.0;
  private upperArmPitch = 28.0;
  private upperArmRoll = 14.0;
  private forearmPitch = 65.0;
  private forearmRoll = 8.0;

  public onPacket(cb: PacketCallback): void {
    this.packetCallback = cb;
  }

  public setPacketRate(hz: number): void {
    this.packetRateHz = Math.max(10, Math.min(100, hz));
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public setTargetHeartRate(hr: number): void {
    this.targetHeartRate = hr;
  }

  public setButtonState(pressed: boolean): void {
    this.buttonState = pressed;
  }

  public triggerButtonPulse(durationMs: number = 400): void {
    this.buttonState = true;
    setTimeout(() => {
      this.buttonState = false;
    }, durationMs);
  }

  public setTorsoCompensation(degreesPitch: number): void {
    this.torsoPitch = degreesPitch;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const intervalMs = Math.round(1000 / this.packetRateHz);

    this.intervalId = setInterval(() => {
      this.generatePacket();
    }, intervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generatePacket(): void {
    this.timeStep += 0.05;

    // Smooth approach to target HR with subtle respiratory sinus arrhythmia
    const hrDelta = (this.targetHeartRate - this.currentHeartRate) * 0.05;
    const breathingNoise = Math.sin(this.timeStep * 0.4) * 1.5;
    this.currentHeartRate = Math.round(this.currentHeartRate + hrDelta + (Math.random() * 0.4 - 0.2));
    const effectiveHr = Math.max(50, Math.min(180, Math.round(this.currentHeartRate + breathingNoise)));

    // Generate continuous smooth movement oscillations
    const armOsc = Math.sin(this.timeStep) * 6.0;
    const forearmOsc = Math.cos(this.timeStep * 1.2) * 8.0;
    const torsoOsc = Math.sin(this.timeStep * 0.5) * 1.0;

    const packet: RawHardwarePacket = {
      device: 'vagus-grip-ball-sim',
      connected: true,
      button: this.buttonState,
      heartRate: effectiveHr,
      imu: {
        torso: {
          roll: Number((this.torsoRoll + torsoOsc * 0.5).toFixed(2)),
          pitch: Number((this.torsoPitch + torsoOsc).toFixed(2)),
          yaw: Number((Math.sin(this.timeStep * 0.2) * 2.0).toFixed(2)),
        },
        upperArm: {
          roll: Number((this.upperArmRoll + armOsc * 0.4).toFixed(2)),
          pitch: Number((this.upperArmPitch + armOsc).toFixed(2)),
          yaw: Number((Math.sin(this.timeStep * 0.6) * 4.0).toFixed(2)),
        },
        forearm: {
          roll: Number((this.forearmRoll + forearmOsc * 0.5).toFixed(2)),
          pitch: Number((this.forearmPitch + forearmOsc).toFixed(2)),
          yaw: Number((Math.cos(this.timeStep * 0.8) * 5.0).toFixed(2)),
        },
      },
      timestamp: Date.now(),
    };

    const jitteredLatency = Math.max(10, Math.round(this.simulatedLatencyMs + (Math.random() * 6 - 3)));

    if (this.packetCallback) {
      this.packetCallback(packet, jitteredLatency);
    }
  }

  public isSimulating(): boolean {
    return this.isRunning;
  }
}

export const simulationHardware = new SimulationHardware();
