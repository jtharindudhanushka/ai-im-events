import { createClient } from '@supabase/supabase-js';

// Public client — for anonymous reads (checking pause state etc.)
export function createPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Admin/service client — server-side ONLY
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) throw new Error('Missing Supabase service role env vars');
    return createClient(url, key, {
        auth: { persistSession: false },
    });
}
