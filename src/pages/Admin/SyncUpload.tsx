import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

const SyncUpload = () => {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string; status: 'ok' | 'error'; details?: string }[]>([]);

  const handleImport = async () => {
    setLoading(true);
    setResults([]);
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) throw new Error('JSON must be an array of property objects');
      const resList: { title: string; status: 'ok' | 'error'; details?: string }[] = [];
      for (const item of data) {
        const payload = {
          title: item.title,
          description: item.description,
          price: item.price,
          currency: item.currency || 'KES',
          location: item.location,
          county: item.county || '',
          subcounty: item.subcounty || '',
          estate: item.estate || '',
          type: item.type === 'Rent' ? 'Rent' : 'Sale',
          status: item.status || 'available',
          bedrooms: item.bedrooms ?? item.beds ?? 0,
          bathrooms: item.bathrooms ?? item.baths ?? 0,
          sqm: item.sqm ?? item.sqft ?? 0,
          lat: item.lat ?? null,
          lng: item.lng ?? null,
          property_type: item.property_type || item.category || null,
          virtual_tour_url: item.virtual_tour_url || null,
          images: Array.isArray(item.images) ? item.images : [],
          amenities: Array.isArray(item.amenities) ? item.amenities : (typeof item.amenities === 'string' ? item.amenities.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
        };
        const res = await api.addProperty(payload);
        if ((res as any).id) {
          resList.push({ title: payload.title, status: 'ok' });
        } else {
          resList.push({ title: payload.title, status: 'error', details: JSON.stringify(res) });
        }
      }
      setResults(resList);
      alert('Sync completed');
    } catch (e:any) {
      alert(`Invalid JSON: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">Sync Properties</h1>
        <Link to="/admin/properties" className="underline text-sm">Back to Properties</Link>
      </div>

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
