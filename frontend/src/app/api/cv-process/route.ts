import { NextResponse } from 'next/server';
import { startProcessing, validateRequestBody } from '@/lib/processing';
import { processCvPdf, validateAndCleanCvData } from '@/lib/profile-pdf';
import { CvData } from '@/lib/interfaces/cv';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logActivity, getUserIdFromRequest } from '@/lib/activityLogger';

export async function POST(request: Request) {
  console.log('🔥 [DEBUG] CV-PROCESS API CALLED - NEW CODE');

  // Validate request body
  const bodyValidation = validateRequestBody(request);
  if (bodyValidation) {
    console.log('❌ [DEBUG] Body validation failed');
    return bodyValidation;
  }

  console.log('✅ [DEBUG] Body validation passed');
  const body = await request.json();
  console.log('✅ [DEBUG] Request body parsed:', { applicant_id: body.applicant_id, file_id: body.file_id });
  const { applicant_id, file_id } = body;

  if (!applicant_id) {
    console.log('❌ [DEBUG] Missing applicant_id');
    return NextResponse.json(
      { error: 'applicant_id is required' },
      { status: 400 }
    );
  }

  console.log('✅ [DEBUG] About to call startProcessing');

  try {
    // Use the reusable processing function with timeout
    const processingPromise = startProcessing(
      applicant_id,
      'cv_status',
      async (applicant) => {
        const supabase = createServiceRoleClient();
        let cvData: CvData | null = null;

        if (file_id) {
          // Get file information
          const { data: fileRecord, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', file_id)
            .single();

          if (fileError || !fileRecord) {
            throw new Error('File not found');
          }

          // Download file from Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(fileRecord.storage_bucket)
            .download(fileRecord.storage_path);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download file: ${downloadError?.message}`);
          }

          // Convert blob to buffer and save as temporary file
          const buffer = Buffer.from(await fileData.arrayBuffer());
          const tempFilePath = `./cv_${applicant_id}_${Date.now()}.pdf`;

          // Write to temp file (processCvPdf expects file path)
          const fs = await import('fs');
          fs.writeFileSync(tempFilePath, buffer);

          // Process CV
          console.log(`📄 [DEBUG] Processing CV file for applicant ${applicant_id} - NEW CODE DEPLOYED`);
          const rawCvData = await processCvPdf(tempFilePath, true, `cv_${applicant_id}`);
          cvData = validateAndCleanCvData(rawCvData);

          // Clean up temp file
          fs.unlinkSync(tempFilePath);

        } else if (applicant.cv_data) {
          // CV data already exists, just validate it
          cvData = validateAndCleanCvData(applicant.cv_data);
        } else {
          throw new Error('No CV file or data available');
        }

        // Extract name and email from CV data and update applicant info
        if (cvData) {
          const name = `${cvData.firstName} ${cvData.lastName}`.trim() || applicant.name;
          const email = cvData.email || applicant.email;

          // Update name, email and social links in addition to cv_data
          await supabase
            .from('applicants')
            .update({ 
              name, 
              email,
              linkedin_url: cvData.linkedin || applicant.linkedin_url,
              github_url: cvData.github || applicant.github_url,
              leetcode_url: cvData.leetcode || applicant.leetcode_url,
              cv_data: cvData // Also save the full JSON data
            })
            .eq('id', applicant_id);
        }

        return cvData;
      },
      'CV'
    );

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CV processing timeout after 60 seconds')), 60000);
    });

    const result = await Promise.race([processingPromise, timeoutPromise]);
    console.log('✅ [DEBUG] CV processing completed successfully');

    // Result is a NextResponse. We can try to extract the body to log activity.
    const resultJson = await (result as NextResponse).json();
    const userId = await getUserIdFromRequest();

    if (userId && resultJson.success) {
      await logActivity({
        userId,
        eventType: 'cv_processed',
        title: 'CV Processed',
        description: `Successfully parsed CV for candidate.`,
        applicantId: applicant_id,
        metadata: { file_id }
      });
    }

    return NextResponse.json(resultJson);

  } catch (error) {
    console.error('❌ [DEBUG] CV processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'CV processing failed',
      applicant_id: applicant_id
    }, { status: 500 });
  }
}
