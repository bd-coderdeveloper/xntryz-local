'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    // Optional: Add a check for an invite key logic here
    if (key !== 'UPFEED-INVITE') {
      // Just a mock check, in production we would verify against db
      // Let it bypass for now or show error depending on requirement
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          key,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        setLoading(false);
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'เครือข่ายมีปัญหา');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-950">

      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full mix-blend-screen" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-dark-800 to-dark-700 border border-dark-600 flex items-center justify-center shadow-lg mb-4 hover:scale-105 transition-transform">
            <KeyRound className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">สมัครสมาชิก</h1>
          <p className="text-dark-400 mt-2">UPFEED ยินดีต้อนรับทุกท่าน</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-2xl p-8 relative z-10">
          <form onSubmit={handleRegister} className="space-y-5">

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ไม่ต้องใช้อีเมล์"
                className="input-primary"
                required
                minLength={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ขั้นต่ำ 6 ตัวอักษร"
                className="input-primary"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ยืนยันรหัสผ่าน"
                className="input-primary"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">ผู้แนะนำ: <span className="text-dark-500 font-normal">(Optional)</span></label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="หากไม่มี ไม่ต้องใส่"
                className="input-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'สมัครสมาชิก'}
              {!loading && <Sparkles className="w-4 h-4 ml-1" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-dark-400 text-sm">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                เข้าสู่ระบบเล๊ยยย!!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}