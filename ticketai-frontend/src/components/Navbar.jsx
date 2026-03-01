// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { 
      await api.post('/auth/logout', { refresh }); 
    } catch {}
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.leftSection}>
        <span style={styles.logo} onClick={() => navigate('/')}>
          🎫 TicketAI
        </span>
        
        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <button 
            style={styles.navLink} 
            onClick={() => navigate('/')}
          >
            Dashboard
          </button>
          <button 
            style={styles.navLink} 
            onClick={() => navigate('/create')}
          >
            New Ticket
          </button>
        </div>
      </div>

      <div style={styles.rightSection}>
        {/* User Info with Profile Link */}
        <div style={styles.userMenu}>
          <button 
            style={styles.userInfo}
            onClick={() => navigate('/profile')}
          >
            <span style={styles.avatar}>
              {user.email?.charAt(0).toUpperCase()}
            </span>
            <span style={styles.userDetails}>
              <span style={styles.userEmail}>{user.email}</span>
              <span style={styles.userRole}>{user.role || 'User'}</span>
            </span>
          </button>
          
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: '#001529',
    padding: '0 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
  },
  logo: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.3s',
    ':hover': {
      opacity: 0.8,
    },
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '15px',
    padding: '8px 0',
    transition: 'color 0.3s',
    ':hover': {
      color: 'white',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '6px',
    transition: 'background 0.3s',
    ':hover': {
      background: 'rgba(255,255,255,0.1)',
    },
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    background: '#1890ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userEmail: {
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  userRole: {
    color: '#aaa',
    fontSize: '11px',
  },
  logoutBtn: {
    padding: '6px 16px',
    background: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'background 0.3s',
    ':hover': {
      background: '#ff7875',
    },
  },
};