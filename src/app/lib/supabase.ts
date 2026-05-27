import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mchikdltrcbovhdzdhhf.supabase.co';
const supabaseAnonKey = 'sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
});