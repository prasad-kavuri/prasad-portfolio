import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Contact Prasad Kavuri — VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const GREEN = '#22c55e';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const channels = [
  { label: 'Book a Call', detail: 'calendly.com/vbkpkavuri', color: ACCENT },
  { label: 'Email', detail: 'vbkpkavuri@gmail.com', color: '#ef4444' },
  { label: 'LinkedIn', detail: 'linkedin.com/in/pkavuri', color: '#3b82f6' },
  { label: 'GitHub', detail: 'prasad-kavuri/prasad-portfolio', color: '#71717a' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '44px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>PRASADKAVURI.COM</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: GREEN }} />
            <span style={{ fontSize: 13, color: GREEN, letterSpacing: '0.06em' }}>IMMEDIATELY AVAILABLE</span>
          </div>
        </div>

        {/* Two-column */}
        <div style={{ display: 'flex', flex: 1, gap: 56 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: 15, color: ACCENT, letterSpacing: '0.1em', marginBottom: 16 }}>GET IN TOUCH</div>
            <div style={{ fontSize: 50, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 20 }}>
              Let&apos;s talk
              <br />AI leadership.
            </div>
            <div style={{ fontSize: 16, color: TEXT_MUTED, lineHeight: 1.6 }}>
              Open to VP / Head of AI Engineering
              {'\n'}and AI Platform Leadership roles.
            </div>
            <div style={{ marginTop: 20, fontSize: 14, color: TEXT_MUTED }}>
              Chicago, IL · Remote-open
            </div>
          </div>

          {/* Right: contact channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 460 }}>
            {channels.map((ch) => (
              <div
                key={ch.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderLeft: `3px solid ${ch.color}`,
                  borderRadius: 10,
                  padding: '14px 20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{ch.label}</span>
                  <span style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{ch.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 44, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
