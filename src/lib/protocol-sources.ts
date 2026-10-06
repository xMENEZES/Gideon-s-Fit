import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProtocolType } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

// Opções para iniciar um protocolo a partir de outro conteúdo: os modelos do
// profissional e os outros alunos dele que já têm protocolo ativo do mesmo tipo.
export async function loadProtocolSources(supabase: Client, studentId: string, type: ProtocolType) {
  const [{ data: templates }, { data: activeProtocols }] = await Promise.all([
    supabase
      .from("protocols")
      .select("id, template_name")
      .eq("type", type)
      .not("owner_trainer_id", "is", null)
      .order("template_name", { ascending: true }),
    supabase
      .from("protocols")
      .select("student_id, students(nickname, profiles!students_profile_id_fkey(full_name))")
      .eq("type", type)
      .eq("is_active", true)
      .not("student_id", "is", null)
      .neq("student_id", studentId),
  ]);

  return {
    templates: (templates ?? []).map((template) => ({
      id: template.id,
      name: template.template_name ?? "Modelo",
    })),
    sourceStudents: (activeProtocols ?? [])
      .filter((protocol): protocol is typeof protocol & { student_id: string } => !!protocol.student_id)
      .map((protocol) => ({
        id: protocol.student_id,
        name: protocol.students?.nickname ?? protocol.students?.profiles?.full_name ?? "Aluno",
      })),
  };
}
