import { Dumbbell, WifiOff } from "lucide-react";

export const metadata = {
  title: "Sem conexão — Gideon's Fit",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12 text-center">
      <div className="flex items-center gap-2 text-brand">
        <Dumbbell className="size-7" strokeWidth={2.5} />
        <span className="text-2xl font-bold tracking-tight text-foreground">Gideon&apos;s Fit</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <WifiOff className="size-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Você está sem conexão</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar esta página porque o dispositivo está offline. Verifique sua
          internet e tente novamente.
        </p>
      </div>
    </div>
  );
}
