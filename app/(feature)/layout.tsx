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
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Header />
        </div>
        <div className="flex flex-1 pt-[72px]"> {/* Adjust pt-[72px] if Header height changes */}
          {/* Fixed Sidebar */}
          <div className="fixed top-[72px] left-0 bottom-0 z-20 w-64">
            <Sidebar />
          </div>
          {/* Main Content Scrollable */}
          <main className="flex-1 ml-64 p-6 overflow-y-auto min-h-[calc(100vh-72px)] bg-gray-50">
            {children}
          </main>
        </div>
        <div className="ml-64">
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}
