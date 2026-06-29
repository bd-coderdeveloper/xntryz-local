'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, ShieldAlert, MessageCircle, X } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBannedUrl, setIsBannedUrl] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('banned') === 'true') {
        setIsBannedUrl(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Using dummy email approach
    const email = `${username.trim()}@upfeed.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/tools/one-card');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-950">

      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full mix-blend-screen" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 rotate-3 hover:rotate-6 transition-transform">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">UPFEEDTH</h1>
          <p className="text-dark-400 mt-2">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-2xl p-8 relative z-10">
          <form onSubmit={handleLogin} className="space-y-6">

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">Username: </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอก Username"
                className="input-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200 ml-1">Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="input-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'เข้าสู่ระบบ'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-dark-400 text-sm">
              ยังไม่มีบัญชีใช่ไหม?{' '}
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                สมัครเล๊ยย!!
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-8">
          BD Coder & Developer © 2026. All rights reserved.
        </p>
      </div>

      {isBannedUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-dark-900 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-red-500/20 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsBannedUrl(false)} 
              className="absolute top-4 right-4 text-dark-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">บัญชีถูกระงับการใช้งาน</h2>
            <p className="text-dark-400 mb-8 text-sm leading-relaxed">
              สิทธิ์การเข้าใช้งานของท่านถูกระงับชั่วคราว<br/>
              หากต้องการทราบสาเหตุหรือขอปลดแบน<br/>
              กรุณาติดต่อทีมซัพพอร์ตโดยตรงค่ะ
            </p>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                alert('โปรดใส่ลิงก์ติดต่อ Support ตรงนี้ เช่น ลิงก์ Line OA หรือ Facebook Messenger');
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              ติดต่อ Support สด
            </a>
            <button 
              onClick={() => setIsBannedUrl(false)} 
              className="mt-6 text-sm font-medium text-dark-500 hover:text-white transition-colors underline underline-offset-4"
            >
              กลับหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}