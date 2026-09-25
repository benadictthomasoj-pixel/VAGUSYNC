import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import { TherapistOverview } from './TherapistOverview';
import { TherapistPatientDetail } from './TherapistPatientDetail';
import { TherapistAlerts } from './TherapistAlerts';
import { TherapistPrograms } from './TherapistPrograms';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Layers,
} from 'lucide-react';

export const TherapistPortal: React.FC = () => {
  const { activePage, setActivePage, activePatientId, setActivePatientId, alerts } = useRehab();
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<string | null>(null);

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  if (selectedPatientForDetail) {
    return (
      <TherapistPatientDetail
        patientId={selectedPatientForDetail}
        onBack={() => setSelectedPatientForDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Therapist Sub-Navigation Tabs */}
      <nav aria-label="Therapist portal navigation" className="bg-white/80 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/90 shadow-xs max-w-xl mx-auto flex items-center justify-between gap-1 overflow-x-auto">
        <button
          onClick={() => setActivePage('overview')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActivePage('programs')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'programs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Programs</span>
        </button>

        <button
          onClick={() => setActivePage('alerts')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'alerts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alerts</span>
          {unresolvedAlertsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
              {unresolvedAlertsCount}
            </span>
          )}
        </button>
      </nav>

      {/* Pages */}
      {activePage === 'overview' && (
        <TherapistOverview
          onSelectPatient={(pId) => {
            setSelectedPatientForDetail(pId);
            setActivePatientId(pId);
          }}
          onNavigate={(page) => setActivePage(page)}
        />
      )}

      {activePage === 'programs' && (
        <TherapistPrograms
          onSelectPatient={(pId) => {
            setSelectedPatientForDetail(pId);
            setActivePatientId(pId);
          }}
        />
      )}

      {activePage === 'alerts' && <TherapistAlerts />}
    </div>
  );
};
