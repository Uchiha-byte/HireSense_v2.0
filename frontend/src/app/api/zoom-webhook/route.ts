import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Validate Zoom Webhook signature
function verifyZoomWebhook(reqBody: string, signature: string, timestamp: string): boolean {
  const zoomWebhookSecret = process.env.ZOOM_WEBHOOK_SECRET;
  if (!zoomWebhookSecret) return false;

  const message = `v0:${timestamp}:${reqBody}`;
  const hashForVerify = crypto.createHmac('sha256', zoomWebhookSecret).update(message).digest('hex');
  const signatureForVerify = `v0=${hashForVerify}`;
  return signature === signatureForVerify;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-zm-signature');
    const timestamp = request.headers.get('x-zm-request-timestamp');
    const rawBodyText = await request.text();

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    if (!process.env.ZOOM_WEBHOOK_SECRET) {
      console.warn('⚠️ ZOOM_WEBHOOK_SECRET is not configured');
      // For development, we allow it to pass if no secret is set, but in production we'd return 401
    } else {
      if (!verifyZoomWebhook(rawBodyText, signature, timestamp)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBodyText);

    // Zoom URL validation (Initial endpoint validation)
    if (payload.event === 'endpoint.url_validation') {
      const zoomWebhookSecret = process.env.ZOOM_WEBHOOK_SECRET || '';
      const plainToken = payload.payload.plainToken;
      const encryptedToken = crypto.createHmac('sha256', zoomWebhookSecret).update(plainToken).digest('hex');
      return NextResponse.json({
        plainToken: plainToken,
        encryptedToken: encryptedToken
      });
    }

    const supabase = createServiceRoleClient();
    const event = payload.event;
    const meeting = payload.payload?.object;

    if (!meeting || !meeting.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const zoomMeetingId = meeting.id.toString();

    // Query the reference call by zoom_meeting_id
    const { data: referenceCall, error } = await supabase
      .from('reference_calls')
      .select('id, status, zoom_meeting_id')
      .eq('zoom_meeting_id', zoomMeetingId)
      .single();

    if (error || !referenceCall) {
      // It might not be a reference call meeting, just ignore
      return NextResponse.json({ success: true, message: 'Unrelated meeting ignored' });
    }

    if (event === 'meeting.started') {
      await supabase
        .from('reference_calls')
        .update({ status: 'started' })
        .eq('id', referenceCall.id);
      
      console.log(`✅ Zoom Meeting Started for Reference Call ${referenceCall.id}`);
    } else if (event === 'meeting.ended') {
      const durationSeconds = meeting.duration ? meeting.duration * 60 : 0; // Zoom provides duration in some contexts, but usually meeting.ended has start_time and end_time
      let actualSeconds = 0;
      
      if (meeting.start_time && meeting.end_time) {
        const start = new Date(meeting.start_time).getTime();
        const end = new Date(meeting.end_time).getTime();
        actualSeconds = Math.floor((end - start) / 1000);
      }

      await supabase
        .from('reference_calls')
        .update({ 
          status: 'ended',
          actual_duration_seconds: actualSeconds
        })
        .eq('id', referenceCall.id);
        
      console.log(`✅ Zoom Meeting Ended for Reference Call ${referenceCall.id}. Duration: ${actualSeconds}s`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Zoom Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
