"use client";

import { useState } from "react";
import { toast } from "sonner";
import { chooseProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import {
  ProfileTypeSelector,
  type ProfileType,
} from "@/components/shared/profile-type-selector";

export function ProfileChoice() {
  const [value, setValue] = useState<ProfileType>();
  const [pending, setPending] = useState(false);

  async function handleContinue() {
    if (!value) return;
    setPending(true);
    const result = await chooseProfile(value);
    if (result?.error) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="flex flex-col gap-4">
      <ProfileTypeSelector value={value} onChange={setValue} />
      <Button onClick={handleContinue} disabled={!value || pending} className="w-full">
        {pending ? "Salvando..." : "Continuar"}
      </Button>
    </div>
  );
}
