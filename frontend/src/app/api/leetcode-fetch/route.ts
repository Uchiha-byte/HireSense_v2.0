import { NextResponse } from 'next/server';
import { startProcessing, validateRequestBody } from '@/lib/processing';
import { fetchLeetCodeProfile, extractLeetCodeUsername } from '@/lib/leetcode';
import { logActivity, getUserIdFromRequest } from '@/lib/activityLogger';

export async function POST(request: Request) {
    // Validate request body
    const bodyValidation = validateRequestBody(request);
    if (bodyValidation) return bodyValidation;

    const body = await request.json();
    const { applicant_id, leetcode_url } = body;

    if (!applicant_id || !leetcode_url) {
        return NextResponse.json(
            { error: 'applicant_id and leetcode_url are required' },
            { status: 400 }
        );
    }

    const username = extractLeetCodeUsername(leetcode_url);
    if (!username) {
        return NextResponse.json(
            { error: 'Could not extract LeetCode username from URL' },
            { status: 400 }
        );
    }

    try {
        const result = await startProcessing(
            applicant_id,
            'lc_status',
            async () => {
                const data = await fetchLeetCodeProfile(username);
                console.log(`📊 LeetCode Data to save for ${applicant_id}:`, {
                    username: data.username,
                    totalSolved: data.totalSolved,
                    ranking: data.ranking
                });
                return data;
            },
            'LeetCode'
        );

        const resultJson = await result.json();
        const userId = await getUserIdFromRequest();

        if (userId && resultJson.success) {
            await logActivity({
                userId,
                eventType: 'leetcode_fetched',
                title: 'LeetCode Stats Fetched',
                description: `Successfully analyzed LeetCode profile for ${username}.`,
                applicantId: applicant_id,
                metadata: { url: leetcode_url, username }
            });
        }

        return NextResponse.json(resultJson);
    } catch (error) {
        console.error('LeetCode processing failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'LeetCode processing failed',
            applicant_id: applicant_id
        }, { status: 500 });
    }
}
