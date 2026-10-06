import Link from "next/link";
import { AlertTriangle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function daysRemaining(endDate: string) {
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

const TYPE_LABEL: Record<string, string> = {
  workout: "Prot. Treino",
  diet: "Prot. Alimentar",
};

export default async function AlertasPage() {
  const supabase = await createClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 7);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const { data: alerts } = await supabase
    .from("protocols")
    .select("id, type, end_date, students(id, nickname, profiles!students_profile_id_fkey(full_name))")
    .eq("is_active", true)
    .lte("end_date", cutoff)
    .order("end_date", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Alertas de vencimento</h1>

      {!alerts?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhum protocolo vencendo nos próximos 7 dias.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const remaining = daysRemaining(alert.end_date);
            const student = alert.students;

            return (
              <Link key={alert.id} href={`/dashboard/alunos/${student?.id ?? ""}`}>
                <Card className="transition-colors hover:border-primary/60">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <User className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">{student?.nickname ?? student?.profiles?.full_name}</p>
                        <Badge variant="secondary">{TYPE_LABEL[alert.type]}</Badge>
                      </div>
                    </div>
                    <Badge variant={remaining < 0 ? "destructive" : "secondary"} className="gap-1">
                      <AlertTriangle className="size-3" />
                      {remaining < 0
                        ? `Vencido há ${Math.abs(remaining)}d`
                        : remaining === 0
                          ? "Vence hoje"
                          : `${remaining}d restantes`}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
