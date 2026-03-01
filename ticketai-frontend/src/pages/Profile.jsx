// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    tickets_created: 0,
    tickets_assigned: 0,
    comments: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // CORRECT ENDPOINT: /api/auth/me/
      const response = await api.get('/auth/me/');
      
      console.log('Profile data:', response.data);
      
      setProfile(response.data);
      setForm(prev => ({ ...prev, email: response.data.email }));
      
      // If the response includes last_login, store it
      if (response.data.last_login) {
        localStorage.setItem('last_login', response.data.last_login);
      }
      
      // Fetch user tickets to get counts
      await fetchUserTickets(response.data.email);
      
    } catch (err) {
      console.error('Profile fetch error:', err);
      
      // Fallback to user from context
      if (user) {
        setProfile({ 
          email: user.email, 
          role: user.role,
          last_login: user.last_login 
        });
        setForm(prev => ({ ...prev, email: user.email }));
        
        // Still try to fetch tickets
        await fetchUserTickets(user.email);
      } else {
        showMessage('error', 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTickets = async (userEmail) => {
    try {
      // CORRECT ENDPOINT: /api/tickets/
      const response = await api.get('/tickets/');
      
      console.log('All tickets:', response.data);
      
      let tickets = [];
      if (response.data.results) {
        tickets = response.data.results;
      } else if (Array.isArray(response.data)) {
        tickets = response.data;
      }
      
      // Count tickets created by user
      const createdByUser = tickets.filter(t => 
        t.created_by?.email === userEmail || 
        t.created_by === userEmail
      );
      
      // Count tickets assigned to user
      const assignedToUser = tickets.filter(t => 
        t.assigned_to?.email === userEmail || 
        t.assigned_to === userEmail
      );
      
      setStats({
        tickets_created: createdByUser.length,
        tickets_assigned: assignedToUser.length,
        comments: 0 // You can implement comments count later
      });
      
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (form.new_password && form.new_password !== form.confirm_password) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (form.new_password && form.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        email: form.email,
      };
      
      if (form.current_password && form.new_password) {
        updateData.current_password = form.current_password;
        updateData.new_password = form.new_password;
      }

      // CORRECT ENDPOINT: /api/auth/me/
      await api.put('/auth/me/', updateData);
      
      setForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      
      showMessage('success', 'Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  if (loading && !profile) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 Profile Settings</h2>

        {message.text && (
          <div style={{
            ...styles.alert,
            ...(message.type === 'success' ? styles.success : styles.error),
          }}>
            {message.text}
          </div>
        )}

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'profile' && styles.activeTab),
            }}
            onClick={() => setActiveTab('profile')}
          >
            Profile Info
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'security' && styles.activeTab),
            }}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {activeTab === 'profile' && (
          <div style={styles.tabContent}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {(profile?.email || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={styles.profileName}>{profile?.email || user?.email}</h3>
                <p style={styles.profileRole}>{profile?.role || 'Utilisateur'}</p>
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{stats.tickets_created}</span>
                <span style={styles.statLabel}>Tickets Créés</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{stats.tickets_assigned}</span>
                <span style={styles.statLabel}>Tickets Assignés</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{stats.comments}</span>
                <span style={styles.statLabel}>Commentaires</span>
              </div>
            </div>

            <div style={styles.infoSection}>
              <h4 style={styles.sectionTitle}>Informations du Compte</h4>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Email:</span>
                <span>{profile?.email || user?.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Membre depuis:</span>
                <span>
                  {formatDate(profile?.date_joined || profile?.created_at || user?.created_at)}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Dernière connexion:</span>
                <span>
                  {formatDateTime(profile?.last_login || localStorage.getItem('last_login'))}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={styles.tabContent}>
            <form onSubmit={handleUpdateProfile}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mot de passe actuel</label>
                <input
                  type="password"
                  style={styles.input}
                  value={form.current_password}
                  onChange={(e) => setForm({...form, current_password: e.target.value})}
                  placeholder="Laisser vide pour garder le même"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input
                  type="password"
                  style={styles.input}
                  value={form.new_password}
                  onChange={(e) => setForm({...form, new_password: e.target.value})}
                  placeholder="Min. 8 caractères"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  style={styles.input}
                  value={form.confirm_password}
                  onChange={(e) => setForm({...form, confirm_password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                style={styles.updateBtn}
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '28px',
    color: '#333',
  },
  alert: {
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  success: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    color: '#52c41a',
  },
  error: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#f5222d',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px',
  },
  tab: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#666',
  },
  activeTab: {
    background: '#e6f7ff',
    color: '#1890ff',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: '20px 0',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '25px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  profileName: {
    margin: '0 0 5px 0',
    fontSize: '20px',
    color: '#333',
  },
  profileRole: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '25px',
  },
  statCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
  },
  infoSection: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '10px',
    fontSize: '14px',
  },
  infoLabel: {
    width: '150px',
    color: '#666',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  updateBtn: {
    width: '100%',
    padding: '12px',
    background: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};