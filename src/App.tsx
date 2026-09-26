import React, { useState } from 'react';
import { RehabProvider, useRehab } from './context/RehabContext';
import { HandTrackingProvider } from './context/HandTrackingContext';
import { HardwareProvider } from './hardware/HardwareContext';
import { InputProvider } from './input/InputContext';

import { Header } from './components/common/Header';
import { HardwareSimulatorBar } from './components/common/HardwareSimulatorBar';
import { HardwareArchitectureModal } from './components/common/HardwareArchitectureModal';
import { DeviceStatusModal } from './components/common/DeviceStatusModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { PatientPortal } from './components/patient/PatientPortal';
import { TherapistPortal } from './components/therapist/TherapistPortal';
import { CaregiverPortal } from './components/caregiver/CaregiverPortal';

const MainLayout: React.FC = () => {
  const { role } = useRehab();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const sessionFlag = sessionStorage.getItem('vagussync_session_auth');
    return sessionFlag === 'true';
  });

  const handleLoginSuccess = () => {
    sessionStorage.setItem('vagussync_session_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vagussync_session_auth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginComplete={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Application Header */}
      <Header />

      {/* Main Role Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {role === 'patient' && <PatientPortal />}
        {role === 'therapist' && <TherapistPortal />}
        {role === 'caregiver' && <CaregiverPortal />}
      </main>

      {/* Floating Hardware Simulation Bar */}
      <HardwareSimulatorBar />

      {/* Modals */}
      <HardwareArchitectureModal />
      <DeviceStatusModal />

      {/* Application Footer */}
      <footer className="bg-white/70 border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500 space-y-1 mt-8">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-slate-800">VagusSync</span>
          <span>•</span>
          <span>Cardiac-Safe Stroke Rehabilitation Platform</span>
          <span>•</span>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
          >
            Switch Role / Log Out
          </button>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <HardwareProvider>
      <InputProvider>
        <RehabProvider>
          <HandTrackingProvider>
            <MainLayout />
          </HandTrackingProvider>
        </RehabProvider>
      </InputProvider>
    </HardwareProvider>
  );
}

export default App;
