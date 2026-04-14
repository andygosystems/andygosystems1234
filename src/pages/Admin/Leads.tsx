import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mail, ExternalLink, MessageSquare, Phone,
  Users, Bot, BarChart2, CheckCircle2, XCircle, Eye, RefreshCw
} from 'lucide-react';
import { useInquiry, Inquiry } from '../../context/InquiryContext';
import { useProperty } from '../../context/PropertyContext';
import { useChat, ChatSession } from '../../context/ChatContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GOLD = '#D4AF37';

type Tab = 'pipeline' | 'leads' | 'conversations' | 'analytics';

const STATUS_META: Record<string, { label: string; color: string; dot: string; col: string }> = {
  new:       { label: 'New Lead',          color: 'text-emerald-400', dot: 'bg-emerald-400', col: 'border-t-emerald-400' },
  contacted: { label: 'Contacted',         color: 'text-blue-400',    dot: 'bg-blue-400',    col: 'border-t-blue-400'    },
  qualified: { label: 'Viewing Scheduled', color: 'text-amber-400',   dot: 'bg-amber-400',   col: 'border-t-amber-400'   },
  closed:    { label: 'Closed',            color: 'text-rose-400',    dot: 'bg-rose-400',    col: 'border-t-rose-400'    },
  archived:  { label: 'Archived',          color: 'text-zinc-500',    dot: 'bg-zinc-500',    col: 'border-t-zinc-500'    },
};

const avatar = (name: string) =>
  name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// Sparkline SVG
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = GOLD }) => {
  const W = 80, H = 28;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = data.length < 2 ? W / 2 : (i / (data.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Lead Card (pipeline) ─────────────────────────────────────────────────────
const PipelineCard: React.FC<{
  lead: Inquiry;
  propTitle?: string;
  onClick: () => void;
  onStatusChange: (s: Inquiry['status']) => void;
}> = ({ lead, propTitle, onClick, onStatusChange }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-card border border-border rounded-sm p-3 cursor-pointer hover:border-[#D4AF37]/40 hover:shadow-md transition-all group"
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
          {avatar(lead.customer_name)}
        </div>
        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{lead.customer_name}</span>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{relTime(lead.date)}</span>
    </div>
    {propTitle && (
      <p className="text-[11px] text-[#D4AF37] font-medium mb-1.5 truncate">{propTitle}</p>
    )}
    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{lead.message || '—'}</p>
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {(['new','contacted','qualified','closed'] as Inquiry['status'][]).filter(s => s !== lead.status).map(s => (
        <button
          key={s}
          onClick={e => { e.stopPropagation(); onStatusChange(s); }}
          className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          → {STATUS_META[s]?.label.split(' ')[0]}
        </button>
      ))}
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Leads: React.FC = () => {
  const { inquiries, updateInquiryStatus, updateInquiryNotes } = useInquiry();
  const { properties } = useProperty();
  const { allSessions } = useChat();

  const [tab, setTab] = useState<Tab>('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Inquiry | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [chatSearch, setChatSearch] = useState('');

  const getProp = (id?: string) => id ? properties.find(p => String(p.id) === String(id)) : null;
  const openWhatsApp = (phone?: string) => {
    if (phone) window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  // ── filtered leads
  const filtered = useMemo(() =>
    inquiries.filter(l => {
      const q = search.toLowerCase();
      const matchQ = !q || (l.customer_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) || (l.phone || '').toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || l.status === statusFilter;
      return matchQ && matchS;
    }),
  [inquiries, search, statusFilter]);

  // ── 7-day sparkline data
  const spark7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().slice(0, 10);
      return inquiries.filter(l => l.date?.startsWith(day)).length;
    });
  }, [inquiries]);

  // ── stats
  const stats = useMemo(() => ({
    total: inquiries.length,
    newLeads: inquiries.filter(l => l.status === 'new').length,
    contacted: inquiries.filter(l => l.status === 'contacted').length,
    qualified: inquiries.filter(l => l.status === 'qualified').length,
    closed: inquiries.filter(l => l.status === 'closed').length,
  }), [inquiries]);

  const convRate = stats.total ? Math.round((stats.closed / stats.total) * 100) : 0;

  // ── pipeline columns
  const PIPELINE_COLS: Array<{ status: Inquiry['status']; label: string }> = [
    { status: 'new',       label: 'New Leads'        },
    { status: 'contacted', label: 'Contacted'         },
    { status: 'qualified', label: 'Viewing Scheduled' },
    { status: 'closed',    label: 'Closed'            },
  ];

  const tabs: Array<{ id: Tab; icon: React.ReactNode; label: string; count?: number }> = [
    { id: 'pipeline',      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>, label: 'Pipeline' },
    { id: 'leads',         icon: <Users className="w-4 h-4" />,     label: 'Leads',         count: stats.newLeads },
    { id: 'conversations', icon: <Bot className="w-4 h-4" />,       label: 'AI Chats',      count: allSessions.length },
    { id: 'analytics',     icon: <BarChart2 className="w-4 h-4" />, label: 'Analytics'      },
  ];

  return (
    <div className="min-h-screen flex flex-col gap-0">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">
            CRM <span style={{ color: GOLD }}>Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Krugerr Brendt · Lead Intelligence</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Leads',  value: stats.total,     sub: '+' + spark7[6] + ' today', spark: true },
          { label: 'New',          value: stats.newLeads,  sub: 'Unread inquiries',          dot: 'bg-emerald-400' },
          { label: 'In Progress',  value: stats.contacted + stats.qualified, sub: 'Contacted + Viewing', dot: 'bg-blue-400' },
          { label: 'Conversion',   value: convRate + '%',  sub: stats.closed + ' closed deals', dot: 'bg-amber-400' },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-sm p-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{k.label}</p>
                <p className="text-2xl font-serif font-bold text-foreground">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
              </div>
              {k.spark ? (
                <Sparkline data={spark7} />
              ) : (
                <span className={`w-2.5 h-2.5 rounded-full mt-1 ${k.dot}`} />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${GOLD}33, transparent)` }} />
          </div>
        ))}
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-sm p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${
              tab === t.id
                ? 'text-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={tab === t.id ? { background: GOLD } : {}}
          >
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-black/20 text-black' : 'bg-primary/15 text-primary'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {/* ── PIPELINE ── */}
        {tab === 'pipeline' && (
          <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {PIPELINE_COLS.map(col => {
                const colLeads = inquiries.filter(l => l.status === col.status);
                const meta = STATUS_META[col.status];
                return (
                  <div key={col.status} className={`bg-card border border-border border-t-2 ${meta.col} rounded-sm`}>
                    <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>{col.label}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{colLeads.length}</span>
                    </div>
                    <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                      <AnimatePresence>
                        {colLeads.length === 0 ? (
                          <p className="text-center text-[11px] text-muted-foreground py-8">No leads</p>
                        ) : colLeads.map(lead => (
                          <PipelineCard
                            key={lead.id}
                            lead={lead}
                            propTitle={getProp(lead.property_id)?.title}
                            onClick={() => { setSelectedLead(lead); setTab('leads'); }}
                            onStatusChange={s => updateInquiryStatus(lead.id, s)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── LEADS ── */}
        {tab === 'leads' && (
          <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-340px)] min-h-[500px]">

              {/* Left: Lead Feed */}
              <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-2 shrink-0">
                {/* Search + filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search leads…"
                      className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:border-[#D4AF37] text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-card border border-border rounded-sm text-xs px-2 focus:outline-none text-foreground"
                  >
                    <option value="all">All</option>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Lead list */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No leads found</div>
                  ) : filtered.map(lead => {
                    const meta = STATUS_META[lead.status] || STATUS_META.new;
                    const isSelected = selectedLead?.id === lead.id;
                    return (
                      <motion.div
                        key={lead.id}
                        layout
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-sm border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5'
                            : 'border-border bg-card hover:border-[#D4AF37]/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-full shrink-0 bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[11px] font-bold text-[#D4AF37]">
                            {avatar(lead.customer_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{lead.customer_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{lead.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{relTime(lead.date)}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{lead.message || '—'}</p>
                        {lead.property_id && (
                          <p className="text-[10px] font-medium mt-1" style={{ color: GOLD }}>
                            {getProp(lead.property_id)?.title || 'Property inquiry'}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Lead Detail */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {selectedLead ? (
                    <motion.div
                      key={selectedLead.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-card border border-border rounded-sm h-full flex flex-col"
                    >
                      {/* Detail header */}
                      <div className="p-5 border-b border-border flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-lg font-bold text-[#D4AF37]">
                            {avatar(selectedLead.customer_name)}
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-foreground">{selectedLead.customer_name}</h2>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedLead.email || '—'}</span>
                              {selectedLead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedLead.phone}</span>}
                            </div>
                          </div>
                        </div>
                        {/* Status selector */}
                        <select
                          value={selectedLead.status}
                          onChange={e => updateInquiryStatus(selectedLead.id, e.target.value as Inquiry['status'])}
                          className="text-xs bg-card border border-border rounded-sm px-2 py-1.5 font-bold focus:outline-none"
                          style={{ color: STATUS_META[selectedLead.status]?.color.replace('text-', '').includes('emerald') ? '#34d399' : undefined }}
                        >
                          {Object.entries(STATUS_META).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* Property card */}
                        {selectedLead.property_id && (() => {
                          const prop = getProp(selectedLead.property_id);
                          return prop ? (
                            <div className="flex gap-3 p-3 bg-muted/30 border border-border rounded-sm">
                              {prop.images?.[0] && (
                                <img src={prop.images[0]} alt="" className="w-14 h-14 rounded-sm object-cover shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Property Interest</p>
                                <p className="text-sm font-semibold text-foreground truncate">{prop.title}</p>
                                <p className="text-xs text-muted-foreground">{prop.location}</p>
                              </div>
                              <a href={`/property/${prop.id}`} target="_blank" rel="noreferrer"
                                className="shrink-0 p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          ) : null;
                        })()}

                        {/* Message */}
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Message</p>
                          <div className="bg-muted/20 border border-border rounded-sm p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedLead.message || <span className="italic text-muted-foreground">No message provided.</span>}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Agent Notes</p>
                          <textarea
                            className="w-full bg-muted/10 border border-border rounded-sm p-3 text-sm text-foreground focus:outline-none focus:border-[#D4AF37] transition-colors resize-none min-h-[90px] placeholder:text-muted-foreground"
                            placeholder="Log your contact details, next steps, client preferences…"
                            value={selectedLead.notes || ''}
                            onChange={e => updateInquiryNotes(selectedLead.id, e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground text-right mt-1">Auto-saved</p>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="p-4 border-t border-border flex items-center gap-2 flex-wrap">
                        <a href={`mailto:${selectedLead.email}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold text-black transition-colors"
                          style={{ background: GOLD }}>
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                        {selectedLead.phone && (
                          <button onClick={() => openWhatsApp(selectedLead.phone)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-sm text-xs font-bold hover:opacity-90 transition-opacity">
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        )}
                        <button onClick={() => updateInquiryStatus(selectedLead.id, 'qualified')}
                          className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-sm text-xs font-bold hover:bg-muted transition-colors ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Schedule Viewing
                        </button>
                        <button onClick={() => updateInquiryStatus(selectedLead.id, 'archived')}
                          className="p-2 border border-border rounded-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/5"
                    >
                      <Eye className="w-12 h-12 mb-3 opacity-15" />
                      <p className="text-sm font-medium">Select a lead to view details</p>
                      <p className="text-xs mt-1 text-muted-foreground/60">Click any lead from the list</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── AI CONVERSATIONS ── */}
        {tab === 'conversations' && (
          <motion.div key="conversations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <div className="flex gap-4 h-[calc(100vh-340px)] min-h-[500px]">
              {/* Session list */}
              <div className="w-72 shrink-0 flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:border-[#D4AF37] text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5">
                  {allSessions.filter(s => {
                    const q = chatSearch.toLowerCase();
                    return !q || (s.userName || '').toLowerCase().includes(q) ||
                      s.messages.some(m => m.text.toLowerCase().includes(q));
                  }).map(session => (
                    <div key={session.id} onClick={() => setSelectedSession(session)}
                      className={`p-3 rounded-sm border cursor-pointer transition-all ${
                        selectedSession?.id === session.id
                          ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5'
                          : 'border-border bg-card hover:border-[#D4AF37]/30'
                      }`}>
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{session.userName || 'Anonymous'}</p>
                          <p className="text-[10px] text-muted-foreground">{session.messages.length} messages</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{relTime(session.lastMessageTime)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {session.messages[session.messages.length - 1]?.text || '—'}
                      </p>
                    </div>
                  ))}
                  {allSessions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">No AI conversations yet</div>
                  )}
                </div>
              </div>

              {/* Chat view */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {selectedSession ? (
                    <motion.div key={selectedSession.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-card border border-border rounded-sm h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{selectedSession.userName || 'Anonymous visitor'}</p>
                          {selectedSession.userPhone && <p className="text-xs text-muted-foreground">{selectedSession.userPhone}</p>}
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">AI Session</span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedSession.messages.map((msg, i) => (
                          <div key={i} className={`flex gap-2.5 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${
                              msg.isBot ? 'bg-primary/15 text-primary' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            }`}>
                              {msg.isBot ? <Bot className="w-3 h-3" /> : 'C'}
                            </div>
                            <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                              msg.isBot
                                ? 'bg-muted text-foreground rounded-tl-none'
                                : 'text-black rounded-tr-none'
                            }`}
                            style={!msg.isBot ? { background: GOLD } : {}}>
                              {msg.text}
                              <span className="block text-[9px] mt-1 opacity-50 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedSession.userPhone && (
                        <div className="p-3 border-t border-border">
                          <button onClick={() => openWhatsApp(selectedSession.userPhone)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white rounded-sm text-xs font-bold hover:opacity-90 transition-opacity">
                            <MessageSquare className="w-3.5 h-3.5" /> Continue on WhatsApp
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-sm bg-muted/5 text-muted-foreground">
                      <Bot className="w-10 h-10 mb-3 opacity-15" />
                      <p className="text-sm">Select a conversation</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* 7-day chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Lead Volume</p>
                    <p className="text-2xl font-serif font-bold text-foreground mt-0.5">{stats.total} total</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Last 7 days</span>
                </div>
                {/* Bar chart */}
                <div className="flex items-end gap-2 h-32">
                  {spark7.map((v, i) => {
                    const max = Math.max(...spark7, 1);
                    const h = max > 0 ? (v / max) * 100 : 0;
                    const d = new Date(); d.setDate(d.getDate() - (6 - i));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground">{v > 0 ? v : ''}</span>
                        <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(h, 4)}%`, background: i === 6 ? GOLD : `${GOLD}50` }} />
                        <span className="text-[9px] text-muted-foreground">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Funnel */}
              <div className="bg-card border border-border rounded-sm p-5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-4">Conversion Funnel</p>
                <div className="space-y-3">
                  {PIPELINE_COLS.map(col => {
                    const count = inquiries.filter(l => l.status === col.status).length;
                    const pct = stats.total ? (count / stats.total) * 100 : 0;
                    const meta = STATUS_META[col.status];
                    return (
                      <div key={col.status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground font-medium">{col.label}</span>
                          <span className={`font-bold ${meta.color}`}>{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${meta.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-bold text-foreground">{convRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">AI Sessions</span>
                    <span className="font-bold text-foreground">{allSessions.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">This week</span>
                    <span className="font-bold text-foreground">{spark7.reduce((a, b) => a + b, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Leads;