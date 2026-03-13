// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/* ── Couleurs EMSI ── */
const G = {
  primary: '#16a34a',      // vert EMSI
  primaryDark: '#15803d',
  primaryLight: '#86efac',
  primarySoft: '#f0fdf4',
  primaryBorder: '#bbf7d0',
  accent: '#15803d',       // vert navbar
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
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
  purple: '#8b5cf6',
  purpleSoft: '#f5f3ff',
};

const PRIORITY_COLORS = {
  Critique: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  Élevé:    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Moyen:    { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Faible:   { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
};
const STATUS_COLORS = {
  Ouvert:    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'En cours':{ bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Résolu:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Fermé:     { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

/* ── Shared UI ── */
function Badge({ text, type = 'status' }) {
  if (!text) return null;
  const map = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const c = map[text] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: '20px 22px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: G.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
          <div style={{ color: G.text, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ color: G.textMuted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      </div>
    </div>
  );
}

function BarChart({ data, colorFn, title }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {title && <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>{title}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: G.textMuted, fontSize: 12, minWidth: 110, textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
            <div style={{ flex: 1, height: 20, background: G.border, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: colorFn ? colorFn(d.label) : G.primary, borderRadius: 10, transition: 'width 0.6s ease', minWidth: d.value > 0 ? 4 : 0 }} />
            </div>
            <span style={{ color: G.text, fontWeight: 700, fontSize: 13, minWidth: 24 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, total, label }) {
  let offset = 0;
  const r = 38, cx = 46, cy = 46, stroke = 10, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={92} height={92} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={G.border} strokeWidth={stroke} />
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const dash = (seg.value / (total || 1)) * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />;
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={G.text} fontSize={15} fontWeight={800}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={G.textMuted} fontSize={9}>{label}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: G.textMuted, fontSize: 12 }}>{seg.label}</span>
            <span style={{ color: G.text, fontWeight: 700, fontSize: 12, marginLeft: 'auto', paddingLeft: 10 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: G.white, borderRadius: 16, padding: 28, width: 460, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: G.text, margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: G.border, border: 'none', color: G.textMuted, width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

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

const s = {
  input: { background: G.white, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 13px', color: G.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  label: { display: 'block', color: G.textMuted, fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' },
  primaryBtn: { background: G.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  secondaryBtn: { background: G.white, color: G.textMuted, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', color: G.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `2px solid ${G.border}`, background: G.bg, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', fontSize: 13, color: G.textMuted, verticalAlign: 'middle', borderBottom: `1px solid ${G.border}` },
  card: { background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterBtn: (active) => ({ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? G.primary : G.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: active ? G.primarySoft : G.white, color: active ? G.primary : G.textMuted, transition: 'all 0.15s' }),
  actionBtn: (color, bg) => ({ background: bg || `${color}12`, color, border: `1px solid ${color}30`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }),
  pageTitle: { color: G.text, fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' },
  pageSub: { color: G.textMuted, fontSize: 13, margin: '0 0 22px' },
};

/* ══════════════════════════════════════════
   OVERVIEW
══════════════════════════════════════════ */
function OverviewView({ tickets, users }) {
  const open = tickets.filter(t => t.status === 'Ouvert').length;
  const inProg = tickets.filter(t => t.status === 'En cours').length;
  const resolved = tickets.filter(t => t.status === 'Résolu').length;
  const closed = tickets.filter(t => t.status === 'Fermé').length;
  const critical = tickets.filter(t => t.priority_score === 'Critique' && !t.is_archived).length;
  const archived = tickets.filter(t => t.is_archived).length;
  const emsiCount = users.filter(u => u.email?.endsWith('@emsi-edu.ma')).length;

  const byCategory = tickets.reduce((acc, t) => { if (t.category) acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {});
  const byPriority = ['Critique', 'Élevé', 'Moyen', 'Faible'].map(p => ({ label: p, value: tickets.filter(t => t.priority_score === p).length }));
  const priorityBarColor = (l) => PRIORITY_COLORS[l]?.text || G.primary;

  const statusSegs = [
    { label: 'Ouvert', value: open, color: G.blue },
    { label: 'En cours', value: inProg, color: G.yellow },
    { label: 'Résolu', value: resolved, color: G.primary },
    { label: 'Fermé', value: closed, color: G.textLight },
  ];
  const total = tickets.filter(t => !t.is_archived).length;
  const assigned = tickets.filter(t => t.assigned_to).length;
  const unassigned = tickets.filter(t => !t.assigned_to && !t.is_archived).length;

  return (
    <div>
      <h2 style={s.pageTitle}>Vue d'ensemble</h2>
      <p style={s.pageSub}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📂" label="Tickets ouverts" value={open} color={G.blue} sub="En attente" />
        <StatCard icon="⚙️" label="En cours" value={inProg} color={G.yellow} sub="En traitement" />
        <StatCard icon="✅" label="Résolus" value={resolved} color={G.primary} sub="Terminés" />
        <StatCard icon="🚨" label="Critiques" value={critical} color={G.red} sub="Urgents" />
        <StatCard icon="🗄️" label="Archivés" value={archived} color={G.purple} sub="Fermés" />
        <StatCard icon="👥" label="Utilisateurs" value={users.length} color={G.primary} sub={`${emsiCount} EMSI`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Répartition par statut</p>
          <DonutChart segments={statusSegs} total={total} label="actifs" />
        </div>
        <div style={s.card}>
          <BarChart title="Par priorité" data={byPriority} colorFn={priorityBarColor} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <BarChart title="Par catégorie" data={Object.entries(byCategory).map(([label, value]) => ({ label, value }))} colorFn={() => G.primary} />
          {!Object.keys(byCategory).length && <p style={{ color: G.textLight, textAlign: 'center', fontSize: 13, marginTop: 12 }}>Aucune donnée</p>}
        </div>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Assignation</p>
          <DonutChart segments={[
            { label: 'Assignés', value: assigned, color: G.primary },
            { label: 'Non assignés', value: unassigned, color: G.red },
            { label: 'Archivés', value: archived, color: G.textLight },
          ]} total={tickets.length} label="total" />
          {critical > 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 10 }}>
              <span style={{ color: G.red, fontSize: 12, fontWeight: 700 }}>🚨 {critical} ticket(s) critique(s) non assigné(s)</span>
            </div>
          )}
        </div>
      </div>

      <div style={s.card}>
        <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Tickets récents</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Assigné', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {tickets.slice(0, 6).map(t => (
              <tr key={t.id}>
                <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                <td style={{ ...s.td, color: G.text, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                <td style={s.td}><Badge text={t.status} type="status" /></td>
                <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                <td style={{ ...s.td, fontSize: 12 }}>{t.assigned_to ? <span style={{ color: G.primary }}>✓ {t.assigned_to.email}</span> : <span style={{ color: G.red }}>✗ Non assigné</span>}</td>
                <td style={{ ...s.td, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tickets.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 30 }}>Aucun ticket</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TICKETS
══════════════════════════════════════════ */
function TicketsView({ tickets, setTickets, users, flash }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');

  const filtered = tickets.filter(t => {
    if (!showArchived && t.is_archived) return false;
    if (showArchived && !t.is_archived) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleArchive = async (id) => {
    if (!window.confirm('Archiver ce ticket ?')) return;
    try {
      await api.post(`/tickets/${id}/archive/`);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, is_archived: true } : t));
      flash('✅ Ticket archivé');
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || e.message)); }
  };

  const handleStatusSave = async () => {
    try {
      await api.patch(`/tickets/${editTicket.id}/status/`, { status: editTicket.status });
      setTickets(prev => prev.map(t => t.id === editTicket.id ? { ...t, status: editTicket.status } : t));
      setEditTicket(null); flash('✅ Statut mis à jour');
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || 'Erreur')); }
  };

  const handleAssign = async () => {
    if (!assignEmail) return flash('❌ Sélectionne un technicien');
    const tech = users.find(u => u.email === assignEmail);
    try {
      const payload = tech?.id ? { assigned_to: tech.id } : (() => { throw new Error("ID technicien introuvable — utilisateur non trouvé dans la liste"); })();
      await api.patch(`/tickets/${assignTicket.id}/assign/`, payload);
      setTickets(prev => prev.map(t => t.id === assignTicket.id ? { ...t, assigned_to: { id: tech?.id, email: assignEmail } } : t));
      setAssignTicket(null); setAssignEmail('');
      flash('✅ Assigné à ' + assignEmail);
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || JSON.stringify(e.response?.data))); }
  };

  const techs = users.filter(u => u.role === 'Technicien' || u.role === 'Admin');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Tickets</h2>
        <button style={s.primaryBtn} onClick={() => navigate('/create')}>+ Nouveau ticket</button>
      </div>
      <p style={s.pageSub}>{filtered.length} ticket(s) affiché(s)</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ ...s.input, width: 220 }} />
        {['all', 'Ouvert', 'En cours', 'Résolu', 'Fermé'].map(st => (
          <button key={st} onClick={() => setStatusFilter(st)} style={s.filterBtn(statusFilter === st)}>
            {st === 'all' ? 'Tous' : st}
          </button>
        ))}
        <button onClick={() => setShowArchived(!showArchived)} style={{ ...s.filterBtn(showArchived), borderColor: showArchived ? G.purple : G.border, color: showArchived ? G.purple : G.textMuted, background: showArchived ? G.purpleSoft : G.white }}>
          🗄 Archivés
        </button>
      </div>

      <div style={s.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné', 'Créé par', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ opacity: t.is_archived ? 0.6 : 1 }}>
                  <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                  <td style={{ ...s.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: G.text, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</span>
                  </td>
                  <td style={s.td}><Badge text={t.status} type="status" /></td>
                  <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.category || '—'}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>
                    {t.assigned_to ? <span style={{ color: G.primary }}>✓ {t.assigned_to.email}</span> : <span style={{ color: G.red }}>✗ Non assigné</span>}
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.created_by?.email || '—'}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {!t.is_archived && <button onClick={() => setEditTicket({ ...t })} style={s.actionBtn(G.blue)}>✏ Statut</button>}
                      {!t.is_archived && <button onClick={() => { setAssignTicket(t); setAssignEmail(t.assigned_to?.email || ''); }} style={s.actionBtn(G.primary)}>👤 Assigner</button>}
                      {!t.is_archived && <button onClick={() => handleArchive(t.id)} style={s.actionBtn(G.purple)}>🗄</button>}
                      <button onClick={() => navigate(`/tickets/${t.id}`)} style={s.actionBtn(G.textMuted)}>👁</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun ticket</p>}
        </div>
      </div>

      {editTicket && (
        <Modal title={`Modifier statut — #${editTicket.id}`} onClose={() => setEditTicket(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Statut</label>
            <select style={s.input} value={editTicket.status} onChange={e => setEditTicket({ ...editTicket, status: e.target.value })}>
              {['Ouvert', 'En cours', 'Résolu', 'Fermé'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.primaryBtn} onClick={handleStatusSave}>Sauvegarder</button>
            <button style={s.secondaryBtn} onClick={() => setEditTicket(null)}>Annuler</button>
          </div>
        </Modal>
      )}

      {assignTicket && (
        <Modal title={`Assigner — #${assignTicket.id}`} onClose={() => setAssignTicket(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Technicien</label>
            {techs.length > 0
              ? <select style={s.input} value={assignEmail} onChange={e => setAssignEmail(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {techs.map(u => <option key={u.id} value={u.email}>{u.email} ({u.role})</option>)}
                </select>
              : <input style={s.input} placeholder="email@emsi-edu.ma" value={assignEmail} onChange={e => setAssignEmail(e.target.value)} />}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.primaryBtn} onClick={handleAssign}>Assigner</button>
            <button style={s.secondaryBtn} onClick={() => setAssignTicket(null)}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   UTILISATEURS
══════════════════════════════════════════ */
function UsersView({ users, setUsers, flash }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/auth/register', form);
      setUsers(prev => [...prev, res.data.user || { ...form, id: Date.now() }]);
      setShowCreate(false);
      flash('✅ Utilisateur créé');
    } catch (e) { flash('❌ ' + (e.response?.data?.message || JSON.stringify(e.response?.data))); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    try { await api.delete(`/auth/users/${u.id}/`).catch(() => {}); } catch {}
    setUsers(prev => prev.filter(x => x.id !== u.id));
    flash('✅ Supprimé');
  };

  const admins = users.filter(u => u.role === 'Admin').length;
  const techs = users.filter(u => u.role === 'Technicien').length;
  const emsi = users.filter(u => u.email?.endsWith('@emsi-edu.ma')).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Utilisateurs</h2>
        <button style={s.primaryBtn} onClick={() => setShowCreate(true)}>+ Nouvel utilisateur</button>
      </div>
      <p style={s.pageSub}>Gestion des comptes</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: users.length, color: G.blue },
          { label: 'Admins', value: admins, color: G.red },
          { label: 'Techniciens', value: techs, color: G.primary },
          { label: 'EMSI', value: emsi, color: G.primary },
        ].map(st => (
          <div key={st.label} style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${st.color}` }}>
            <div style={{ color: st.color, fontSize: 24, fontWeight: 900 }}>{st.value}</div>
            <div style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Email..." style={{ ...s.input, width: 240 }} />
        {['all', 'Admin', 'Technicien', 'Utilisateur'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} style={s.filterBtn(roleFilter === r)}>
            {r === 'all' ? 'Tous' : r}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Email', 'Rôle', 'EMSI', 'Créé le', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((u, i) => {
              const isEmsi = u.email?.endsWith('@emsi-edu.ma');
              return (
                <tr key={u.id || i}>
                  <td style={s.td}><span style={{ color: G.purple, fontWeight: 700 }}>#{u.id}</span></td>
                  <td style={{ ...s.td, color: G.text, fontWeight: 500 }}>{u.email}</td>
                  <td style={s.td}><Badge text={u.role || 'Utilisateur'} type="status" /></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isEmsi ? G.primary : G.red }} />
                      <span style={{ color: isEmsi ? G.primary : G.red, fontSize: 12, fontWeight: 600 }}>{isEmsi ? 'EMSI ✓' : 'Externe'}</span>
                    </div>
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => setEditUser({ ...u })} style={s.actionBtn(G.blue)}>✏ Rôle</button>
                      <button onClick={() => handleDelete(u)} style={s.actionBtn(G.red)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun utilisateur</p>}
      </div>

      {showCreate && (
        <Modal title="Créer un utilisateur" onClose={() => setShowCreate(false)}>
          <CreateUserForm onCreate={handleCreate} onClose={() => setShowCreate(false)} />
        </Modal>
      )}

      {editUser && (
        <Modal title={`Modifier rôle — ${editUser.email}`} onClose={() => setEditUser(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Rôle</label>
            <select style={s.input} value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              {['Utilisateur', 'Technicien', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.primaryBtn} onClick={async () => {
              try { await api.patch(`/auth/users/${editUser.id}/`, { role: editUser.role }).catch(() => {}); } catch {}
              setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: editUser.role } : u));
              setEditUser(null); flash('✅ Rôle mis à jour');
            }}>Sauvegarder</button>
            <button style={s.secondaryBtn} onClick={() => setEditUser(null)}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateUserForm({ onCreate, onClose }) {
  const [form, setForm] = useState({ email: '', password: '', password_confirm: '', role: 'Utilisateur' });
  const [err, setErr] = useState('');
  const isEmsi = form.email.endsWith('@emsi-edu.ma');

  const submit = () => {
    if (!form.email || !form.password) return setErr('Champs requis');
    if (form.password !== form.password_confirm) return setErr('Mots de passe différents');
    if (form.password.length < 8) return setErr('Minimum 8 caractères');
    onCreate(form);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {err && <div style={{ color: G.red, background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>{err}</div>}
      <div>
        <label style={s.label}>Email</label>
        <input style={{ ...s.input, borderColor: form.email.length > 5 ? (isEmsi ? G.primary : G.yellow) : G.border }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@emsi-edu.ma" />
        {form.email.length > 5 && <div style={{ fontSize: 11, marginTop: 4, color: isEmsi ? G.primary : G.yellow }}>{isEmsi ? '✓ Domaine EMSI' : '⚠ Domaine non-EMSI'}</div>}
      </div>
      <div>
        <label style={s.label}>Rôle</label>
        <select style={s.input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          {['Utilisateur', 'Technicien', 'Admin'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div><label style={s.label}>Mot de passe</label><input style={s.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
      <div><label style={s.label}>Confirmer</label><input style={s.input} type="password" value={form.password_confirm} onChange={e => setForm({ ...form, password_confirm: e.target.value })} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={s.primaryBtn} onClick={submit}>Créer</button>
        <button style={s.secondaryBtn} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EMAILS EMSI
══════════════════════════════════════════ */
function EmailVerifyView({ users }) {
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');
  const [result, setResult] = useState(null);
  const [bulkRes, setBulkRes] = useState([]);

  const check = (email) => {
    const e = email.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === e);
    return { email: e, isEmsi: e.endsWith('@emsi-edu.ma'), exists: !!user, user };
  };

  const nonEmsi = users.filter(u => !u.email?.endsWith('@emsi-edu.ma'));
  const emsiCount = users.filter(u => u.email?.endsWith('@emsi-edu.ma')).length;
  const domainMap = {};
  users.forEach(u => { const d = u.email?.split('@')[1] || '?'; domainMap[d] = (domainMap[d] || 0) + 1; });

  return (
    <div>
      <h2 style={s.pageTitle}>Vérification Emails EMSI</h2>
      <p style={s.pageSub}>Contrôle du domaine @emsi-edu.ma</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ ...s.card, borderLeft: `4px solid ${G.primary}` }}><div style={{ color: G.primary, fontSize: 28, fontWeight: 900 }}>{emsiCount}</div><div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>Emails EMSI @emsi-edu.ma</div></div>
        <div style={{ ...s.card, borderLeft: `4px solid ${G.red}` }}><div style={{ color: G.red, fontSize: 28, fontWeight: 900 }}>{nonEmsi.length}</div><div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>Externes (hors EMSI)</div></div>
        <div style={{ ...s.card, borderLeft: `4px solid ${G.blue}` }}><div style={{ color: G.blue, fontSize: 28, fontWeight: 900 }}>{users.length}</div><div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>Total utilisateurs</div></div>
      </div>

      <div style={{ ...s.card, marginBottom: 16 }}>
        <BarChart title="Répartition par domaine" data={Object.entries(domainMap).map(([label, value]) => ({ label, value }))} colorFn={l => l === 'emsi-edu.ma' ? G.primary : G.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Vérifier un email</p>
          <input style={{ ...s.input, marginBottom: 10, borderColor: single.length > 4 ? (single.endsWith('@emsi-edu.ma') ? G.primary : G.yellow) : G.border }} placeholder="email@emsi-edu.ma" value={single} onChange={e => setSingle(e.target.value)} onKeyDown={e => e.key === 'Enter' && single.trim() && setResult(check(single))} />
          <button style={s.primaryBtn} onClick={() => single.trim() && setResult(check(single))}>Vérifier →</button>
          {result && (
            <div style={{ marginTop: 14, padding: 16, background: result.isEmsi ? G.primarySoft : G.redSoft, border: `1px solid ${result.isEmsi ? G.primaryBorder : G.redBorder}`, borderRadius: 12 }}>
              <div style={{ color: result.isEmsi ? G.primary : G.red, fontWeight: 800, marginBottom: 10 }}>{result.isEmsi ? '✅ Email EMSI valide' : '❌ Email hors domaine'}</div>
              <div style={{ fontSize: 13, color: G.textMuted, lineHeight: 2 }}>
                <div>📧 <strong style={{ color: G.text }}>{result.email}</strong></div>
                <div>🏫 EMSI : <strong style={{ color: result.isEmsi ? G.primary : G.red }}>{result.isEmsi ? 'Oui ✓' : 'Non ✗'}</strong></div>
                <div>💾 Inscrit : <strong>{result.exists ? 'Oui' : 'Non'}</strong></div>
                {result.user && <div>👤 Rôle : <Badge text={result.user.role} /></div>}
              </div>
            </div>
          )}
        </div>

        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Vérification en masse</p>
          <textarea style={{ ...s.input, height: 100, resize: 'vertical', marginBottom: 10 }} placeholder={'email1@emsi-edu.ma\nemail2@gmail.com'} value={bulk} onChange={e => setBulk(e.target.value)} />
          <button style={s.primaryBtn} onClick={() => setBulkRes(bulk.split('\n').map(e => e.trim()).filter(Boolean).map(check))}>Analyser →</button>
          {bulkRes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{ color: G.primary, fontSize: 12, fontWeight: 700 }}>✓ {bulkRes.filter(r => r.isEmsi).length} EMSI</span>
                <span style={{ color: G.red, fontSize: 12, fontWeight: 700 }}>✗ {bulkRes.filter(r => !r.isEmsi).length} externes</span>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {bulkRes.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${G.border}`, fontSize: 12 }}>
                    <span style={{ color: G.text }}>{r.email}</span>
                    <span style={{ color: r.isEmsi ? G.primary : G.red, fontWeight: 700 }}>{r.isEmsi ? '✓ EMSI' : '✗ Ext.'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {nonEmsi.length > 0 && (
        <div style={{ ...s.card, border: `1px solid ${G.redBorder}`, background: G.redSoft }}>
          <p style={{ color: G.red, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>⚠ Utilisateurs hors domaine EMSI</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Email', 'Domaine', 'Rôle'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {nonEmsi.map((u, i) => (
                <tr key={i}><td style={{ ...s.td, color: G.red }}>{u.email}</td><td style={s.td}>{u.email?.split('@')[1]}</td><td style={s.td}><Badge text={u.role} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ARCHIVES
══════════════════════════════════════════ */
function ArchivesView({ tickets }) {
  const navigate = useNavigate();
  const archived = tickets.filter(t => t.is_archived);
  return (
    <div>
      <h2 style={s.pageTitle}>Archives</h2>
      <p style={s.pageSub}>{archived.length} ticket(s) archivé(s)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total archivés', value: archived.length, color: G.purple },
          { label: 'Résolus', value: archived.filter(t => t.status === 'Résolu').length, color: G.primary },
          { label: 'Critiques', value: archived.filter(t => t.priority_score === 'Critique').length, color: G.red },
        ].map(st => (
          <div key={st.label} style={{ ...s.card, borderLeft: `4px solid ${st.color}` }}>
            <div style={{ color: st.color, fontSize: 26, fontWeight: 900 }}>{st.value}</div>
            <div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>{st.label}</div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        {archived.length === 0 ? <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun ticket archivé</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Créé par'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {archived.map(t => (
                <tr key={t.id} style={{ opacity: 0.75 }}>
                  <td style={s.td}><span style={{ color: G.purple, fontWeight: 700 }}>#{t.id}</span></td>
                  <td style={{ ...s.td, cursor: 'pointer', color: G.text, fontWeight: 600 }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</td>
                  <td style={s.td}><Badge text={t.status} type="status" /></td>
                  <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.created_by?.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   AUDIT LOGS
══════════════════════════════════════════ */
function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/audit/logs/?page=${page}`)
      .then(res => { setLogs(res.data.results || res.data || []); setTotal(res.data.count || 0); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page]);

  const actionColor = (a = '') => {
    if (a.includes('LOGIN')) return G.primary;
    if (a.includes('CREAT')) return G.blue;
    if (a.includes('STATUS') || a.includes('UPDATE')) return G.yellow;
    if (a.includes('ARCHIV')) return G.purple;
    if (a.includes('DELETE')) return G.red;
    return G.textMuted;
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Audit Logs</h2>
      <p style={s.pageSub}>{total} entrées — GET /api/audit/logs/</p>
      <div style={s.card}>
        {loading ? <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Chargement...</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Action', 'Utilisateur', 'IP', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i}>
                    <td style={s.td}>{log.id}</td>
                    <td style={s.td}><code style={{ color: actionColor(log.action), background: `${actionColor(log.action)}15`, padding: '3px 9px', borderRadius: 6, fontSize: 12 }}>{log.action}</code></td>
                    <td style={{ ...s.td, fontSize: 12 }}>{log.user_email || log.user?.email || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logs.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun log</p>}
            {total > 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button style={s.secondaryBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Préc.</button>
                <span style={{ color: G.textMuted, fontSize: 13, lineHeight: '38px' }}>Page {page}</span>
                <button style={s.secondaryBtn} onClick={() => setPage(p => p + 1)} disabled={logs.length < 10}>Suiv. →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NAVBAR ADMIN (même style que l'app)
══════════════════════════════════════════ */
function AdminNavbar({ active, setActive, openCount, archivedCount, criticalCount, user, onLogout }) {
  const navItems = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'tickets', label: 'Tickets', badge: openCount || null },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'email-verify', label: 'Emails EMSI' },
    { id: 'archives', label: 'Archives', badge: archivedCount || null },
    { id: 'audit', label: 'Audit Logs' },
  ];

  return (
    <nav style={{ background: G.accent, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🎫</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>
            Ticket<span style={{ color: G.primaryLight }}>AI</span>
          </span>
          <span style={{ background: G.primary, color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              background: active === item.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', color: active === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
            }}>
              {item.label}
              {item.badge > 0 && (
                <span style={{ background: G.primary, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {criticalCount > 0 && (
          <div style={{ background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ color: G.red, fontSize: 12, fontWeight: 700 }}>🚨 {criticalCount} critique(s)</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: G.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{user?.email}</div>
            <div style={{ color: G.primaryLight, fontSize: 11 }}>Admin</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: G.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const [active, setActive] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const flash = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); };

  useEffect(() => {
    api.get('/tickets/').then(res => {
      const list = res.data.results || res.data || [];
      setTickets(list);
      const map = {};
      list.forEach(t => {
        if (t.created_by?.id) map[t.created_by.id] = t.created_by;
        if (t.assigned_to?.id) map[t.assigned_to.id] = t.assigned_to;
      });
      setUsers(Object.values(map));
    }).catch(e => flash('❌ ' + (e.response?.data?.detail || e.message)))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refresh: localStorage.getItem('refresh_token') }); } catch {}
    logout(); navigate('/login');
  };

  const openCount = tickets.filter(t => t.status === 'Ouvert' && !t.is_archived).length;
  const archivedCount = tickets.filter(t => t.is_archived).length;
  const criticalCount = tickets.filter(t => t.priority_score === 'Critique' && !t.assigned_to && !t.is_archived).length;

  const renderView = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${G.primaryBorder}`, borderTop: `3px solid ${G.primary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: G.textMuted, fontSize: 14 }}>Chargement...</p>
      </div>
    );
    switch (active) {
      case 'overview': return <OverviewView tickets={tickets} users={users} />;
      case 'tickets': return <TicketsView tickets={tickets} setTickets={setTickets} users={users} flash={flash} />;
      case 'users': return <UsersView users={users} setUsers={setUsers} flash={flash} />;
      case 'email-verify': return <EmailVerifyView users={users} />;
      case 'archives': return <ArchivesView tickets={tickets} />;
      case 'audit': return <AuditView />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />
      <AdminNavbar active={active} setActive={setActive} openCount={openCount} archivedCount={archivedCount} criticalCount={criticalCount} user={user} onLogout={handleLogout} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
        {renderView()}
      </main>
    </div>
  );
}