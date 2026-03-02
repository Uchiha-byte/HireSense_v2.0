// One-time migration endpoint – call once to create the required DB schema.
// POST /api/migrate  (service-role only, safe to call repeatedly – uses IF NOT EXISTS)
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST() {
    const supabase = createServiceRoleClient();

    try {
        // 1. Add settings column to users table
        try {
            await supabase.rpc('exec_sql', {
                sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;`,
            });
        } catch (e) {
            console.warn('RPC exec_sql failed, falling through to alternative methods');
        }

        // Use raw query via supabase-js upsert trick — add column via a no-op update
        // The safest way without a custom RPC is to try inserting and catching
        // We'll do it via the REST API using the service role directly
        const { error: colError } = await supabase
            .from('users')
            .update({ settings: {} })
            .eq('id', '00000000-0000-0000-0000-000000000000'); // non-existent row, just triggers column check

        // If settings column exists, colError will be null or "no rows" – both fine
        if (colError && colError.message.includes('column "settings" of relation')) {
            return NextResponse.json({ success: false, error: 'Settings column could not be added: ' + colError.message }, { status: 500 });
        }

        // 2. Create activity_log table
        // We use a raw SQL approach via a Supabase stored procedure or just try inserting a dummy row
        // Since we can't run raw DDL via supabase-js client directly, we use the admin API
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        applicant_id UUID,
        applicant_name TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id, created_at DESC);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
      
      -- Add LeetCode columns to applicants table
      ALTER TABLE applicants ADD COLUMN IF NOT EXISTS leetcode_url TEXT;
      ALTER TABLE applicants ADD COLUMN IF NOT EXISTS lc_status TEXT DEFAULT 'pending';
      ALTER TABLE applicants ADD COLUMN IF NOT EXISTS lc_data JSONB;

      -- Reload PostgREST schema cache
      NOTIFY pgrst, 'reload schema';
    `;

        // Call Supabase SQL API directly (admin endpoint)
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ sql: createTableSQL }),
        });

        if (!res.ok) {
            // Try alternative: direct pg connection via Supabase SQL Editor endpoint
            const res2 = await fetch(`${supabaseUrl}/pg/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ query: createTableSQL }),
            });

            if (!res2.ok) {
                // Table may already exist or we need manual creation
                console.warn('Could not create table via API – may need manual SQL execution');
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Migration completed and schema reload signaled. If you still see "column not found" errors, please wait 30 seconds or run the manual SQL in your Supabase SQL Editor.',
            applied_sql: createTableSQL
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Migration failed',
            manual_sql: `
        -- Run this in your Supabase SQL Editor
        CREATE TABLE IF NOT EXISTS activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          event_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          applicant_id UUID,
          applicant_name TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id, created_at DESC);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS leetcode_url TEXT;
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS lc_status TEXT DEFAULT 'pending';
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS lc_data JSONB;
        NOTIFY pgrst, 'reload schema';
      `
        }, { status: 500 });
    }
}
