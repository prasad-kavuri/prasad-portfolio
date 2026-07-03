import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Runtime Engineering — Prasad Kavuri, VP / Head of AI Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT_PRIMARY = '#fafafa';
const TEXT_MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CARD_BG = '#18181b';
const CARD_BORDER = '#27272a';

const techniques = [
  { title: 'Speculative Decoding', note: 'Draft + verify · Lower latency' },
  { title: 'KV Cache', note: 'Reused attention state · Higher concurrency' },
  { title: 'Prefix Caching', note: 'Shared context · Less recompute' },
  { title: 'Continuous Batching', note: 'Dynamic admission · Higher utilization' },
  { title: 'Quantization', note: 'FP32 → INT8 · Smaller footprint' },
  { title: 'Inference Scheduling', note: 'Latency SLOs · Cost-aware placement' },
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
            RUNTIME ENGINEERING
          </span>
        </div>

        <div style={{ fontSize: 48, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.1, marginBottom: 32 }}>
          AI Runtime
          <br />Engineering
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
          {techniques.map((t) => (
            <div
              key={t.title}
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
              <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{t.title}</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.note}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 4, backgroundColor: ACCENT, marginTop: 32, marginLeft: -64, width: 1200 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
