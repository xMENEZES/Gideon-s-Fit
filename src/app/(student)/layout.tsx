import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";

export default async function StudentAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (!profile.onboarded) redirect(ONBOARDING_PATH);
  if (profile.role !== "student") redirect(roleHome(profile.role));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar fullName={profile.full_name} homeHref="/aluno" />
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
