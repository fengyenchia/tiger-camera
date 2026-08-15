import type { Metadata } from "next";

import { AdminPanel } from "@/app/admin/_components/admin-panel";

export const metadata: Metadata = {
  title: "管理員｜Tiger Camera",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-36 md:px-10">
      <AdminPanel />
    </main>
  );
}

