import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Governance Dashboard — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';
const GREEN = '#22c55e';
const GREEN_BG = '#052e16';

const controls = [
  { label: 'HITL Checkpoints', status: 'ACTIVE' },
  { label: 'Eval-gated CI', status: 'ACTIVE' },
  { label: 'Drift Monitoring', status: 'ACTIVE' },
  { label: 'Prompt Guardrails', status: 'ACTIVE' },
  { label: 'Audit Trails', status: 'ACTIVE' },
  { label: 'Cost Controls', status: 'ACTIVE' },
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
            GOVERNANCE DASHBOARD
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 12 }}>
            Enterprise AI
            <br />Governance
          </div>
          <div style={{ fontSize: 20, color: TEXT_MUTED, marginBottom: 36 }}>
            Live controls · Policy boundaries · Traceability · Operational risk posture
          </div>

          {/* Controls grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {controls.map((ctrl) => (
              <div
                key={ctrl.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 10,
                  padding: '12px 20px',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: GREEN_BG,
                  border: `1px solid ${GREEN}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 10,
                  color: GREEN,
                  letterSpacing: '0.08em',
                }}>
                  {ctrl.status}
                </div>
                <span style={{ fontSize: 15, color: TEXT_PRIMARY }}>{ctrl.label}</span>
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
