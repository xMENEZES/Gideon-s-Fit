import { notFound } from "next/navigation";
import { getTrainerStudent } from "@/lib/data/students";
import { getStudentBodyData } from "@/lib/data/body-data";
import { ageOn, formatBirthDate, weightLabel } from "@/lib/body-data";
import { todayBR } from "@/lib/dates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

// Dados corporais do aluno, somente leitura. Só chegam aqui os de alunos do time (RLS do banco);
// quem altera ou apaga é o próprio aluno, em Perfil > Meus Dados.
export default async function AlunoDadosPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = await getTrainerStudent(studentId);
  if (!student) notFound();

  const data = await getStudentBodyData(studentId);
  const age = data ? ageOn(data.birth_date, todayBR()) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do aluno</CardTitle>
        <CardDescription>
          Informados pelo próprio aluno, em Perfil &gt; Meus Dados. Somente leitura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data ? (
          <dl className="flex flex-col gap-3">
            <Row
              label="Data de nascimento"
              value={`${formatBirthDate(data.birth_date)}${age !== null ? ` (${age} anos)` : ""}`}
            />
            <Row label="Altura" value={data.height_cm != null ? `${data.height_cm} cm` : "Não informada"} />
            <Row label="Peso" value={data.weight_kg != null ? weightLabel(data.weight_kg) : "Não informado"} />
            <Row
              label="Atualizado em"
              value={new Date(data.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">O aluno ainda não informou os dados corporais.</p>
        )}
      </CardContent>
    </Card>
  );
}
