'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mic, Calendar, User, FileText } from 'lucide-react';
import { ACCESSIBILITY } from '@/constants/accessibility';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Trang chủ' },
    { href: '/diagnosis', icon: Mic, label: 'Phân tích' },
    { href: '/scheduler', icon: Calendar, label: 'Đặt lịch' },
    { href: '/appointments', icon: FileText, label: 'Lịch hẹn' },
    { href: '/profile', icon: User, label: 'Hồ sơ' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-5 h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              style={{ minHeight: ACCESSIBILITY.touchTarget.comfortable }}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
