import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Botão no topo das telas de edição e de plano completo para voltar à tela diária.
export function BackToTodayLink({ href, label }: { href: string; label: string }) {
  return (
    <div>
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href} />}>
        <ArrowLeft />
        {label}
      </Button>
    </div>
  );
}
