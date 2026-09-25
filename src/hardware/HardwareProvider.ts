import { hardwareConnection, HardwareConnection } from './HardwareConnection';
import { simulationHardware, SimulationHardware } from './SimulationHardware';

export class HardwareService {
  public connection: HardwareConnection = hardwareConnection;
  public simulator: SimulationHardware = simulationHardware;

  public initialize(enableSimulation: boolean = true): void {
    if (enableSimulation) {
      this.connection.setSimulationMode(true);
    }
  }
}

export const hardwareService = new HardwareService();
