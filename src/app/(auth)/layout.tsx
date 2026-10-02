import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="flex items-center gap-2 text-brand">
        <Dumbbell className="size-7" strokeWidth={2.5} />
        <span className="text-2xl font-bold tracking-tight text-foreground">Gideon&apos;s Fit</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
