import { supabase } from './supabase';

export const isJson = (res: Response) => {
  const contentType = res.headers.get('content-type');
  return contentType && contentType.includes('application/json');
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

const isTransientNetworkError = (e: any) => {
  const msg = (e?.message || '').toLowerCase();
  if (msg.includes('aborterror')) return true;
  if (msg.includes('network timeout')) return true;
  if (msg.includes('failed to fetch')) return true;
  if (msg.includes('networkerror')) return true;
  const status = typeof e?.status === 'number' ? e.status : undefined;
  if (status && status >= 500) return true;
  return false;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async (fn: () => Promise<any>, opts?: { retries?: number }): Promise<any> => {
  const retries = opts?.retries ?? 3;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt += 1;
      if (attempt > retries || !isTransientNetworkError(e)) throw e;
      const base = 400 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 200);
      await sleep(base + jitter);
    }
  }
};

const asPromise = (value: any): Promise<any> => Promise.resolve(value as any);

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
        `, { count: 'exact' })
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
      if (error) {
        console.error("Supabase Query Error:", error);
        throw error;
      }

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
      console.log("[DEBUG] addProperty payload:", p);
      
      const { data: prop, error: propErr } = await withRetry(() =>
        asPromise(
          supabase
            .from('properties')
            .insert([{
              title: p.title || 'Untitled Property',
              description: p.description || '',
              price: parseFloat(p.price) || 0,
              currency: p.currency || 'KES',
              location: p.location || '',
              type: p.type || 'Sale',
              status: p.status || 'available',
              bedrooms: parseInt(p.bedrooms || p.beds) || 0,
              bathrooms: parseInt(p.bathrooms || p.baths) || 0,
              sqm: parseInt(p.sqm || p.sqft) || 0,
              lat: parseFloat(p.lat) || null,
              lng: parseFloat(p.lng) || null,
              property_type: p.property_type || null,
              virtual_tour_url: p.virtual_tour_url || null,
              video_url: p.video_url || null,
              video_urls: Array.isArray(p.video_urls) ? p.video_urls : (p.video_url ? [p.video_url] : []),
              price_on_request: !!p.price_on_request,
              flags: Array.isArray(p.flags) ? p.flags : []
            }])
            .select('id')
            .single()
        )
      );

      if (propErr) {
        console.error("[DEBUG] Supabase Properties Insert Error:", propErr);
        throw propErr;
      }

      console.log("[DEBUG] Property created, id:", prop.id);

      // Add Images
      if (Array.isArray(p.images) && p.images.length > 0) {
        const imgs = p.images.map((url: string, i: number) => ({
          property_id: prop.id,
          url,
          is_primary: i === 0
        }));
        const { error: imgErr } = await withRetry(() => asPromise(supabase.from('property_images').insert(imgs)));
        if (imgErr) console.error("[DEBUG] Image Insert Error:", imgErr);
      }

      // Add Amenities
      if (Array.isArray(p.amenities) && p.amenities.length > 0) {
        const ams = p.amenities.map((name: string) => ({
          property_id: prop.id,
          name
        }));
        const { error: amErr } = await withRetry(() => asPromise(supabase.from('property_amenities').insert(ams)));
        if (amErr) console.error("[DEBUG] Amenities Insert Error:", amErr);
      }

      return { id: prop.id, message: 'Created' };
    } catch (e: any) {
      console.error("[DEBUG] addProperty caught error:", e);
      throw e;
    }
  },

  bulkAddProperties: async (items: any[]) => {
    const results: { title: string; status: 'ok' | 'error'; id?: string; details?: string }[] = [];
    const chunkSize = 5;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      try {
        const rows = chunk.map(p => ({
          title: p.title || 'Untitled Property',
          description: p.description || '',
          price: parseFloat(p.price) || 0,
          currency: p.currency || 'KES',
          location: p.location || '',
          type: p.type || 'Sale',
          status: p.status || 'available',
          bedrooms: parseInt(p.bedrooms || p.beds) || 0,
          bathrooms: parseInt(p.bathrooms || p.baths) || 0,
          sqm: parseInt(p.sqm || p.sqft) || 0,
          lat: parseFloat(p.lat) || null,
          lng: parseFloat(p.lng) || null,
          property_type: p.property_type || null,
          virtual_tour_url: p.virtual_tour_url || null,
          land_category: p.land_category || null,
          tenure_type: p.tenure_type || null,
          plot_size: p.plot_size || null,
        }));

        const { data: inserted, error: insertErr } = await withRetry(() =>
          asPromise(
            supabase
              .from('properties')
              .insert(rows)
              .select('id,title')
          )
        );

        if (insertErr) throw insertErr;
        const insertedRows = inserted || [];

        const imageRows: any[] = [];
        const amenityRows: any[] = [];

        for (let j = 0; j < insertedRows.length; j++) {
          const ins = insertedRows[j] as any;
          const original = chunk[j] || {};

          const imgs = Array.isArray(original.images) ? original.images : [];
          for (let k = 0; k < imgs.length; k++) {
            imageRows.push({ property_id: ins.id, url: imgs[k], is_primary: k === 0 });
          }

          const ams = Array.isArray(original.amenities)
            ? original.amenities
            : (Array.isArray(original.keywords) ? original.keywords : []);
          for (const name of ams) {
            amenityRows.push({ property_id: ins.id, name });
          }

          results.push({ title: ins.title || original.title || 'Untitled Property', status: 'ok', id: ins.id });
        }

        if (imageRows.length > 0) {
          const { error: imgErr } = await withRetry(() => asPromise(supabase.from('property_images').insert(imageRows)));
          if (imgErr) {
            console.error("Supabase bulk image insert error:", errorMessage(imgErr));
            for (const r of results.filter(r => r.status === 'ok' && insertedRows.some((ins: any) => ins.id === r.id))) {
              r.details = (r.details ? r.details + '; ' : '') + `Image insert failed: ${errorMessage(imgErr)}`;
            }
          }
        }

        if (amenityRows.length > 0) {
          const { error: amErr } = await withRetry(() => asPromise(supabase.from('property_amenities').insert(amenityRows)));
          if (amErr) {
            console.error("Supabase bulk amenities insert error:", errorMessage(amErr));
            for (const r of results.filter(r => r.status === 'ok' && insertedRows.some((ins: any) => ins.id === r.id))) {
              r.details = (r.details ? r.details + '; ' : '') + `Amenity insert failed: ${errorMessage(amErr)}`;
            }
          }
        }
      } catch (e: any) {
        const msg = errorMessage(e);
        for (const p of chunk) {
          results.push({ title: p.title || 'Untitled Property', status: 'error', details: msg });
        }
      }
    }

    return results;
  },

  updateProperty: async (id: string | number, p: any) => {
    try {
      const idStr = String(id);
      const { error: propErr } = await withRetry(() =>
        asPromise(
          supabase
            .from('properties')
            .update({
          title: p.title,
          description: p.description,
          price: typeof p.price === 'string' ? (parseFloat(p.price) || 0) : (p.price ?? 0),
          currency: p.currency || 'KES',
          location: p.location,
          type: p.type,
          status: p.status,
          bedrooms: typeof p.bedrooms === 'string' ? (parseInt(p.bedrooms) || 0) : (p.bedrooms ?? 0),
          bathrooms: typeof p.bathrooms === 'string' ? (parseInt(p.bathrooms) || 0) : (p.bathrooms ?? 0),
          sqm: typeof p.sqm === 'string' ? (parseInt(p.sqm) || 0) : (p.sqm ?? 0),
          lat: p.lat === '' || p.lat === undefined ? null : (typeof p.lat === 'string' ? (parseFloat(p.lat) || null) : p.lat),
          lng: p.lng === '' || p.lng === undefined ? null : (typeof p.lng === 'string' ? (parseFloat(p.lng) || null) : p.lng),
          property_type: p.property_type,
          virtual_tour_url: p.virtual_tour_url,
          video_url: p.video_url || null,
          video_urls: Array.isArray(p.video_urls) ? p.video_urls : (p.video_url ? [p.video_url] : []),
          price_on_request: !!p.price_on_request,
          flags: Array.isArray(p.flags) ? p.flags : [],
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
            .eq('id', idStr)
        )
      );

      if (propErr) throw propErr;

      // Refresh Images
      if (Array.isArray(p.images)) {
        const { error: delErr } = await withRetry(() => asPromise(supabase.from('property_images').delete().eq('property_id', idStr)));
        if (delErr) throw delErr;
        const imgs = p.images.map((url: string, i: number) => ({
          property_id: idStr,
          url,
          is_primary: i === 0
        }));
        if (imgs.length > 0) {
          const { error: insErr } = await withRetry(() => asPromise(supabase.from('property_images').insert(imgs)));
          if (insErr) throw insErr;
        }
      }

      // Refresh Amenities
      if (Array.isArray(p.amenities)) {
        const { error: delErr } = await withRetry(() => asPromise(supabase.from('property_amenities').delete().eq('property_id', idStr)));
        if (delErr) throw delErr;
        const ams = p.amenities.map((name: string) => ({
          property_id: idStr,
          name
        }));
        if (ams.length > 0) {
          const { error: insErr } = await withRetry(() => asPromise(supabase.from('property_amenities').insert(ams)));
          if (insErr) throw insErr;
        }
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
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    const { error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw new Error(
        error.message === 'The resource already exists'
          ? `File already exists: ${fileName}`
          : `Storage upload failed: ${error.message} (Check that the "property-images" bucket exists and the admin has INSERT policy on storage.objects)`
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return { url: publicUrl };
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
      console.error("Supabase getProjects Error:", errorMessage(e));
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
          status: p.status || 'Planning',
          video_url: p.videoUrl || null
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
          video_url: p.videoUrl || null,
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
      // Normalize field names for the admin UI (DB uses 'name', UI expects 'customer_name')
      return (data || []).map((row: any) => ({
        ...row,
        customer_name: row.customer_name || row.name || 'Unknown',
        message: row.message || row.notes || '',
      }));
    } catch (e: any) {
      console.error("Supabase getInquiries Error:", errorMessage(e));
      return [];
    }
  },

  sendInquiry: async (i: any) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: i.customer_name || i.name || 'Unknown',
          email: i.email || null,
          phone: i.phone || null,
          message: i.message || null,
          subject: i.subject || null,
          property_id: i.property_id ? String(i.property_id) : (i.propertyId ? String(i.propertyId) : null),
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
      // Map frontend-only statuses to valid DB CHECK values
      const dbStatusMap: Record<string, string> = {
        archived: 'closed',
        read: 'contacted',
        qualified: 'qualified',
        closed: 'closed',
        contacted: 'contacted',
        new: 'new',
      };
      const dbStatus = dbStatusMap[status] || 'new';
      const { error } = await supabase
        .from('leads')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
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
      console.error("Supabase getCRMStats Error:", errorMessage(e));
      throw e;
    }
  },

  // --- CHATS ---
  getChats: async () => {
    try {
      // Use inner join so only leads that have AI chat messages appear in Chats panel
      const { data, error } = await supabase
        .from('leads')
        .select('*, messages!inner(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        startTime: l.created_at,
        lastMessageTime: l.updated_at,
        userName: l.name,
        userPhone: l.phone,
        leadId: l.id,
        messages: (l.messages || []).map((m: any) => ({
          text: m.content,
          isBot: m.role === 'assistant',
          timestamp: m.created_at,
          ...m.metadata
        }))
      }));
    } catch (e: any) {
      console.error("Supabase getChats Error:", errorMessage(e));
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

  uploadVideo: async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return { url: publicUrl };
  },

  // --- PROPERTY VISIT TRACKING ---
  trackPropertyVisit: async (propertyId: string, visitorId?: string) => {
    try {
      await supabase.from('property_visits').insert([{
        property_id: String(propertyId),
        visitor_id: visitorId || null,
      }]);
    } catch {
      // Non-critical — silently ignore tracking failures
    }
  },

  getPropertyVisitStats: async (days = 7): Promise<Array<{ property_id: string; visited_at: string; visitor_id: string | null }>> => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('property_visits')
        .select('property_id, visited_at, visitor_id')
        .gte('visited_at', since.toISOString())
        .order('visited_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error('getPropertyVisitStats error:', e.message);
      return [];
    }
  },

  // --- SCRAPER ---
  scrape: async (urls: string[]) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = supabaseUrl 
        ? `${supabaseUrl}/functions/v1/scrape-properties`
        : 'https://iuyasnhjevxzidpsolfz.functions.supabase.co/scrape-properties';

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ urls }),
      });
      return await res.json();
    } catch (e: any) {
      throw e;
    }
  }
};
