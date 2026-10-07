import { Suspense } from "react";
import {
  StudentPageHeader,
  StudentPageHeaderSkeleton,
} from "@/components/shared/student-page-header";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<StudentPageHeaderSkeleton />}>
        <StudentPageHeader studentId={studentId} />
      </Suspense>
      {children}
    </div>
  );
}
