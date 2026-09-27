import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, MessageCircle,
  Upload, LogOut, Menu, X, ChevronRight, GraduationCap,
  Bell, Search, Clock, Calendar
} from 'lucide-react';

const navLinks = [
  { to: '/',              label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/students',      label: 'Students',               icon: Users },
  { to: '/attendance',    label: 'Attendance',             icon: ClipboardList },
  { to: '/upload',        label: 'Excel Upload',           icon: Upload },
  { to: '/notifications', label: 'WhatsApp Notifications', icon: MessageCircle },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{ background: 'linear-gradient(160deg, #3730a3 0%, #4f46e5 50%, #7c3aed 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg flex-shrink-0">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              AITS
            </p>
            <p className="text-indigo-200 text-[10px] leading-tight">Attendance Management</p>
          </div>
        </div>
        {/* ERP badge */}
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
          <p className="text-white/80 text-[11px] font-semibold">📋 ERP 2026</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-4 mb-4 px-3 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate leading-tight">{user?.name}</p>
            <p className="text-indigo-200 text-xs truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-indigo-300/70 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Main Menu</p>
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight size={13} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 pt-3 border-t border-white/10 mt-2">
        <button
          onClick={handleLogout}
          className="nav-item w-full"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 animate-slide-in-left">
            <Sidebar />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
            <X size={16} className="text-slate-600" />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 flex-shrink-0">
              <Menu size={20} />
            </button>
            {/* Search bar */}
            <div className="search-bar flex-1 max-w-xs sm:max-w-md">
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search students, classes, attendance..."
                className="bg-transparent outline-none w-full text-slate-600 text-sm placeholder-slate-400"
              />
              <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded font-mono hidden sm:block">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Date & Real-time Live Timer */}
            <div className="hidden md:flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-medium">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <Calendar size={13} className="text-indigo-500" />
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <span className="text-indigo-200">|</span>
              <div className="flex items-center gap-1.5 text-indigo-900 font-mono font-bold tracking-tight">
                <Clock size={13} className="text-indigo-600 animate-pulse" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Bell size={17} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-tight truncate max-w-[80px]">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
