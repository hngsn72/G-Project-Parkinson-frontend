'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search, 
  Bell, 
  Settings, 
  User,
  Menu,
  ChevronDown,
  Activity,
  Calendar,
  HelpCircle,
  LogOut,
  Stethoscope,
  Bookmark
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Brand */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-xl shadow-lg">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">ParkinsonVoice</h1>
                <p className="text-xs text-gray-500">AI Medical Platform</p>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search patients, records, or analysis..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-3">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4 mr-4 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">24 Active</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">8 Today</span>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-900">New Analysis Complete</p>
                      <p className="text-xs text-gray-500">Patient #1234 voice analysis ready</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-yellow-500">
                      <p className="text-sm font-medium text-gray-900">Appointment Reminder</p>
                      <p className="text-xs text-gray-500">Dr. Smith - 2:30 PM today</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-green-500">
                      <p className="text-sm font-medium text-gray-900">System Update</p>
                      <p className="text-xs text-gray-500">New features available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.display_name || 'Chưa đăng nhập'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.display_name || 'Chưa đăng nhập'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                  
                  <button
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/profile');
                    }}
                  >
                    <User className="h-4 w-4 mr-3" />
                    {user?.display_name ? 'Profile Settings' : 'Chưa đăng nhập'}
                  </button>

                  <button 
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/saved-posts');
                    }}
                  >
                    <Bookmark className="h-4 w-4 mr-3" />
                    Bài viết đã lưu
                  </button>
                  
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4 mr-3" />
                    Preferences
                  </button>
                  
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Help & Support
                  </button>
                  
                  <div className="border-t border-gray-100 mt-1">
                    <button onClick={logout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
