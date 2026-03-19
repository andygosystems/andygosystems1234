import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Property } from '../data/properties';
import { api } from '../lib/api';

// Extend Property type to include optional fields for analytics/management
export interface ExtendedProperty extends Property {
  visits?: number;
  isLocal?: boolean; // True if created via Admin Dashboard
  dateAdded?: string;
  status?: 'available' | 'sold' | 'rented';
}

interface PropertyContextType {
  properties: ExtendedProperty[];
  loading: boolean;
  addProperty: (property: any) => Promise<{ id: string; message: string }>;
  updateProperty: (id: string | number, updates: any) => Promise<{ message: string }>;
  deleteProperty: (id: string | number) => Promise<{ message: string }>;
  getPropertyById: (id: string | number) => ExtendedProperty | undefined;
  incrementVisits: (id: string | number) => void;
  getStats: () => { totalProperties: number; totalVisits: number; totalInquiries: number };
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<ExtendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const loadInFlight = useRef(false);
  const mutationInFlight = useRef(false);

  const loadData = async (opts?: { silent?: boolean }) => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      const showLoading = !opts?.silent && properties.length === 0;
      if (showLoading) setLoading(true);
      const res = await api.getProperties();
      console.log("Property load result:", res); // Debug log
      
      if (res.error) {
        console.error("API error loading properties:", res.error);
      }

      const allProps = (res.data || []).map((p: any) => ({
        ...p,
        id: String(p.id),
        // Ensure price is a string for the Property interface
        price: typeof p.price === 'number' ? `KES ${p.price.toLocaleString()}` : String(p.price || '0'),
        beds: typeof p.bedrooms === 'number' ? p.bedrooms : (typeof p.beds === 'number' ? p.beds : 0),
        baths: typeof p.bathrooms === 'number' ? p.bathrooms : (typeof p.baths === 'number' ? p.baths : 0),
        sqft: typeof p.sqm === 'number' ? p.sqm : (typeof p.sqft === 'number' ? p.sqft : 0),
        coords: [
          typeof p.lat === 'number' ? p.lat : (p.lat ? Number(p.lat) : 0),
          typeof p.lng === 'number' ? p.lng : (p.lng ? Number(p.lng) : 0),
        ],
        visits: p.visits || 0,
        status: p.status || 'available',
        dateAdded: p.dateAdded || p.created_at || new Date().toISOString()
      }));
      setProperties(allProps);
    } catch (error) {
      console.error("Failed to load property data:", error);
    } finally {
      setLoading(false);
      loadInFlight.current = false;
    }
  };

  useEffect(() => {
    loadData();

    // Listen for storage changes (for local fallback if still used)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kb_properties' || e.key === 'kb_analytics') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Poll for updates in admin view
    const interval = setInterval(() => {
      if (mutationInFlight.current) return;
      loadData({ silent: true });
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const addProperty = async (newProperty: any) => {
    try {
      mutationInFlight.current = true;
      const res = await api.addProperty(newProperty);
      if (res?.id) {
        setProperties(prev => [
          {
            ...newProperty,
            id: String(res.id),
            price: typeof newProperty.price === 'number' ? `KES ${newProperty.price.toLocaleString()}` : String(newProperty.price || '0'),
            beds: Number(newProperty.bedrooms ?? newProperty.beds ?? 0),
            baths: Number(newProperty.bathrooms ?? newProperty.baths ?? 0),
            sqft: Number(newProperty.sqm ?? newProperty.sqft ?? 0),
            coords: [
              Number(newProperty.lat ?? 0),
              Number(newProperty.lng ?? 0),
            ],
            status: newProperty.status || 'available',
            dateAdded: new Date().toISOString(),
            visits: 0,
          } as any,
          ...prev,
        ]);
      }
      loadData({ silent: true });
      return res;
    } catch (e) {
      console.error("Failed to add property", e);
      throw e;
    } finally {
      mutationInFlight.current = false;
    }
  };

  const updateProperty = async (id: string | number, updates: any) => {
    try {
      mutationInFlight.current = true;
      const res = await api.updateProperty(id, updates);
      setProperties(prev =>
        prev.map(p =>
          String(p.id) === String(id)
            ? ({
                ...p,
                ...updates,
                beds: Number((updates as any).bedrooms ?? (updates as any).beds ?? (p as any).beds ?? 0),
                baths: Number((updates as any).bathrooms ?? (updates as any).baths ?? (p as any).baths ?? 0),
                sqft: Number((updates as any).sqm ?? (updates as any).sqft ?? (p as any).sqft ?? 0),
                coords: [
                  Number((updates as any).lat ?? (p as any).coords?.[0] ?? 0),
                  Number((updates as any).lng ?? (p as any).coords?.[1] ?? 0),
                ],
              } as any)
            : p
        )
      );
      loadData({ silent: true });
      return res;
    } catch (e) {
      console.error("Failed to update property", e);
      throw e;
    } finally {
      mutationInFlight.current = false;
    }
  };

  const deleteProperty = async (id: string | number) => {
    try {
      mutationInFlight.current = true;
      const res = await api.deleteProperty(id);
      setProperties(prev => prev.filter(p => String(p.id) !== String(id)));
      loadData({ silent: true });
      return res;
    } catch (e) {
      console.error("Failed to delete property", e);
      throw e;
    } finally {
      mutationInFlight.current = false;
    }
  };

  const getPropertyById = (id: string | number) => {
    return properties.find(p => String(p.id) === String(id));
  };

  const incrementVisits = (id: string | number) => {
    // Analytics tracking could be an API call too
    setProperties(prev => prev.map(p => 
      String(p.id) === String(id) ? { ...p, visits: (p.visits || 0) + 1 } : p
    ));
  };

  const getStats = () => {
    const totalProperties = properties.length;
    const totalVisits = properties.reduce((acc, curr) => acc + (curr.visits || 0), 0);
    
    // Get inquiries count from leads storage if available
    const inquiriesStr = localStorage.getItem('kb_leads');
    const totalInquiries = inquiriesStr ? JSON.parse(inquiriesStr).length : 0;

    return { totalProperties, totalVisits, totalInquiries };
  };

  return (
    <PropertyContext.Provider value={{
      properties,
      loading,
      addProperty,
      updateProperty,
      deleteProperty,
      getPropertyById,
      incrementVisits,
      getStats
    }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
