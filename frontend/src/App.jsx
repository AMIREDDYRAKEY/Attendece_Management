import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import UploadPage from './pages/UploadPage';
import NotificationsPage from './pages/NotificationsPage';

// ─── Protected Route wrapper ───────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── App routes ────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/"              element={<DashboardPage />} />
                <Route path="/students"      element={<StudentsPage />} />
                <Route path="/attendance"    element={<AttendancePage />} />
                <Route path="/upload"        element={<UploadPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*"              element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0f172a' },
              duration: 3000,
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0f172a' },
              duration: 4000,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
