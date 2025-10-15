import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AttendancePage from './components/AttendancePage';
import LeaveRequestsPage from './components/LeaveRequestsPage';
import './App.css';

// Componente per proteggere le route autenticate
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente per reindirizzare utenti già autenticati
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Componenti placeholder per le pagine admin
const ShiftsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">I miei turni</h2>
    <p className="text-gray-600">Pagina in sviluppo...</p>
  </div>
);

const AdminUsersPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Gestione utenti</h2>
    <p className="text-gray-600">Pagina in sviluppo...</p>
  </div>
);

const AdminAttendancePage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Tutte le presenze</h2>
    <p className="text-gray-600">Pagina in sviluppo...</p>
  </div>
);

const AdminShiftsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Gestione turni</h2>
    <p className="text-gray-600">Pagina in sviluppo...</p>
  </div>
);

const AdminLeaveRequestsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Approvazione richieste</h2>
    <p className="text-gray-600">Pagina in sviluppo...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Route pubbliche */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          } />
          
          {/* Route protette */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance" element={
            <ProtectedRoute>
              <Layout>
                <AttendancePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/shifts" element={
            <ProtectedRoute>
              <Layout>
                <ShiftsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/leave-requests" element={
            <ProtectedRoute>
              <Layout>
                <LeaveRequestsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <Layout>
                <AdminUsersPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/attendance" element={
            <ProtectedRoute>
              <Layout>
                <AdminAttendancePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/shifts" element={
            <ProtectedRoute>
              <Layout>
                <AdminShiftsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/leave-requests" element={
            <ProtectedRoute>
              <Layout>
                <AdminLeaveRequestsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
