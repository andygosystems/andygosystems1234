import { useEffect, useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Link, useLocation } from 'react-router-dom';

const SyncUpload = () => {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string; status: 'ok' | 'error'; details?: string }[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'warn'; message: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const stateJson = (location.state as any)?.prefillJson;
    if (typeof stateJson === 'string' && stateJson.trim()) {
      setJsonText(stateJson);
      return;
    }
    const saved = localStorage.getItem('kb_sync_prefill');
    if (saved && saved.trim()) {
      setJsonText(saved);
      localStorage.removeItem('kb_sync_prefill');
    }
  }, [location.state]);

  const handleImport = async () => {
    if (!jsonText.trim()) return;
    setLoading(true);
    setResults([]);
    setImportStatus(null);

    try {
      localStorage.setItem('kb_net_busy', '1');
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) throw new Error('JSON must be an array of property objects');

      const payloads = data.map((item: any) => {
        let status = (item.status || 'available').toLowerCase();
        if (!['available', 'sold', 'rented'].includes(status)) status = 'available';

        return {
          title: item.title || 'Untitled Property',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          currency: item.currency || 'KES',
          location: item.location || 'Unknown Location',
          type: item.type === 'Rent' ? 'Rent' : 'Sale',
          status,
          bedrooms: parseInt(item.bedrooms || item.beds) || 0,
          bathrooms: parseInt(item.bathrooms || item.baths) || 0,
          sqm: parseInt(item.sqm || item.sqft) || 0,
          lat: parseFloat(item.lat) || null,
          lng: parseFloat(item.lng) || null,
          property_type: item.property_type || item.category || null,
          virtual_tour_url: item.virtual_tour_url || null,
          land_category: item.land_category || null,
          tenure_type: item.tenure_type || null,
          plot_size: item.plot_size || null,
          images: Array.isArray(item.images) ? item.images : [],
          amenities: Array.isArray(item.amenities)
            ? item.amenities
            : (typeof item.amenities === 'string'
              ? item.amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
              : (Array.isArray(item.keywords) ? item.keywords : []))
        };
      });

      const bulkResults = await api.bulkAddProperties(payloads);
      setResults(bulkResults);

      const ok = bulkResults.filter(r => r.status === 'ok').length;
      const failed = bulkResults.filter(r => r.status === 'error').length;
      if (ok === payloads.length) {
        setImportStatus({ type: 'success', message: `Successfully imported all ${ok} properties!` });
      } else if (ok > 0) {
        setImportStatus({ type: 'warn', message: `Imported ${ok} of ${payloads.length} properties. ${failed} failed — see results below.` });
      } else {
        setImportStatus({ type: 'error', message: 'All imports failed. Check results below for per-item errors.' });
      }

    } catch (e: any) {
      console.error('JSON Parse Error:', e);
      setImportStatus({ type: 'error', message: `Import failed: ${e.message}` });
    } finally {
      setLoading(false);
      localStorage.removeItem('kb_net_busy');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">Sync Properties</h1>
        <Link to="/admin/properties" className="underline text-sm">Back to Properties</Link>
      </div>

      {importStatus && (
        <div className={`mb-4 p-4 rounded-sm border text-sm font-medium flex items-start justify-between gap-4 ${
          importStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-600' :
          importStatus.type === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700' :
          'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <span>{importStatus.message}</span>
          <button type="button" onClick={() => setImportStatus(null)} className="shrink-0 font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="bg-card p-6 rounded-sm shadow-sm border border-border space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-bold">Bulk Import from JSON</h3>
            <p className="text-sm text-muted-foreground">Paste JSON exported from your scraper tool. Each item should be a property object.</p>
          </div>
        </div>

        <textarea
          rows={14}
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
          placeholder='[{"title":"Luxury Villa","description":"...","price":50000000,"location":"Nairobi, Karen","type":"Sale","bedrooms":4,"bathrooms":5,"sqm":420,"images":["https://.../photo1.jpg"],"amenities":["Pool","Gym"]}]'
        />

        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-sm font-bold uppercase text-xs tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-8 bg-card p-6 rounded-sm shadow-sm border border-border">
          <h3 className="font-bold mb-4">Results</h3>
          <div className="space-y-3">
            {results.map((r, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {r.status === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm">{r.title}</span>
                {r.details && <span className="text-xs text-muted-foreground">({r.details})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncUpload;
