// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import logger from '../utils/logger';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      const response = await api.get('/auth/me');
      setProfile(response.data);
      setForm(prev => ({ ...prev, email: response.data.email }));
      if (response.data.last_login) {
        localStorage.setItem('last_login', response.data.last_login);
      }
      await fetchUserTickets(response.data.email);
    } catch (err) {
      logger.error('Profile fetch error:', err);
      if (user) {
        setProfile({
          email: user.email,
          role: user.role,
          last_login: user.last_login
        });
        setForm(prev => ({ ...prev, email: user.email }));
        await fetchUserTickets(user.email);
      } else {
        showMessage('error', 'Impossible de charger le profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTickets = async (userEmail) => {
    try {
      const response = await api.get('/tickets/');
      let tickets = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setStats({
        tickets_created: tickets.filter(t =>
          t.created_by?.email === userEmail || t.created_by === userEmail
        ).length,
        tickets_assigned: tickets.filter(t =>
          t.assigned_to?.email === userEmail || t.assigned_to === userEmail
        ).length,
        comments: 0,
      });
    } catch (err) {
      logger.error('Failed to fetch tickets:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!form.current_password || !form.new_password) {
      showMessage('error', 'Remplissez le mot de passe actuel et le nouveau');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (form.new_password.length < 12) {
      showMessage('error', 'Minimum 12 caractères requis');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/me/update', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      showMessage('success', 'Mot de passe mis à jour ! Reconnexion en cours...');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'N/A'; }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return 'N/A'; }
  };

  if (loading && !profile) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 Paramètres du Profil</h2>

        {message.text && (
          <div style={{ ...styles.alert, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'profile' && styles.activeTab) }}
            onClick={() => setActiveTab('profile')}
          >
            Informations
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'security' && styles.activeTab) }}
            onClick={() => setActiveTab('security')}
          >
            Sécurité
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
                <span style={{
                  background: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0', padding: '3px 12px',
                  borderRadius: 20, fontSize: 12, fontWeight: 700
                }}>
                  {profile?.role || user?.role || 'Utilisateur'}
                </span>
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={{ ...styles.statCard, borderTop: '3px solid #3b82f6' }}>
                <span style={styles.statValue}>{stats.tickets_created}</span>
                <span style={styles.statLabel}>Tickets Créés</span>
              </div>
              <div style={{ ...styles.statCard, borderTop: '3px solid #16a34a' }}>
                <span style={styles.statValue}>{stats.tickets_assigned}</span>
                <span style={styles.statLabel}>Tickets Assignés</span>
              </div>
              <div style={{ ...styles.statCard, borderTop: '3px solid #8b5cf6' }}>
                <span style={styles.statValue}>{stats.comments}</span>
                <span style={styles.statLabel}>Commentaires</span>
              </div>
            </div>

            <div style={styles.infoSection}>
              <h4 style={styles.sectionTitle}>Informations du Compte</h4>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Email :</span>
                <span>{profile?.email || user?.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Membre depuis :</span>
                <span>{formatDate(profile?.created_at || user?.created_at)}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Dernière connexion :</span>
                <span>{formatDateTime(localStorage.getItem('last_login_time'))}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>MFA :</span>
                <span style={{ color: profile?.mfa_enabled ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {profile?.mfa_enabled ? '✅ Activé' : '❌ Désactivé'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={styles.tabContent}>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400e' }}>
              ⚠️ Après le changement de mot de passe, vous serez automatiquement déconnecté de toutes vos sessions.
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mot de passe actuel</label>
                <input
                  type="password"
                  style={styles.input}
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  placeholder="Votre mot de passe actuel"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input
                  type="password"
                  style={{
                    ...styles.input,
                    borderColor: form.new_password.length > 0
                      ? form.new_password.length >= 12 ? '#16a34a' : '#ef4444'
                      : '#ddd'
                  }}
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  placeholder="Min. 12 caractères"
                  required
                />
                {form.new_password.length > 0 && (
                  <small style={{ color: form.new_password.length >= 12 ? '#16a34a' : '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {form.new_password.length >= 12 ? '✓ Longueur valide' : `${form.new_password.length}/12 caractères minimum`}
                  </small>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  style={{
                    ...styles.input,
                    borderColor: form.confirm_password.length > 0
                      ? form.confirm_password === form.new_password ? '#16a34a' : '#ef4444'
                      : '#ddd'
                  }}
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Répétez le nouveau mot de passe"
                  required
                />
                {form.confirm_password.length > 0 && (
                  <small style={{ color: form.confirm_password === form.new_password ? '#16a34a' : '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {form.confirm_password === form.new_password ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                  </small>
                )}
              </div>

              <button
                type="submit"
                style={{ ...styles.updateBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                disabled={loading}
              >
                {loading ? '⏳ Mise à jour...' : '🔐 Changer le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  card: { background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 20px 0', fontSize: '28px', color: '#333' },
  alert: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 500 },
  success: { background: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a' },
  error: { background: '#fff2f0', border: '1px solid #ffccc7', color: '#f5222d' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' },
  tab: { padding: '8px 16px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', color: '#666' },
  activeTab: { background: '#e6f7ff', color: '#1890ff', fontWeight: 'bold' },
  tabContent: { padding: '20px 0' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' },
  avatar: { width: '80px', height: '80px', borderRadius: '40px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', flexShrink: 0 },
  profileName: { margin: '0 0 8px 0', fontSize: '20px', color: '#333' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' },
  statCard: { background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' },
  statValue: { display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: '13px', color: '#666' },
  infoSection: { background: '#f8f9fa', padding: '20px', borderRadius: '8px' },
  sectionTitle: { margin: '0 0 15px 0', fontSize: '16px', color: '#333', fontWeight: 700 },
  infoRow: { display: 'flex', marginBottom: '12px', fontSize: '14px', alignItems: 'center' },
  infoLabel: { width: '160px', color: '#666', fontWeight: '500', flexShrink: 0 },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  updateBtn: { width: '100%', padding: '13px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold' },
};