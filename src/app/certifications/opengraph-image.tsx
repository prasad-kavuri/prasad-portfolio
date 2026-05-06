import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Certifications and Validation — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';
const AMBER = '#f59e0b';
const AMBER_BG = '#1c1407';
const SLATE_BG = '#111827';
const SLATE_BORDER = '#1f2937';

const tiers = [
  {
    tier: 'Tier 1',
    label: 'Featured AI Credentials',
    desc: 'Recent 2025–2026 agentic AI, LLM orchestration, and MCP signal',
    accent: ACCENT,
    bg: '#0f0e2e',
    border: ACCENT,
  },
  {
    tier: 'Tier 2',
    label: 'LLMOps & Applied AI',
    desc: 'Production AI operations, evaluation frameworks, and applied ML',
    accent: AMBER,
    bg: AMBER_BG,
    border: AMBER,
  },
  {
    tier: 'Tier 3',
    label: 'Foundational Systems',
    desc: 'Cloud, platform, and data engineering foundations',
    accent: TEXT_MUTED,
    bg: SLATE_BG,
    border: SLATE_BORDER,
  },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          padding: '52px 64px 0 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
            PRASADKAVURI.COM
          </span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            CERTIFICATIONS
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 46, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 10 }}>
          AI Certifications
          <br />&amp; Validation
        </div>
        <div style={{ fontSize: 18, color: TEXT_MUTED, marginBottom: 36 }}>
          Recency-weighted · Recent AI signal first · Foundations preserved
        </div>

        {/* Tier cards */}
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          {tiers.map((t) => (
            <div
              key={t.tier}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <span style={{ fontSize: 11, color: t.accent, letterSpacing: '0.1em', marginBottom: 8 }}>
                {t.tier.toUpperCase()}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>
                {t.label}
              </span>
              <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.4 }}>{t.desc}</span>
            </div>
          ))}
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 32, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
