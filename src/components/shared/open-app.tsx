"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Se a navegação do app travar (rede ruim), cai para uma navegação completa depois deste tempo.
const FALLBACK_AFTER_MS = 12000;

export function OpenApp({ home }: { home: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(home);
    const fallback = window.setTimeout(() => window.location.replace(home), FALLBACK_AFTER_MS);
    return () => window.clearTimeout(fallback);
  }, [router, home]);

  return null;
}
