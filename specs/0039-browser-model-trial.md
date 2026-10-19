# SPEC-0039: Browser model trial (RAG embeddings and PII NER)

**Status**: Implemented (decision: keep both current models; no code change)
**Date**: 2026-10-18

## What

A measured comparison of the two browser-side models against newer open candidates, run in a real browser with
Transformers.js 4.3.1 (WASM backend, `dtype: q8`, the library's default for WASM), to decide whether either should be
swapped. The trial ran on huggingface.co in the in-app browser, because the cloud and desktop shells cannot reach
Hugging Face. Latency numbers come from one machine and are indicative only.

## Why

The model inventory (2026-10-18) flagged `Xenova/all-MiniLM-L6-v2` (2021) and `Xenova/bert-base-NER` (2019) as old.
Age alone is not a reason to swap in a demo whose point is a small, fast, private browser model.

## Results

Download sizes are Hugging Face file sizes for the q8 files the demos load by default.

| Candidate | Size (q8) | Cold load | Notes |
|---|---|---|---|
| all-MiniLM-L6-v2 (current, RAG) | 22.8 MB | 3.1 s | 384 dims |
| bge-small-en-v1.5 | 33.8 MB | 2.0 s | 384 dims, needs a query prefix |
| EmbeddingGemma-300M | not tested | not tested | Gemma licence (not Apache/MIT); about 295 MB over WASM per a third-party listing |
| bert-base-NER (current, edge-agent) | 109 MB | 4.6 s | names, places, orgs; English |
| multilang-pii-ner (xlm-roberta-base) | 278.7 MB | 11.3 s | PII labels; EN/DE/IT/FR; MIT |

**Embeddings.** 14 hand-labelled queries against the RAG demo's own 10 knowledge-base documents:

| Model | Top-1 | MRR | Recall@3 | Query median |
|---|---|---|---|---|
| MiniLM-L6-v2 | 13/14 | 0.964 | 0.952 | 31 ms |
| bge-small, no prefix | 12/14 | 0.929 | 0.952 | 13 ms |
| bge-small, recommended prefix | 13/14 | 0.964 | 1.000 | 38 ms |

The differences are one query out of 14, inside the noise of a small hand-labelled set. bge-small costs 11 MB more
and gains nothing measurable here.

**NER.** Five synthetic sentences (names, email, account id, phone, address, birth date, passport, one German):

- bert-base-NER found the person names (including Hans Müller) and place names; it does not detect phones,
  addresses, dates or passports. About 410 ms per sentence.
- multilang-pii-ner detects many more PII types (phone, street, building number, zip, birth date, passport) but the
  spans come back as fragments: phone numbers reduced to "312" or "(4", zip codes to "6" and "2704.", surnames
  missing for two of three full names, and "Acme Corp" labelled as a street. Used as-is, redaction would leave
  digits and names behind. About 465 ms per sentence, 2.5x the download.

## Decisions

- Keep `all-MiniLM-L6-v2` for the RAG demo. Same quality on this set, smallest download.
- Keep `bert-base-NER` for names in the edge-agent demo. Replacing it with multilang-pii-ner would mean a 279 MB
  download plus span-merging post-processing and its own tests; not worth it for this demo.
- Do not adopt EmbeddingGemma: the Gemma licence is not the Apache/MIT style the other models use, and it is a much
  larger download.

## Findings to follow up (not done here)

- The edge-agent redaction covers names, emails and `ACC-` account ids only. Phone numbers, street addresses and
  birth dates pass through unredacted. Cheapest fix: structural regex for phone numbers and dates next to the existing
  email and account patterns (no new model). The demo copy should say exactly what is redacted.
- Re-run this trial when a small PII-tuned model ships with a merged-span pipeline in Transformers.js.

## Scope boundaries

- In scope: the measurements and decision above.
- Out of scope: any change to `src/`; the Groq models (covered by SPEC-0029/0038); EmbeddingGemma measurement.
