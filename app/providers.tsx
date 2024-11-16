"use client";

import { JazzAndAuth } from "@/lib/jazz";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <JazzAndAuth>{children}</JazzAndAuth>;
}
