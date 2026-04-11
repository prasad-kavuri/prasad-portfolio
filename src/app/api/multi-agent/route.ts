import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const HF_SPACE_URL = 'https://prasadkavuri-multi-agent-demo.hf.space';

const BLOCKED_URL_PATTERNS = [
  'localhost', '127.0.0.1', '0.0.0.0', '169.254', '10.', '192.168.', 'internal',
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (rateLimit(ip).limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { website_url } = await req.json();

  if (!website_url) {
    return NextResponse.json({ error: 'website_url is required' }, { status: 400 });
  }

  if (website_url.length > 200) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 });
  }

  try {
    new URL(website_url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (BLOCKED_URL_PATTERNS.some(b => website_url.includes(b))) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
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
