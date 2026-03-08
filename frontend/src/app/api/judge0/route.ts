import { NextResponse } from 'next/server';

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { language_id, source_code } = body;

    if (!language_id || !source_code) {
      return NextResponse.json(
        { success: false, error: 'language_id and source_code are required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL || DEFAULT_BACKEND_URL;
    const url = `${backendUrl.replace(/\/$/, '')}/judge0/execute`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = resp.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await resp.json()
      : { raw: await resp.text() };

    return NextResponse.json(
      {
        success: resp.ok,
        judge0Response: data,
      },
      { status: resp.status }
    );
  } catch (error) {
    console.error('Error in /api/judge0:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to execute code via Judge0',
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

