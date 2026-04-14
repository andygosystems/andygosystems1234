import { useState } from 'react';
import { useProperty } from '../../context/PropertyContext';
import { Plus, Trash2, MapPin, Eye, Edit, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

const AdminProperties = () => {
  const { properties, deleteProperty, loading } = useProperty();
  const { formatPrice } = useCurrency();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = properties.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      setDeleteError(null);
      await deleteProperty(id);
    } catch (e: any) {
      setDeleteError(e?.message || 'Failed to delete property.');
    }
  };

  if (loading) return <div>Loading properties...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">All Properties</h1>
        <div className="flex items-center gap-2">
          <Link 
            to="/admin/properties/sync" 
            className="border border-border px-4 py-2 rounded-sm font-bold uppercase text-xs tracking-wide flex items-center gap-2 hover:bg-muted transition-colors"
          >
            Sync
          </Link>
          <Link 
            to="/admin/properties/agency-sync" 
            className="border border-border px-4 py-2 rounded-sm font-bold uppercase text-xs tracking-wide flex items-center gap-2 hover:bg-muted transition-colors"
          >
            Agency Sync
          </Link>
          <Link 
            to="/admin/properties/add" 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-sm font-bold uppercase text-xs tracking-wide flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </Link>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-sm flex justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full pl-9 pr-4 py-2 bg-input border border-input rounded-sm text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-input border border-input rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      <div className="bg-card rounded-sm shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Property</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Visits</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No properties found.</td></tr>
              )}
              {filtered.map((property) => (
                <tr key={property.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                        {property.images?.[0] ? (
                          <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm line-clamp-1">{property.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground">{property.type}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-primary font-serif">
                      {formatPrice(property.price)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {property.visits || 0}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-sm ${
                      property.status === 'sold' ? 'bg-destructive/10 text-destructive' : 
                      property.status === 'rented' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {property.status || 'Available'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/property/${property.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-sm transition-colors"
                        title="View on site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        to={`/admin/properties/edit/${property.id}`}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProperties;
