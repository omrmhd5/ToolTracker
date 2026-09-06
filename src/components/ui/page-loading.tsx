type PageLoadingProps = {
  variant?: "app" | "auth";
  label?: string;
};

export function PageLoading({
  variant = "app",
  label = "Loading",
}: PageLoadingProps) {
  if (variant === "auth") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center px-4 py-8"
        aria-busy="true"
        aria-live="polite">
        <div className="w-full max-w-md animate-pulse space-y-4">
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted/70" />
        </div>
        <p className="sr-only">{label}</p>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-xl bg-muted/80" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-muted/60" />
      <p className="sr-only">{label}</p>
    </div>
  );
}
