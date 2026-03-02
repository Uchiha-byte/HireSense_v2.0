import { NextResponse } from 'next/server';
import { startProcessing, validateRequestBody } from '@/lib/processing';
import { analyzeApplicant, createErrorFallback } from '@/lib/analysis';
import { Applicant } from '@/lib/interfaces/applicant';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: Request) {
  // Validate request body
  const bodyValidation = validateRequestBody(request);
  if (bodyValidation) return bodyValidation;

  const body = await request.json();
  const { applicant_id } = body;

  if (!applicant_id) {
    return NextResponse.json(
      { error: 'applicant_id is required' },
      { status: 400 }
    );
  }

  // Fetch the current user (for settings + activity logging)
  let userId: string | null = null;
  let detectionPrompt: string | undefined;
  let customWeights: Record<string, number> | undefined;

  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    userId = user?.id ?? null;

    if (userId) {
      // Fetch user settings to apply personalization
      const serviceClient = createServiceRoleClient();
      const { data: userRow } = await serviceClient
        .from('users')
        .select('settings')
        .eq('id', userId)
        .single();

      const settings = userRow?.settings ?? {};

      // Get active preset prompt
      const presets: Array<{ id: string; prompt: string }> = settings.presets ?? [];
      const activePresetId: string = settings.activePresetId ?? '1';
      const activePreset = presets.find((p) => p.id === activePresetId);
      if (activePreset?.prompt) {
        detectionPrompt = activePreset.prompt;
        console.log(`[Analysis] Using custom preset "${activePreset.id}" for applicant ${applicant_id}`);
      }

      // Get scoring weights as a plain object
      const scoringWeights: Array<{ key: string; value: number }> = settings.scoringWeights ?? [];
      if (scoringWeights.length > 0) {
        customWeights = Object.fromEntries(scoringWeights.map((w) => [w.key, w.value]));
      }
    }
  } catch (err) {
    // Non-blocking — proceed with defaults
    console.warn('[Analysis] Could not fetch user settings:', err);
  }

  // Use the reusable processing function with special error handling for AI
  try {
    return await startProcessing(
      applicant_id,
      'ai_status',
      async (applicant) => {
        console.log(`🔍 Running comprehensive analysis for applicant ${applicant_id}`);

        // Run the analysis using the centralized analysis service, with personalization
        const analyzedApplicant = await analyzeApplicant(
          applicant as unknown as Applicant,
          { detectionPrompt, customWeights }
        );

        // Update the score field in database as well as ai_data
        const supabase = createServiceRoleClient();
        await supabase
          .from('applicants')
          .update({
            score: analyzedApplicant.ai_data?.score || null
          })
          .eq('id', applicant_id);

        // Log activity
        if (userId) {
          const score = analyzedApplicant.ai_data?.score ?? 0;
          const flagCount = (analyzedApplicant.ai_data?.flags ?? []).length;
          const isFlagged = score < (settings_flagThreshold) || (analyzedApplicant.ai_data?.flags ?? []).some((f: { type: string }) => f.type === 'red');

          await logActivity({
            userId,
            eventType: isFlagged ? 'candidate_flagged' : 'analysis_complete',
            title: isFlagged
              ? `Candidate Flagged: ${applicant.name as string}`
              : `Analysis Complete: ${applicant.name as string}`,
            description: isFlagged
              ? `Score: ${score}/100 — ${flagCount} flag(s) detected`
              : `Credibility score: ${score}/100`,
            applicantId: applicant_id,
            applicantName: applicant.name as string,
            metadata: { score, flagCount, isFlagged },
          });
        }

        return analyzedApplicant.ai_data;
      },
      'AI Analysis'
    );
  } catch (error) {
    // Special handling for AI analysis errors - still mark as completed with error fallback
    console.error(`❌ AI analysis failed for applicant ${applicant_id}:`, error);

    const errorFallback = createErrorFallback(error instanceof Error ? error.message : 'Analysis failed');

    // For AI analysis, we want to mark as completed even with errors
    const supabase = createServiceRoleClient();
    await supabase
      .from('applicants')
      .update({
        ai_status: 'ready',
        ai_data: errorFallback,
        score: errorFallback.score,
      })
      .eq('id', applicant_id);

    if (userId) {
      await logActivity({
        userId,
        eventType: 'analysis_complete',
        title: `Analysis Error`,
        description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        applicantId: applicant_id,
        metadata: { error: true },
      });
    }

    return NextResponse.json({
      success: true,
      applicant_id,
      ai_data: errorFallback,
      score: errorFallback.score
    });
  }
}

// Flag threshold from settings — fetched inline above, default 65
const settings_flagThreshold = 65;