import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const referrer = req.headers.get('referer') ?? 'direct';
  console.log(`[resume-download] ${new Date().toISOString()} | referrer: ${referrer}`);
  return NextResponse.redirect(new URL('/Prasad_Kavuri_Resume.pdf', req.url));
}
