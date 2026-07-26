import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ExportImportBar } from "@/components/layout/ExportImportBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar user={session.user} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">{children}</main>
      <ExportImportBar />
    </div>
  );
}
