"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.28a12 12 0 0 0 0 10.8l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}

export function GoogleButton({
  label = "Continuar com Google",
  profile,
  disabled = false,
}: {
  label?: string;
  profile?: "trainer" | "standard";
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const query = profile ? `?perfil=${profile}` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback${query}` },
    });
    if (error) {
      setError("Não foi possível iniciar o login com o Google.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={pending || disabled}>
        <GoogleIcon />
        {pending ? "Redirecionando..." : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
