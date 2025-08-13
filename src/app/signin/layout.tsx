import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function SigninLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex">
        {/* Left side: Logo, text, background */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-600 to-blue-400 relative overflow-hidden">
          <div className="z-10 flex flex-col items-center px-8">
            <img src="/favicon.ico" alt="Logo" className="w-24 h-24 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-bold text-white mb-2 text-center drop-shadow">PARKINSON VOICE ANALYSIS</h1>
            <p className="text-white text-lg text-center max-w-md drop-shadow">Nền tảng hỗ trợ phân tích giọng nói phát hiện Parkinson hiện đại, bảo mật và dễ sử dụng.</p>
          </div>
          <div className="absolute inset-0 bg-[url('/bg-trongdong.jpg')] bg-cover bg-center opacity-20" />
        </div>
        {/* Right side: Signin form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md px-4">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
