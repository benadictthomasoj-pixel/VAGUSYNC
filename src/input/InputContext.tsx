import React, { createContext, useContext, useEffect, useState } from 'react';
import { RehabInputState, InputModeSelection, INITIAL_REHAB_INPUT_STATE } from './inputTypes';
import { inputNormalizer } from './InputNormalizer';

interface InputContextType {
  inputState: RehabInputState;
  inputMode: InputModeSelection;
  setInputMode: (mode: InputModeSelection) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

export const InputProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputState, setInputState] = useState<RehabInputState>(inputNormalizer.getState());
  const [inputMode, setInputModeState] = useState<InputModeSelection>(inputNormalizer.getMode());

  useEffect(() => {
    inputNormalizer.start();
    const unsub = inputNormalizer.subscribe((state) => {
      // Throttle React state updates to ~30Hz so UI stays super responsive without unnecessary rendering overhead
      setInputState(state);
    });
    return () => {
      unsub();
      inputNormalizer.stop();
    };
  }, []);

  const setInputMode = (mode: InputModeSelection) => {
    inputNormalizer.setMode(mode);
    setInputModeState(mode);
  };

  return (
    <InputContext.Provider value={{ inputState, inputMode, setInputMode }}>
      {children}
    </InputContext.Provider>
  );
};

export const useRehabInput = (): InputContextType => {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('useRehabInput must be used within an InputProvider');
  }
  return context;
};
