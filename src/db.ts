import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yqmeycstrdtylhuzmdln.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_uHGNB7nTmTCp3yiaea1qbg_t3xHhqRn';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
