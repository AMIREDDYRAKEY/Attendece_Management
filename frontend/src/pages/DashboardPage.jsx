import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users, ClipboardList, CheckCircle2, XCircle, MessageCircle,
  TrendingUp, AlertTriangle, RefreshCw, Loader2, Zap, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, sub, iconBg, trend, loading }) => (
  <div className="card p-5 hover:shadow-md transition-all duration-200 animate-fade-in-up">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          <ArrowUpRight size={12} /> {trend}%
        </span>
      )}
    </div>
    {loading ? (
      <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse mb-1" />
    ) : (
      <p className="text-3xl font-black text-slate-800 mb-1" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>{value ?? '—'}</p>
    )}
    <p className="text-sm text-slate-500 font-medium">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [attSummary, setAttSummary] = useState(null);
  const [notifStats, setNotifStats]  = useState(null);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, n, l] = await Promise.all([
        api.get(`/attendance/summary?date=${today}`),
        api.get(`/notifications/stats?date=${today}`),
        api.get(`/notifications?dateRange=today&limit=8`),
      ]);
      setAttSummary(a.data);
      setNotifStats(n.data.stats);
      setRecentNotifs(l.data.notifications || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const statusBadge = (s) => ({
    SENT:    <span className="badge-sent">✓ Sent</span>,
    FAILED:  <span className="badge-failed">✗ Failed</span>,
    SKIPPED: <span className="badge-skipped">⏭ Skipped</span>,
    PENDING: <span className="badge-pending">⋯ Pending</span>,
  }[s] || <span className="badge-pending">{s}</span>);

  const attendanceRate = attSummary?.total
    ? Math.round((attSummary.present / attSummary.total) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            Good to see you, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>


      {/* Attendance stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today's Attendance</p>
          <span className="text-xs text-slate-400">{today}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Students" value={attSummary?.total}
            iconBg="bg-gradient-to-br from-blue-500 to-blue-600"  trend={null}        loading={loading} />
          <StatCard icon={CheckCircle2}  label="Present Today"  value={attSummary?.present}
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-500" trend={attendanceRate} loading={loading} />
          <StatCard icon={XCircle}       label="Absent Today"   value={attSummary?.absent}
            iconBg="bg-gradient-to-br from-red-500 to-rose-500"    trend={null}        loading={loading} />
          <StatCard icon={TrendingUp}    label="Attendance Rate"
            value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
            iconBg="bg-gradient-to-br from-violet-500 to-purple-600" loading={loading} />
        </div>
      </div>

      {/* WhatsApp stats */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">WhatsApp Notifications — Today</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={MessageCircle} label="WA Sent"     value={notifStats?.sent}
            iconBg="bg-gradient-to-br from-green-500 to-emerald-600"    loading={loading} />
          <StatCard icon={XCircle}       label="Failed"       value={notifStats?.failed}
            iconBg="bg-gradient-to-br from-red-500 to-rose-600"          loading={loading} />
          <StatCard icon={AlertTriangle} label="Skipped"      value={notifStats?.skipped}
            iconBg="bg-gradient-to-br from-amber-400 to-orange-500"      loading={loading} />
          <StatCard icon={Loader2}       label="Pending"      value={notifStats?.pending}
            iconBg="bg-gradient-to-br from-slate-400 to-slate-500"       loading={loading} />
        </div>
      </div>

      {/* Recent notifications table */}
      <div className="card overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <MessageCircle size={15} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Recent WhatsApp Notifications</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Today</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="spinner w-8 h-8" />
          </div>
        ) : recentNotifs.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No notifications yet today</p>
            <p className="text-slate-400 text-xs mt-1">Mark students absent to trigger WhatsApp alerts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Student</th><th>Class</th><th>Parent</th>
                <th>Date</th><th>Status</th><th>Sent At</th>
              </tr></thead>
              <tbody>
                {recentNotifs.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.1)' }}>
                          {n.studentName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{n.studentName}</p>
                          <p className="text-xs text-indigo-600 font-mono font-medium">{n.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">{n.className}</span></td>
                    <td>
                      <p className="text-slate-800 text-sm font-medium">{n.parentName || '—'}</p>
                      <p className="font-mono text-xs text-slate-500 font-medium">{n.parentPhone}</p>
                    </td>
                    <td className="font-mono text-slate-600 text-xs font-medium">{n.date}</td>
                    <td>{statusBadge(n.status)}</td>
                    <td className="text-slate-600 text-xs font-medium">
                      {n.sentAt ? new Date(n.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
