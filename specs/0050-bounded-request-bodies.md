# SPEC-0050: Bound request bytes before parsing

Date: 2026-10-24

Read request streams with a byte counter, cancelling on overflow. Do not rely
on Content-Length alone. The shared JSON reader permits 1 MiB, enough for the
existing 20-message, 8192-character history contract even with JSON escapes.
A2A keeps its intended 16000-byte cap; MCP POST gets 64000 bytes. Evaluation
uses the shared reader and caps mockResponse at 16000 characters.

Oversize input returns 413 with existing response trace/protocol envelopes.
Malformed input remains 400. Rate limiting still happens before body reading.
No model, quota, authorization or CSP changes.

Verify real byte boundaries, multibyte/chunked input, misleading/missing length
headers, cancellation and reader failure, plus API integration tests and valid
multi-turn histories. Run full coverage, lint, typecheck, build and audit.
