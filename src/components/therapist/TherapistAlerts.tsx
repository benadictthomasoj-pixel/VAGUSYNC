import React, { useState } from 'react';
import { useRehab } from '../../context/RehabContext';
import {
  ShieldAlert,
  AlertTriangle,
  Heart,
  PhoneCall,
  Activity,
  CheckCircle,
  Filter,
  Check,
} from 'lucide-react';

export const TherapistAlerts: React.FC = () => {
  const { alerts, resolveAlert } = useRehab();
  const [filter, setFilter] = useState<'all' | 'safety' | 'sos' | 'pain'>('all');

  const filteredAlerts =
    filter === 'all' ? alerts : alerts.filter((a) => a.type === filter);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'sos':
        return <PhoneCall className="w-5 h-5 text-indigo-600" />;
      case 'pain':
        return <Activity className="w-5 h-5 text-purple-600" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Safety Dispatch & Clinical Escalations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Safety & Incident Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time cardiac threshold crossings, manual assistance calls, and reported discomfort events.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          {(['all', 'safety', 'sos', 'pain'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="medical-card p-12 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Active Alerts</h3>
            <p className="text-xs text-slate-500">All clinical safety signals are currently nominal.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`medical-card p-5 border-l-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                alert.resolved
                  ? 'border-l-slate-300 opacity-60 bg-slate-50/50'
                  : alert.type === 'safety'
                  ? 'border-l-rose-500 bg-rose-50/30'
                  : alert.type === 'sos'
                  ? 'border-l-indigo-500 bg-indigo-50/30'
                  : 'border-l-amber-500 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    alert.type === 'safety'
                      ? 'bg-rose-100 border-rose-200'
                      : alert.type === 'sos'
                      ? 'bg-indigo-100 border-indigo-200'
                      : 'bg-amber-100 border-amber-200'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{alert.title}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-800">
                      {alert.patientName}
                    </span>
                    <span className="text-[11px] text-slate-400">• {alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                {alert.resolved ? (
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Resolved
                  </span>
                ) : (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Acknowledge & Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
