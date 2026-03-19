
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}
if (isPublishableKey) {
  console.error('Invalid Supabase key: use the anon public key (starts with "eyJ..."), not sb_publishable_.');
}

export const hasSupabaseEnv =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder' &&
  !isPublishableKey;

const safeFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const nextInit: RequestInit | undefined = init
    ? { ...init, signal: controller.signal }
    : { signal: controller.signal };

  return fetch(input, nextInit).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: { fetch: safeFetch },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type Profile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  type: 'Sale' | 'Rent';
  status: 'available' | 'sold' | 'rented';
  image_urls: string[];
  amenities: string[];
  beds: number;
  baths: number;
  sqft: number;
  coords: number[]; // [lat, lng]
  agent_id?: string;
  created_at: string;
};

export type Inquiry = {
  id: string;
  property_id?: string;
  customer_name: string;
  email: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
};
