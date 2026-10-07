import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://yppehqowqgeyydsgnyrj.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_CIhHloXaObmiY9TrZF0-aA_O70rSK1P';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const url = envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = envKey || DEFAULT_SUPABASE_ANON_KEY;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function saveSupabaseConfig(_url: string, _anonKey: string) {
  // Stored Supabase configuration is managed directly via environment or cloud constants
}

// Singleton client for Supabase
const { url, anonKey } = getStoredSupabaseConfig();
export const supabase: SupabaseClient = createClient(url, anonKey);

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export async function testSupabaseConnection(
  testUrl: string = DEFAULT_SUPABASE_URL,
  testKey: string = DEFAULT_SUPABASE_ANON_KEY
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(testUrl.trim(), testKey.trim());
    const { error } = await client.from('products').select('product_id').limit(1);
    if (!error) {
      return { success: true, message: 'Successfully connected and verified Supabase database!' };
    }
    return { success: false, message: error.message || 'Failed to query Supabase products table.' };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Connection test failed. Verify network access and your Supabase project URL.',
    };
  }
}
