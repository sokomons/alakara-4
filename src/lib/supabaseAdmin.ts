import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase URL or Service Role Key is missing. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseServiceRoleKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
