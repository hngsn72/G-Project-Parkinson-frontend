'use client';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { useEffect as useReactEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useReactEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    AuthService.me().then(res => {
      if (res.success && res.data) {
        setDisplayName(res.data.display_name);
        setEmail(res.data.email);
      }
    });
  }, []);

  const onSave = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}`,
      },
      body: JSON.stringify({ display_name: displayName, email }),
    });
    setMessage(res.ok ? 'Đã lưu' : 'Lỗi lưu thay đổi');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang kiểm tra đăng nhập...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Hồ sơ</h1>
      {message && <div className="text-sm text-green-700 mb-2">{message}</div>}
      <label className="block text-sm mb-1">Tên hiển thị</label>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full border rounded px-3 py-2 mb-3"/>
      <label className="block text-sm mb-1">Email</label>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2 mb-4"/>
      <button onClick={onSave} className="bg-blue-600 text-white rounded px-4 py-2">Lưu</button>
    </div>
  );
}


