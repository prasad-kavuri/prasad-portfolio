import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TelemetryDisclosureProps {
  label: string;
  message: string;
  className?: string;
}

export function TelemetryDisclosure({ label, message, className }: TelemetryDisclosureProps) {
  return (
    <div
      role="note"
      aria-label={`${label} disclosure`}
      className={cn(
        'rounded-xl border border-amber-500/30 bg-amber-500/10 p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
          {label}
        </Badge>
        <p className="text-sm text-foreground/95">{message}</p>
      </div>
    </div>
  );
}
