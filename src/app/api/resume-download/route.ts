import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit, jsonError } from '@/lib/api';

function safeReferrer(referrer: string): string {
  return referrer.replace(/[\r\n]/g, ' ').slice(0, 200);
}

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await enforceRateLimit(req);
    if (rateLimited) return rateLimited;

    const referrer = safeReferrer(req.headers.get('referer') ?? 'direct');
    console.log(`[resume-download] ${new Date().toISOString()} | referrer: ${referrer}`);
    return NextResponse.redirect(new URL('/Prasad_Kavuri_Resume.pdf', req.url));
  } catch (error) {
    console.error('Resume download error:', error);
    return jsonError('Internal server error', 500);
  }
}
