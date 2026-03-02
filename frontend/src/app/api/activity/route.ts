// GET  /api/activity        → fetch user activity log (last 100 events)
// POST /api/activity        → insert an activity event (internal server use)
import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventType = searchParams.get('event_type');
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);

        const serviceClient = createServiceRoleClient();
        let query = serviceClient
            .from('activity_log')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (eventType && eventType !== 'all') {
            query = query.eq('event_type', eventType);
        }

        const { data, error } = await query;

        if (error) {
            // Table may not exist yet
            if (error.code === '42P01') {
                return NextResponse.json({ events: [], message: 'Activity log not yet initialized. Run the migration.' });
            }
            console.error('Error fetching activity:', error);
            return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
        }

        return NextResponse.json({ logs: data ?? [] });
    } catch (error) {
        console.error('Activity GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, event_type, title, description, applicant_id, applicant_name, metadata } = body;

        if (!user_id || !event_type || !title) {
            return NextResponse.json({ error: 'user_id, event_type and title are required' }, { status: 400 });
        }

        const serviceClient = createServiceRoleClient();
        const { data, error } = await serviceClient
            .from('activity_log')
            .insert({ user_id, event_type, title, description, applicant_id, applicant_name, metadata: metadata ?? {} })
            .select()
            .single();

        if (error) {
            // Graceful failure — don't break calling code
            if (error.code === '42P01') {
                console.warn('activity_log table does not exist yet. Run /api/migrate POST first.');
                return NextResponse.json({ success: false, message: 'Table not ready' });
            }
            console.error('Error inserting activity:', error);
            return NextResponse.json({ error: 'Failed to insert activity' }, { status: 500 });
        }

        return NextResponse.json({ success: true, event: data });
    } catch (error) {
        console.error('Activity POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
