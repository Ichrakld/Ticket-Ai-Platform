// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import MFAVerify from './pages/MFAVerify';
// Import TechnicienDashboard avec fallback si le fichier n'existe pas encore
let TechnicienDashboard;
try {
  TechnicienDashboard = require('./pages/TechnicienDashboard').default;
} catch {
  TechnicienDashboard = () => (
    <div style={{ padding: 40, color: '#fff', background: '#070b14', minHeight: '100vh' }}>
      <h2 style={{ color: '#06b6d4' }}>TechnicienDashboard</h2>
      <p style={{ color: '#64748b' }}>
        Fichier manquant : copie <code>TechnicienDashboard.jsx</code> dans <code>src/pages/</code>
      </p>
    </div>
  );
}

function RoleBasedHome() {
  const { user } = useAuth();

  console.log('RoleBasedHome → role:', user?.role);

  if (user?.role === 'Admin') return <AdminDashboard />;
  if (user?.role === 'Technicien') return <TechnicienDashboard />;
  return (
    <>
      <Navbar />
      <Dashboard />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <PrivateRoute>
              <RoleBasedHome />
            </PrivateRoute>
          } />

          <Route path="/create" element={
            <PrivateRoute><Navbar /><CreateTicket /></PrivateRoute>
          } />

          <Route path="/tickets/:id" element={
            <PrivateRoute><Navbar /><TicketDetail /></PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute><Navbar /><Profile /></PrivateRoute>
          } />
          {/* <Route path="/mfa/verify" element={
            <PrivateRoute><MFAVerify /></PrivateRoute>
          } /> */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;