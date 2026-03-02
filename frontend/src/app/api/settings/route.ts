// GET  /api/settings  → fetch user settings
// PUT  /api/settings  → save user settings
import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = createServiceRoleClient();
        const { data, error } = await serviceClient
            .from('users')
            .select('settings')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        return NextResponse.json({ settings: data?.settings ?? {} });
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
        }

        const serviceClient = createServiceRoleClient();

        // Fetch current settings to merge
        const { data: current } = await serviceClient
            .from('users')
            .select('settings')
            .eq('id', user.id)
            .single();

        const merged = { ...(current?.settings ?? {}), ...settings };

        const { error: updateError } = await serviceClient
            .from('users')
            .update({ settings: merged })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error saving settings:', updateError);
            return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
        }

        // Log the settings_saved activity (fire and forget)
        void serviceClient.from('activity_log').insert({
            user_id: user.id,
            event_type: 'settings_saved',
            title: 'Settings Updated',
            description: `Personalize settings saved: ${Object.keys(settings).join(', ')}`,
            metadata: { keys_updated: Object.keys(settings) },
        });

        return NextResponse.json({ success: true, settings: merged });
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
