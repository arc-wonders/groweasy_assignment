import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstreamResponse = await fetch(`${backendUrl}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await upstreamResponse.text();

    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Import proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to reach the import backend.' },
      { status: 502 }
    );
  }
}
