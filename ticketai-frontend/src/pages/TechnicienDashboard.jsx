// src/pages/TechnicienDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const G = {
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryLight: '#86efac',
  primarySoft: '#f0fdf4',
  primaryBorder: '#bbf7d0',
  accent: '#15803d',
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  text: '#14532d',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  red: '#ef4444',
  redSoft: '#fef2f2',
  redBorder: '#fecaca',
  yellow: '#f59e0b',
  yellowSoft: '#fffbeb',
  blue: '#3b82f6',
  blueSoft: '#eff6ff',
  cyan: '#0891b2',
};

const PRIORITY_COLORS = {
  Critique: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  Élevé:    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Moyen:    { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Faible:   { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
};
const STATUS_COLORS = {
  Ouvert:     { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'En cours': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Résolu:     { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Fermé:      { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

function Badge({ text, type = 'status' }) {
  if (!text) return null;
  const map = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const c = map[text] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</span>;
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: '20px 22px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: G.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
          <div style={{ color: G.text, fontSize: 32, fontWeight: 800 }}>{value}</div>
          {sub && <div style={{ color: G.textMuted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      </div>
    </div>
  );
}

const s = {
  input: { background: G.white, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 13px', color: G.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  primaryBtn: { background: G.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  secondaryBtn: { background: G.white, color: G.textMuted, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', color: G.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `2px solid ${G.border}`, background: G.bg, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', fontSize: 13, color: G.textMuted, verticalAlign: 'middle', borderBottom: `1px solid ${G.border}` },
  card: { background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterBtn: (active) => ({ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? G.primary : G.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: active ? G.primarySoft : G.white, color: active ? G.primary : G.textMuted }),
  actionBtn: (color) => ({ background: `${color}12`, color, border: `1px solid ${color}30`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }),
  pageTitle: { color: G.text, fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' },
  pageSub: { color: G.textMuted, fontSize: 13, margin: '0 0 22px' },
};

/* ── Vue d'ensemble technicien ── */
function TechOverview({ tickets, user }) {
  const myTickets = tickets.filter(t => t.assigned_to?.email === user?.email);
  const myOpen = myTickets.filter(t => t.status === 'Ouvert').length;
  const myInProg = myTickets.filter(t => t.status === 'En cours').length;
  const myResolved = myTickets.filter(t => t.status === 'Résolu').length;
  const unassigned = tickets.filter(t => !t.assigned_to && !t.is_archived);
  const criticalUnassigned = unassigned.filter(t => t.priority_score === 'Critique');
  const navigate = useNavigate();

  return (
    <div>
      <h2 style={s.pageTitle}>Vue d'ensemble</h2>
      <p style={s.pageSub}>Bonjour {user?.email} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📋" label="Mes tickets" value={myTickets.length} color={G.primary} />
        <StatCard icon="📂" label="Ouverts" value={myOpen} color={G.blue} />
        <StatCard icon="⚙️" label="En cours" value={myInProg} color={G.yellow} />
        <StatCard icon="✅" label="Résolus" value={myResolved} color={G.primary} />
      </div>

      {criticalUnassigned.length > 0 && (
        <div style={{ padding: '14px 18px', background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 12, marginBottom: 20 }}>
          <span style={{ color: G.red, fontWeight: 700, fontSize: 14 }}>
            🚨 {criticalUnassigned.length} ticket(s) critique(s) non assigné(s) — intervention urgente
          </span>
        </div>
      )}

      <div style={s.card}>
        <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Mes tickets récents</p>
        {myTickets.length === 0
          ? <p style={{ textAlign: 'center', color: G.textLight, padding: 30 }}>Aucun ticket assigné</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {myTickets.slice(0, 5).map(t => (
                  <tr key={t.id}>
                    <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                    <td style={{ ...s.td, cursor: 'pointer', color: G.text, fontWeight: 600 }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</td>
                    <td style={s.td}><Badge text={t.status} /></td>
                    <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                    <td style={{ ...s.td, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

/* ── Mes tickets ── */
function MesTickets({ tickets, setTickets, user, flash }) {
  const navigate = useNavigate();
  const myTickets = tickets.filter(t => t.assigned_to?.email === user?.email && !t.is_archived);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? myTickets : myTickets.filter(t => t.status === filter);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}/status/`, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      flash('✅ Statut mis à jour');
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || 'Erreur')); }
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Mes Tickets</h2>
      <p style={s.pageSub}>{myTickets.length} ticket(s) qui vous sont assignés</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'Ouvert', 'En cours', 'Résolu'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={s.filterBtn(filter === f)}>
            {f === 'all' ? 'Tous' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ ...s.card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: G.textMuted }}>Aucun ticket dans cette catégorie</p>
          </div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {filtered.map(t => {
              const pc = PRIORITY_COLORS[t.priority_score] || PRIORITY_COLORS.Faible;
              return (
                <div key={t.id} style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${pc.text}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: G.primary, fontWeight: 700, fontSize: 12 }}>#{t.id}</span>
                    <Badge text={t.priority_score} type="priority" />
                  </div>
                  <h4 style={{ color: G.text, margin: '0 0 8px', fontSize: 14, fontWeight: 700, cursor: 'pointer', lineHeight: 1.4 }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</h4>
                  {t.description && <p style={{ color: G.textMuted, fontSize: 12, margin: '0 0 12px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <Badge text={t.status} />
                    <select
                      value={t.status}
                      onChange={e => updateStatus(t.id, e.target.value)}
                      style={{ ...s.input, width: 'auto', padding: '5px 10px', fontSize: 12, borderColor: G.primaryBorder, color: G.primary, fontWeight: 600 }}
                    >
                      {['Ouvert', 'En cours', 'Résolu', 'Fermé'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ color: G.textLight, fontSize: 11, marginTop: 10 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ── Tous les tickets ── */
function TousTickets({ tickets, setTickets, user, flash }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priFilter, setPriFilter] = useState('all');

  const active = tickets.filter(t => !t.is_archived);
  const filtered = active.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priFilter !== 'all' && t.priority_score !== priFilter) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleTake = async (t) => {
    try {
      // Backend attend: { assigned_to: <int id> }
      // user.id vient du JWT via AuthContext
      if (!user?.id) return flash("❌ ID utilisateur introuvable, reconnectez-vous");
      const payload = { assigned_to: user.id };
      await api.patch(`/tickets/${t.id}/assign/`, payload);
      setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, assigned_to: { email: user.email }, status: 'En cours' } : tk));
      flash('✅ Ticket pris en charge');
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || 'Erreur')); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}/status/`, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      flash('✅ Statut mis à jour');
    } catch (e) { flash('❌ ' + e.message); }
  };

  const unassigned = filtered.filter(t => !t.assigned_to);

  return (
    <div>
      <h2 style={s.pageTitle}>Tous les Tickets</h2>
      <p style={s.pageSub}>{filtered.length} ticket(s) · {unassigned.length} non assigné(s)</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ ...s.input, width: 220 }} />
        {['all', 'Ouvert', 'En cours', 'Résolu'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={s.filterBtn(statusFilter === f)}>{f === 'all' ? 'Tous statuts' : f}</button>
        ))}
        {['all', 'Critique', 'Élevé', 'Moyen', 'Faible'].map(p => (
          <button key={p} onClick={() => setPriFilter(p)} style={{ ...s.filterBtn(priFilter === p), borderColor: priFilter === p ? (PRIORITY_COLORS[p]?.text || G.primary) : G.border, color: priFilter === p ? (PRIORITY_COLORS[p]?.text || G.primary) : G.textMuted, background: priFilter === p ? (PRIORITY_COLORS[p]?.bg || G.primarySoft) : G.white }}>
            {p === 'all' ? 'Toutes priorités' : p}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Assigné', 'Créé le', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(t => {
                const isMyTicket = t.assigned_to?.email === user?.email;
                const canEdit = isMyTicket || !t.assigned_to;
                return (
                  <tr key={t.id}>
                    <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                    <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: G.text, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</span>
                    </td>
                    <td style={s.td}><Badge text={t.status} /></td>
                    <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                    <td style={{ ...s.td, fontSize: 12 }}>
                      {t.assigned_to
                        ? <span style={{ color: isMyTicket ? G.primary : G.textMuted }}>
                            {isMyTicket ? '✓ Moi' : t.assigned_to.email}
                          </span>
                        : <span style={{ color: G.red }}>✗ Non assigné</span>}
                    </td>
                    <td style={{ ...s.td, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {!t.assigned_to && (
                          <button onClick={() => handleTake(t)} style={{ ...s.actionBtn(G.primary), background: G.primarySoft, border: `1px solid ${G.primaryBorder}` }}>
                            ✋ Prendre
                          </button>
                        )}
                        {canEdit && (
                          <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                            style={{ ...s.input, width: 'auto', padding: '5px 8px', fontSize: 11, borderColor: G.border }}>
                            {['Ouvert', 'En cours', 'Résolu', 'Fermé'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        )}
                        <button onClick={() => navigate(`/tickets/${t.id}`)} style={s.actionBtn(G.textMuted)}>👁</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun ticket</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, onClose }) {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: ok ? G.primarySoft : G.redSoft, border: `1px solid ${ok ? G.primaryBorder : G.redBorder}`, color: ok ? G.primary : G.red, borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 360 }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
    </div>
  );
}

/* ── MAIN ── */
export default function TechnicienDashboard() {
  const [active, setActive] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const flash = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); };

  useEffect(() => {
    api.get('/tickets/')
      .then(res => setTickets(res.data.results || res.data || []))
      .catch(e => flash('❌ ' + (e.response?.data?.detail || e.message)))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refresh: localStorage.getItem('refresh_token') }); } catch {}
    logout(); navigate('/login');
  };

  const myCount = tickets.filter(t => t.assigned_to?.email === user?.email).length;
  const myOpen = tickets.filter(t => t.assigned_to?.email === user?.email && t.status === 'Ouvert').length;

  const navItems = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'mes-tickets', label: 'Mes Tickets', badge: myOpen || null },
    { id: 'tous-tickets', label: 'Tous les Tickets' },
  ];

  const renderView = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${G.primaryBorder}`, borderTop: `3px solid ${G.primary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: G.textMuted, fontSize: 14 }}>Chargement...</p>
      </div>
    );
    switch (active) {
      case 'overview': return <TechOverview tickets={tickets} user={user} />;
      case 'mes-tickets': return <MesTickets tickets={tickets} setTickets={setTickets} user={user} flash={flash} />;
      case 'tous-tickets': return <TousTickets tickets={tickets} setTickets={setTickets} user={user} flash={flash} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />

      {/* Navbar */}
      <nav style={{ background: G.accent, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🎫</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Ticket<span style={{ color: G.primaryLight }}>AI</span></span>
            <span style={{ background: G.cyan, color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, marginLeft: 4 }}>TECH</span>
          </div>
          <div style={{ display: 'flex', gap: 2, marginLeft: 12 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)} style={{ background: active === item.id ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', color: active === item.id ? '#fff' : 'rgba(255,255,255,0.65)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.label}
                {item.badge > 0 && <span style={{ background: G.red, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: G.primarySoft, border: `1px solid ${G.primaryBorder}`, borderRadius: 8, padding: '4px 12px' }}>
            <span style={{ color: G.primary, fontSize: 12, fontWeight: 700 }}>📋 {myCount} tickets assignés</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: G.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {user?.email?.[0]?.toUpperCase() || 'T'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{user?.email}</div>
              <div style={{ color: G.primaryLight, fontSize: 11 }}>Technicien</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: G.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
        {renderView()}
      </main>
    </div>
  );
}