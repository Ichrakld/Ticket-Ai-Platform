// src/pages/CreateTicket.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateTicket() {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    if (form.title.length < 5) { setError('Le titre doit contenir au moins 5 caractères'); return false; }
    if (form.description.length < 10) { setError('La description doit contenir au moins 10 caractères'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.post('/tickets/', form);
      sessionStorage.setItem('ticketSuccess', '✅ Ticket créé avec succès — L\'IA l\'a classifié automatiquement !');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du ticket');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerBadge}>🤖 Classifié automatiquement par IA</div>
        <h2 style={styles.title}>🆕 Nouveau Ticket</h2>

        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Titre */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Titre <span style={{ color: '#ff4d4f' }}>*</span></label>
            <input
              style={styles.input}
              placeholder="Ex : Problème de connexion au portail étudiant"
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(''); }}
              disabled={loading}
              required
            />
            <small style={{ ...styles.hint, color: form.title.length >= 5 ? '#52c41a' : '#888' }}>
              {form.title.length < 5 ? `Minimum 5 caractères (${form.title.length}/5)` : '✓ Titre valide'}
            </small>
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description <span style={{ color: '#ff4d4f' }}>*</span></label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="Décrivez le problème en détail : quand ça a commencé, ce que vous avez déjà essayé..."
              value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setError(''); }}
              disabled={loading}
              required
              rows="5"
            />
            <small style={{ ...styles.hint, color: form.description.length >= 10 ? '#52c41a' : '#888' }}>
              {form.description.length < 10 ? `Minimum 10 caractères (${form.description.length}/10)` : '✓ Description valide'}
            </small>
          </div>

          {/* Catégorie */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Catégorie <span style={{ color: '#888', fontSize: 13, fontWeight: 400 }}>(optionnel — sinon l'IA classe automatiquement)</span></label>
            <select
              style={styles.input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={loading}
            >
              <option value="">🤖 Classification automatique par IA</option>
              <option value="Compte bloqué">🔒 Compte bloqué</option>
              <option value="Salle / Équipement">🏫 Salle / Équipement</option>
              <option value="Matériel informatique">💻 Matériel informatique</option>
              <option value="Télécommandes de climatiseur">❄️ Télécommandes de climatiseur</option>
              <option value="Réseau / Connexion">📶 Réseau / Connexion</option>
              <option value="Logiciel / Application">📱 Logiciel / Application</option>
              <option value="Autre">📁 Autre</option>
            </select>
          </div>

          {/* Info IA */}
          <div style={styles.aiInfo}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <strong style={{ color: '#722ed1', fontSize: 13 }}>Analyse IA automatique</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>L'IA analysera le titre et la description pour déterminer la catégorie et le niveau de priorité (Critique / Élevé / Moyen / Faible).</p>
            </div>
          </div>

          <button
            type="submit"
            style={{ ...styles.submitBtn, ...(loading && styles.submitBtnDisabled) }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={styles.spinner}></span>
                🤖 L'IA analyse votre ticket...
              </span>
            ) : (
              'Soumettre le ticket'
            )}
          </button>

          <button type="button" style={styles.cancelBtn} onClick={() => navigate('/')} disabled={loading}>
            ← Retour au tableau de bord
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', background: '#f0f2f5', padding: '40px 20px' },
  card: { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px' },
  headerBadge: { background: '#f9f0ff', border: '1px solid #d3adf7', color: '#722ed1', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 16 },
  title: { textAlign: 'center', marginBottom: '28px', fontSize: '26px', color: '#333', marginTop: 0 },
  errorAlert: { background: '#fff2f0', border: '1px solid #ffccc7', color: '#f5222d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333', fontSize: 14 },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { minHeight: '120px', resize: 'vertical' },
  hint: { display: 'block', marginTop: '5px', fontSize: '12px' },
  aiInfo: { background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 8, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' },
  submitBtn: { width: '100%', padding: '14px', background: '#722ed1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 12 },
  submitBtnDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  cancelBtn: { width: '100%', padding: '12px', background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  spinner: { width: '20px', height: '20px', border: '3px solid #ffffff', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' },
};