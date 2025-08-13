import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/useAuth";

import type { ReactNode } from "react";

interface FeatureLayoutProps {
  children: ReactNode;
}

export default function FeatureLayout({ children }: FeatureLayoutProps) {
  return (
    <AuthProvider>
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <Footer />
    </AuthProvider>
  );
}
