import { NextRequest } from 'next/server';
import { DEMO_SCOPES } from '@/lib/agent-auth';

const SITE_URL = 'https://www.prasadkavuri.com';

const protectedResourceMetadata = {
  resource: SITE_URL,
  authorization_servers: [],
  scopes_supported: DEMO_SCOPES,
  bearer_methods_supported: ['header'],
  resource_documentation: `${SITE_URL}/auth.md`,
  agent_auth: {
    registration_endpoint: `${SITE_URL}/api/agent-auth`,
    flows_supported: ['anonymous_start', 'claim_init', 'claim_complete'],
    scopes: DEMO_SCOPES,
    anonymous_credential_ttl: 3600,
    claimed_credential_ttl: 86400,
    otp_ttl: 600,
    demo_page: `${SITE_URL}/demos/agent-auth`,
  },
};

export function GET(_req: NextRequest) {
  return Response.json(protectedResourceMetadata, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
