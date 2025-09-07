export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <p>&copy; 2025 ParkinsonVoice AI Platform. All rights reserved.</p>
          <div className="hidden sm:flex items-center space-x-4">
            <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="/support" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden md:inline">Version 2.1.0</span>
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-xs">System Online</span>
        </div>
      </div>
    </footer>
  );
}
