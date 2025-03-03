import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './environment';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variables. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
} 

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function getUser(token?: string | string[] | null): Promise<string | null> {
  if (!token || Array.isArray(token)) return null;

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', token)
    .single();

  if (error || !data) {
    return null;
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data.user;
}
