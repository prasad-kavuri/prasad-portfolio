import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Testimonials — What leaders say about Prasad Kavuri';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const quotes = [
  {
    text: 'Built the AI platform that moved us from experimentation to production.',
    source: 'Engineering Leader · HERE Technologies',
  },
  {
    text: 'Rare combination of executive communication and deep technical implementation.',
    source: 'Senior Director · Krutrim AI',
  },
  {
    text: 'Reduced AI infrastructure cost by 70%+ without sacrificing model quality.',
    source: 'VP Engineering · Ola',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>PRASADKAVURI.COM</span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            PEER & LEADERSHIP REVIEWS
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 40, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>
          What leaders say
        </div>
        <div style={{ fontSize: 17, color: TEXT_MUTED, marginBottom: 36 }}>
          Recommendations from engineering leaders, peers, and direct reports
        </div>

        {/* Quote cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {quotes.map((q) => (
            <div
              key={q.source}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: CARD_BG,
                border: `1px solid ${CARD_BORDER}`,
                borderLeft: `3px solid ${ACCENT}`,
                borderRadius: 10,
                padding: '14px 20px',
              }}
            >
              <span style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.5, marginBottom: 6 }}>
                &ldquo;{q.text}&rdquo;
              </span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>— {q.source}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 40, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
