import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, Search, X, Loader2, Phone, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const StudentsPage = () => {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('');
  const [year, setYear] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: '', name: '', className: '', year: 1, rollNumber: '',
    parent: { name: '', whatsappNumber: '', relation: 'Parent' }
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (className) params.append('className', className);
      if (year) params.append('year', year);
      const { data } = await api.get(`/students?${params}`);
      setStudents(data.students || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [search, className, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.className) { toast.error('Student Name and Class required'); return; }
    setSaving(true);
    try {
      await api.post('/students', form);
      toast.success('Student added successfully!');
      setShowModal(false);
      setForm({ name: '', className: '', year: 1, rollNumber: '', parent: { name: '', whatsappNumber: '', relation: 'Parent' } });
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const classes = [...new Set(students.map((s) => s.className).filter(Boolean))].sort();

  const avatarColors = ['from-indigo-400 to-indigo-600','from-purple-400 to-purple-600','from-pink-400 to-pink-600','from-blue-400 to-blue-600','from-emerald-400 to-emerald-600'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>Students</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage student records, year levels, and parent contacts</p>
        </div>
        {hasRole('SUPER_ADMIN', 'ADMIN') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <UserPlus size={16} /> Add Student
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" className="input pl-9 py-2" placeholder="Search students..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Year Dropdown Filter */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <select className="input w-auto py-2 text-sm font-semibold text-slate-700" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select className="input w-auto py-2 text-sm" value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users size={15} className="text-indigo-600" />
            </div>
            <span className="font-bold text-slate-800 text-sm">
              {loading ? 'Loading...' : `${students.length} Students ${year ? `(Year ${year})` : ''}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium">No students found</p>
            <p className="text-slate-400 text-xs mt-1">Try changing the year or class filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Student</th><th>Student ID</th><th>Year</th><th>Class</th><th>Roll No.</th><th>Parent</th><th>WhatsApp</th><th>Status</th>
              </tr></thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {s.studentId}
                      </span>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold">
                        Year {s.year || 1}
                      </span>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                        {s.className}
                      </span>
                    </td>
                    <td className="text-slate-600 font-medium">{s.rollNumber || '—'}</td>
                    <td>
                      {s.parent?.name
                        ? <div>
                            <p className="text-slate-800 text-sm font-medium">{s.parent.name}</p>
                            <p className="text-slate-400 text-xs">{s.parent.relation || 'Parent'}</p>
                          </div>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td>
                      {s.parent?.whatsappNumber === undefined
                        ? <span className="flex items-center gap-1 text-slate-400 text-xs"><Phone size={12} /> Hidden</span>
                        : s.parent?.whatsappNumber
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60"><Phone size={12} /> Registered</span>
                        : <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60"><Phone size={12} /> Missing</span>}
                    </td>
                    <td>
                      {s.isActive
                        ? <span className="badge-sent">Active</span>
                        : <span className="badge-failed">Inactive</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl p-7 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>Add New Student</h3>
                <p className="text-slate-500 text-sm mt-0.5">Fill in student, academic year, and parent details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input className="input" placeholder="Rahul Kumar"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Roll Number</label>
                  <input className="input" placeholder="01"
                    value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Academic Year *</label>
                  <select className="input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Class / Section *</label>
                  <input className="input" placeholder="CSE-A"
                    value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Parent / Guardian</p>
                <div className="space-y-3">
                  <div>
                    <label className="input-label">Parent Name</label>
                    <input className="input" placeholder="Parent name"
                      value={form.parent.name} onChange={(e) => setForm({ ...form, parent: { ...form.parent, name: e.target.value } })} />
                  </div>
                  <div>
                    <label className="input-label">WhatsApp Number <span className="text-slate-400 font-normal normal-case">(e.g. 919876543210)</span></label>
                    <input className="input font-mono" placeholder="919876543210"
                      value={form.parent.whatsappNumber} onChange={(e) => setForm({ ...form, parent: { ...form.parent, whatsappNumber: e.target.value } })} />
                  </div>
                  <div>
                    <label className="input-label">Relation</label>
                    <select className="input" value={form.parent.relation}
                      onChange={(e) => setForm({ ...form, parent: { ...form.parent, relation: e.target.value } })}>
                      <option>Parent</option><option>Father</option><option>Mother</option><option>Guardian</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><UserPlus size={14} /> Add Student</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
