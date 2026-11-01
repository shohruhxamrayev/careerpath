"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { AppProvider } from "@/lib/store/AppProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>{children}</AppProvider>
    </ToastProvider>
  );
}
