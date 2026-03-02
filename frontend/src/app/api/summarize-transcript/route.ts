import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RequestBody {
  applicant_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const { applicant_id }: RequestBody = await request.json();

    if (!applicant_id) {
      return NextResponse.json(
        { error: 'applicant_id is required' },
        { status: 400 }
      );
    }

    console.log('Fetching calls summary for applicant:', applicant_id);

    // Fetch calls_summary from applicants table in Supabase
    const { data, error } = await supabase
      .from('applicants')
      .select('calls_summary')
      .eq('id', applicant_id)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calls summary from database' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    const summary = data.calls_summary;

    if (!summary) {
      return NextResponse.json(
        { error: 'No calls summary available for this applicant' },
        { status: 404 }
      );
    }

    console.log('Successfully retrieved summary for applicant:', applicant_id);

    return NextResponse.json({
      success: true,
      summary,
      applicantId: applicant_id,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in calls summary route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: `Failed to retrieve calls summary: ${errorMessage}`,
        success: false 
      },
      { status: 500 }
    );
  }
}