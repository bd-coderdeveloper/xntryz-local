'use client';

import { supabase } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, CopyPlus, Trash2, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserData(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-[2rem] overflow-hidden glass-panel p-10 md:p-14 border border-orange-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            ยินดีต้อนรับสู่ <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-orange-600">UPFEEDTH</span>
          </h1>
          <p className="text-lg md:text-xl text-dark-300 mb-8 leading-relaxed">
            สุดยอดเครื่องมือจัดการ Facebook ครบวงจร ที่ช่วยประหยัดเวลาการทำงาน เพิ่มยอดการเข้าถึง และบริหารจัดการเพจของคุณอย่างมืออาชีพ 🚀
          </p>

          <div className="text-xl font-medium text-white bg-dark-900/40 backdrop-blur-md inline-block px-5 py-3 rounded-2xl border border-dark-700/50 shadow-inner">
            ยินดีต้อนรับ Username: <span className="text-orange-400 font-bold">{userData?.user_metadata?.username || 'ผู้ใช้งาน'}</span> 👋
          </div>
        </div>
      </div>

      {/* Quick Tools */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <LayoutDashboard className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">เครื่องมือยอดนิยม (Quick Tools)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/tools/deep-clone" className="group glass-panel p-8 rounded-[1.5rem] hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden shadow-lg hover:shadow-blue-500/10">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <CopyPlus className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Page Deep Clone</h3>
            <p className="text-dark-400 text-sm mb-6 leading-relaxed">
              คัดลอกโพสต์ รูปภาพ วิดีโอ และอัลบั้มจากเพจเป้าหมายได้อย่างรวดเร็ว พร้อมตั้งเวลาโพสต์ได้ทันที
            </p>
            <div className="text-blue-400 text-sm font-bold flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              เริ่มใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          <Link href="/tools/one-card" className="group glass-panel p-8 rounded-[1.5rem] hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden shadow-lg hover:shadow-orange-500/10">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Zap className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">One Card & Carousel</h3>
            <p className="text-dark-400 text-sm mb-6 leading-relaxed">
              สร้างโพสต์แบบภาพเดียวหรือ Carousel อัตโนมัติ สะดวกสบายสำหรับสายคอนเทนต์ จัดการรูปได้อิสระ
            </p>
            <div className="text-orange-400 text-sm font-bold flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              เริ่มใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          <Link href="/tools/post-remover" className="group glass-panel p-8 rounded-[1.5rem] hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden shadow-lg hover:shadow-red-500/10">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Posts Remover</h3>
            <p className="text-dark-400 text-sm mb-6 leading-relaxed">
              ลบโพสต์บนเพจของคุณแบบอัตโนมัติ ความเร็วสูง ช่วยเคลียร์เนื้อหาเพจให้สะอาดและจัดระเบียบง่ายๆ
            </p>
            <div className="text-red-400 text-sm font-bold flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              เริ่มใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}