import { NextResponse } from 'next/server';
import { startProcessing, validateRequestBody } from '@/lib/processing';
import { processGitHubAccount } from '@/lib/github';
import { logActivity, getUserIdFromRequest } from '@/lib/activityLogger';

export async function POST(request: Request) {
  // Validate request body
  const bodyValidation = validateRequestBody(request);
  if (bodyValidation) return bodyValidation;

  const body = await request.json();
  const { applicant_id, github_url } = body;

  if (!applicant_id || !github_url) {
    return NextResponse.json(
      { error: 'applicant_id and github_url are required' },
      { status: 400 }
    );
  }

  // Use the reusable processing function
  try {
    const result = await startProcessing(
      applicant_id,
      'gh_status',
      async () => {
        return await processGitHubAccount(github_url, {
          maxRepos: 50,
          includeOrganizations: true,
          analyzeContent: true,
          maxContentAnalysis: 3,
          includeActivity: true
        });
      },
      'GitHub'
    );

    const resultJson = await result.json();
    const userId = await getUserIdFromRequest();

    if (userId && resultJson.success) {
      await logActivity({
        userId,
        eventType: 'github_fetched',
        title: 'GitHub Profile Fetched',
        description: `Successfully analyzed GitHub contributions and repositories.`,
        applicantId: applicant_id,
        metadata: { url: github_url }
      });
    }

    return NextResponse.json(resultJson);
  } catch (error) {
    console.error('GitHub processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'GitHub processing failed',
      applicant_id: applicant_id
    }, { status: 500 });
  }
}
