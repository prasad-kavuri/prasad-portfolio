import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'For Recruiters — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const stats = [
  { value: '20+', label: 'Years Experience' },
  { value: '200+', label: 'Engineers Led' },
  { value: '13K+', label: 'B2B Customers' },
  { value: '70%+', label: 'Cost Reduction' },
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
            FOR RECRUITERS
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 16 }}>
            Everything you need
            <br />to evaluate Prasad
          </div>
          <div style={{ fontSize: 22, color: TEXT_MUTED, marginBottom: 48 }}>
            VP / Head of AI Engineering · Immediately available · Chicago / Remote
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {stats.map((s) => (
              <div
                key={s.value}
                style={{
                  display: 'flex', flexDirection: 'column',
                  backgroundColor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 12, padding: '20px 28px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: TEXT_PRIMARY }}>{s.value}</span>
                <span style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 48, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
