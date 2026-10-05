/**
 * KENNY Brew Intelligence - Supabase Client & REST Connector
 * Provides direct PostgREST compatibility with zero external bundle friction.
 */

const STORAGE_KEY_URL = 'kenny_brew_supabase_url';
const STORAGE_KEY_ANON = 'kenny_brew_supabase_anon';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const url = localStorage.getItem(STORAGE_KEY_URL) || envUrl || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || envKey || '';
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_ANON);
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => Promise<{ data: any; error: any }>;
  insert: (records: any | any[]) => Promise<{ data: any; error: any }>;
  upsert: (records: any | any[]) => Promise<{ data: any; error: any }>;
}

export interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return null;

  const baseUrl = url.replace(/\/$/, '');

  return {
    from: (table: string) => ({
      select: async (columns = '*') => {
        try {
          const res = await fetch(`${baseUrl}/rest/v1/${table}?select=${columns}`, {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      insert: async (records: any | any[]) => {
        try {
          const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(records),
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      upsert: async (records: any | any[]) => {
        try {
          const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(records),
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
    }),
  };
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = anonKey.trim();

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/products?select=count`, {
      method: 'HEAD',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (res.ok || res.status === 200 || res.status === 206) {
      return { success: true, message: 'Successfully connected and verified Supabase database!' };
    }

    if (res.status === 404 || res.status === 400) {
      return {
        success: true,
        message: 'Connected to Supabase! (Database tables need initialization via SQL schema tab).',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'Invalid Supabase API key or insufficient permissions.' };
    }

    return { success: true, message: `Connected to Supabase host (Status code: ${res.status}).` };
  } catch (err: any) {
    return {
      success: false,
      message:
        err.message || 'Connection test failed. Verify network access and your Supabase project URL.',
    };
  }
}
