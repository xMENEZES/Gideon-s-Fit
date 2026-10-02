import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shared/top-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "student") redirect("/aluno");
  if (profile?.role === "trainer") redirect("/dashboard");
  if (profile?.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar fullName={profile.full_name} homeHref="/admin" />
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
