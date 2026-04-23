import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { AuditTrail } from '@/app/demos/multi-agent/AuditTrail';
import type { AuditEvent } from '@/lib/agents/handoff-model';

function makeEvent(index: number, severity: AuditEvent['severity'] = 'info'): AuditEvent {
  return {
    id: `evt-${index}`,
    traceId: 'trace-1',
    timestamp: new Date((index + 1) * 1000).toISOString(),
    agentId: 'system',
    eventType: 'workflow_started',
    description: `event ${index}`,
    severity,
  };
}

describe('AuditTrail', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders empty state gracefully', () => {
    render(<AuditTrail events={[]} />);
    expect(screen.getByText(/No events yet/i)).toBeInTheDocument();
  });

  it('renders up to maxVisible events by default (8)', () => {
    const events = Array.from({ length: 10 }, (_, i) => makeEvent(i));
    render(<AuditTrail events={events} />);

    expect(screen.getAllByTestId(/audit-event-/)).toHaveLength(8);
  });

  it('shows show-all toggle when more than 8 events exist', () => {
    const events = Array.from({ length: 10 }, (_, i) => makeEvent(i));
    render(<AuditTrail events={events} />);

    expect(screen.getByRole('button', { name: /show all/i })).toBeInTheDocument();
  });

  it('copies JSON payload to clipboard', async () => {
    const events = [makeEvent(0)];
    render(<AuditTrail events={events} />);

    fireEvent.click(screen.getByRole('button', { name: /copy trace/i }));

    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(events, null, 2));
  });

  it('applies severity dot color classes', () => {
    const events = [makeEvent(0, 'info'), makeEvent(1, 'ok'), makeEvent(2, 'warn')];
    render(<AuditTrail events={events} maxVisible={10} />);

    const rendered = screen.getAllByTestId(/audit-event-/);
    expect(rendered[0].querySelector('.bg-slate-500')).toBeTruthy();
    expect(rendered[1].querySelector('.bg-green-500')).toBeTruthy();
    expect(rendered[2].querySelector('.bg-amber-500')).toBeTruthy();
  });
});
