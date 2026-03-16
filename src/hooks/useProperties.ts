import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Property as LocalProperty } from '../data/properties';

// Adapter to normalize PHP API property to LocalProperty interface
const normalizeProperty = (p: any): LocalProperty => ({
  id: String(p.id),
  title: p.title,
  price: `${p.currency || 'KES'} ${Number(p.price || 0).toLocaleString()}`,
  location: p.location || '',
  type: p.type === 'Rent' ? 'Rent' : 'Sale',
  beds: Number(p.bedrooms ?? p.beds ?? 0),
  baths: Number(p.bathrooms ?? p.baths ?? 0),
  sqft: Number(p.sqm ?? p.sqft ?? 0),
  images: Array.isArray(p.images) ? p.images : (Array.isArray(p.image_urls) ? p.image_urls : []),
  description: p.description || '',
  amenities: Array.isArray(p.amenities) ? p.amenities : [],
  coords: p.lat && p.lng ? [Number(p.lat), Number(p.lng)] : undefined
});

export const useProperties = () => {
  const [properties, setProperties] = useState<LocalProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProperties = async () => {
      try {
        const res = await api.getProperties({ page: 1, limit: 100 });
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (mounted) {
          const remoteProperties = list.map(normalizeProperty);
          setProperties(remoteProperties);
        }
      } catch (err) {
        console.error('API connection error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProperties();

    return () => {
      mounted = false;
    };
  }, []);

  return { properties, loading };
};
