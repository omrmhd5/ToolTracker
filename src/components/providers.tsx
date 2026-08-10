"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        richColors
        closeButton
        position="top-right"
        duration={3500}
        toastOptions={{
          classNames: {
            toast: "font-[family-name:var(--font-geist-sans)]",
          },
        }}
      />
    </SessionProvider>
  );
}
