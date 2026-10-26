---
title: Multi Agent Demo
sdk: docker
app_port: 7860
license: mit
---

# Protected Multi-Agent service deployment

This directory replaces the public Space source reviewed at commit
`1f17a35e17808f4363bd75124da26c522867fdfe`. It is staged source, not proof
that the live Space has been updated. Copy app.py, requirements.txt, Dockerfile
and this README into prasadkavuri/multi-agent-demo through its Files UI.

## Private configuration and rollout

1. Generate a random credential of 32-256 printable ASCII characters without whitespace using a password
   manager. Do not paste it into chat, source, terminal arguments or a PR.
2. Set the same value as MULTI_AGENT_SHARED_SECRET in Hugging Face Space
   Secrets and Vercel Production/Preview environment settings. Retain the
   existing GROQ_API_KEY in the Space; never copy it to the browser.
3. The caller PR can be previewed against the old service (which ignores the
   extra header), but that alone does NOT verify service authentication.
4. Use a maintenance window: publish the protected Space, then deploy the
   updated portfolio caller. The old production caller will fail between the
   two deployments. Do not merge without accepting that coordination step.
5. Verify /health stays public, and POST /analyze without a credential returns
   401 without any Groq work. With the configured caller, run one explicitly
   approved paid demo and verify release approval still works. Do not put the
   shared credential in a browser request or client bundle.
6. Roll back the caller only if it still sends the credential. Never restore
   unauthenticated service access as an availability workaround.

## Controls and limits

- Auth before body reads, timing-safe comparison, no default secret.
- 1 KiB body and 200-character HTTP(S) URL. No URL credentials or extra fields.
- Two active analyses, 20 admissions/minute, 100/day UTC per worker. These are
  in-memory safeguards, reset on restart and are NOT durable/distributed spend
  guarantees. Keep one worker; portfolio Redis budgets and a Groq project/account
  hard spending limit remain necessary. Leaked credentials must be rotated.
- Three fixed async provider calls, zero retries, SDK timeout 12 seconds and
  overall analysis deadline 45 seconds. Cancellation cannot guarantee that a
  provider stops billing work already accepted.
- Typed output bounds, safe errors, no website fetches/tools and no permissive
  browser CORS. URL-only suggestions must not be presented as measured findings.
- Docker runs as UID 1000. The platform's isolation guarantees still need their
  own assessment; this does not establish a compliance certification.

## Tests (no network/model calls)

Use Python 3.11+, install requirements in an isolated environment, then from
this directory run `python -m unittest -v test_app`. Run `pip-audit` against the
installed environment before publishing dependency changes. No secrets are
needed for tests; the credential and provider are synthetic/mocked.

The current-role context is sourced from the portfolio's owner-supplied facts.
Future role updates must update this separate deployment as well.
