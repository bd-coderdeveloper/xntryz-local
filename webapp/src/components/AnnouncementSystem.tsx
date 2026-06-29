'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { X, Info, AlertTriangle, CheckCircle, Flame, Megaphone } from 'lucide-react';

export default function AnnouncementSystem() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [doNotShowToday, setDoNotShowToday] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        const active = data.data || [];

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

        // Filter out announcements dismissed today
        const filtered = active.filter((item: any) => {
          return localStorage.getItem(`dismissed_announcement_today_${item.id}`) !== todayStr;
        });

        setAnnouncements(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  const handleDismiss = (id: string) => {
    if (doNotShowToday[id]) {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      localStorage.setItem(`dismissed_announcement_today_${id}`, todayStr);
    }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (announcements.length === 0) return null;

  // Render banners at the top
  const banners = announcements.filter(a => a.display_style === 'banner');
  // Render popups in the center
  const popups = announcements.filter(a => a.display_style === 'popup');

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'maintenance': return <Flame className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getBannerColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100';
      case 'maintenance': return 'bg-red-500/10 border-red-500/20 text-red-100';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-100';
    }
  };

  const getBadgeColorClass = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'success': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'maintenance': return 'border-red-500/30 bg-red-500/10 text-red-400';
      default: return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
    }
  };

  return (
    <>
      {/* Banners - Premium Running text in Header */}
      {banners.length > 0 && (
        <div className="w-full bg-linear-to-r from-dark-950 via-dark-900 to-dark-950 border-b border-dark-800/80 flex items-center h-12 shrink-0 relative shadow-md z-[60] overflow-hidden group">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100%); }
            }
            .animate-marquee {
              display: inline-flex;
              animation: marquee ${Math.max(20, banners.length * 15)}s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>

          {/* Static Ticker Head */}
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-4 bg-gradient-to-r from-dark-950 via-dark-950 to-transparent pr-12 pointer-events-none">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-dark-800/80 backdrop-blur-md border border-dark-700/50 rounded-lg shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-zinc-100 tracking-widest relative z-10">ประกาศจากทีมงาน</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            {/* Soft fade gradients for marquee */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none"></div>

            <div className="animate-marquee whitespace-nowrap flex items-center gap-10 px-8 h-full">
              {banners.map((item, idx) => {
                const badgeClass = getBadgeColorClass(item.type);
                return (
                  <div key={item.id || idx} className="flex items-center">
                    <div className="flex items-center gap-3 py-1 px-2 rounded-xl hover:bg-white/[0.02] transition-colors cursor-default">
                      <div className={`px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${badgeClass}`}>
                        <Megaphone className="w-3 h-3 opacity-80" />
                        {item.title}
                      </div>
                      <span className="text-[13px] text-zinc-200 font-medium tracking-wide drop-shadow-sm pr-2">{item.content}</span>
                    </div>
                    {/* Separator */}
                    <div className="w-1.5 h-1.5 rounded-full bg-dark-700 ml-10 shadow-inner"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pop-ups (Modal) */}
      {popups.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col gap-4 w-full max-w-md">
            {popups.map((item, idx) => (
              <div
                key={item.id}
                className={`bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
                style={{ display: idx === 0 ? 'block' : 'none' }} // Show one popup at a time if multiple
              >
                <div className={`p-4 border-b flex items-center justify-between ${item.type === 'maintenance' ? 'bg-red-500/10 border-red-500/20' :
                  item.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    item.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      'bg-blue-500/10 border-blue-500/20'
                  }`}>
                  <div className="flex items-center gap-2">
                    {getIcon(item.type)}
                    <span className="font-bold text-white">{item.title}</span>
                  </div>
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!doNotShowToday[item.id]}
                        onChange={(e) => setDoNotShowToday(p => ({ ...p, [item.id]: e.target.checked }))}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                      />
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">ไม่แจ้งเตือนวันนี้</span>
                    </label>
                    <button
                      onClick={() => handleDismiss(item.id)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}