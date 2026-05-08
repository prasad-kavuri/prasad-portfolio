import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Agent Entry Point — Prasad Kavuri | AI Platform Leader';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const metrics = [
  { value: 'JSON', label: 'Machine Readable' },
  { value: 'llms.txt', label: 'Agent Optimized' },
  { value: 'MCP', label: 'Tool Enabled' },
  { value: '2026', label: 'Context Freshness' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
            PRASADKAVURI.COM
          </span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            AGENT ENTRY POINT
          </span>
        </div>

        {/* Main content — two columns */}
        <div style={{ display: 'flex', flex: 1, gap: 48 }}>
          {/* Left: identity + pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 54, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.05, marginBottom: 14 }}>
              AI Agent
              <br />Entry Point
            </div>
            <div style={{ fontSize: 20, color: ACCENT, marginBottom: 10 }}>
              Prasad Kavuri — Machine-Readable Profile
            </div>
            <div style={{ fontSize: 15, color: TEXT_MUTED, marginBottom: 28, lineHeight: 1.5 }}>
              Optimized context for LLMs, Perplexity, and Agentic SEO. Includes entity.json, llms.txt, and MCP tool definitions.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
               <div style={{ fontSize: 13, color: TEXT_PRIMARY, backgroundColor: ACCENT, padding: '8px 16px', borderRadius: 6 }}>
                  rel="ai-content"
               </div>
               <div style={{ fontSize: 13, color: TEXT_MUTED, border: `1px solid ${CARD_BORDER}`, padding: '8px 16px', borderRadius: 6 }}>
                  JSON-LD Person
               </div>
            </div>
          </div>

          {/* Right: metric cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
            {metrics.map((m) => (
              <div
                key={m.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 10,
                  padding: '14px 20px',
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 700, color: TEXT_PRIMARY, minWidth: 64 }}>
                  {m.value}
                </span>
                <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.3 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 40, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
