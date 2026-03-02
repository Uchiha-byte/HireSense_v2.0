import { NextResponse } from 'next/server';
import { startProcessing, validateRequestBody } from '@/lib/processing';
import { startLinkedInJob, checkLinkedInJob, processLinkedInData, generateDummyLinkedInData } from '@/lib/linkedin-api';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logActivity, getUserIdFromRequest } from '@/lib/activityLogger';

export async function POST(request: Request) {
  // Validate request body
  const bodyValidation = validateRequestBody(request);
  if (bodyValidation) return bodyValidation;

  const body = await request.json();
  const { applicant_id, linkedin_url } = body;

  if (!applicant_id || !linkedin_url) {
    return NextResponse.json(
      { error: 'applicant_id and linkedin_url are required' },
      { status: 400 }
    );
  }

  // Use standard processing - we'll handle special responses after
  try {
    const result = await startProcessing(
      applicant_id,
      'li_status',
      async () => {
        // Check if LinkedIn scraping is disabled
        const scrapingEnabled = process.env.NEXT_PUBLIC_LINKEDIN_SCRAPING_ENABLED !== 'false';

        if (!scrapingEnabled) {
          console.log(`🎭 Using dummy LinkedIn data for ${applicant_id} (scraping disabled)`);
          return generateDummyLinkedInData(linkedin_url);
        }

        console.log(`🚀 Starting LinkedIn job for ${applicant_id}`);
        const { jobId, isExisting } = await startLinkedInJob(linkedin_url);

        let linkedinData;

        if (isExisting) {
          // For existing snapshots, try to get data directly
          console.log(`♻️ Using existing LinkedIn snapshot ${jobId}`);
          const result = await checkLinkedInJob(jobId, true);
          if (result.data) {
            linkedinData = processLinkedInData(result.data);
          } else {
            return {
              error: 'existing_snapshot_no_data',
              message: 'No data available from existing snapshot',
              processed_at: new Date().toISOString()
            };
          }
        } else {
          // Poll until complete for new jobs
          console.log(`⏳ Waiting for LinkedIn job ${jobId} to complete...`);
          let attempts = 0;
          const maxAttempts = 36; // Reduced from 60 to 36 (3 minutes max)
          let lastStatus = 'unknown';

          while (attempts < maxAttempts) {
            const result = await checkLinkedInJob(jobId);

            // Log status changes for better monitoring
            if (result.status !== lastStatus) {
              console.log(`📊 LinkedIn job ${jobId} status changed: ${lastStatus} → ${result.status} (attempt ${attempts + 1}/${maxAttempts})`);
              lastStatus = result.status;
            }

            if (result.status === 'completed' && result.data) {
              linkedinData = processLinkedInData(result.data);
              console.log(`✅ LinkedIn job ${jobId} completed successfully with data`);
              break;
            } else if (result.status === 'failed') {
              console.log(`❌ LinkedIn job ${jobId} failed - profile may be private or inaccessible`);
              return {
                error: 'profile_not_accessible',
                message: 'LinkedIn profile not accessible - snapshot empty or blocked',
                processed_at: new Date().toISOString()
              };
            } else if (result.status === 'completed' && !result.data) {
              // This should not happen with our updated logic, but handle it gracefully
              console.log(`⚠️ LinkedIn job ${jobId} completed but returned no data - treating as failed`);
              return {
                error: 'profile_no_data',
                message: 'LinkedIn profile returned no data',
                processed_at: new Date().toISOString()
              };
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          }

          if (!linkedinData) {
            console.log(`⏰ LinkedIn job ${jobId} timed out after ${maxAttempts} attempts`);
            return {
              error: 'profile_timeout',
              message: `LinkedIn job timed out after ${Math.floor(maxAttempts * 5 / 60)} minutes`,
              processed_at: new Date().toISOString()
            };
          }
        }

        // Check if we got an error response instead of data
        if (linkedinData && typeof linkedinData === 'object' && 'error' in linkedinData) {
          // Handle profile accessibility issues by marking as not_provided
          const errorData = linkedinData as unknown as { error: string; message: string; processed_at: string };
          console.log(`🔒 LinkedIn profile not accessible for ${applicant_id} - ${errorData.message}`);

          // Update the applicant directly to bypass startProcessing error handling
          const supabase = createServiceRoleClient();
          await supabase
            .from('applicants')
            .update({
              li_status: 'not_provided',
              li_data: linkedinData
            })
            .eq('id', applicant_id);

          // Return a response that indicates success but with not_provided status
          throw new Error(`HANDLE_AS_NOT_PROVIDED: ${errorData.message}`);
        }

        // Update name from LinkedIn data if available
        if (linkedinData && linkedinData.name) {
          const supabase = createServiceRoleClient();
          await supabase
            .from('applicants')
            .update({ name: linkedinData.name })
            .eq('id', applicant_id);
        }

        return linkedinData;
      },
      'LinkedIn'
    );

    const resultJson = await result.json();
    const userId = await getUserIdFromRequest();

    if (userId && resultJson.success) {
      await logActivity({
        userId,
        eventType: 'linkedin_fetched',
        title: 'LinkedIn Data Fetched',
        description: `Successfully synchronized LinkedIn profile data.`,
        applicantId: applicant_id,
        metadata: { url: linkedin_url }
      });
    }

    return NextResponse.json(resultJson);
  } catch (error) {
    // Check if this is our special "not provided" error
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.startsWith('HANDLE_AS_NOT_PROVIDED:')) {
      // This was already handled - return success response
      const userId = await getUserIdFromRequest();
      if (userId) {
        await logActivity({
          userId,
          eventType: 'linkedin_fetched',
          title: 'LinkedIn Not Accessible',
          description: `LinkedIn profile was inaccessible for ${applicant_id}.`,
          applicantId: applicant_id,
          metadata: { error: errorMessage }
        });
      }
      return NextResponse.json({
        success: true,
        applicant_id: applicant_id,
        message: 'LinkedIn profile not accessible - marked as not provided'
      });
    }

    // Re-throw other errors to let startProcessing handle them normally
    // But first check if it's a known API error that should be 400
    if ((error as any).status === 400) {
      return NextResponse.json({
        success: false,
        error: (error as Error).message,
        details: (error as any).details,
        applicant_id: applicant_id
      }, { status: 400 });
    }

    console.error('LinkedIn processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'LinkedIn processing failed',
      applicant_id: applicant_id
    }, { status: 500 });
  }
}