// src/pages/AdminDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const G = {
  primary: '#16a34a', primaryDark: '#15803d', primaryLight: '#86efac',
  primarySoft: '#f0fdf4', primaryBorder: '#bbf7d0', accent: '#15803d',
  bg: '#f8fafc', white: '#ffffff', border: '#e2e8f0', borderDark: '#cbd5e1',
  text: '#14532d', textMuted: '#64748b', textLight: '#94a3b8',
  red: '#ef4444', redSoft: '#fef2f2', redBorder: '#fecaca',
  yellow: '#f59e0b', yellowSoft: '#fffbeb',
  blue: '#3b82f6', blueSoft: '#eff6ff',
  purple: '#8b5cf6', purpleSoft: '#f5f3ff',
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
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />;
          offset += dash; return el;
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
function WeeklyBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingBottom: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ color: G.text, fontSize: 10, fontWeight: 700 }}>{d.value > 0 ? d.value : ''}</span>
          <div style={{ width: '100%', background: G.border, borderRadius: '4px 4px 0 0', height: 70, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 4 : 0,
              background: i === data.length - 1 ? G.primary : `${G.primary}80`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.6s ease'
            }} />
          </div>
          <span style={{ color: G.textMuted, fontSize: 9, textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
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

// ── Pagination component ──
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
      <button onClick={() => onPage(1)} disabled={page === 1} style={pagBtn(page === 1)}>«</button>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} style={pagBtn(page === 1)}>‹</button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        return p <= totalPages ? (
          <button key={p} onClick={() => onPage(p)} style={{ ...pagBtn(false), background: p === page ? G.primary : G.white, color: p === page ? '#fff' : G.textMuted, borderColor: p === page ? G.primary : G.border }}>
            {p}
          </button>
        ) : null;
      })}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} style={pagBtn(page === totalPages)}>›</button>
      <button onClick={() => onPage(totalPages)} disabled={page === totalPages} style={pagBtn(page === totalPages)}>»</button>
      <span style={{ color: G.textMuted, fontSize: 12, marginLeft: 8 }}>Page {page}/{totalPages}</span>
    </div>
  );
}
const pagBtn = (disabled) => ({ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${G.border}`, background: G.white, color: disabled ? G.textLight : G.textMuted, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, opacity: disabled ? 0.5 : 1 });

// ── Export helpers ──
function exportCSV(data, filename, headers) {
  const rows = [headers, ...data];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printTable(title, headers, rows) {
  const html = `<html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
    h2{color:#15803d;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th{background:#15803d;color:white;padding:8px 10px;text-align:left;font-size:11px}
    td{padding:7px 10px;border-bottom:1px solid #e2e8f0;color:#374151}
    tr:nth-child(even){background:#f8fafc}
    .footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center}
  </style></head><body>
    <h2>${title}</h2>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="footer">TicketAI — Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
  </body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close(); w.print();
}

const PAGE_SIZE = 10;

const s = {
  input: { background: G.white, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 13px', color: G.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  label: { display: 'block', color: G.textMuted, fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' },
  primaryBtn: { background: G.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  secondaryBtn: { background: G.white, color: G.textMuted, border: `1.5px solid ${G.border}`, borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13 },
  exportBtn: { background: G.white, color: G.blue, border: `1.5px solid ${G.blue}30`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  printBtn: { background: G.white, color: G.purple, border: `1.5px solid ${G.purple}30`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  th: { textAlign: 'left', padding: '10px 14px', color: G.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `2px solid ${G.border}`, background: G.bg, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', fontSize: 13, color: G.textMuted, verticalAlign: 'middle', borderBottom: `1px solid ${G.border}` },
  card: { background: G.white, border: `1px solid ${G.border}`, borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterBtn: (active) => ({ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? G.primary : G.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: active ? G.primarySoft : G.white, color: active ? G.primary : G.textMuted, transition: 'all 0.15s' }),
  actionBtn: (color, bg) => ({ background: bg || `${color}12`, color, border: `1px solid ${color}30`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }),
  pageTitle: { color: G.text, fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' },
  pageSub: { color: G.textMuted, fontSize: 13, margin: '0 0 22px' },
};

function OverviewView({ tickets, users }) {
  const now = new Date();
  const open = tickets.filter(t => t.status === 'Ouvert').length;
  const inProg = tickets.filter(t => t.status === 'En cours').length;
  const resolved = tickets.filter(t => t.status === 'Résolu').length;
  const closed = tickets.filter(t => t.status === 'Fermé').length;
  const critical = tickets.filter(t => t.priority_score === 'Critique' && !t.is_archived).length;
  const archived = tickets.filter(t => t.is_archived).length;
  const emsiCount = users.filter(u => u.email?.endsWith('@emsi-edu.ma')).length;

  // ── Temps moyen de résolution ──
  const resolvedTickets = tickets.filter(t => t.status === 'Résolu' && t.created_at && t.resolved_at);
  const avgResolutionHours = resolvedTickets.length > 0
    ? Math.round(resolvedTickets.reduce((acc, t) => acc + (new Date(t.resolved_at) - new Date(t.created_at)) / 36e5, 0) / resolvedTickets.length)
    : null;
  const avgDisplay = avgResolutionHours === null ? '—' : avgResolutionHours < 24 ? `${avgResolutionHours}h` : `${Math.round(avgResolutionHours / 24)}j`;

  // ── Tickets en retard (+48h ouvert/en cours) ──
  const lateTickets = tickets.filter(t => {
    if (t.is_archived || t.status === 'Résolu' || t.status === 'Fermé') return false;
    const hours = (now - new Date(t.created_at)) / 36e5;
    return hours > 48;
  });

  // ── Top 5 techniciens ──
  const techMap = {};
  tickets.forEach(t => {
    if (t.assigned_to?.email) {
      if (!techMap[t.assigned_to.email]) techMap[t.assigned_to.email] = { total: 0, resolved: 0 };
      techMap[t.assigned_to.email].total++;
      if (t.status === 'Résolu') techMap[t.assigned_to.email].resolved++;
    }
  });
  const top5Techs = Object.entries(techMap)
    .map(([email, data]) => ({ email, ...data }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 5);

  // ── Graphique évolution par semaine (8 dernières semaines) ──
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (7 * (7 - i)));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = tickets.filter(t => {
      const d = new Date(t.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    const label = `S${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    return { label, value: count };
  });

  const byCategory = tickets.reduce((acc, t) => { if (t.category) acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {});
  const byPriority = ['Critique', 'Élevé', 'Moyen', 'Faible'].map(p => ({ label: p, value: tickets.filter(t => t.priority_score === p).length }));
  const total = tickets.filter(t => !t.is_archived).length;
  const assigned = tickets.filter(t => t.assigned_to).length;
  const unassigned = tickets.filter(t => !t.assigned_to && !t.is_archived).length;

  return (
    <div>
      <h2 style={s.pageTitle}>Vue d'ensemble</h2>
      <p style={s.pageSub}>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

      {/* ── Alertes retard ── */}
      {lateTickets.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ea580c', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
              {lateTickets.length} ticket(s) en retard — ouverts depuis plus de 48h
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lateTickets.slice(0, 6).map(t => {
                const hours = Math.round((now - new Date(t.created_at)) / 36e5);
                return (
                  <span key={t.id} style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#92400e' }}>
                    <strong>#{t.id}</strong> · {t.title?.slice(0, 25)}{t.title?.length > 25 ? '…' : ''} · <span style={{ color: '#dc2626', fontWeight: 700 }}>{hours}h</span>
                  </span>
                );
              })}
              {lateTickets.length > 6 && <span style={{ fontSize: 12, color: '#ea580c', padding: '4px 8px' }}>+{lateTickets.length - 6} autres</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📂" label="Tickets ouverts" value={open} color={G.blue} sub="En attente" />
        <StatCard icon="⚙️" label="En cours" value={inProg} color={G.yellow} sub="En traitement" />
        <StatCard icon="✅" label="Résolus" value={resolved} color={G.primary} sub="Terminés" />
        <StatCard icon="🚨" label="Critiques" value={critical} color={G.red} sub="Urgents" />
        <StatCard icon="⏱" label="Temps moyen" value={avgDisplay} color={G.purple} sub="Résolution" />
        <StatCard icon="👥" label="Utilisateurs" value={users.length} color={G.primary} sub={`${emsiCount} EMSI`} />
      </div>

      {/* ── Graphique évolution + Donut statut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
            Évolution des tickets (8 semaines)
          </p>
          <WeeklyBarChart data={weeklyData} />
        </div>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Répartition par statut</p>
          <DonutChart segments={[
            { label: 'Ouvert', value: open, color: G.blue },
            { label: 'En cours', value: inProg, color: G.yellow },
            { label: 'Résolu', value: resolved, color: G.primary },
            { label: 'Fermé', value: closed, color: G.textLight },
          ]} total={total} label="actifs" />
        </div>
      </div>

      {/* ── Par priorité + Top techniciens ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <BarChart title="Par priorité" data={byPriority} colorFn={l => PRIORITY_COLORS[l]?.text || G.primary} />
        </div>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
            🏆 Top 5 techniciens
          </p>
          {top5Techs.length === 0
            ? <p style={{ color: G.textLight, fontSize: 13, textAlign: 'center', padding: 20 }}>Aucun ticket assigné</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {top5Techs.map((tech, i) => {
                  const rate = tech.total > 0 ? Math.round((tech.resolved / tech.total) * 100) : 0;
                  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                  return (
                    <div key={tech.email} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, minWidth: 24 }}>{medals[i]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: G.text, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{tech.email}</span>
                          <span style={{ color: G.textMuted, fontSize: 11, flexShrink: 0 }}>{tech.resolved}/{tech.total} · {rate}%</span>
                        </div>
                        <div style={{ height: 6, background: G.border, borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${rate}%`, background: i === 0 ? '#f59e0b' : G.primary, borderRadius: 10, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>

      {/* ── Par catégorie + Assignation ── */}
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

      {/* ── Tickets récents ── */}
      <div style={s.card}>
        <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Tickets récents</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Assigné', 'Date', 'Retard'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {tickets.slice(0, 6).map(t => {
              const hours = Math.round((now - new Date(t.created_at)) / 36e5);
              const isLate = hours > 48 && t.status !== 'Résolu' && t.status !== 'Fermé' && !t.is_archived;
              return (
                <tr key={t.id} style={{ background: isLate ? '#fff7ed' : 'transparent' }}>
                  <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                  <td style={{ ...s.td, color: G.text, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                  <td style={s.td}><Badge text={t.status} /></td>
                  <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.assigned_to ? <span style={{ color: G.primary }}>✓ {t.assigned_to.email}</span> : <span style={{ color: G.red }}>✗ Non assigné</span>}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>
                    {isLate
                      ? <span style={{ color: '#ea580c', fontWeight: 700, background: '#fff7ed', padding: '2px 8px', borderRadius: 8 }}>⏰ {hours}h</span>
                      : <span style={{ color: G.textLight }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!tickets.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 30 }}>Aucun ticket</p>}
      </div>
    </div>
  );
}
/* ══ TICKETS ══ */
function TicketsView({ tickets, setTickets, users, flash }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = tickets.filter(t => {
    if (!showArchived && t.is_archived) return false;
    if (showArchived && !t.is_archived) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority_score !== priorityFilter) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleArchive = (ticket) => setConfirmArchive(ticket);

  const confirmDoArchive = async () => {
  try {
    await api.post(`/tickets/${confirmArchive.id}/archive/`);
    setTickets(prev => prev.map(t =>
      t.id === confirmArchive.id ? { ...t, is_archived: true } : t
    ));
    flash('✅ Ticket #' + confirmArchive.id + ' archivé avec succès');
  } catch (e) {
    flash('❌ Archivage échoué — ' + (e.response?.data?.detail || e.message));
  } finally {
    setConfirmArchive(null);
  }
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
      if (!tech?.id) throw new Error('ID introuvable');
      await api.patch(`/tickets/${assignTicket.id}/assign/`, { assigned_to: tech.id });
      setTickets(prev => prev.map(t => t.id === assignTicket.id ? { ...t, assigned_to: { id: tech.id, email: assignEmail } } : t));
      setAssignTicket(null); setAssignEmail('');
      flash('✅ Assigné à ' + assignEmail);
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || e.message)); }
  };

  const handleExport = () => exportCSV(
    filtered.map(t => [t.id, t.title, t.status, t.priority_score || '—', t.category || '—', t.assigned_to?.email || '—', t.created_by?.email || '—', new Date(t.created_at).toLocaleDateString('fr-FR')]),
    'tickets_export.csv',
    ['#', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné', 'Créé par', 'Date']
  );

  const handlePrint = () => printTable('Liste des Tickets — TicketAI',
    ['#', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné', 'Date'],
    filtered.map(t => [t.id, t.title, t.status, t.priority_score || '—', t.category || '—', t.assigned_to?.email || '—', new Date(t.created_at).toLocaleDateString('fr-FR')])
  );

  const techs = users.filter(u => u.role === 'Technicien' || u.role === 'Admin');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Tickets</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={handleExport}>⬇ CSV</button>
          <button style={s.printBtn} onClick={handlePrint}>🖨 Imprimer</button>
          <button style={s.primaryBtn} onClick={() => navigate('/create')}>+ Nouveau ticket</button>
        </div>
      </div>
      <p style={s.pageSub}>{filtered.length} ticket(s) · Page {page}/{totalPages || 1}</p>

      {/* ── Filtres statut ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Rechercher..." style={{ ...s.input, width: 220 }} />
        {['all', 'Ouvert', 'En cours', 'Résolu', 'Fermé'].map(st => (
          <button key={st} onClick={() => { setStatusFilter(st); setPage(1); }} style={s.filterBtn(statusFilter === st)}>
            {st === 'all' ? 'Tous' : st}
          </button>
        ))}
        <button onClick={() => { setShowArchived(!showArchived); setPage(1); }}
          style={{ ...s.filterBtn(showArchived), borderColor: showArchived ? G.purple : G.border, color: showArchived ? G.purple : G.textMuted, background: showArchived ? G.purpleSoft : G.white }}>
          🗄 Archivés
        </button>
      </div>

      {/* ── Filtres priorité ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Priorité :</span>
        {['all', 'Critique', 'Élevé', 'Moyen', 'Faible'].map(p => (
          <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
            style={{
              ...s.filterBtn(priorityFilter === p),
              ...(p !== 'all' && priorityFilter === p
                ? { background: PRIORITY_COLORS[p]?.bg, color: PRIORITY_COLORS[p]?.text, borderColor: PRIORITY_COLORS[p]?.border }
                : {}),
              fontSize: 11, padding: '5px 10px'
            }}>
            {p === 'all' ? 'Toutes' : p}
          </button>
        ))}
        {(priorityFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button onClick={() => { setPriorityFilter('all'); setStatusFilter('all'); setSearch(''); setPage(1); }}
            style={{ ...s.secondaryBtn, padding: '5px 12px', fontSize: 11, color: G.red }}>
            ✕ Reset filtres
          </button>
        )}
      </div>

      {/* ── Tableau ── */}
      <div style={s.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné', 'Créé par', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id} style={{ opacity: t.is_archived ? 0.6 : 1 }}>
                  <td style={s.td}><span style={{ color: G.primary, fontWeight: 700 }}>#{t.id}</span></td>
                  <td style={{ ...s.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: G.text, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</span>
                  </td>
                  <td style={s.td}><Badge text={t.status} /></td>
                  <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.category || '—'}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>
                    {t.assigned_to
                      ? <span style={{ color: G.primary }}>✓ {t.assigned_to.email}</span>
                      : <span style={{ color: G.red }}>✗ Non assigné</span>}
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.created_by?.email || '—'}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {!t.is_archived && <button onClick={() => setEditTicket({ ...t })} style={s.actionBtn(G.blue)}>✏</button>}
                      {!t.is_archived && <button onClick={() => { setAssignTicket(t); setAssignEmail(t.assigned_to?.email || ''); }} style={s.actionBtn(G.primary)}>👤</button>}
                      {!t.is_archived && <button onClick={() => handleArchive(t)} style={s.actionBtn(G.purple)}>🗄</button>}
                      <button onClick={() => navigate(`/tickets/${t.id}`)} style={s.actionBtn(G.textMuted)}>👁</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun ticket</p>}
        </div>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {/* ── Modal modifier statut ── */}
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

      {/* ── Modal assigner ── */}
      {assignTicket && (
        <Modal title={`Assigner — #${assignTicket.id}`} onClose={() => setAssignTicket(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Technicien</label>
            {techs.length > 0
              ? <select style={s.input} value={assignEmail} onChange={e => setAssignEmail(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {techs.map(u => <option key={u.id} value={u.email}>{u.email} ({u.role})</option>)}
                </select>
              : <input style={s.input} placeholder="email@emsi-tech.ma" value={assignEmail} onChange={e => setAssignEmail(e.target.value)} />}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.primaryBtn} onClick={handleAssign}>Assigner</button>
            <button style={s.secondaryBtn} onClick={() => setAssignTicket(null)}>Annuler</button>
          </div>
        </Modal>
      )}

      {/* ── Modal confirmation archivage ── */}
      {confirmArchive && (
        <Modal title="Confirmer l'archivage" onClose={() => setConfirmArchive(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗄️</div>
            <p style={{ color: G.text, fontWeight: 600, marginBottom: 6 }}>
              Archiver le ticket <span style={{ color: G.primary }}>#{confirmArchive.id}</span> ?
            </p>
            <p style={{ color: G.textMuted, fontSize: 13, marginBottom: 16 }}>
              "{confirmArchive.title?.slice(0, 50)}{confirmArchive.title?.length > 50 ? '…' : ''}"
            </p>
            <div style={{ background: G.yellowSoft, border: `1px solid ${G.yellow}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e', textAlign: 'left' }}>
              ⚠ Ce ticket sera déplacé dans les archives et ne sera plus visible dans la liste principale.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={{ ...s.primaryBtn, background: G.purple }} onClick={confirmDoArchive}>
                🗄 Confirmer l'archivage
              </button>
              <button style={s.secondaryBtn} onClick={() => setConfirmArchive(null)}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══ UTILISATEURS ══ */
function UsersView({ users, setUsers, flash }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (form) => {
    try { const res = await api.post('/auth/register', form); setUsers(prev => [...prev, res.data.user || { ...form, id: Date.now() }]); setShowCreate(false); flash('✅ Utilisateur créé'); }
    catch (e) { flash('❌ ' + (e.response?.data?.message || JSON.stringify(e.response?.data))); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    try { await api.delete(`/auth/users/${u.id}/`).catch(() => {}); } catch {}
    setUsers(prev => prev.filter(x => x.id !== u.id)); flash('✅ Supprimé');
  };

  const handleExport = () => exportCSV(
    filtered.map(u => [u.id, u.email, u.role, u.email?.endsWith('@emsi-edu.ma') ? 'Étudiant/Prof' : u.email?.endsWith('@emsi-tech.ma') ? 'Technicien' : 'Externe', u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—']),
    'utilisateurs_export.csv',
    ['#', 'Email', 'Rôle', 'Domaine', 'Créé le']
  );

  const handlePrint = () => printTable('Liste des Utilisateurs — TicketAI',
    ['#', 'Email', 'Rôle', 'Domaine', 'Créé le'],
    filtered.map(u => [u.id, u.email, u.role, u.email?.endsWith('@emsi-edu.ma') ? '@emsi-edu.ma' : u.email?.endsWith('@emsi-tech.ma') ? '@emsi-tech.ma' : 'Externe', u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'])
  );

  const admins = users.filter(u => u.role === 'Admin').length;
  const techs = users.filter(u => u.role === 'Technicien').length;
  const emsi = users.filter(u => u.email?.endsWith('@emsi-edu.ma')).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Utilisateurs</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={handleExport}>⬇ CSV</button>
          <button style={s.printBtn} onClick={handlePrint}>🖨 Imprimer</button>
          <button style={s.primaryBtn} onClick={() => setShowCreate(true)}>+ Nouvel utilisateur</button>
        </div>
      </div>
      <p style={s.pageSub}>Gestion des comptes · {filtered.length} résultat(s)</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[{ label: 'Total', value: users.length, color: G.blue }, { label: 'Admins', value: admins, color: G.red }, { label: 'Techniciens', value: techs, color: G.primary }, { label: 'EMSI', value: emsi, color: G.primary }].map(st => (
          <div key={st.label} style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${st.color}` }}>
            <div style={{ color: st.color, fontSize: 24, fontWeight: 900 }}>{st.value}</div>
            <div style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Email..." style={{ ...s.input, width: 240 }} />
        {['all', 'Admin', 'Technicien', 'Utilisateur'].map(r => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} style={s.filterBtn(roleFilter === r)}>{r === 'all' ? 'Tous' : r}</button>
        ))}
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Email', 'Rôle', 'Domaine', 'Créé le', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {paginated.map((u, i) => {
              const isEmsi = u.email?.endsWith('@emsi-edu.ma');
              const isTech = u.email?.endsWith('@emsi-tech.ma');
              return (
                <tr key={u.id || i}>
                  <td style={s.td}><span style={{ color: G.purple, fontWeight: 700 }}>#{u.id}</span></td>
                  <td style={{ ...s.td, color: G.text, fontWeight: 500 }}>{u.email}</td>
                  <td style={s.td}><Badge text={u.role || 'Utilisateur'} /></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isEmsi ? G.primary : isTech ? G.blue : G.red }} />
                      <span style={{ color: isEmsi ? G.primary : isTech ? G.blue : G.red, fontSize: 12, fontWeight: 600 }}>
                        {isEmsi ? '@emsi-edu.ma' : isTech ? '@emsi-tech.ma' : 'Externe ✗'}
                      </span>
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
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {showCreate && <Modal title="Créer un utilisateur" onClose={() => setShowCreate(false)}><CreateUserForm onCreate={handleCreate} onClose={() => setShowCreate(false)} /></Modal>}
      {editUser && (
        <Modal title={`Modifier rôle — ${editUser.email}`} onClose={() => setEditUser(null)}>
          <div style={{ marginBottom: 16 }}><label style={s.label}>Rôle</label>
            <select style={s.input} value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              {['Utilisateur', 'Technicien', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select></div>
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
  const domain = form.email.split('@')[1] || '';
  const isValid = ['emsi-edu.ma', 'emsi-tech.ma'].includes(domain);

  const submit = () => {
    if (!form.email || !form.password) return setErr('Champs requis');
    if (form.password !== form.password_confirm) return setErr('Mots de passe différents');
    if (form.password.length < 12) return setErr('Minimum 12 caractères');
    onCreate(form);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {err && <div style={{ color: G.red, background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>{err}</div>}
      <div>
        <label style={s.label}>Email</label>
        <input style={{ ...s.input, borderColor: form.email.length > 5 ? (isValid ? G.primary : G.red) : G.border }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@emsi-edu.ma ou @emsi-tech.ma" />
        {form.email.length > 5 && <div style={{ fontSize: 11, marginTop: 4, color: isValid ? G.primary : G.red }}>
          {isValid ? `✓ Domaine ${domain} autorisé` : '✗ Domaine non autorisé (@emsi-edu.ma ou @emsi-tech.ma)'}
        </div>}
      </div>
      <div><label style={s.label}>Rôle</label>
        <select style={s.input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          {['Utilisateur', 'Technicien', 'Admin'].map(r => <option key={r}>{r}</option>)}
        </select></div>
      <div><label style={s.label}>Mot de passe</label><input style={s.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
      <div><label style={s.label}>Confirmer</label><input style={s.input} type="password" value={form.password_confirm} onChange={e => setForm({ ...form, password_confirm: e.target.value })} /></div>
      <div style={{ display: 'flex', gap: 10 }}><button style={s.primaryBtn} onClick={submit}>Créer</button><button style={s.secondaryBtn} onClick={onClose}>Annuler</button></div>
    </div>
  );
}

/* ══ EMAILS EMSI ══ */
function EmailVerifyView({ users }) {
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');
  const [result, setResult] = useState(null);
  const [bulkRes, setBulkRes] = useState([]);
  const [bulkFilter, setBulkFilter] = useState('all');

  const EMSI_DOMAINS = ['emsi-edu.ma', 'emsi-tech.ma'];

  const check = (email) => {
    const e = email.trim().toLowerCase();
    const domain = e.split('@')[1] || '';
    const isEmsi = domain === 'emsi-edu.ma';
    const isTech = domain === 'emsi-tech.ma';
    const isValid = isEmsi || isTech;
    const user = users.find(u => u.email?.toLowerCase() === e);
    return { email: e, isEmsi, isTech, isValid, domain, exists: !!user, user };
  };

  const emsiUsers = users.filter(u => u.email?.endsWith('@emsi-edu.ma'));
  const techUsers = users.filter(u => u.email?.endsWith('@emsi-tech.ma'));
  const nonEmsi = users.filter(u => !EMSI_DOMAINS.includes(u.email?.split('@')[1] || ''));
  const domainMap = {};
  users.forEach(u => { const d = u.email?.split('@')[1] || '?'; domainMap[d] = (domainMap[d] || 0) + 1; });
  const conformRate = users.length > 0 ? Math.round(((emsiUsers.length + techUsers.length) / users.length) * 100) : 0;
  const bulkFiltered = bulkFilter === 'all' ? bulkRes : bulkFilter === 'emsi' ? bulkRes.filter(r => r.isEmsi) : bulkFilter === 'tech' ? bulkRes.filter(r => r.isTech) : bulkRes.filter(r => !r.isValid);

  const exportBulkCSV = () => {
    exportCSV(
      bulkRes.map(r => [r.email, r.domain, r.isEmsi ? 'Étudiant/Prof' : r.isTech ? 'Technicien' : 'Externe', r.isValid ? 'Oui' : 'Non', r.exists ? 'Oui' : 'Non', r.user?.role || '—']),
      'verification_emails_emsi.csv', ['Email', 'Domaine', 'Type', 'Valide', 'Inscrit', 'Rôle']
    );
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Vérification Emails EMSI</h2>
      <p style={s.pageSub}>Domaines autorisés : @emsi-edu.ma · @emsi-tech.ma</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[{ label: 'Étudiants/Profs', value: emsiUsers.length, color: G.primary, sub: '@emsi-edu.ma' }, { label: 'Techniciens', value: techUsers.length, color: G.blue, sub: '@emsi-tech.ma' }, { label: 'Non conformes', value: nonEmsi.length, color: G.red, sub: 'Hors domaines' }, { label: 'Conformité', value: `${conformRate}%`, color: G.purple, sub: 'Taux global' }].map(st => (
          <div key={st.label} style={{ ...s.card, borderLeft: `4px solid ${st.color}` }}>
            <div style={{ color: st.color, fontSize: 28, fontWeight: 900 }}>{st.value}</div>
            <div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>{st.label}</div>
            <div style={{ color: st.color, fontSize: 11, marginTop: 2 }}>{st.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Taux de conformité</span>
          <span style={{ color: conformRate === 100 ? G.primary : conformRate >= 80 ? G.yellow : G.red, fontWeight: 700, fontSize: 13 }}>{conformRate}%</span>
        </div>
        <div style={{ height: 10, background: G.border, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${conformRate}%`, background: conformRate === 100 ? G.primary : conformRate >= 80 ? G.yellow : G.red, borderRadius: 10, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ color: G.primary, fontSize: 11, fontWeight: 600 }}>✓ {emsiUsers.length} @emsi-edu.ma</span>
          <span style={{ color: G.blue, fontSize: 11, fontWeight: 600 }}>✓ {techUsers.length} @emsi-tech.ma</span>
          {nonEmsi.length > 0 && <span style={{ color: G.red, fontSize: 11, fontWeight: 600 }}>✗ {nonEmsi.length} non conformes</span>}
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 16 }}>
        <BarChart title="Répartition par domaine" data={Object.entries(domainMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))} colorFn={l => l === 'emsi-edu.ma' ? G.primary : l === 'emsi-tech.ma' ? G.blue : G.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Vérifier un email</p>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <input style={{ ...s.input, borderColor: single.length > 4 ? (EMSI_DOMAINS.includes(single.trim().toLowerCase().split('@')[1]) ? G.primary : G.red) : G.border, paddingRight: 36 }}
              placeholder="email@emsi-edu.ma ou @emsi-tech.ma" value={single}
              onChange={e => { setSingle(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === 'Enter' && single.trim() && setResult(check(single))} />
            {single.length > 4 && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>{EMSI_DOMAINS.includes(single.trim().toLowerCase().split('@')[1]) ? '✅' : '❌'}</span>}
          </div>
          {single.length > 4 && single.includes('@') && (
            <div style={{ fontSize: 11, marginBottom: 10, fontWeight: 600, color: single.trim().toLowerCase().endsWith('@emsi-edu.ma') ? G.primary : single.trim().toLowerCase().endsWith('@emsi-tech.ma') ? G.blue : G.red }}>
              {single.trim().toLowerCase().endsWith('@emsi-edu.ma') && '✓ Domaine étudiant / prof valide'}
              {single.trim().toLowerCase().endsWith('@emsi-tech.ma') && '✓ Domaine technicien valide'}
              {!EMSI_DOMAINS.includes(single.trim().toLowerCase().split('@')[1]) && '✗ Domaine non autorisé'}
            </div>
          )}
          <button style={{ ...s.primaryBtn, width: '100%', marginBottom: 12 }} onClick={() => single.trim() && setResult(check(single))}>Vérifier →</button>
          {result && (
            <div style={{ padding: 16, background: result.isValid ? G.primarySoft : G.redSoft, border: `1px solid ${result.isValid ? G.primaryBorder : G.redBorder}`, borderRadius: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14, color: result.isEmsi ? G.primary : result.isTech ? G.blue : G.red }}>
                {result.isEmsi && '✅ Email étudiant / prof EMSI'}
                {result.isTech && '✅ Email technicien EMSI'}
                {!result.isValid && '❌ Email hors domaines autorisés'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['📧', 'Email', result.email], ['🌐', 'Domaine', result.domain], ['🏫', 'Type', result.isEmsi ? 'Étudiant / Prof' : result.isTech ? 'Technicien' : 'Non autorisé'], ['💾', 'Inscrit', result.exists ? 'Oui' : 'Non'], ['👤', 'Rôle', result.user?.role || '—'], ['📅', 'Créé le', result.user?.created_at ? new Date(result.user.created_at).toLocaleDateString('fr-FR') : '—']].map(([icon, label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: G.textMuted }}>{icon} {label}</span>
                    <span style={{ color: G.text, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={s.card}>
          <p style={{ color: G.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Vérification en masse</p>
          <textarea style={{ ...s.input, height: 90, resize: 'vertical', marginBottom: 10, fontFamily: 'monospace', fontSize: 12 }} placeholder={'etudiant@emsi-edu.ma\ntech@emsi-tech.ma\nexternal@gmail.com'} value={bulk} onChange={e => { setBulk(e.target.value); setBulkRes([]); }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button style={{ ...s.primaryBtn, flex: 1 }} onClick={() => setBulkRes(bulk.split('\n').map(e => e.trim()).filter(Boolean).map(check))}>Analyser →</button>
            {bulkRes.length > 0 && <button style={s.exportBtn} onClick={exportBulkCSV}>⬇ CSV</button>}
          </div>
          {bulkRes.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
                {[{ label: 'Total', value: bulkRes.length, color: G.blue }, { label: 'Étudiants', value: bulkRes.filter(r => r.isEmsi).length, color: G.primary }, { label: 'Techs', value: bulkRes.filter(r => r.isTech).length, color: G.blue }, { label: 'Invalides', value: bulkRes.filter(r => !r.isValid).length, color: G.red }].map(st => (
                  <div key={st.label} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ color: st.color, fontSize: 16, fontWeight: 800 }}>{st.value}</div>
                    <div style={{ color: G.textMuted, fontSize: 10, fontWeight: 700 }}>{st.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {[['all', 'Tous'], ['emsi', 'Étudiants'], ['tech', 'Techniciens'], ['ext', 'Invalides']].map(([val, label]) => (
                  <button key={val} onClick={() => setBulkFilter(val)} style={{ ...s.filterBtn(bulkFilter === val), fontSize: 11, padding: '4px 10px' }}>{label}</button>
                ))}
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${G.border}`, borderRadius: 8 }}>
                {bulkFiltered.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: i < bulkFiltered.length - 1 ? `1px solid ${G.border}` : 'none', background: i % 2 === 0 ? G.white : G.bg }}>
                    <div>
                      <div style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{r.email}</div>
                      <div style={{ fontSize: 10, color: G.textMuted }}>{r.isEmsi ? 'Étudiant / Prof' : r.isTech ? 'Technicien' : 'Non autorisé'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {r.exists && <span style={{ fontSize: 10, background: G.primarySoft, color: G.primary, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>Inscrit</span>}
                      <span style={{ color: r.isEmsi ? G.primary : r.isTech ? G.blue : G.red, fontWeight: 700, fontSize: 12 }}>{r.isEmsi ? '✓ Étu.' : r.isTech ? '✓ Tech.' : '✗ Inv.'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {nonEmsi.length > 0 && (
        <div style={{ ...s.card, border: `1px solid ${G.redBorder}`, background: G.redSoft }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ color: G.red, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>⚠ {nonEmsi.length} utilisateur(s) hors domaines autorisés</p>
            <span style={{ background: G.red, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Action requise</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Email', 'Domaine', 'Rôle', 'Créé le'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>{nonEmsi.map((u, i) => (
              <tr key={i}>
                <td style={{ ...s.td, color: G.red, fontWeight: 500 }}>{u.email}</td>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{u.email?.split('@')[1]}</td>
                <td style={s.td}><Badge text={u.role} /></td>
                <td style={{ ...s.td, fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══ ARCHIVES ══ */
function ArchivesView({ tickets }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const archived = tickets.filter(t => t.is_archived && (!search || t.title?.toLowerCase().includes(search.toLowerCase())));
  const totalPages = Math.ceil(archived.length / PAGE_SIZE);
  const paginated = archived.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => exportCSV(
    archived.map(t => [t.id, t.title, t.status, t.priority_score || '—', t.created_by?.email || '—', new Date(t.created_at).toLocaleDateString('fr-FR')]),
    'archives_export.csv', ['#', 'Titre', 'Statut', 'Priorité', 'Créé par', 'Date']
  );

  const handlePrint = () => printTable('Archives — TicketAI',
    ['#', 'Titre', 'Statut', 'Priorité', 'Créé par', 'Date'],
    archived.map(t => [t.id, t.title, t.status, t.priority_score || '—', t.created_by?.email || '—', new Date(t.created_at).toLocaleDateString('fr-FR')])
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Archives</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={handleExport}>⬇ CSV</button>
          <button style={s.printBtn} onClick={handlePrint}>🖨 Imprimer</button>
        </div>
      </div>
      <p style={s.pageSub}>{archived.length} ticket(s) archivé(s)</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[{ label: 'Total archivés', value: tickets.filter(t => t.is_archived).length, color: G.purple }, { label: 'Résolus', value: tickets.filter(t => t.is_archived && t.status === 'Résolu').length, color: G.primary }, { label: 'Critiques', value: tickets.filter(t => t.is_archived && t.priority_score === 'Critique').length, color: G.red }].map(st => (
          <div key={st.label} style={{ ...s.card, borderLeft: `4px solid ${st.color}` }}>
            <div style={{ color: st.color, fontSize: 26, fontWeight: 900 }}>{st.value}</div>
            <div style={{ color: G.textMuted, fontSize: 12, marginTop: 4 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Rechercher dans les archives..." style={{ ...s.input, maxWidth: 300 }} />
      </div>

      <div style={s.card}>
        {archived.length === 0 ? <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun ticket archivé</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Titre', 'Statut', 'Priorité', 'Créé par', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>{paginated.map(t => (
                <tr key={t.id} style={{ opacity: 0.75 }}>
                  <td style={s.td}><span style={{ color: G.purple, fontWeight: 700 }}>#{t.id}</span></td>
                  <td style={{ ...s.td, cursor: 'pointer', color: G.text, fontWeight: 600 }} onClick={() => navigate(`/tickets/${t.id}`)}>{t.title}</td>
                  <td style={s.td}><Badge text={t.status} /></td>
                  <td style={s.td}><Badge text={t.priority_score} type="priority" /></td>
                  <td style={{ ...s.td, fontSize: 12 }}>{t.created_by?.email || '—'}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}</tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

/* ══ AUDIT LOGS ══ */
function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    let url = `/audit/logs/?page=${page}&page_size=20`;
    if (search) url += `&action=${encodeURIComponent(search)}`;
    api.get(url)
      .then(res => { setLogs(res.data.results || res.data || []); setTotal(res.data.total || res.data.count || 0); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, search]);

  const ACTION_TYPES = ['all', 'LOGIN', 'LOGOUT', 'TICKET', 'AUDIT', 'PASSWORD', 'MFA'];

  const filtered = logs.filter(log => {
    if (actionFilter !== 'all' && !log.action?.includes(actionFilter)) return false;
    if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(log.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const actionColor = (a = '') => {
    if (a.includes('LOGIN')) return G.primary;
    if (a.includes('LOGOUT')) return G.blue;
    if (a.includes('CREAT')) return G.blue;
    if (a.includes('STATUS') || a.includes('UPDATE')) return G.yellow;
    if (a.includes('ARCHIV')) return G.purple;
    if (a.includes('PASSWORD')) return G.red;
    if (a.includes('MFA')) return G.purple;
    if (a.includes('DELETE')) return G.red;
    return G.textMuted;
  };

  const handleExport = () => exportCSV(
    filtered.map(l => [l.id, l.action, l.user_email || '—', l.ip_address || '—', l.timestamp ? new Date(l.timestamp).toLocaleString('fr-FR') : '—']),
    'audit_logs_export.csv', ['#', 'Action', 'Utilisateur', 'IP', 'Date']
  );

  const handlePrint = () => printTable('Audit Logs — TicketAI',
    ['#', 'Action', 'Utilisateur', 'IP', 'Date'],
    filtered.map(l => [l.id, l.action, l.user_email || '—', l.ip_address || '—', l.timestamp ? new Date(l.timestamp).toLocaleString('fr-FR') : '—'])
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={s.pageTitle}>Audit Logs</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={handleExport}>⬇ CSV</button>
          <button style={s.printBtn} onClick={handlePrint}>🖨 Imprimer</button>
        </div>
      </div>
      <p style={s.pageSub}>{total} entrées au total · {filtered.length} affichées</p>

      {/* Filtres */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Rechercher une action..."
            style={{ ...s.input, maxWidth: 240 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ACTION_TYPES.map(type => (
              <button key={type} onClick={() => setActionFilter(type)} style={{ ...s.filterBtn(actionFilter === type), fontSize: 11, padding: '5px 12px' }}>
                {type === 'all' ? 'Toutes' : type}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <span style={{ color: G.textMuted, fontSize: 12 }}>Du</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...s.input, width: 140, padding: '6px 10px' }} />
            <span style={{ color: G.textMuted, fontSize: 12 }}>Au</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...s.input, width: 140, padding: '6px 10px' }} />
            {(dateFrom || dateTo || actionFilter !== 'all') && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setActionFilter('all'); setSearch(''); }} style={{ ...s.secondaryBtn, padding: '6px 12px', fontSize: 12, color: G.red }}>✕ Reset</button>
            )}
          </div>
        </div>
      </div>

      <div style={s.card}>
        {loading ? <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Chargement...</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Action', 'Utilisateur', 'IP', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id || i} style={{ background: i % 2 === 0 ? G.white : G.bg }}>
                    <td style={s.td}><span style={{ color: G.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{log.id}</span></td>
                    <td style={s.td}><code style={{ color: actionColor(log.action), background: `${actionColor(log.action)}15`, padding: '3px 9px', borderRadius: 6, fontSize: 12 }}>{log.action}</code></td>
                    <td style={{ ...s.td, fontSize: 12 }}>{log.user_email || log.user?.email || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <p style={{ textAlign: 'center', color: G.textLight, padding: 40 }}>Aucun log trouvé</p>}
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

/* ══ NAVBAR ══ */
function AdminNavbar({ active, setActive, openCount, archivedCount, criticalCount, user, onLogout }) {
  const navItems = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'tickets', label: 'Tickets', badge: openCount || null },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'email-verify', label: 'Emails EMSI' },
    { id: 'archives', label: 'Archives', badge: archivedCount || null },
    { id: 'audit', label: 'Audit Logs' },
  ];
  return (
    <nav style={{ background: G.accent, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🎫</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Ticket<span style={{ color: G.primaryLight }}>AI</span></span>
          <span style={{ background: G.primary, color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)} style={{ background: active === item.id ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', color: active === item.id ? '#fff' : 'rgba(255,255,255,0.65)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.label}
              {item.badge > 0 && <span style={{ background: G.red, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {criticalCount > 0 && <div style={{ background: G.redSoft, border: `1px solid ${G.redBorder}`, borderRadius: 8, padding: '4px 10px' }}><span style={{ color: G.red, fontSize: 12, fontWeight: 700 }}>🚨 {criticalCount} critique(s)</span></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: G.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>{user?.email?.[0]?.toUpperCase() || 'A'}</div>
          <div><div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{user?.email}</div><div style={{ color: G.primaryLight, fontSize: 11 }}>Admin</div></div>
        </div>
        <button onClick={onLogout} style={{ background: G.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Logout</button>
      </div>
    </nav>
  );
}

/* ══ MAIN ══ */
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
  Promise.all([api.get('/tickets/'), api.get('/auth/users/')])
    .then(([ticketsRes, usersRes]) => {
      setTickets(ticketsRes.data.results || []);
      setUsers(usersRes.data.results || []);
      const msg = sessionStorage.getItem('ticketSuccess');
      if (msg) { flash(msg); sessionStorage.removeItem('ticketSuccess'); }
    })
    .catch(e => flash('❌ ' + (e.response?.data?.error || e.message)))
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
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>{renderView()}</main>
    </div>
  );
}