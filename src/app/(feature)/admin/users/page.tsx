'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

type AdminUser = {
  id: number; email: string; display_name: string; role: string; status: string; created_at: string;
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/users`, {
          headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}` }
        });
        if (!res.ok) throw new Error('Không có quyền hoặc lỗi máy chủ');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (e:any) {
        setError(e.message);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang kiểm tra đăng nhập...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Quản trị người dùng</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-50 text-left text-sm">
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Tên hiển thị</th>
              <th className="p-2 border">Vai trò</th>
              <th className="p-2 border">Trạng thái</th>
              <th className="p-2 border">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="text-sm">
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.display_name}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.status}</td>
                <td className="p-2 border">{new Date(u.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


