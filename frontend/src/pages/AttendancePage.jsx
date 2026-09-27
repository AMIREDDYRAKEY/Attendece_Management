import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ClipboardList, CheckCircle2, XCircle, Users, Loader2,
  MessageCircle, AlertTriangle, CheckCheck, RefreshCw, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(today());
  const [className, setClassName] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (className) params.append('className', className);
      const { data } = await api.get(`/students?${params}`);
      setStudents(data.students || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const fetchExisting = async () => {
    if (!date) return;
    try {
      const params = new URLSearchParams({ date, limit: 300 });
      if (className) params.append('className', className);
      const { data } = await api.get(`/attendance?${params}`);
      const map = {};
      (data.records || []).forEach((r) => { map[r.studentId] = { status: r.status }; });
      setAttendance((prev) => {
        const merged = { ...prev };
        Object.keys(map).forEach((id) => { merged[id] = { ...merged[id], ...map[id] }; });
        return merged;
      });
    } catch {}
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get(`/attendance/summary?date=${date}${className ? `&className=${className}` : ''}`);
      setSummary(data);
    } catch {}
  };

  useEffect(() => { fetchStudents(); }, [className]);
  useEffect(() => { fetchExisting(); fetchSummary(); }, [date, className]);

  const markAttendance = async (student, status) => {
    const sid = student.studentId;
    setAttendance((prev) => ({ ...prev, [sid]: { status, loading: true } }));
    try {
      const { data } = await api.post('/attendance', { studentId: sid, date, status });
      const notif = data.notification;
      setAttendance((prev) => ({ ...prev, [sid]: { status, loading: false, notification: notif } }));
      if (status === 'Absent' && notif) {
        if (notif.status === 'SENT')    toast.success(`✅ Absent saved · WhatsApp sent to parent`, { duration: 3000 });
        else if (notif.status === 'SKIPPED') toast(`✅ Absent saved · Already notified`, { icon: '⏭', duration: 3000 });
        else if (notif.status === 'FAILED')  toast.error(`⚠️ Absent saved · WhatsApp failed: ${notif.message}`, { duration: 4000 });
      } else if (status === 'Present') {
        toast.success(`Present marked for ${student.name}`, { duration: 2000 });
      }
      fetchSummary();
    } catch (err) {
      setAttendance((prev) => ({ ...prev, [sid]: { ...prev[sid], loading: false } }));
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const notifIcon = (att) => {
    if (!att?.notification) return null;
    const s = att.notification.status;
    if (s === 'SENT')    return <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCheck size={12} /> Notified</span>;
    if (s === 'SKIPPED') return <span className="flex items-center gap-1 text-xs font-semibold text-amber-500"><MessageCircle size={12} /> Already sent</span>;
    if (s === 'FAILED')  return <span className="flex items-center gap-1 text-xs font-semibold text-red-500" title={att.notification.message}><AlertTriangle size={12} /> Failed</span>;
    return null;
  };

  const classes = [...new Set(students.map((s) => s.className).filter(Boolean))].sort();
  const presentCount = Object.values(attendance).filter((a) => a.status === 'Present').length;
  const absentCount  = Object.values(attendance).filter((a) => a.status === 'Absent').length;

  const avatarColors = ['from-indigo-400 to-indigo-600','from-purple-400 to-purple-600','from-pink-400 to-rose-500','from-blue-400 to-cyan-500','from-emerald-400 to-teal-500'];

  return (
    <div className="space-y-5">
      <div className="animate-fade-in-up">
        <h1 className="section-title text-2xl">Attendance</h1>
        <p className="text-slate-500 text-sm mt-0.5">Click Absent → WhatsApp fires automatically. No send button needed.</p>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="input pl-9 py-2 w-auto text-sm" />
        </div>
        <select className="input w-auto py-2 text-sm" value={className} onChange={(e) => setClassName(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { fetchStudents(); fetchExisting(); fetchSummary(); }} className="btn-secondary btn-sm">
          <RefreshCw size={13} /> Refresh
        </button>

        {/* Live counter */}
        <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="font-bold text-emerald-700">{presentCount}</span>
            <span className="text-emerald-600 text-xs sm:text-sm font-semibold">Present</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-red-50 border border-red-200">
            <XCircle size={14} className="text-red-500" />
            <span className="font-bold text-red-600">{absentCount}</span>
            <span className="text-red-500 text-xs sm:text-sm font-semibold">Absent</span>
          </div>
        </div>
      </div>

      {/* Auto-notify notice */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border"
        style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={15} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-indigo-800 text-sm">Auto-WhatsApp Notification Active</p>
          <p className="text-indigo-600 text-xs mt-0.5">
            Marking a student <strong>Absent</strong> instantly sends a WhatsApp message to the parent.
            Parent phone numbers are fetched from MongoDB — never from this screen.
          </p>
        </div>
      </div>

      {/* Student list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-indigo-500" />
            <span className="font-bold text-slate-700 text-sm">
              {loadingStudents ? 'Loading…' : `${students.length} Students — ${date}`}
            </span>
          </div>
        </div>

        {loadingStudents ? (
          <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No students found</p>
            <p className="text-slate-400 text-xs mt-1">Add students first to mark attendance</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {students.map((student, idx) => {
              const att = attendance[student.studentId];
              const isPresent = att?.status === 'Present';
              const isAbsent  = att?.status === 'Absent';
              const isLoading = att?.loading;

              return (
                <div key={student.studentId}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                    {student.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-indigo-500 font-semibold">{student.studentId}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{student.className}</span>
                    </div>
                  </div>

                  {/* Notification status */}
                  <div className="hidden sm:flex min-w-[110px] justify-end">
                    {isAbsent && notifIcon(att)}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {isLoading ? (
                      <div className="w-28 flex justify-center"><Loader2 size={18} className="animate-spin text-indigo-400" /></div>
                    ) : (
                      <>
                        <button
                          onClick={() => markAttendance(student, 'Present')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isPresent
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:scale-105'
                          }`}
                        >
                          <CheckCircle2 size={14} /> Present
                        </button>
                        <button
                          onClick={() => markAttendance(student, 'Absent')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isAbsent
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                              : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:scale-105'
                          }`}
                        >
                          <XCircle size={14} /> Absent
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
