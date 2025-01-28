import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createClient2 = () => {
  const cookieStore = cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: true,
        storageKey: 'sb-session'
      },
      global: {
        headers: {
          'Cookie': cookieStore.toString()
        }
      }
    }
  );
};