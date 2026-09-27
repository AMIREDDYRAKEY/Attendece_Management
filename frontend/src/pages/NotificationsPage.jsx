import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  MessageCircle, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, RotateCcw, Loader2, Filter, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DATE_FILTERS = [
  { label: 'Today',      value: 'today' },
  { label: 'Yesterday',  value: 'yesterday' },
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
];

const STATUS_FILTERS = [
  { label: 'All',     value: '' },
  { label: 'Sent',    value: 'SENT' },
  { label: 'Failed',  value: 'FAILED' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'Pending', value: 'PENDING' },
];

const NotificationsPage = () => {
  const { hasRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [dateRange, setDateRange]         = useState('today');
  const [status, setStatus]               = useState('');
  const [retrying, setRetrying]           = useState({});
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const LIMIT = 50;

  const today = new Date().toISOString().slice(0, 10);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateRange, limit: LIMIT, page });
      if (status) params.append('status', status);
      const [listRes, statsRes] = await Promise.all([
        api.get(`/notifications?${params}`),
        api.get(`/notifications/stats?date=${today}`),
      ]);
      setNotifications(listRes.data.notifications || []);
      setTotal(listRes.data.total || 0);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [dateRange, status, page]);

  const handleRetry = async (notifId) => {
    if (!hasRole('SUPER_ADMIN', 'ADMIN')) {
      toast.error('Only admins can retry notifications');
      return;
    }
    setRetrying((prev) => ({ ...prev, [notifId]: true }));
    try {
      const { data } = await api.post(`/notifications/${notifId}/retry`);
      if (data.success) {
        toast.success('Retry successful — WhatsApp sent!');
        fetchNotifications();
      } else {
        toast.error(data.message || 'Retry failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying((prev) => ({ ...prev, [notifId]: false }));
    }
  };

  const statusBadge = (s) => {
    const map = {
      SENT:    <span className="badge-sent"><CheckCircle2 size={11} /> Sent</span>,
      FAILED:  <span className="badge-failed"><XCircle size={11} /> Failed</span>,
      SKIPPED: <span className="badge-skipped"><MessageCircle size={11} /> Skipped</span>,
      PENDING: <span className="badge-pending"><Clock size={11} /> Pending</span>,
    };
    return map[s] || <span className="badge-pending">{s}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>WhatsApp Notification History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track all parent absence notifications sent via WhatsApp</p>
      </div>

      {/* Today stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
          {[
            { label: 'Sent Today',   value: stats.sent,    icon: CheckCircle2, iconBg: 'bg-emerald-500' },
            { label: 'Failed',       value: stats.failed,  icon: XCircle,      iconBg: 'bg-rose-500'    },
            { label: 'Skipped',      value: stats.skipped, icon: MessageCircle, iconBg: 'bg-amber-500'   },
            { label: 'Pending',      value: stats.pending, icon: Clock,        iconBg: 'bg-slate-500'   },
          ].map(({ label, value, icon: Icon, iconBg }) => (
            <div key={label} className="card p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} text-white shadow-sm`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>{value}</p>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center animate-fade-in-up">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-500 font-medium mr-1">Date:</span>
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setDateRange(f.value); setPage(1); }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                dateRange === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-200/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Status:</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                status === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-200/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={fetchNotifications} className="w-full sm:w-auto sm:ml-auto btn-secondary btn-sm justify-center">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            {loading ? 'Loading...' : `${total} Notifications`}
          </h3>
          {total > LIMIT && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >← Prev</button>
              <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / LIMIT)}
                className="px-2 py-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >Next →</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="spinner w-8 h-8" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageCircle size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Error</th>
                  {hasRole('SUPER_ADMIN', 'ADMIN') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                          {n.studentName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{n.studentName}</p>
                          <p className="text-xs font-mono font-medium text-indigo-600">{n.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 font-medium">{n.className}</td>
                    <td>
                      <div>
                        <p className="text-slate-800 text-sm font-medium">{n.parentName || '—'}</p>
                        <p className="font-mono text-xs text-slate-500">{n.parentPhone}</p>
                      </div>
                    </td>
                    <td className="font-mono text-slate-600 text-xs font-medium">{n.date}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60">
                        <MessageCircle size={12} /> {n.channel}
                      </span>
                    </td>
                    <td>{statusBadge(n.status)}</td>
                    <td className="text-slate-600 text-xs font-medium">
                      {n.sentAt
                        ? new Date(n.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="max-w-[140px]">
                      {n.error ? (
                        <span className="text-xs text-rose-600 truncate block font-medium" title={n.error}>{n.error}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    {hasRole('SUPER_ADMIN', 'ADMIN') && (
                      <td>
                        {n.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(n.id)}
                            disabled={retrying[n.id]}
                            className="btn-warning btn-sm text-xs"
                          >
                            {retrying[n.id]
                              ? <Loader2 size={12} className="animate-spin" />
                              : <RotateCcw size={12} />
                            }
                            Retry
                          </button>
                        )}
                      </td>
                    )}
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

export default NotificationsPage;
