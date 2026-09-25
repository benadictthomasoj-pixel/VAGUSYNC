import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  HeartHandshake,
  Heart,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Activity,
  ShieldCheck,
  X,
  PhoneOutgoing,
} from 'lucide-react';

export const CaregiverPortal: React.FC = () => {
  const { activePatient, sessions, alerts, simulatedHR, safetyState } = useRehab();
  const [showCallModal, setShowCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callConnected, setCallConnected] = useState(false);

  const patientSessions = sessions.filter((s) => s.patientId === activePatient.id);
  const latestSession = patientSessions[patientSessions.length - 1];
  const patientAlerts = alerts.filter((a) => a.patientId === activePatient.id && !a.resolved);

  const handleInitiateCall = () => {
    setShowCallModal(true);
    setCallConnected(false);
    setCallDuration(0);

    setTimeout(() => {
      setCallConnected(true);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Caregiver Peace-of-Mind Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Patient Status: {activePatient.name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Real-time safety overview, exercise completion metrics, and direct emergency check-in for {activePatient.name}.
          </p>
        </div>

        <button
          onClick={handleInitiateCall}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/30 cursor-pointer self-start md:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>CALL {activePatient.name.toUpperCase()}</span>
        </button>
      </div>

      {/* 2-Column Safety Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Real-time Safety Pill */}
        <div className="medical-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Current Safety Status
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  safetyState === 'SAFETY_EVENT'
                    ? 'bg-rose-100 text-rose-600'
                    : safetyState === 'WARNING'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <Heart className="w-6 h-6 fill-current animate-pulse" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  {safetyState === 'SAFETY_EVENT'
                    ? '🔴 Safety Event'
                    : safetyState === 'WARNING'
                    ? '⚠ Warning State'
                    : '● Safe & Monitored'}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Live Simulated Heart Rate: {simulatedHR} BPM
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {safetyState === 'SAFE'
              ? `${activePatient.name} is resting safely within the normal cardiac zone.`
              : `Simulated exertion is currently elevated. Clinician ceiling set at ${activePatient.maxSafeHR} BPM.`}
          </p>
        </div>

        {/* Latest Completed Session */}
        <div className="medical-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            Latest Rehabilitation Session
          </h3>

          {latestSession ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{latestSession.gameName}</span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {latestSession.date === new Date().toISOString().split('T')[0] ? 'Today' : latestSession.date}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Rehab Quality Score</div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                    {latestSession.rehabQualityScore} / 100
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Repetitions</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {latestSession.completedReps} / {latestSession.targetReps}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No sessions recorded today.</p>
          )}

          <p className="text-[11px] text-slate-400">
            Next scheduled session prescribed for tomorrow morning.
          </p>
        </div>
      </div>

      {/* Safety Alerts Feed */}
      <div className="medical-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
          <span>Recent Safety Alerts</span>
          <span className="text-xs text-slate-500 font-normal">
            {patientAlerts.length} active for {activePatient.name}
          </span>
        </h3>

        {patientAlerts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No active alerts. All vital safety margins nominal.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {patientAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-rose-900">{alert.title}</div>
                  <p className="text-xs text-rose-800">{alert.description}</p>
                  <span className="text-[10px] text-rose-600 font-mono">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIMULATED PHONE CALL MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-in zoom-in duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-400">
              <PhoneOutgoing className={`w-10 h-10 ${callConnected ? 'animate-pulse' : 'animate-bounce'}`} />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {callConnected ? 'Call Connected (Demo)' : 'Calling Patient...'}
              </div>
              <h3 className="text-xl font-extrabold">{activePatient.name}</h3>
              <p className="text-xs text-slate-400 font-mono">+91 98401 23456</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
              {callConnected
                ? '“Hi Lakshmi, I’m doing well! Just finishing my rehabilitation reach session with VagusSync.”'
                : 'Connecting secure home audio bridge...'}
            </div>

            <button
              onClick={() => setShowCallModal(false)}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
