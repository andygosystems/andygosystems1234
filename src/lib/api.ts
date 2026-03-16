import { supabase } from './supabase';

export const isJson = (res: Response) => {
  const contentType = res.headers.get('content-type');
  return contentType && contentType.includes('application/json');
};

export const api = {
  // --- AUTH ---
  login: async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (e: any) {
      return { error: e.message || 'Login failed' };
    }
  },

  // --- PROPERTIES ---
  getProperties: async (filters: any = {}) => {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_images (url, is_primary),
          property_amenities (name)
        `)
        .order('created_at', { ascending: false });

      // Apply Filters
      if (filters.type && filters.type !== 'any') query = query.eq('type', filters.type);
      if (filters.status && filters.status !== 'any') query = query.eq('status', filters.status);
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.bedrooms && filters.bedrooms !== 'any') query = query.gte('bedrooms', parseInt(filters.bedrooms));

      // Kenyan Land Filters
      if (filters.land_category && filters.land_category !== 'any') query = query.eq('land_category', filters.land_category);
      if (filters.tenure_type && filters.tenure_type !== 'any') query = query.eq('tenure_type', filters.tenure_type);
      if (filters.plot_size && filters.plot_size !== 'any') query = query.eq('plot_size', filters.plot_size);
      if (filters.doc_ready_title === 'true') query = query.eq('doc_ready_title', true);
      if (filters.verified_listing === 'true') query = query.eq('verified_listing', true);
      if (filters.topography && filters.topography !== 'any') query = query.eq('topography', filters.topography);
      if (filters.payment_plan && filters.payment_plan !== 'any') query = query.eq('payment_plan', filters.payment_plan);
      if (filters.proximity_near_main_road === 'true') query = query.eq('proximity_near_main_road', true);

      const { data, error, count } = await query;
      if (error) throw error;

      // Map to frontend structure
      const mapped = (data || []).map(p => ({
        ...p,
        primary_image: p.property_images?.find((img: any) => img.is_primary)?.url || p.property_images?.[0]?.url,
        images: p.property_images?.map((img: any) => img.url) || [],
        amenities: p.property_amenities?.map((am: any) => am.name) || []
      }));

      return { data: mapped, total: count || mapped.length };
    } catch (e: any) {
      console.error("Supabase getProperties Error:", e);
      return { data: [], total: 0, error: e.message };
    }
  },

  addProperty: async (p: any) => {
    try {
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .insert([{
          title: p.title,
          description: p.description,
          price: p.price,
          currency: p.currency || 'KES',
          location: p.location,
          type: p.type,
          status: p.status || 'available',
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          sqm: p.sqm || 0,
          lat: p.lat,
          lng: p.lng,
          property_type: p.property_type,
          virtual_tour_url: p.virtual_tour_url,
          land_category: p.land_category,
          tenure_type: p.tenure_type,
          plot_size: p.plot_size,
          doc_ready_title: !!p.doc_ready_title,
          doc_allotment_letter: !!p.doc_allotment_letter,
          doc_search_conducted: !!p.doc_search_conducted,
          invest_fenced: !!p.invest_fenced,
          invest_beacons: !!p.invest_beacons,
          invest_borehole: !!p.invest_borehole,
          invest_electricity: !!p.invest_electricity,
          proximity_near_main_road: !!p.proximity_near_main_road,
          proximity_distance_cbd: p.proximity_distance_cbd,
          proximity_future_infra: !!p.proximity_future_infra,
          topography: p.topography,
          payment_plan: p.payment_plan,
          verified_listing: !!p.verified_listing
        }])
        .select()
        .single();

      if (propErr) throw propErr;

      // Add Images
      if (Array.isArray(p.images) && p.images.length > 0) {
        const imgs = p.images.map((url: string, i: number) => ({
          property_id: prop.id,
          url,
          is_primary: i === 0
        }));
        await supabase.from('property_images').insert(imgs);
      }

      // Add Amenities
      if (Array.isArray(p.amenities) && p.amenities.length > 0) {
        const ams = p.amenities.map((name: string) => ({
          property_id: prop.id,
          name
        }));
        await supabase.from('property_amenities').insert(ams);
      }

      return { id: prop.id, message: 'Created' };
    } catch (e: any) {
      throw e;
    }
  },

  updateProperty: async (id: string | number, p: any) => {
    try {
      const idStr = String(id);
      const { error: propErr } = await supabase
        .from('properties')
        .update({
          title: p.title,
          description: p.description,
          price: p.price,
          currency: p.currency,
          location: p.location,
          type: p.type,
          status: p.status,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          sqm: p.sqm,
          lat: p.lat,
          lng: p.lng,
          property_type: p.property_type,
          virtual_tour_url: p.virtual_tour_url,
          land_category: p.land_category,
          tenure_type: p.tenure_type,
          plot_size: p.plot_size,
          doc_ready_title: !!p.doc_ready_title,
          doc_allotment_letter: !!p.doc_allotment_letter,
          doc_search_conducted: !!p.doc_search_conducted,
          invest_fenced: !!p.invest_fenced,
          invest_beacons: !!p.invest_beacons,
          invest_borehole: !!p.invest_borehole,
          invest_electricity: !!p.invest_electricity,
          proximity_near_main_road: !!p.proximity_near_main_road,
          proximity_distance_cbd: p.proximity_distance_cbd,
          proximity_future_infra: !!p.proximity_future_infra,
          topography: p.topography,
          payment_plan: p.payment_plan,
          verified_listing: !!p.verified_listing,
          updated_at: new Date().toISOString()
        })
        .eq('id', idStr);

      if (propErr) throw propErr;

      // Refresh Images
      if (Array.isArray(p.images)) {
        await supabase.from('property_images').delete().eq('property_id', idStr);
        const imgs = p.images.map((url: string, i: number) => ({
          property_id: idStr,
          url,
          is_primary: i === 0
        }));
        await supabase.from('property_images').insert(imgs);
      }

      // Refresh Amenities
      if (Array.isArray(p.amenities)) {
        await supabase.from('property_amenities').delete().eq('property_id', idStr);
        const ams = p.amenities.map((name: string) => ({
          property_id: idStr,
          name
        }));
        await supabase.from('property_amenities').insert(ams);
      }

      return { message: 'Updated' };
    } catch (e: any) {
      throw e;
    }
  },

  deleteProperty: async (id: string | number) => {
    try {
      const idStr = String(id);
      const { error } = await supabase.from('properties').delete().eq('id', idStr);
      if (error) throw error;
      return { message: 'Deleted' };
    } catch (e: any) {
      throw e;
    }
  },

  uploadImage: async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (e: any) {
      console.error("Upload error:", e);
      throw e;
    }
  },

  // --- PROJECTS ---
  getProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Supabase getProjects Error:", e);
      return [];
    }
  },

  addProject: async (p: any) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: p.title,
          location: p.location,
          description: p.description,
          images: p.images || [],
          brochure_url: p.brochureUrl,
          estimated_completion: p.estimatedCompletion,
          start_date: p.startDate,
          progress: p.progress || 0,
          auto_progress: !!p.autoProgress,
          status: p.status || 'Planning'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      throw e;
    }
  },

  updateProject: async (id: string, p: any) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: p.title,
          location: p.location,
          description: p.description,
          images: p.images,
          brochure_url: p.brochureUrl,
          estimated_completion: p.estimatedCompletion,
          start_date: p.startDate,
          progress: p.progress,
          auto_progress: !!p.autoProgress,
          status: p.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      throw e;
    }
  },

  deleteProject: async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      throw e;
    }
  },

  // --- CRM & INQUIRIES ---
  getInquiries: async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error("Supabase getInquiries Error:", e);
      return [];
    }
  },

  sendInquiry: async (i: any) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: i.name,
          email: i.email,
          phone: i.phone,
          message: i.message,
          property_id: i.propertyId || null,
          status: 'new'
        }])
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, message: 'Inquiry sent' };
    } catch (e: any) {
      throw e;
    }
  },

  updateInquiryStatus: async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { message: 'Updated' };
    } catch (e: any) {
      throw e;
    }
  },

  updateInquiryNotes: async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { message: 'Updated' };
    } catch (e: any) {
      throw e;
    }
  },

  // --- CRM ANALYTICS ---
  getCRMStats: async (from: string, to: string) => {
    try {
      // For performance, this could be a Supabase RPC or view
      // But for simple inbuilt logic, we'll fetch and count
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', from)
        .lte('created_at', to);

      const { data: props } = await supabase.from('properties').select('id');
      const { data: activeLeases } = await supabase
        .from('leases')
        .select('property_id, amount')
        .eq('status', 'active')
        .lte('start_date', to)
        .gte('end_date', from);
      
      const { data: maintenance } = await supabase
        .from('maintenance_costs')
        .select('amount')
        .gte('date', from)
        .lte('date', to);

      const funnel: Record<string, number> = { inquiry: 0, viewing: 0, negotiation: 0, closed: 0 };
      const sources: Record<string, number> = { whatsapp: 0, facebook: 0, website: 0, referral: 0, other: 0 };
      
      (leads || []).forEach(l => {
        if (funnel[l.stage]) funnel[l.stage]++;
        if (sources[l.source]) sources[l.source]++;
      });

      const totalUnits = props?.length || 0;
      const occupied = new Set(activeLeases?.map(l => l.property_id)).size;
      const leaseIncome = activeLeases?.reduce((acc, l) => acc + Number(l.amount), 0) || 0;
      const maintenanceSum = maintenance?.reduce((acc, m) => acc + Number(m.amount), 0) || 0;

      return {
        funnel,
        sources,
        speed_to_lead_avg: 0, // Placeholder
        occupancy: { occupied, vacant: Math.max(0, totalUnits - occupied), total: totalUnits },
        noi: leaseIncome - maintenanceSum,
        maintenance: maintenanceSum,
        lease_income: leaseIncome,
        dom: 0, // Placeholder
        forecast_next_month: 0, // Placeholder
        range: { from, to }
      };
    } catch (e: any) {
      console.error("Supabase getCRMStats Error:", e);
      throw e;
    }
  },

  // --- CHATS ---
  getChats: async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*, messages(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        startTime: l.created_at,
        lastMessageTime: l.updated_at,
        userName: l.name,
        userPhone: l.phone,
        leadId: l.id,
        messages: l.messages.map((m: any) => ({
          text: m.content,
          isBot: m.role === 'assistant',
          timestamp: m.created_at,
          ...m.metadata
        }))
      }));
    } catch (e: any) {
      console.error("Supabase getChats Error:", e);
      return [];
    }
  },

  startChatSession: async (session: any) => {
    // Lead creation is handled by startChatSession in supabaseCrmService
    return { success: true };
  },

  addChatMessage: async (sessionId: string, message: any) => {
    // Message logging is handled by logMessage in supabaseCrmService
    return { success: true };
  },

  deleteChatSession: async (sessionId: string) => {
    try {
      await supabase.from('leads').delete().eq('id', sessionId);
      return { success: true };
    } catch (e: any) {
      throw e;
    }
  },

  // --- SCRAPER ---
  scrape: async (urls: string[]) => {
    try {
      // Scraper still needs a server to run (CORS prevents browser scraping)
      // We'll call the Node.js server for this specific utility
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      return await res.json();
    } catch (e: any) {
      throw e;
    }
  }
};
