import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization');
    const secret = process.env.ADMIN_SECRET;
    return !!(secret && auth === `Bearer ${secret}`);
}

// GET /api/admin?format=json|csv
export async function GET(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const format = new URL(req.url).searchParams.get('format') ?? 'json';

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('field_trip_registrations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10000);

        if (error) throw error;

        const rows = data ?? [];

        if (format === 'csv') {
            const header = 'ID,Name,WhatsApp,Email,Level,Reason,Registered At\n';
            const body = rows
                .map((r) =>
                    [
                        r.id,
                        `"${r.name.replace(/"/g, '""')}"`,
                        r.whatsapp,
                        `"${r.email || ''}"`,
                        `"${r.level}"`,
                        `"${r.reason.replace(/"/g, '""')}"`,
                        new Date(r.created_at).toLocaleString('en-GB'),
                    ].join(',')
                )
                .join('\n');

            return new NextResponse(header + body, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="field_trip_registrations_${Date.now()}.csv"`,
                },
            });
        }

        return NextResponse.json({ data: rows });
    } catch (err) {
        console.error('Admin GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch data.' }, { status: 500 });
    }
}

// POST /api/admin — bulk actions
export async function POST(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let body: { action?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    if (body.action === 'delete_duplicates') {
        try {
            const supabase = createAdminClient();

            // Fetch all rows ordered oldest-first so we know which to keep
            const { data, error: fetchErr } = await supabase
                .from('field_trip_registrations')
                .select('id, name, whatsapp')
                .order('created_at', { ascending: true })
                .limit(20000);

            if (fetchErr) throw fetchErr;

            const rows = data ?? [];

            // Keep the first occurrence of each (name, whatsapp) pair
            const seen = new Set<string>();
            const toDelete: string[] = [];
            for (const row of rows) {
                const key = `${row.name.trim().toLowerCase()}|${row.whatsapp.trim()}`;
                if (seen.has(key)) {
                    toDelete.push(row.id);
                } else {
                    seen.add(key);
                }
            }

            if (toDelete.length === 0) {
                return NextResponse.json({ deleted: 0 });
            }

            // Delete in batches of 500 to stay within URL length limits
            const BATCH = 500;
            for (let i = 0; i < toDelete.length; i += BATCH) {
                const batch = toDelete.slice(i, i + BATCH);
                const { error: delErr } = await supabase
                    .from('field_trip_registrations')
                    .delete()
                    .in('id', batch);
                if (delErr) throw delErr;
            }

            return NextResponse.json({ deleted: toDelete.length });
        } catch (err) {
            console.error('delete_duplicates error:', err);
            return NextResponse.json({ error: 'Failed to delete duplicates.' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

// DELETE /api/admin — delete a registration
export async function DELETE(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let body: { id?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    if (!body.id) {
        return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('field_trip_registrations')
            .delete()
            .eq('id', body.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin DELETE error:', err);
        return NextResponse.json({ error: 'Failed to delete registration.' }, { status: 500 });
    }
}

// PATCH /api/admin  — toggle pause state
export async function PATCH(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let body: { paused?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    if (typeof body.paused !== 'boolean') {
        return NextResponse.json({ error: 'paused must be a boolean.' }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('field_trip_settings')
            .update({ value: body.paused ? 'true' : 'false' })
            .eq('key', 'registrations_paused');

        if (error) throw error;

        return NextResponse.json({ paused: body.paused });
    } catch (err) {
        console.error('Admin PATCH error:', err);
        return NextResponse.json({ error: 'Failed to update setting.' }, { status: 500 });
    }
}

// GET /api/admin/status — public endpoint to check pause state (no auth needed)
export async function HEAD(req: NextRequest) {
    // Not used — pause status is in /api/status
    return new NextResponse(null, { status: 200 });
}
