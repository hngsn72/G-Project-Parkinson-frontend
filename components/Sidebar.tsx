'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Mic, 
  Users, 
  Calendar, 
  History, 
  // Settings,
  // BarChart3,
  ChevronRight,
  Globe,
  Shield,
  Bookmark,
  FileText,
  Building2
} from 'lucide-react';

const getNavigationItems = (isAdmin: boolean, isDoctor: boolean) => {
  const baseItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview & Analytics'
    },
    {
      title: 'Voice Analysis',
      href: '/diagnosis',
      icon: Mic,
      description: 'AI Voice Diagnosis'
    }
  ];

  // Add role-specific items
  if (isAdmin || isDoctor) {
    baseItems.push({
      title: 'Patients',
      href: '/patients', 
      icon: Users,
      description: 'Patient Management'
    });
  }

  baseItems.push(
    {
      title: 'Bệnh viện',
      href: '/hospitals',
      icon: Building2,
      description: 'Tìm kiếm bệnh viện'
    },
    {
      title: 'Lịch hẹn',
      href: '/scheduler',
      icon: Calendar,
      description: 'Quản lí lịch hẹn'
    },
    {
      title: 'History',
      href: '/history',
      icon: History,
      description: 'Analysis Records'
    },
    {
      title: 'Blog Bác sĩ',
      href: '/blog',
      icon: FileText,
      description: 'Blog từ bác sĩ'
    },
    {
      title: 'Tin tức',
      href: '/news',
      icon: Globe,
      description: 'Tin tức chính thức'
    },
    {
      title: 'Bài viết đã lưu',
      href: '/saved-posts',
      icon: Bookmark,
      description: 'Bài viết yêu thích'
    }
  );

  // Admin-only items
  if (isAdmin) {
    baseItems.push({
      title: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      description: 'Quản lý hệ thống'
    });
  }

  return baseItems;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isDoctor } = useAuth();
  
  const navigationItems = getNavigationItems(isAdmin(), isDoctor());

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="bg-white w-64 min-h-full border-r border-gray-200 shadow-sm">
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`group relative flex items-center px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                    active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className={`text-xs truncate ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {active && (
                    <ChevronRight className="h-4 w-4 ml-2 opacity-70" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
