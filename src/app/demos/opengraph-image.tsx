import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Demos — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';
const TAG_BG = '#1e1b4b';

const tags = [
  'LLM Router',
  'RAG Pipeline',
  'Multi-Agent',
  'Eval Framework',
  'Governance',
  'Vector Search',
  'MCP Protocol',
  'Cost Control',
  'Drift Monitor',
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
          padding: '56px 64px 0 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: 16, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
            PRASADKAVURI.COM
          </span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            AI DEMO INDEX
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 16 }}>
            14 Production
            <br />AI Demos
          </div>
          <div style={{ fontSize: 20, color: TEXT_MUTED, marginBottom: 40 }}>
            Enterprise patterns · Cost-aware routing · Governance controls · Multi-agent orchestration
          </div>

          {/* Tag pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  backgroundColor: TAG_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 20,
                  padding: '8px 18px',
                  fontSize: 14,
                  color: TEXT_PRIMARY,
                }}
              >
                {tag}
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                backgroundColor: CARD_BG,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 20,
                padding: '8px 18px',
                fontSize: 14,
                color: TEXT_MUTED,
              }}
            >
              + more
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 48, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
