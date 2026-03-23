import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function MFAVerify() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/email/send');
      setSent(true);
      setSuccess('Code envoyé ! Vérifiez votre email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/email/verify', { token: otp });
      setSuccess('Identité vérifiée !');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✉️</div>
        <h2 style={styles.title}>Vérification par email</h2>
        <p style={styles.subtitle}>
          Un code à 6 chiffres sera envoyé à votre adresse email.
        </p>

        {error && <div style={styles.error}>⚠️ {error}</div>}
        {success && <div style={styles.successBox}>✅ {success}</div>}

        {!sent ? (
          <button
            style={styles.sendBtn}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Envoi...' : '📧 Envoyer le code'}
          </button>
        ) : (
          <form onSubmit={handleVerify}>
            <div style={styles.otpContainer}>
              <input
                style={styles.otpInput}
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            <button
              type="submit"
              style={styles.verifyBtn}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
            <button
              type="button"
              style={styles.resendBtn}
              onClick={handleSend}
              disabled={loading}
            >
              Renvoyer le code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #14532d, #16a34a)',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 420, textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 800, color: '#14532d', margin: '0 0 8px' },
  subtitle: { fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 13,
  },
  successBox: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#15803d', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 13,
  },
  sendBtn: {
    width: '100%', padding: '14px', background: '#16a34a',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  otpContainer: { marginBottom: 20 },
  otpInput: {
    width: '100%', padding: '18px', fontSize: 32,
    textAlign: 'center', letterSpacing: 12, fontWeight: 700,
    border: '2px solid #16a34a', borderRadius: 10,
    color: '#14532d', boxSizing: 'border-box', outline: 'none',
  },
  verifyBtn: {
    width: '100%', padding: '14px', background: '#16a34a',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginBottom: 10, opacity: 1,
  },
  resendBtn: {
    width: '100%', padding: '12px', background: 'transparent',
    color: '#6b7280', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 13, cursor: 'pointer',
  },
};