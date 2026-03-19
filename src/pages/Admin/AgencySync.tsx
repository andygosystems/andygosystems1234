import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Globe, Image as ImageIcon, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AgencySync = () => {
  const [urlsText, setUrlsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms)),
    ]);
  };

  const errorMessage = (e: any) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e.message) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  };

  const handleScrape = async () => {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setLoading(true);
    setItems([]);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('scrape-properties', { body: { urls } }),
        45000
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setItems(data?.items || []);
    } catch (e: any) {
      alert(`Scrape failed: ${errorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">Agency Sync</h1>
        <Link to="/admin/properties" className="underline text-sm">Back to Properties</Link>
      </div>

      <div className="bg-card p-6 rounded-sm border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Globe className="w-5 h-5" />
          Paste property URLs from BuyRentKenya (Agency 18528) — one per line.
        </div>
        <textarea
          rows={6}
          value={urlsText}
          onChange={e => setUrlsText(e.target.value)}
          className="w-full bg-input border border-border p-3 rounded-sm text-sm"
          placeholder="https://www.buyrentkenya.com/listing/..."
        />
        <div className="flex items-center gap-2">
          <input
            placeholder="(Optional) Token"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="bg-input border border-border p-2 rounded-sm text-sm w-full"
          />
          <button
            onClick={handleScrape}
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-sm font-bold uppercase text-xs tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Preview ({items.length})</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const json = JSON.stringify(items, null, 2);
                  localStorage.setItem('kb_sync_prefill', json);
                  navigator.clipboard.writeText(json);
                  alert('Copied to clipboard! Redirecting to Sync tool...');
                  navigate('/admin/properties/sync', { state: { prefillJson: json } });
                }}
                className="text-xs uppercase font-bold text-primary hover:underline"
              >
                Copy as JSON & Sync
              </button>
              <button onClick={() => setItems([])} className="text-xs uppercase font-bold text-muted-foreground hover:text-red-500 transition-colors">Clear Results</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((it, idx) => (
              <div key={idx} className="bg-card border border-border rounded-sm p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Shield className="w-3 h-3" />
                  {it.url}
                </div>
                <h3 className="font-serif font-bold text-foreground">{it.title || 'Untitled'}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{it.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(it.keywords || []).map((k: string) => (
                    <span key={k} className="text-[10px] uppercase font-bold px-2 py-1 rounded-sm border border-border">{k}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(it.images || []).slice(0, 6).map((src: string, j: number) => (
                    <div key={j} className="aspect-square bg-muted rounded-sm overflow-hidden flex items-center justify-center">
                      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencySync;
