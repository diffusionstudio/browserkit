import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as env from '../environment';

let supabase: SupabaseClient<any, "public", any> | undefined = undefined;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
} else if (!env.API_KEY) {
  throw new Error('Missing environment variables. API_KEY or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

export async function validateApiKey(key: string): Promise<boolean> {
  if (key === env.API_KEY) return true;
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) {
    return false;
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return true;
}

// export async function generateApiKey(userId: string): Promise<string | null> {
//   const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
//     .map(b => b.toString(16).padStart(2, '0'))
//     .join('');

//   const { data, error } = await supabase
//     .from('api_keys')
//     .insert([
//       {
//         user_id: userId,
//         key,
//         created_at: new Date().toISOString(),
//       },
//     ])
//     .select()
//     .single();

//   if (error || !data) {
//     console.error('Error generating API key:', error);
//     return null;
//   }

//   return key;
// }

// export async function listApiKeys(userId: string): Promise<ApiKey[]> {
//   const { data, error } = await supabase
//     .from('api_keys')
//     .select('*')
//     .eq('user_id', userId)
//     .order('created_at', { ascending: false });

//   if (error) {
//     console.error('Error fetching API keys:', error);
//     return [];
//   }

//   return data || [];
// }

// export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
//   const { error } = await supabase
//     .from('api_keys')
//     .delete()
//     .eq('id', keyId)
//     .eq('user_id', userId);

//   return !error;
// } 