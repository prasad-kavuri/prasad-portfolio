import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Real Work in Production AI Is Managing Tradeoffs — Prasad Kavuri';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
            PRASADKAVURI.COM
          </span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            PERSPECTIVES · PRODUCTION AI
          </span>
        </div>

        {/* Article card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: CARD_BG,
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 16,
          padding: '40px 48px',
          borderLeft: `4px solid ${ACCENT}`,
        }}>
          <div style={{ fontSize: 13, color: ACCENT, letterSpacing: '0.1em', marginBottom: 20 }}>
            PRODUCTION AI · 4 MIN READ
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.15, marginBottom: 24 }}>
            The Real Work in Production AI
            <br />Is Managing Tradeoffs,
            <br />Not Selecting Models
          </div>
          <div style={{ fontSize: 18, color: TEXT_MUTED, lineHeight: 1.5, flex: 1 }}>
            Model selection is maybe 20% of the problem. The other 80% is
            routing, retrieval, caching, and fallback strategy.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <span style={{ fontSize: 14, color: TEXT_MUTED }}>Prasad Kavuri</span>
            <span style={{ fontSize: 14, color: CARD_BORDER }}>·</span>
            <span style={{ fontSize: 14, color: TEXT_MUTED }}>VP / Head of AI Engineering</span>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 32, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
