import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from('nimbo_profiles').select('id').limit(1);

if (error) {
  console.log(JSON.stringify({ ok: false, projectUrl: url, schemaReady: false, error: error.message }, null, 2));
  process.exit(2);
}

console.log(JSON.stringify({ ok: true, projectUrl: url, schemaReady: true, sampleRows: data?.length ?? 0 }, null, 2));
