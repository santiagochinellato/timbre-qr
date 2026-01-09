"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveStatusPoller({
  intervalMs = 3000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // Re-fetches server components
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null; // Invisible component
}
