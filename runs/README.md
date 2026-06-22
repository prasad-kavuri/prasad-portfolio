# runs/ — Agent Execution Traceability

This directory captures the inputs, outputs, and metrics of every significant agent skill run.
It enables measuring: agent reliability, regression rate, cost trends, and evaluation quality over time.

## Directory structure

```
runs/
  <date>-<skill>/
    inputs/          # Prompt, profile used, skill invoked, target (e.g. "Anthropic")
    outputs/         # Generated text, changed files, commit message
    coverage/        # Test coverage report (for testing skill runs)
    metrics/         # Token usage, latency, cost, pass/fail per gate
    screenshots/     # Lighthouse or Playwright screenshots (for design/testing runs)
    costs/           # Token cost breakdown (input, output, cache)
    summary.yaml     # Machine-readable run summary (see schema below)
```

## summary.yaml schema

```yaml
run_id: 2026-06-22-recruiter-review-anthropic
date: 2026-06-22
skill: recruiter-review
profile: recruiter
target: Anthropic
duration_seconds: 47
tokens:
  input: 12400
  output: 3200
  estimated_cost_usd: 0.085
gates_passed: 5
gates_failed: 1
gates_untested: 2
hallucinations_detected: 0
steps_missed: 0
output_files:
  - outputs/recruiter-review-anthropic.md
notes: "Keyword coverage untested — manual ATS check needed"
```

## Usage

After running a skill session:
1. Create a directory: `runs/<YYYY-MM-DD>-<skill>-<optional-target>/`
2. Save the skill output to `outputs/`
3. Fill in `summary.yaml` with the metrics above
4. Commit the run directory to main

Over time, the `runs/` directory becomes a regression baseline:
- Compare `hallucinations_detected` across runs of the same skill
- Track `estimated_cost_usd` trends to detect prompt bloat
- Identify skills where `steps_missed > 0` repeatedly (reliability signal)

## Run naming convention

```
<YYYY-MM-DD>-<skill-name>-<target-or-context>

Examples:
  2026-06-22-recruiter-review-anthropic
  2026-06-22-security-review-full
  2026-06-22-testing-coverage-audit
  2026-07-01-executive-review-dario-amodei
  2026-07-01-agentic-seo-post-deploy
```

## .gitignore note

Large binary outputs (screenshots > 1MB, coverage HTML) should be excluded.
Text outputs, summary.yaml, and metrics/ are always committed.
