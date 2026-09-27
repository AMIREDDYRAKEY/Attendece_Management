import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);
    if (result?.success) { toast.success('Welcome back!'); navigate('/'); }
    else toast.error(result?.message || 'Login failed');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2ff' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #3730a3 0%, #4f46e5 55%, #7c3aed 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5 translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>AITS</h1>
            <p className="text-indigo-200 text-sm">Attendance Management System</p>
          </div>
        </div>

        {/* Center text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            Smart Attendance<br />& WhatsApp Alerts
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Mark attendance once. Parents get notified instantly via WhatsApp — automatically.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              '✅ Auto WhatsApp on every absence',
              '📊 Excel bulk upload supported',
              '🔒 JWT + RBAC Security',
              '📱 Duplicate protection built-in',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© 2026 AITS · All rights reserved</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <GraduationCap size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-indigo-700" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>AITS</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                Sign In to AITS
              </h2>
              <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email" className="input pl-10"
                    placeholder="admin@school.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 text-base mt-2">
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                  : 'Sign In →'}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
