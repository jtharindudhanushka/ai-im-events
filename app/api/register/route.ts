import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function sanitize(s: string) {
    return s.replace(/[<>"'`]/g, '').trim().slice(0, 2000);
}

export async function POST(req: NextRequest) {
    let body: { name?: string; whatsapp?: string; email?: string; level?: string; reason?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    const { name, whatsapp, email, level, reason } = body;

    if (!name || !whatsapp || !email || !level || !reason) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Basic phone validation (7-15 digits)
    const phoneDigits = whatsapp.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return NextResponse.json({ error: 'Invalid phone number length.' }, { status: 400 });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Reason validation (min 10 chars)
    if (reason.trim().length < 10) {
        return NextResponse.json({ error: 'Please provide a more detailed reason.' }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('field_trip_registrations').insert({
            name: sanitize(name),
            whatsapp: sanitize(whatsapp),
            email: sanitize(email),
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
