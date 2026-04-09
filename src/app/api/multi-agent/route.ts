import { NextRequest, NextResponse } from 'next/server';

const HF_SPACE_URL = 'https://prasadkavuri-multi-agent-demo.hf.space';

export async function POST(req: NextRequest) {
  const { website_url } = await req.json();

  if (!website_url) {
    return NextResponse.json({ error: 'website_url is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${HF_SPACE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_url }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to connect to agent backend' },
      { status: 500 }
    );
  }
}
