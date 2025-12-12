'use client';

import { useState } from 'react';
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/useAuth";

import type { ReactNode } from "react";

interface FeatureLayoutProps {
  children: ReactNode;
}

export default function FeatureLayout({ children }: FeatureLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Header onToggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[72px]">
          {/* Fixed Sidebar - Hidden on Mobile (<768px) */}
          <div className={`hidden md:block fixed top-[72px] left-0 bottom-0 z-20 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
            <Sidebar collapsed={sidebarCollapsed} />
          </div>
          
          {/* Main Content Scrollable */}
          <main className={`flex-1 p-4 md:p-6 overflow-y-auto min-h-[calc(100vh-72px)] bg-gray-50 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} pb-24 md:pb-0`}>
            {children}
          </main>
        </div>
        
        {/* Footer - Hidden on Mobile */}
        <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <Footer />
        </div>

        {/* Bottom Navigation - Only Mobile (<768px) */}
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
