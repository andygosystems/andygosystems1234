import React, { createContext, useContext, useState, useEffect } from 'react';

import { api } from '../lib/api';

export interface Inquiry {
  id: string;
  customer_name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
  property_id?: string;
  status: 'new' | 'read' | 'contacted' | 'archived';
  date: string;
  notes?: string;
}

interface InquiryContextType {
  inquiries: Inquiry[];
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'date' | 'status'>) => Promise<void>;
  updateInquiryStatus: (id: string, status: Inquiry['status']) => Promise<void>;
  updateInquiryNotes: (id: string, notes: string) => Promise<void>;
  deleteInquiry: (id: string) => void;
  getStats: () => { total: number; new: number };
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);

export const InquiryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const inFlight = React.useRef(false);

  const loadInquiries = async () => {
    if (inFlight.current) return;
    if (localStorage.getItem('kb_net_busy') === '1') return;
    inFlight.current = true;
    try {
      const data = await api.getInquiries();
      // Map API response to local interface if needed
      const mapped = data.map((item: any) => ({
        ...item,
        date: item.created_at || item.date || new Date().toISOString(),
        // Ensure other fields are present
        customer_name: item.customer_name || item.name || 'Unknown',
        status: item.status || 'new'
      }));
      setInquiries(mapped);
    } catch (e) {
      console.error("Failed to load inquiries", e);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    loadInquiries();

    // Listen for storage changes (cross-tab sync for local mode)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'krugerr_inquiries') {
        loadInquiries();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(loadInquiries, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const addInquiry = async (inquiryData: Omit<Inquiry, 'id' | 'date' | 'status'>) => {
    // Optimistic update
    const tempId = 'temp-' + Date.now();
    const newInquiry: Inquiry = {
      ...inquiryData,
      id: tempId,
      date: new Date().toISOString(),
      status: 'new'
    };
    setInquiries(prev => [newInquiry, ...prev]);

    try {
      await api.sendInquiry(inquiryData);
      // Reload to get real ID and server data
      await loadInquiries();
    } catch (e) {
      console.error("Failed to add inquiry", e);
      // If API fails, we keep the optimistic update (which might be saved locally by api.ts fallback)
      // But api.sendInquiry ALREADY handles fallback and returns success message.
      // So if it throws, it's a real error.
      // But api.sendInquiry in my implementation catches errors and returns fallback result.
      // So it shouldn't throw.
    }
  };

  const updateInquiryStatus = async (id: string, status: Inquiry['status']) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    await api.updateInquiryStatus(id, status);
  };

  const updateInquiryNotes = async (id: string, notes: string) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    await api.updateInquiryNotes(id, notes);
  };

  const deleteInquiry = (id: string) => {
    setInquiries(prev => prev.filter(i => i.id !== id));
    // API delete not implemented in api.ts yet, but we can add it later
  };


  const getStats = () => {
    return {
      total: inquiries.length,
      new: inquiries.filter(i => i.status === 'new').length
    };
  };

  return (
    <InquiryContext.Provider value={{ inquiries, addInquiry, updateInquiryStatus, updateInquiryNotes, deleteInquiry, getStats }}>
      {children}
    </InquiryContext.Provider>
  );
};

export const useInquiry = () => {
  const context = useContext(InquiryContext);
  if (context === undefined) {
    throw new Error('useInquiry must be used within an InquiryProvider');
  }
  return context;
};
