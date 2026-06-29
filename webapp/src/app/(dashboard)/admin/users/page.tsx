'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ShieldAlert, User, Mail, Calendar, Loader2, Ban, ShieldCheck, CreditCard, Wallet, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  banned_until?: string;
  user_metadata: {
    username?: string;
    package?: string;
    package_expire?: string;
    wallet_balance?: number | string;
    recent_fb_token?: string;
    recent_eaab_token?: string;
  };
  today_usage?: {
    posts_removed_count: number;
    posts_cloned_count: number;
    auto_create_pages_count: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check admin status early to aggressively redirect non-admins
      const username = (session.user.user_metadata?.username || '').toLowerCase();
      const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
      if (!adminUsernames.includes(username)) {
        router.push('/tools/one-card');
        return;
      }

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/tools/one-card');
          return;
        }
        throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'ban' | 'package' | 'expire', value: any) => {
    try {
      setProcessingId(userId);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action, value })
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'เกิดข้อผิดพลาดในการอัปเดต Server');
      }

      // Refresh list
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.user_metadata?.username && u.user_metadata.username.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-dark-300">กำลังโหลดรายชื่อผู้ใช้ทั้งหมด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto mt-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-dark-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
            ระบบจัดการผู้ใช้งาน (Admin)
          </h1>
          <p className="text-dark-400 mt-2">จัดการสิทธิ์ สถานะ และแพ็กเกจของสมาชิกทั้งหมดในระบบ</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 text-sm rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
          <div className="bg-dark-900 border border-dark-800 px-4 py-2 w-full sm:w-auto text-center rounded-xl text-dark-300 whitespace-nowrap">
            ค้นพบ: <span className="text-orange-400 font-bold ml-1">{filteredUsers.length}</span> / {users.length}
          </div>
        </div>
      </div>

      <div className="bg-dark-900/50 border border-dark-800 rounded-2xl overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm text-dark-300">
          <thead className="bg-dark-950/80 border-b border-dark-800 text-[11px] uppercase tracking-wider font-semibold text-dark-400 uppercase">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">ผู้ใช้งาน</th>
              <th className="px-6 py-4 whitespace-nowrap">แพ็กเกจ & หมดอายุ</th>
              <th className="px-6 py-4 whitespace-nowrap">เครดิต Wallet</th>
              <th className="px-6 py-4 whitespace-nowrap text-center">Tokens</th>
              <th className="px-6 py-4 whitespace-nowrap">สถานะ</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/60">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-dark-400">
                  ไม่พบผู้ใช้งานที่ตรงกับคีย์เวิร์ด
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => {
              const isBanned = !!user.banned_until || (user.user_metadata as any)?.is_banned === true;
              
              let currentPackage = user.user_metadata?.package || 'Free';
              const packageExpire = user.user_metadata?.package_expire;
              let isExpired = false;

              let effectivePackageExpire = packageExpire;

              if ((currentPackage === 'Pro' || currentPackage === 'Premium') && packageExpire && new Date(packageExpire) < new Date()) {
                currentPackage = 'Free';
                isExpired = true;
                effectivePackageExpire = undefined;
              }

              // Parse any existing format and render precisely in Thai timezone string YYYY-MM-DDTHH:mm
              const formatThaiInput = (dateString: string | null | undefined) => {
                if (!dateString) return '';
                const d = new Date(dateString);
                // Convert to YYYY-MM-DDTHH:mm in Thai Time
                try {
                  const formatter = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                  });
                  // en-CA gives YYYY-MM-DD, we just need to replace comma/space with T
                  const parts = formatter.formatToParts(d);
                  const p = (type: string) => parts.find(p => p.type === type)?.value || '00';
                  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`;
                } catch {
                  return dateString.slice(0, 16);
                }
              };

              return (
                <tr key={user.id} className="hover:bg-dark-800/20 transition-colors group">
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-dark-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          {user.user_metadata?.username || 'No Username'}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-dark-400 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="text-[10px] text-dark-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Package & Expiry */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                        currentPackage === 'Premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        currentPackage === 'Pro' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-dark-800 text-dark-300 border-dark-700'
                        }`}>
                        {currentPackage}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          className="bg-dark-950 border border-dark-800/80 rounded-md px-2 py-1 text-[11px] text-zinc-300 focus:border-orange-500 focus:outline-none w-36 shadow-inner"
                          value={formatThaiInput(effectivePackageExpire)}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Save exactly the specified time as local Thai time +07:00 so the DB recognizes it correctly
                            const isoString = val ? `${val}:00+07:00` : undefined;
                            handleAction(user.id, 'expire', isoString);
                          }}
                          disabled={processingId === user.id}
                          title="ลบเพื่อตั้งเป็นไม่มีวันหมดอายุ"
                        />
                        {processingId === user.id && <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />}
                      </div>
                    </div>
                  </td>

                  {/* Wallet & Quota */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-green-400">
                        <Wallet className="w-3.5 h-3.5" />
                        {user.user_metadata?.wallet_balance || 0} ฿
                      </div>
                      {/* <div className="flex items-center gap-1.5 text-xs text-dark-300">
                        <span className="text-[10px] uppercase font-bold text-dark-500 px-1 border border-dark-700 rounded bg-dark-800">สร้างเพจไปแล้ว</span>
                        <span className="font-semibold text-white">{user.today_usage?.auto_create_pages_count || 0}</span>
                      </div> */}
                    </div>
                  </td>

                  {/* Tokens */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {user.user_metadata?.recent_fb_token ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.user_metadata!.recent_fb_token!);
                            alert('คัดลอก FB Token แล้ว');
                          }}
                          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1 rounded text-[10px] uppercase font-bold border border-blue-500/20 transition-colors shadow-sm"
                          title="คลิกเพื่อคัดลอก FB Token"
                        >
                          FB Token
                        </button>
                      ) : (
                        <span className="text-[10px] text-dark-600 border border-dark-700/50 px-2 py-1 rounded bg-dark-800/30 line-through">NO FB</span>
                      )}

                      {user.user_metadata?.recent_eaab_token ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.user_metadata!.recent_eaab_token!);
                            alert('คัดลอก EAAB Token แล้ว');
                          }}
                          className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-2 py-1 rounded text-[10px] uppercase font-bold border border-purple-500/20 transition-colors shadow-sm"
                          title="คลิกเพื่อคัดลอก EAAB Token"
                        >
                          EAAB
                        </button>
                      ) : (
                        <span className="text-[10px] text-dark-600 border border-dark-700/50 px-2 py-1 rounded bg-dark-800/30 line-through">NO EAAB</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isBanned ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold">
                        <Ban className="w-3 h-3" /> ระงับ
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> ปกติ
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        className="bg-dark-950 border border-dark-700/80 text-xs rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-orange-500/50 hover:border-dark-600 transition-colors cursor-pointer w-28"
                        value={currentPackage}
                        disabled={processingId === user.id}
                        onChange={(e) => handleAction(user.id, 'package', e.target.value)}
                      >
                        <option value="Free">Free</option>
                        <option value="Pro">Pro</option>
                        <option value="Premium">Premium</option>
                      </select>

                      <button
                        onClick={() => handleAction(user.id, 'ban', !isBanned)}
                        disabled={processingId === user.id}
                        className={`min-w-[80px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${isBanned
                          ? 'bg-dark-800 text-green-400 hover:bg-dark-700 border border-dark-700 hover:border-green-500/30'
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40'
                          }`}
                      >
                        {processingId === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isBanned ? (
                          'ปลดแบน'
                        ) : (
                          'ระงับผู้ใช้'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
