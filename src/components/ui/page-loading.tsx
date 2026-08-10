export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-md bg-muted/70"
          />
        ))}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
