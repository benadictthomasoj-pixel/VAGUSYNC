import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { UserRole } from '../../types';

interface LoginScreenProps {
  onLoginComplete: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginComplete }) => {
  const { setRole, setActivePatientId, patients } = useRehab();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [name, setName] = useState('Meera Krishnan');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'patient') {
      setName('Meera Krishnan');
    } else if (role === 'therapist') {
      setName('Dr. Priya');
    } else if (role === 'caregiver') {
      setName('Lakshmi');
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(selectedRole);
    if (selectedRole === 'patient') {
      const match = patients.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) {
        setActivePatientId(match.id);
      } else {
        setActivePatientId('p-meera');
      }
    }
    onLoginComplete();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden bg-[#0A0D14]">
      {/* Dynamic Ambient Background Glows matching reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left Burgundy / Wine Glow */}
        <div className="absolute -top-[20%] -left-[15%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-[#670B34] via-[#3B071E] to-transparent opacity-85 blur-[120px]" />
        
        {/* Top-Right Deep Navy / Indigo Glow */}
        <div className="absolute -top-[15%] -right-[15%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-[#0C2D64] via-[#081B3E] to-transparent opacity-80 blur-[130px]" />
        
        {/* Bottom Subtle Dark Teal / Slate Glow */}
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-t from-[#061A24] via-[#051118] to-transparent opacity-60 blur-[140px]" />
      </div>

      {/* Main Centered Login Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#E8EDF2] rounded-[32px] shadow-2xl p-7 sm:p-9 border border-white/60 text-center animate-in fade-in zoom-in-95 duration-300">
        <form onSubmit={handleContinue} className="flex flex-col items-center">
          {/* App Squircle Icon with Heart + ECG pulse */}
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#E62872] via-[#AC28A6] to-[#4F46E5] flex items-center justify-center text-white shadow-lg shadow-pink-500/25 mb-5 transition-transform hover:scale-105 duration-200">
            <svg
              className="w-9 h-9"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Clean Heart Contour with ECG Pulse Line cut/overlay */}
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M3.5 11.5h4.2l1.8-3.2 2.8 7 2.2-4.8 1.5 2h4.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* App Title & Subtitle */}
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#161C2D] mb-1.5 font-sans">
            VagusSync
          </h1>
          <p className="text-[13px] text-[#64748B] font-normal leading-relaxed max-w-[300px] mb-6">
            Cardiac-safe, movement-paired stroke rehabilitation at home.
          </p>

          {/* Segmented Role Selector Control */}
          <div className="w-full bg-[#D8E0E8] p-1 rounded-2xl flex items-center gap-1 mb-5">
            <button
              type="button"
              onClick={() => handleRoleSelect('patient')}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                selectedRole === 'patient'
                  ? 'bg-white text-[#161C2D] shadow-xs'
                  : 'text-[#5C6E82] hover:text-[#161C2D]'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('therapist')}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                selectedRole === 'therapist'
                  ? 'bg-white text-[#161C2D] shadow-xs'
                  : 'text-[#5C6E82] hover:text-[#161C2D]'
              }`}
            >
              Therapist
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('caregiver')}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                selectedRole === 'caregiver'
                  ? 'bg-white text-[#161C2D] shadow-xs'
                  : 'text-[#5C6E82] hover:text-[#161C2D]'
              }`}
            >
              Caregiver
            </button>
          </div>

          {/* Name Input Field */}
          <div className="w-full text-left space-y-1.5 mb-5">
            <label className="block text-[13px] font-medium text-[#5F6F82]">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                selectedRole === 'patient'
                  ? 'e.g. Meera Krishnan'
                  : selectedRole === 'therapist'
                  ? 'e.g. Dr. Priya'
                  : 'e.g. Lakshmi'
              }
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#CDD6E0] text-sm text-[#161C2D] placeholder-[#9BA7B6] focus:outline-hidden focus:ring-2 focus:ring-[#0066EE] focus:border-transparent transition-all shadow-2xs font-medium"
              required
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#0066EE] hover:bg-[#0055D0] active:scale-[0.99] text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-blue-600/25 cursor-pointer flex items-center justify-center mb-4"
          >
            Continue
          </button>

          {/* Demo Mode Subtext */}
          <p className="text-[12px] text-[#7E8E9F] font-medium">
            Demo mode — no real account needed
          </p>
        </form>
      </div>
    </div>
  );
};
