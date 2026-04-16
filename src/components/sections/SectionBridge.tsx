export function SectionBridge({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:py-5">
      <p className="rounded-lg border border-border/60 bg-muted/25 px-4 py-3 text-sm italic leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
