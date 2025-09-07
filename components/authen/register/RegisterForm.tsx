"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await AuthService.register(email, password, displayName);
    setLoading(false);
    if (!res.success) { setError(res.error || 'Đăng ký thất bại'); return; }
    router.push('/');
  };

  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ height: 420 }}
      animate={{ height: 500 }}
      exit={{ height: 420 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <div className="flex flex-col items-center mb-6">
        <img src="/favicon.ico" alt="Logo" className="w-12 h-12 mb-2" />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng ký tài khoản mới</h1>
        <p className="text-gray-500 text-sm">Tạo tài khoản để sử dụng Parkinson Voice Analysis</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 mb-2 text-center">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" required/>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" required/>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" required/>
        </div>
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold transition-colors duration-150 disabled:opacity-60">
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>
      <div className="mt-3 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link href="/signin" className="text-blue-700 font-medium hover:underline">Đăng nhập</Link>
      </div>
    </motion.div>
  );
}
