import React from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  Users,
  CalendarCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  Heart,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface TherapistOverviewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate: (page: string) => void;
}

export const TherapistOverview: React.FC<TherapistOverviewProps> = ({
  onSelectPatient,
  onNavigate,
}) => {
  const { patients, sessions, alerts } = useRehab();

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const pendingReviews = patients.filter((p) => p.status === 'Review Required' || p.status === 'Needs Attention').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Supervisory Clinician Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, Dr. Priya
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Overview of remote stroke cohort: 24 active telerehabilitation devices, real-time safety telemetry & adaptive difficulty approvals.
          </p>
        </div>

        <button
          onClick={() => onNavigate('alerts')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-colors cursor-pointer self-start md:self-auto"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{unresolvedAlerts.length} Active Safety Alerts</span>
        </button>
      </div>

      {/* 4 Clinical Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="medical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Patients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">24</div>
          <p className="text-[11px] text-slate-500">5 home sessions active now</p>
        </div>

        <div className="medical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sessions This Week</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">86</div>
          <p className="text-[11px] text-emerald-600 font-semibold">+12% vs last week</p>
        </div>

        <div className="medical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Safety Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#FF375F] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 fill-[#FF375F]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">3</div>
          <p className="text-[11px] text-rose-600 font-semibold">1 requires check-in</p>
        </div>

        <div className="medical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Reviews</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">5</div>
          <p className="text-[11px] text-indigo-600 font-semibold">Adaptive difficulty ready</p>
        </div>
      </div>

      {/* Patient Cohort Table */}
      <div className="medical-card overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Patient Cohort Monitoring</h3>
            <p className="text-xs text-slate-500">
              Live patient adherence, rehab quality indices, and clinical review status
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            {patients.length} Enrolled Demo Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-5">Patient</th>
                <th className="py-3.5 px-4">Condition & Side</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Session</th>
                <th className="py-3.5 px-4">Rehab Quality</th>
                <th className="py-3.5 px-4">Alerts</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => {
                const patientAlerts = alerts.filter(
                  (a) => a.patientId === patient.id && !a.resolved
                );

                return (
                  <tr
                    key={patient.id}
                    onClick={() => onSelectPatient(patient.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Patient Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {patient.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {patient.name}
                          </div>
                          <div className="text-[11px] text-slate-400">Age: {patient.age}</div>
                        </div>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-4 px-4 text-slate-600">
                      <div>{patient.condition}</div>
                      <div className="text-[11px] text-slate-400">{patient.affectedSide}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          patient.status === 'On Track'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : patient.status === 'Needs Attention'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        ● {patient.status}
                      </span>
                    </td>

                    {/* Last Session */}
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {patient.id === 'p-meera'
                        ? 'Today'
                        : patient.id === 'p-kamala'
                        ? 'Yesterday'
                        : patient.id === 'p-arun'
                        ? '3 days ago'
                        : 'Today'}
                    </td>

                    {/* Quality Score */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {patient.id === 'p-meera'
                            ? 87
                            : patient.id === 'p-arun'
                            ? 61
                            : patient.id === 'p-kamala'
                            ? 82
                            : 54}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${
                                patient.id === 'p-meera'
                                  ? 87
                                  : patient.id === 'p-arun'
                                  ? 61
                                  : patient.id === 'p-kamala'
                                  ? 82
                                  : 54
                              }%`,
                            }}
                            className="h-full bg-blue-600 rounded-full"
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Alerts */}
                    <td className="py-4 px-4">
                      {patientAlerts.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {patientAlerts.length} Alert{patientAlerts.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View Chart</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
