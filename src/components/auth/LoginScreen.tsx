import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { UserRole } from '../../types';
import {
  Activity,
  User,
  Stethoscope,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginComplete: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginComplete }) => {
  const { setRole, activePatient, setActivePatientId, patients } = useRehab();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [patientName, setPatientName] = useState('Meera');
  const [therapistName, setTherapistName] = useState('Dr. Priya');
  const [caregiverName, setCaregiverName] = useState('Lakshmi');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleEnterDemo = () => {
    setRole(selectedRole);
    if (selectedRole === 'patient') {
      const match = patients.find((p) => p.name.toLowerCase() === patientName.toLowerCase());
      if (match) {
        setActivePatientId(match.id);
      } else {
        setActivePatientId('p-meera');
      }
    }
    onLoginComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">VagusSync</span>
            <span className="block text-[11px] font-medium text-slate-500">Digital Health System</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>HACKATHON DEMO PROTOTYPE</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Clinical & Patient Experience
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            VagusSync
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            “Cardiac-safe, movement-paired stroke rehabilitation at home.”
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Patient Card */}
          <div
            onClick={() => handleRoleSelect('patient')}
            className={`cursor-pointer rounded-3xl p-6 border-2 transition-all text-left relative overflow-hidden bg-white shadow-xs ${
              selectedRole === 'patient'
                ? 'border-blue-600 ring-4 ring-blue-500/15 shadow-xl -translate-y-1'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {selectedRole === 'patient' && (
              <div className="absolute top-4 right-4 text-blue-600">
                <CheckCircle className="w-5 h-5 fill-blue-600 text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <User className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              PATIENT
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Rehabilitation Portal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete guided rehabilitation, interactive games, and track cardiac-safe recovery.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Demo Persona:</span>
              <span className="font-semibold text-slate-900">Meera (58y)</span>
            </div>
          </div>

          {/* Therapist Card */}
          <div
            onClick={() => handleRoleSelect('therapist')}
            className={`cursor-pointer rounded-3xl p-6 border-2 transition-all text-left relative overflow-hidden bg-white shadow-xs ${
              selectedRole === 'therapist'
                ? 'border-indigo-600 ring-4 ring-indigo-500/15 shadow-xl -translate-y-1'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {selectedRole === 'therapist' && (
              <div className="absolute top-4 right-4 text-indigo-600">
                <CheckCircle className="w-5 h-5 fill-indigo-600 text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              THERAPIST
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Clinical Dashboard
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor patient cohort, approve adaptive difficulty, set thresholds, and write clinical notes.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Demo Clinician:</span>
              <span className="font-semibold text-slate-900">Dr. Priya</span>
            </div>
          </div>

          {/* Caregiver Card */}
          <div
            onClick={() => handleRoleSelect('caregiver')}
            className={`cursor-pointer rounded-3xl p-6 border-2 transition-all text-left relative overflow-hidden bg-white shadow-xs ${
              selectedRole === 'caregiver'
                ? 'border-emerald-600 ring-4 ring-emerald-500/15 shadow-xl -translate-y-1'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {selectedRole === 'caregiver' && (
              <div className="absolute top-4 right-4 text-emerald-600">
                <CheckCircle className="w-5 h-5 fill-emerald-600 text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              CAREGIVER
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Safety & Status Hub
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stay informed about patient safety events, completed sessions, and rapid check-in calls.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Demo Caregiver:</span>
              <span className="font-semibold text-slate-900">Lakshmi</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Selected Demo Profile
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <span>
                {selectedRole === 'patient' && `Patient: ${patientName}`}
                {selectedRole === 'therapist' && `Therapist: ${therapistName}`}
                {selectedRole === 'caregiver' && `Caregiver: ${caregiverName}`}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Prototype Demo User
              </span>
            </div>
          </div>

          <button
            onClick={handleEnterDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Enter Demo Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-slate-500 space-y-1 pt-4 border-t border-slate-200">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>VagusSync Hackathon Prototype — Sensor readings & physiological responses are simulated.</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Not intended for actual medical diagnosis or direct clinical treatment.
        </p>
      </div>
    </div>
  );
};
