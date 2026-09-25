import { inputNormalizer, InputNormalizer } from './InputNormalizer';
import { RehabInputState, InputModeSelection } from './inputTypes';

export class InputService {
  public normalizer: InputNormalizer = inputNormalizer;

  public initialize(mode: InputModeSelection = 'hybrid'): void {
    this.normalizer.setMode(mode);
    this.normalizer.start();
  }

  public getInput(): RehabInputState {
    return this.normalizer.getState();
  }
}

export const inputService = new InputService();
