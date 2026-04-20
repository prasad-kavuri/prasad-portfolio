import { NextResponse } from 'next/server';
import { getRecentSkillInvocations } from '@/lib/observability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50);
  return NextResponse.json({
    invocations: getRecentSkillInvocations(limit),
    bufferedCount: getRecentSkillInvocations(50).length,
  });
}
