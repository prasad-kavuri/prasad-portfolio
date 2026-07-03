import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Adaptive AI Governance — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const controls = [
  { title: 'Risk Classification', note: 'Standard · Sensitive · Regulated · Blocked' },
  { title: 'Risk-Aware Routing', note: 'Restricted tier · Policy-approved · Blocked' },
  { title: 'Human Approval', note: 'Escalation, not silent refusal' },
  { title: 'Policy-Governed Requests', note: 'Regulated domains · Audit trail' },
  { title: 'Injection Blocking', note: 'Known signatures · Blocked before model' },
  { title: 'Audit on Every Decision', note: 'Traceable, not silent pass-through' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
            PRASADKAVURI.COM
          </span>
          <span style={{
            fontSize: 12, color: ACCENT, letterSpacing: '0.1em',
            border: `1px solid ${ACCENT}`, padding: '4px 14px', borderRadius: 4,
          }}>
            ADAPTIVE GOVERNANCE
          </span>
        </div>

        <div style={{ fontSize: 44, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 32 }}>
          Adaptive AI
          <br />Governance
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
          {controls.map((c) => (
            <div
              key={c.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: CARD_BG,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 10,
                padding: '14px 18px',
                width: 'calc(33.33% - 8px)',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{c.title}</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{c.note}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 32, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
