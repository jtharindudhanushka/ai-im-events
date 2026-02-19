import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function sanitize(s: string) {
    return s.replace(/[<>"'`]/g, '').trim().slice(0, 2000);
}

export async function POST(req: NextRequest) {
    let body: { name?: string; whatsapp?: string; level?: string; reason?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    const { name, whatsapp, level, reason } = body;

    if (!name || !whatsapp || !level || !reason) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Basic phone validation
    if (!/^\+?[\d\s\-().]{7,20}$/.test(whatsapp)) {
        return NextResponse.json({ error: 'Invalid WhatsApp number.' }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('field_trip_registrations').insert({
            name: sanitize(name),
            whatsapp: sanitize(whatsapp),
            level: sanitize(level),
            reason: sanitize(reason),
        });

        if (error) {
            console.error('DB insert error:', error);
            return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Server error.' }, { status: 500 });
    }
}
