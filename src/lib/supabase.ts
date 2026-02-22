import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqmeycstrdtylhuzmdln.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uHGNB7nTmTCp3yiaea1qbg_t3xHhqRn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
