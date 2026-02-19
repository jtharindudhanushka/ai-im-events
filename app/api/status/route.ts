import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase';

// Public — no auth needed. Returns whether registrations are paused.
export async function GET() {
    try {
        const supabase = createPublicClient();
        const { data, error } = await supabase
            .from('field_trip_settings')
            .select('value')
            .eq('key', 'registrations_paused')
            .single();

        if (error) throw error;

        return NextResponse.json({ paused: data?.value === 'true' });
    } catch (err) {
        console.error('Status check error:', err);
        // Default to not paused if DB unavailable
        return NextResponse.json({ paused: false });
    }
}
