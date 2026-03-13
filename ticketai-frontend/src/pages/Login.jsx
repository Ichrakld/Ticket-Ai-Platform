// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!form.email || !form.password) { setError('Veuillez remplir tous les champs'); setLoading(false); return; }
    try {
      const res = await api.post('/auth/login', form);
      const userData = res.data.user || {};
      login(userData, res.data.access, res.data.refresh);
      localStorage.setItem('last_login_time', new Date().toISOString());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <div style={st.container}>
      {/* Fond vert EMSI */}
      <div style={st.bg}>
        <div style={st.blob1} />
        <div style={st.blob2} />
        <div style={st.blob3} />
      </div>

      {/* Panneau gauche branding */}
      <div style={st.leftPanel}>
        <div style={st.brandLogo}>
          <span style={{ fontSize: 48 }}>🎫</span>
        </div>
        <h1 style={st.brandTitle}>TicketAI</h1>
        <p style={st.brandSub}>Système de gestion des tickets<br />EMSI — NeuralDevSecurity</p>
        <div style={st.features}>
          {['🤖 Classification IA automatique', '🔒 Sécurité renforcée', '📊 Tableau de bord en temps réel', '🏫 Intégration EMSI'].map((f, i) => (
            <div key={i} style={st.feature}>{f}</div>
          ))}
        </div>
      </div>

      {/* Card login */}
      <div style={st.card}>
        <div style={st.cardHeader}>
          <h2 style={st.cardTitle}>Connexion</h2>
          <p style={st.cardSub}>Bienvenue sur TicketAI</p>
        </div>

        {error && (
          <div style={st.errorAlert}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={st.form}>
          <div style={st.group}>
            <label style={st.label}>Adresse Email</label>
            <input
              type="email" style={st.input} placeholder="votre@emsi-edu.ma"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={loading} required
            />
            {form.email.endsWith('@emsi-edu.ma') && (
              <div style={st.emsiTag}>✓ Email EMSI reconnu</div>
            )}
          </div>

          <div style={st.group}>
            <label style={st.label}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} style={st.input}
                placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                disabled={loading} required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" style={{ ...st.submitBtn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={st.spinner} />Connexion...
                </span>
              : 'Se connecter →'}
          </button>
        </form>

        <div style={st.divider}><span>ou</span></div>

        <div style={st.registerRow}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Pas encore de compte ? </span>
          <Link to="/register" style={{ color: '#16a34a', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Créer un compte</Link>
        </div>

        
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
      `}</style>
    </div>
  );
}

const st = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #15803d 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '20px', gap: 48 },
  bg: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' },
  blob1: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -100, right: -100, animation: 'float 8s ease-in-out infinite' },
  blob2: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -80, left: -80, animation: 'float 10s ease-in-out infinite' },
  blob3: { position: 'absolute', width: 200, height: 200, borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%', background: 'rgba(255,255,255,0.06)', top: '40%', left: '30%', animation: 'float 6s ease-in-out infinite' },
  leftPanel: { position: 'relative', zIndex: 1, color: '#fff', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 20 },
  brandLogo: { width: 80, height: 80, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' },
  brandTitle: { fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: '-0.03em' },
  brandSub: { fontSize: 15, opacity: 0.85, margin: 0, lineHeight: 1.6 },
  features: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
  feature: { fontSize: 14, opacity: 0.9, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)' },
  card: { position: 'relative', zIndex: 1, background: '#fff', borderRadius: 24, padding: '36px 32px', width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' },
  cardHeader: { marginBottom: 28, textAlign: 'center' },
  cardTitle: { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' },
  cardSub: { fontSize: 14, color: '#64748b', margin: 0 },
  errorAlert: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  group: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '0.02em' },
  input: { width: '100%', padding: '13px 16px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  emsiTag: { fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
  submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 6, boxShadow: '0 4px 14px rgba(22,163,74,0.35)' },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },
  divider: { textAlign: 'center', margin: '20px 0', color: '#94a3b8', fontSize: 13, position: 'relative', display: 'flex', alignItems: 'center', gap: 12 },
  registerRow: { textAlign: 'center', marginBottom: 20 },
  demoBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', textAlign: 'center' },
  demoTitle: { margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#15803d' },
  demoText: { margin: '3px 0', fontSize: 12, color: '#16a34a', fontFamily: 'monospace', fontWeight: 600 },
};