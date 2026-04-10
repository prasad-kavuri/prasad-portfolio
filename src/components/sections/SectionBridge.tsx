export function SectionBridge({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-2">
      <p className="text-sm text-muted-foreground italic border-l-2 border-indigo-500/40 pl-4">
        {text}
      </p>
    </div>
  );
}
