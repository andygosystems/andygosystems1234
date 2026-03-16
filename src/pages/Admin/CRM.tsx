import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, BarChart2, Clock, PieChart, Map } from 'lucide-react';
import { api } from '../../lib/api';

type CRMStats = {
  funnel: Record<string, number>;
  sources: Record<string, number>;
  speed_to_lead_avg: number;
  occupancy: { occupied: number; vacant: number; total: number };
  noi: number;
  maintenance: number;
  lease_income: number;
  dom: number;
  forecast_next_month: number;
  range: { from: string; to: string };
};

const Bar = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span className="uppercase font-bold">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
    <div className="h-2 bg-muted rounded-sm overflow-hidden">
      <div className="h-2 bg-primary" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  </div>
);

const CRM = () => {
  const [from, setFrom] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0,10));
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const json = await api.getCRMStats(from, to);
      setError(null);
      setStats(json);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxFunnel = stats ? Math.max(...Object.values(stats.funnel)) : 0;
  const maxSources = stats ? Math.max(...Object.values(stats.sources)) : 0;
  const totalLeads = stats ? Object.values(stats.funnel).reduce((a,b)=>a+b,0) : 0;
  const occupancyPct = stats && stats.occupancy.total > 0 ? Math.round((stats.occupancy.occupied / stats.occupancy.total) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-foreground mb-8">CRM Analytics</h1>

      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-input border border-border p-2 rounded-sm text-sm" />
        <span className="text-muted-foreground">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-input border border-border p-2 rounded-sm text-sm" />
        <button onClick={load} className="px-3 py-2 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-widest">
          Refresh
        </button>
      </div>

      {loading && <div>Loading CRM...</div>}
      {!loading && error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-sm">Failed to load analytics.</div>
      )}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-4 rounded-sm border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Total Leads</div>
              <div className="text-2xl font-serif font-bold">{totalLeads}</div>
            </div>
            <div className="bg-card p-4 rounded-sm border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Occupancy</div>
              <div className="text-2xl font-serif font-bold">{occupancyPct}%</div>
            </div>
            <div className="bg-card p-4 rounded-sm border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Speed-to-Lead</div>
              <div className="text-2xl font-serif font-bold">{stats.speed_to_lead_avg}s</div>
            </div>
            <div className="bg-card p-4 rounded-sm border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Forecast</div>
              <div className="text-2xl font-serif font-bold">KES {Math.round(stats.forecast_next_month).toLocaleString()}</div>
            </div>
          </div>

          {totalLeads === 0 && maxSources === 0 ? (
            <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
              <p className="text-sm text-muted-foreground">No analytics found for the selected range. Add inquiries, leases, or maintenance records to see insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Conversion Funnel</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.funnel).map(([stage, count]) => (
                <Bar key={stage} label={stage} value={count} max={maxFunnel} />
              ))}
            </div>
          </div>

          <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Source ROI</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.sources).map(([src, count]) => (
                <Bar key={src} label={src} value={count} max={maxSources} />
              ))}
            </div>
          </div>

          <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Portfolio Health</h3>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span>Occupancy</span><span className="font-bold">{stats.occupancy.occupied}/{stats.occupancy.total}</span></div>
              <div className="flex justify-between"><span>Vacancy</span><span className="font-bold">{stats.occupancy.vacant}</span></div>
              <div className="flex justify-between"><span>NOI</span><span className="font-bold">KES {Math.round(stats.noi).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Maintenance</span><span className="font-bold">KES {Math.round(stats.maintenance).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Lease Income</span><span className="font-bold">KES {Math.round(stats.lease_income).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Operational Metrics</h3>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span>Speed-to-Lead</span><span className="font-bold">{stats.speed_to_lead_avg} sec</span></div>
              <div className="flex justify-between"><span>Days on Market (DOM)</span><span className="font-bold">{stats.dom} days</span></div>
              <div className="flex justify-between"><span>Forecast (Next Month)</span><span className="font-bold">KES {Math.round(stats.forecast_next_month).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Map className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Heatmap</h3>
            </div>
            <p className="text-sm text-muted-foreground">Configure region performance overlays (Nairobi, Kiambu, Mombasa). Coming soon.</p>
          </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CRM;
