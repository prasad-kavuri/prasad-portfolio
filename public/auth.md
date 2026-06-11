# auth.md — Prasad Kavuri Portfolio

This file describes how AI agents can register for and use this portfolio's
machine-readable API endpoints. It follows the [auth.md open protocol](https://github.com/workos/auth.md).

## Discovery

Protected resource metadata is available at:

```
GET https://www.prasadkavuri.com/.well-known/oauth-protected-resource
```

## Available Scopes

| Scope | Description |
|-------|-------------|
| `read:profile` | Read profile, experience, skills, and achievements data |
| `call:mcp-tools` | Execute MCP tool calls (`get_experience`, `search_skills`, `calculate_fit_score`, `get_achievements`) |

## Step 1 — Register (Anonymous Start)

No email required. Receive a time-limited credential immediately with read-only scopes.
Optionally claim it to a real identity later.

```http
POST https://www.prasadkavuri.com/api/agent-auth
Content-Type: application/json

{
  "type": "anonymous_start"
}
```

Response:

```json
{
  "credential": "<token>",
  "type": "anonymous",
  "scopes": ["read:profile", "call:mcp-tools"],
  "expires_in": 3600,
  "claim_token": "<claim_token>",
  "claim_endpoint": "https://www.prasadkavuri.com/api/agent-auth"
}
```

## Step 2 — Initiate Claim (Optional)

Bind the credential to an email address. Triggers a 6-digit OTP.

```http
POST https://www.prasadkavuri.com/api/agent-auth
Content-Type: application/json

{
  "type": "claim_init",
  "claim_token": "<claim_token from step 1>",
  "email": "recruiter@example.com"
}
```

Response:

```json
{
  "claim_id": "<claim_id>",
  "otp_delivery": "demo_inline",
  "otp": "<6-digit OTP>",
  "message": "OTP shown inline (demo mode). In production this would be emailed.",
  "expires_in": 600
}
```

## Step 3 — Complete Claim

Submit the OTP to upgrade your credential to a claimed (email-bound) token.

```http
POST https://www.prasadkavuri.com/api/agent-auth
Content-Type: application/json

{
  "type": "claim_complete",
  "claim_id": "<claim_id from step 2>",
  "otp": "<6-digit OTP>"
}
```

Response:

```json
{
  "credential": "<claimed_token>",
  "type": "claimed",
  "email": "recruiter@example.com",
  "scopes": ["read:profile", "call:mcp-tools"],
  "expires_in": 86400
}
```

## Step 4 — Use the Credential

Pass the credential as a Bearer token to any protected endpoint:

```http
POST https://www.prasadkavuri.com/api/mcp-demo
Authorization: Bearer <credential>
Content-Type: application/json

{
  "query": "What are Prasad's strongest AI platform capabilities?"
}
```

The response will include an `auth_context` field confirming your identity and scopes.

## Errors

| Code | Meaning |
|------|---------|
| 400 | Missing or invalid fields |
| 401 | Invalid or expired credential |
| 410 | OTP expired or already used |
| 429 | Rate limit exceeded |

## Revocation

Credentials expire automatically (anonymous: 1 hour, claimed: 24 hours).
There is no explicit revocation endpoint — let the TTL expire.

## Rate Limits

- Unauthenticated: 10 requests / 60 seconds
- Authenticated: 20 requests / 60 seconds

## Notes

This portfolio is publicly accessible. Authentication is optional — all endpoints
work without credentials at the standard rate limit. Authenticating identifies your
agent to the system and enables higher throughput.

For the live interactive demo, visit:
https://www.prasadkavuri.com/demos/agent-auth
