// Server-side utility to log activity events to the activity_log table
// Import and call from any API route — fires and forgets (non-blocking)
import { createServiceRoleClient } from '@/lib/supabase/server';

export type ActivityEventType =
    | 'applicant_created'
    | 'analysis_complete'
    | 'candidate_flagged'
    | 'applicant_deleted'
    | 'settings_saved'
    | 'reference_called'
    | 'linkedin_fetched'
    | 'github_fetched'
    | 'leetcode_fetched'
    | 'cv_processed';

export interface LogActivityOptions {
    userId: string;
    eventType: ActivityEventType;
    title: string;
    description?: string;
    applicantId?: string;
    applicantName?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Insert an activity log row. Non-blocking — errors are swallowed so they
 * never break the calling endpoint.
 */
export async function logActivity(opts: LogActivityOptions): Promise<void> {
    try {
        const supabase = createServiceRoleClient();
        const { error } = await supabase.from('activity_log').insert({
            user_id: opts.userId,
            event_type: opts.eventType,
            title: opts.title,
            description: opts.description ?? null,
            applicant_id: opts.applicantId ?? null,
            applicant_name: opts.applicantName ?? null,
            metadata: opts.metadata ?? {},
        });
        if (error) {
            // graceful: table may not exist yet
            if (error.code !== '42P01') {
                console.warn('[logActivity] Insert failed:', error.message);
            }
        }
    } catch (err) {
        console.warn('[logActivity] Unexpected error:', err);
    }
}

/**
 * Best-effort: get the user_id from the calling request using cookie-based auth.
 * Returns null if not authenticated (non-throwing).
 */
export async function getUserIdFromRequest(): Promise<string | null> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}
