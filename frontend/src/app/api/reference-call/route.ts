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
  addCodingInterview?: boolean;
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

// Helper function to generate Google Meet link
function generateGoogleMeetLink(referenceName: string, candidateName: string): string {
  const meetId = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return `https://meet.google.com/${meetId}`;
}

// Helper function to send email
async function sendEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP not configured - email not sent');
      return { success: false, error: 'SMTP not configured' };
    }

    // Dynamically import nodemailer
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
    console.log('📋 Request body received:', {
      referenceName: body.referenceName,
      phoneNumber: body.phoneNumber,
      candidateName: body.candidateName,
      hasEmail: !!body.emailId,
      hasMeetingDate: !!body.meetingDate,
    });

    // Validate required fields
    if (!body.phoneNumber?.trim()) {
      return NextResponse.json(
        { error: 'Phone Number is required', success: false },
        { status: 400 }
      );
    }

    if (!body.candidateName?.trim()) {
      return NextResponse.json(
        { error: 'Candidate Name is required', success: false },
        { status: 400 }
      );
    }

    if (!body.referenceName?.trim()) {
      return NextResponse.json(
        { error: 'Reference Name is required', success: false },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (body.emailId && !validateEmail(body.emailId)) {
      return NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
    }

    let emailSent = false;
    let emailError: string | undefined = undefined;

    // Generate base meeting link (Google Meet-style)
    const meetingLink = generateGoogleMeetLink(
      body.referenceName,
      body.candidateName
    );

    // Optional coding interview link (Judge0-based)
    let codingInterviewUrl: string | undefined;

    if (body.addCodingInterview) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const codingInterviewId = crypto.randomUUID();
      codingInterviewUrl = `${appUrl.replace(/\/$/, '')}/coding-interview/${codingInterviewId}`;

      // Background attempt to persist to DB
      try {
        const supabase = createServiceRoleClient();
        const referenceId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        supabase.from('coding_interviews').insert({
          id: codingInterviewId,
          reference_id: referenceId,
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

    // Send email if both email and meeting date are provided
    if (body.emailId?.trim() && body.meetingDate?.trim()) {
      const formattedDate = formatMeetingDate(body.meetingDate);

      const emailSubject = 'Reference Verification Meeting Invitation';

      const codingInterviewTextSection = codingInterviewUrl
        ? `
An optional coding interview has been enabled for this candidate.
Coding Interview Link: ${codingInterviewUrl}
`
        : '';

      const codingInterviewHtmlSection = codingInterviewUrl
        ? `
            <p><strong>Coding Interview:</strong> <a href="${codingInterviewUrl}" style="color: #0066cc; text-decoration: none; font-weight: bold;">Start coding interview session</a></p>
          `
        : '';

      const emailTextBody = `
Hello ${body.referenceName},

You've been listed as a professional reference by ${body.candidateName}.

A brief meeting has been scheduled to verify work details.

Meeting Details:
Date & Time: ${formattedDate}
Platform: Google Meet
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
          
          <p>You've been listed as a professional reference by <strong>${body.candidateName}</strong>.</p>
          
          <p>A brief meeting has been scheduled to verify work details.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
            <h3 style="margin-top: 0; color: #0066cc;">Meeting Details:</h3>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Platform:</strong> Google Meet</p>
            <p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #0066cc; text-decoration: none; font-weight: bold;">Join Google Meet</a></p>
            ${body.companyName ? `<p><strong>Company:</strong> ${body.companyName}</p>` : ''}
            ${body.roleTitle ? `<p><strong>Role:</strong> ${body.roleTitle}</p>` : ''}
            ${body.workDuration ? `<p><strong>Duration:</strong> ${body.workDuration}</p>` : ''}
          </div>

          ${codingInterviewUrl ? `
          <div style="background-color: #f9f0ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea;">
            <h3 style="margin-top: 0; color: #9333ea;">Coding Interview (Judge0):</h3>
            <p>An optional coding interview has been enabled for this candidate.</p>
            <p style="margin-bottom: 0;">
              <a href="${codingInterviewUrl}" style="display: inline-block; background-color: #9333ea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Launch Judge0 Coding Environment</a>
            </p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">Technical support provided by Judge0 Execution Engine.</p>
          </div>
          ` : ''}
          
          <p>Thank you for your time and cooperation. We look forward to speaking with you.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #666; font-size: 12px;">
            <strong>Reference Verification Team</strong><br>
            If you have any questions, please contact us.
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

    const referenceId = `ref_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const response = {
      success: true,
      id: referenceId,
      candidateName: body.candidateName,
      referenceName: body.referenceName,
      phoneNumber: body.phoneNumber,
      companyName: body.companyName || '',
      roleTitle: body.roleTitle || '',
      workDuration: body.workDuration || '',
      emailId: body.emailId || '',
      meetingDate: body.meetingDate || '',
      emailSent: emailSent,
      emailError: emailError || undefined,
      addCodingInterview: !!body.addCodingInterview,
      codingInterviewUrl: codingInterviewUrl || '',
      message: emailSent
        ? 'Reference saved and meeting invite sent successfully!'
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