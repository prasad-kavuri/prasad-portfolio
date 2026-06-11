import { NextRequest } from 'next/server';

const SITE_URL = 'https://www.prasadkavuri.com';

const protectedResourceMetadata = {
  resource: SITE_URL,
  authorization_servers: [],
  scopes_supported: ['read:profile', 'call:mcp-tools'],
  bearer_methods_supported: ['header'],
  resource_documentation: `${SITE_URL}/auth.md`,
  agent_auth: {
    registration_endpoint: `${SITE_URL}/api/agent-auth`,
    flows_supported: ['anonymous_start', 'claim_init', 'claim_complete'],
    scopes: ['read:profile', 'call:mcp-tools'],
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
