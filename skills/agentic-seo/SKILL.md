---
name: agentic-seo
description: AI crawler and recruiter discoverability audit. Use when the user wants to improve AI SEO, update llms.txt, check if ChatGPT/Claude/Gemini/Perplexity can answer questions about the portfolio correctly, audit structured data, or generate docs/discoverability.md.
---

# Agentic SEO — AI Crawler Discoverability

Read `CONTEXT.md` before starting. Key terms: **llms-txt**, **agentic-seo**, **agent context**, **recruiter path**, **recruiter experience**.

Also read ADR-0006 (llms.txt), ADR-0007 (schema.org JSON-LD).

## Phase 1 — llms.txt validation

```bash
cat public/llms.txt
wc -l public/llms.txt
```

Check:
- [ ] File exists at `public/llms.txt`
- [ ] Has all required sections: `VERIFIED IMPACT METRICS`, `PLATFORM ARCHITECTURE`, `AI DEMOS`, `RECRUITER QUERIES`, `WHAT'S NEW`
- [ ] Demo count in `AI DEMOS` matches `src/data/demos.ts` entry count
- [ ] Headline metrics match `PORTFOLIO_FACTS` in `src/data/site-config.ts`
- [ ] `profile.personal.title` in `profile.json` matches the title line in `llms.txt`
- [ ] At least 20 recruiter query phrases in `RECRUITER QUERIES`
- [ ] `WHAT'S NEW` section has entries from the last 3 months

If metrics are stale, update `public/llms.txt` — see ADR-0006 for ownership rules.

## Phase 2 — ai-agent-manifest.json validation

```bash
node -e "
const m = JSON.parse(require('fs').readFileSync('public/.well-known/ai-agent-manifest.json','utf8'));
console.log('schema_version:', m.schema_version);
console.log('demos count:', m.portfolio?.demos?.length ?? 'MISSING');
console.log('metrics keys:', Object.keys(m.metrics ?? {}));
"
```

Check:
- [ ] `schema_version` is `1.1` or higher
- [ ] `metrics` object has at minimum: `call_center_seats_automated`, `pois_indexed`, `languages_ai_supported`, `llm_cost_reduction`
- [ ] `plain_text_url` points to `https://www.prasadkavuri.com/llms.txt`
- [ ] `portfolio.demos` list matches `src/data/demos.ts`
- [ ] `new_in_<year>_<month>` section exists for the most recent deploy

## Phase 3 — JSON-LD / schema.org audit

```bash
node -e "
const layout = require('fs').readFileSync('src/app/layout.tsx', 'utf8');
const match = layout.match(/JSON\.stringify\((\{[\s\S]*?\})\)/);
console.log(match ? 'JSON-LD found' : 'JSON-LD NOT FOUND — check layout.tsx');
"
```

Validate via Google Rich Results Test:
- Open `https://search.google.com/test/rich-results`
- Enter `https://www.prasadkavuri.com`
- Confirm: Person entity detected, SoftwareApplication entities for demos detected

Check:
- [ ] `Person` entity has `name`, `jobTitle`, `url`, `sameAs` (LinkedIn + GitHub)
- [ ] `WebSite` entity has `potentialAction.SearchAction`
- [ ] At least 10 `SoftwareApplication` entities (one per live demo)
- [ ] `speakable.cssSelector` includes `#profile-name`, `#profile-summary`, `#experience`
- [ ] All `@id` values use `https://www.prasadkavuri.com/` (with www, with https)

## Phase 4 — sitemap.xml + robots.txt

```bash
curl -s https://www.prasadkavuri.com/sitemap.xml | grep -c "<url>"
curl -s https://www.prasadkavuri.com/robots.txt
```

Check:
- [ ] `sitemap.xml` includes `/`, `/demos`, `/governance`, `/capabilities`, `/for-recruiters`
- [ ] `sitemap.xml` includes `/llms.txt` (as a resource URL for AI crawlers)
- [ ] `robots.txt` has `Allow: /llms.txt`
- [ ] `robots.txt` `Disallow: /api/` (block API routes from web crawlers)
- [ ] `User-agent: *` section is present

## Phase 5 — LLM compatibility test (manual)

Open each LLM and ask these queries. Record the response quality (1-5):

| Query | ChatGPT | Claude | Gemini | Perplexity |
|-------|---------|--------|--------|------------|
| "Who is Prasad Kavuri?" | | | | |
| "What AI demos has Prasad built?" | | | | |
| "What did Prasad build at Krutrim?" | | | | |
| "What is prasadkavuri.com?" | | | | |
| "What AI engineering work has Prasad done?" | | | | |

Score 1 = hallucination / no data, 3 = partially correct, 5 = fully accurate with metrics.

If any score < 3:
- Add the missing information to `llms.txt` under the relevant section
- Ensure `ai-agent-manifest.json` has the missing field
- Re-check after next deploy (CDN may cache for 24h)

## Phase 6 — Generate docs/discoverability.md

```markdown
# AI Discoverability Report — <date>

## Assets
- llms.txt: ✅ / ❌ (<line count> lines)
- ai-agent-manifest.json: ✅ / ❌ (schema_version <X>)
- JSON-LD @graph: ✅ / ❌ (<N> entities)
- sitemap.xml: ✅ / ❌ (<N> URLs)
- robots.txt: ✅ / ❌

## LLM Compatibility
| Query | ChatGPT | Claude | Gemini | Perplexity |
|-------|---------|--------|--------|------------|
<results from Phase 5>

## Overall score: <X>/5

## Open gaps
<list with remediation>

## Next review date
<date + 3 months>
```
