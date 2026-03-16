import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  addProperty: (property: any) => Promise<void>;
  updateProperty: (id: string | number, updates: any) => Promise<void>;
  deleteProperty: (id: string | number) => Promise<void>;
  getPropertyById: (id: string | number) => ExtendedProperty | undefined;
  incrementVisits: (id: string | number) => void;
  getStats: () => { totalProperties: number; totalVisits: number; totalInquiries: number };
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<ExtendedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getProperties();
      const allProps = (res.data || []).map((p: any) => ({
        ...p,
        id: String(p.id),
        // Ensure price is a string for the Property interface
        price: typeof p.price === 'number' ? `KES ${p.price.toLocaleString()}` : String(p.price || '0'),
        visits: p.visits || 0,
        status: p.status || 'available',
        dateAdded: p.dateAdded || new Date().toISOString()
      }));
      setProperties(allProps);
    } catch (error) {
      console.error("Failed to load property data:", error);
    } finally {
      setLoading(false);
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
    const interval = setInterval(loadData, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const addProperty = async (newProperty: any) => {
    setLoading(true);
    try {
      await api.addProperty(newProperty);
      await loadData();
    } catch (e) {
      console.error("Failed to add property", e);
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id: string | number, updates: any) => {
    setLoading(true);
    try {
      await api.updateProperty(id, updates);
      await loadData();
    } catch (e) {
      console.error("Failed to update property", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string | number) => {
    setLoading(true);
    try {
      await api.deleteProperty(id);
      await loadData();
    } catch (e) {
      console.error("Failed to delete property", e);
    } finally {
      setLoading(false);
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
