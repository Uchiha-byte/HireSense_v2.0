// app/api/reference-call/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface ReferenceRequestBody {
  phoneNumber: string;
  candidateName: string;
  referenceName: string;
  companyName?: string;
  roleTitle?: string;
  workDuration?: string;
  emailId?: string;
  meetingDate?: string;
  durationMinutes?: number;
  addCodingInterview?: boolean;
  applicantId?: string;
}

// Helper function to validate email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to format meeting date
function formatMeetingDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return dateString;
  }
}

// Generate Zoom Server-to-Server OAuth Token
async function getZoomAccessToken(): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    console.warn('⚠️ Zoom credentials missing');
    return null;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to get Zoom token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting Zoom token:', error);
    return null;
  }
}

// Helper function to create Zoom Meeting
async function createZoomMeeting(
  topic: string, 
  startTime: string, 
  durationMinutes: number, 
  accessToken: string
) {
  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: topic,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: durationMinutes,
        timezone: 'UTC', // Ensure meetingDate is passed as ISO UTC
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2,
          audio: 'voip',
          auto_recording: 'local' // Set auto recording so watcher picks it up
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Zoom Meeting Creation Failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return null;
    }

    const data = await response.json();
    return {
      join_url: data.join_url,
      meeting_id: data.id.toString()
    };
  } catch (error) {
    console.error('❌ Error creating Zoom meeting:', error);
    return null;
  }
}


// Helper function to send email
async function sendEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP not configured - email not sent');
      return { success: false, error: 'SMTP not configured' };
    }

    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: to,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error sending email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Reference Call API called');

    const body: ReferenceRequestBody = await request.json();
    let candidateName = body.candidateName;

    console.log('📋 Request body received:', {
      referenceName: body.referenceName,
      phoneNumber: body.phoneNumber,
      candidateName: candidateName,
      hasEmail: !!body.emailId,
      hasMeetingDate: !!body.meetingDate,
      duration: body.durationMinutes,
      applicantId: body.applicantId
    });

    const supabase = createServiceRoleClient();

    // If candidate name is "Processing...", try to fetch the real name from DB if already extracted
    if (candidateName === 'Processing...' && body.applicantId) {
       const { data: applicant } = await supabase
         .from('applicants')
         .select('name')
         .eq('id', body.applicantId)
         .single();
       
       if (applicant && applicant.name !== 'Processing...') {
         candidateName = applicant.name;
         console.log(`✨ Recovered real candidate name: ${candidateName}`);
       }
    }

    // Validate required fields
    if (!body.phoneNumber?.trim()) {
      return NextResponse.json({ error: 'Phone Number is required', success: false }, { status: 400 });
    }

    if (!body.candidateName?.trim()) {
      return NextResponse.json({ error: 'Candidate Name is required', success: false }, { status: 400 });
    }

    if (!body.referenceName?.trim()) {
      return NextResponse.json({ error: 'Reference Name is required', success: false }, { status: 400 });
    }

    if (!body.applicantId) {
      return NextResponse.json({ error: 'Applicant ID is required', success: false }, { status: 400 });
    }

    if (body.emailId && !validateEmail(body.emailId)) {
      return NextResponse.json({ error: 'Invalid email format', success: false }, { status: 400 });
    }

    let emailSent = false;
    let emailError: string | undefined = undefined;
    let meetingLink = ''; // Strictly required for references now
    let zoomMeetingId = null;

    const referenceCallId = crypto.randomUUID();

    // Generate Zoom link if we have meeting date
    if (body.meetingDate) {
      console.log(`🚀 Attempting to create Zoom meeting for ${body.meetingDate}`);
      const token = await getZoomAccessToken();
      if (token) {
        const topic = `HireSense Reference Call - ${candidateName} & ${body.referenceName} __[${referenceCallId}]__`;
        const zoomStartTime = new Date(body.meetingDate).toISOString();
        const duration = body.durationMinutes || 15;

        const meetingData = await createZoomMeeting(topic, zoomStartTime, duration, token);
        if (meetingData) {
          meetingLink = meetingData.join_url;
          zoomMeetingId = meetingData.meeting_id;
          console.log(`✅ Zoom Meeting created successfully: ${meetingLink}`);
        } else {
           return NextResponse.json({ error: 'Failed to create Zoom meeting. Verify your Zoom Server-to-Server app scopes (meeting:write) and credentials.', success: false }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Zoom Authentication failed. Please check ZOOM_ACCOUNT_ID and credentials in .env.', success: false }, { status: 500 });
      }
    } else {
        return NextResponse.json({ error: 'Meeting Date is strictly required for Zoom Reference calls.', success: false }, { status: 400 });
    }

    // Optional coding interview link (Judge0-based)
    let codingInterviewUrl: string | undefined;

    if (body.addCodingInterview) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const codingInterviewId = crypto.randomUUID();
      codingInterviewUrl = `${appUrl.replace(/\/$/, '')}/coding-interview/${codingInterviewId}`;

      try {
        const supabase = createServiceRoleClient();
        supabase.from('coding_interviews').insert({
          id: codingInterviewId,
          reference_id: referenceCallId,
          candidate_name: body.candidateName,
          reference_name: body.referenceName,
          email: body.emailId || '',
          meeting_date: body.meetingDate || '',
          coding_interview_url: codingInterviewUrl,
        }).then(({ error: dbError }) => {
          if (dbError) {
            console.warn('⚠️ Failed to persist coding interview record:', dbError);
          } else {
            console.log('✅ Coding interview record persisted');
          }
        });
      } catch (err) {
        console.warn('⚠️ Error while initiating coding interview persistence:', err);
      }
    }

    // Save Reference Call to Supabase Reference Calls Table
    try {
      const supabase = createServiceRoleClient();
      const insertData = {
        id: referenceCallId,
        applicant_id: body.applicantId,
        reference_name: body.referenceName,
        reference_email: body.emailId || null,
        company_name: body.companyName || null,
        role_title: body.roleTitle || null,
        work_duration: body.workDuration || null,
        phone_number: body.phoneNumber,
        scheduled_time: body.meetingDate ? new Date(body.meetingDate).toISOString() : null,
        duration_minutes: body.durationMinutes || 15,
        zoom_join_url: zoomMeetingId ? meetingLink : null,
        zoom_meeting_id: zoomMeetingId,
        coding_interview_url: codingInterviewUrl || null,
        status: 'scheduled'
      };

      const { error: dbError } = await supabase.from('reference_calls').insert(insertData);
      if (dbError) {
        console.error('❌ Failed to insert reference call into DB:', dbError);
        // Continue anyway to send the email
      } else {
        console.log(`✅ Saved Reference Call to DB: ${referenceCallId}`);
      }
    } catch(err) {
      console.warn('⚠️ Insert to reference_calls failed unexpectedly:', err);
    }

    // Send email if both email and meeting date are provided
    if (body.emailId?.trim() && body.meetingDate?.trim()) {
      const formattedDate = formatMeetingDate(body.meetingDate);
      const emailSubject = 'Reference Verification Meeting Invitation';
      const platformName = zoomMeetingId ? 'Zoom Meeting' : 'Google Meet';

      const emailTextBody = `
Hello ${body.referenceName},

You've been listed as a professional reference by ${body.candidateName}.

A brief meeting has been scheduled to verify work details.

Meeting Details:
Date & Time: ${formattedDate}
Duration: ${body.durationMinutes || 15} minutes
Platform: ${platformName}
Meeting Link: ${meetingLink}

${codingInterviewUrl ? `
Coding Interview (Judge0):
An optional coding interview has been enabled for this candidate.
Link: ${codingInterviewUrl}
Note: Clicking this link will launch the Judge0 coding environment.
` : ''}

${body.companyName ? `Company: ${body.companyName}` : ''}
${body.roleTitle ? `Role: ${body.roleTitle}` : ''}
${body.workDuration ? `Duration: ${body.workDuration}` : ''}

Thank you for your time and cooperation. We look forward to speaking with you.

Best regards,
Reference Verification Team
      `.trim();

      const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <p>Hello <strong>${body.referenceName}</strong>,</p>
          
          <p>You've been listed as a professional reference by <strong>${candidateName}</strong>.</p>
          
          <p>A brief meeting has been scheduled to verify work details.</p>
          
          <div style="background-color: #f0f7ff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #d0e7ff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #0b5cff; display: flex; align-items: center; gap: 8px;">
               Zoom Meeting Scheduled
            </h3>
            <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${body.durationMinutes || 15} minutes</p>
            <p style="margin: 20px 0;">
              <a href="${meetingLink}" style="display: inline-block; background-color: #0b5cff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Join Zoom Meeting
              </a>
            </p>
            <p style="font-size: 12px; color: #666; margin-bottom: 0;">Meeting ID: ${zoomMeetingId || 'N/A'}</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
            ${body.companyName ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${body.companyName}</p>` : ''}
            ${body.roleTitle ? `<p style="margin: 5px 0;"><strong>Role:</strong> ${body.roleTitle}</p>` : ''}
            ${body.workDuration ? `<p style="margin: 5px 0;"><strong>Years:</strong> ${body.workDuration}</p>` : ''}
          </div>

          ${codingInterviewUrl ? `
          <div style="background-color: #f9f0ff; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #f3e8ff;">
            <h3 style="margin-top: 0; color: #9333ea;">Coding Interview (Judge0):</h3>
            <p>An optional coding interview has been enabled for this candidate.</p>
            <p style="margin-bottom: 0;">
              <a href="${codingInterviewUrl}" style="display: inline-block; background-color: #9333ea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Launch Judge0 Coding Environment</a>
            </p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">Technical support provided by Judge0 Execution Engine.</p>
          </div>
          ` : ''}
          
          <p>Thank you for your time and cooperation. We look forward to speaking with you.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            <strong>Reference Verification Team</strong><br>
            Powered by HireSense AI
          </p>
        </div>
      `;

      const emailResult = await sendEmail(
        body.emailId,
        emailSubject,
        emailTextBody,
        emailHtmlBody
      );

      if (emailResult.success) {
        emailSent = true;
        console.log('✅ Email sent successfully');
      } else {
        emailError = emailResult.error;
        console.warn('⚠️ Email sending failed:', emailError);
      }
    }

    const response = {
      success: true,
      id: referenceCallId,
      candidateName: body.candidateName,
      referenceName: body.referenceName,
      phoneNumber: body.phoneNumber,
      companyName: body.companyName || '',
      roleTitle: body.roleTitle || '',
      workDuration: body.workDuration || '',
      emailId: body.emailId || '',
      meetingDate: body.meetingDate || '',
      durationMinutes: body.durationMinutes || 15,
      emailSent: emailSent,
      emailError: emailError || undefined,
      addCodingInterview: !!body.addCodingInterview,
      codingInterviewUrl: codingInterviewUrl || '',
      meetingLink: meetingLink,
      message: emailSent
        ? 'Reference saved and Zoom meeting invite sent successfully!'
        : 'Reference saved successfully',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Reference processed successfully:', response.message);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Error processing reference:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: `Failed to process reference: ${errorMessage}`,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}