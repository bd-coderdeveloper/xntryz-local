'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Ticket, Loader2, ShieldAlert, Plus, Trash2, Calendar, Users, Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [rewardPackage, setRewardPackage] = useState('Pro');
  const [rewardDays, setRewardDays] = useState('5');
  const [rewardBalance, setRewardBalance] = useState('0');
  const [maxUses, setMaxUses] = useState('10');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // Admin access wrapper
      const username = (session.user.user_metadata?.username || '').toLowerCase();
      const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
      if (!adminUsernames.includes(username)) return router.push('/tools/one-card');

      const res = await fetch('/api/admin/promos', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูลหน้า Promo');
      const data = await res.json();
      setPromos(data.promos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          reward_package: rewardPackage === 'None' ? null : rewardPackage,
          reward_days: rewardDays,
          reward_balance: rewardBalance,
          max_uses: maxUses,
          valid_until: validUntil || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAdd(false);
      setCode('');
      await fetchPromos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบโค้ด ${codeName}?`)) return;

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/admin/promos?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchPromos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  if (error) return (
    <div className="glass-panel p-8 rounded-2xl flex flex-col items-center max-w-lg mx-auto mt-20">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
      <p className="text-dark-300">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-orange-500" />
            ระบบจัดการ Promo Codes
          </h1>
          <p className="text-dark-400 mt-2">สร้างและแจกจ่ายโค้ดโปรโมชั่น ลดราคา หรือแจกวันใช้งาน</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'ปิดหน้าต่างแก้ไข' : 'สร้างใหม่'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreatePrompt} className="bg-dark-900 border border-dark-800 p-6 rounded-2xl shadow-xl animate-fade-in-up">
          <h3 className="text-lg font-bold text-white mb-4">✨ เพิ่มโค้ดใหม่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="space-y-1">
              <label className="text-xs text-dark-400">โค้ด (CODE)</label>
              <input required type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white font-mono uppercase" placeholder="SUMMER50" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-dark-400">อัปเกรดเป็นแพ็กเกจ</label>
              <select value={rewardPackage} onChange={e => setRewardPackage(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white">
                <option value="None">ไม่ปรับแพ็กเกจ</option>
                <option value="Pro">ให้สิทธิ์ Pro</option>
                <option value="Premium">ให้สิทธิ์ Premium</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-dark-400">จำกัดจำนวนคนใช้งาน</label>
              <input type="number" required min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white" placeholder="0 = ไม่จำกัด" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-dark-400">วันหมดอายุของโค้ด</label>
              <input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-dark-400">จำนวนวันที่</label>
              <div className="flex gap-2">
                <input type="number" required min="0" value={rewardDays} onChange={e => setRewardDays(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-dark-400">เพิ่มเงินใน Wallet(THB)</label>
              <div className="flex gap-2">
                <input type="number" required min="0" value={rewardBalance} onChange={e => setRewardBalance(e.target.value)} placeholder="0 = ไม่ได้เงินคืน" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white" />
                <button type="submit" disabled={processing} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 font-bold rounded-lg shrink-0 disabled:opacity-50">
                  บันทึก
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      <div className="bg-dark-900/50 border border-dark-800 rounded-2xl overflow-x-auto shadow-xl mt-8">
        <table className="w-full text-left text-sm text-dark-300">
          <thead className="bg-dark-950/80 border-b border-dark-800 text-[11px] uppercase tracking-wider font-semibold text-dark-400">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">โค้ด (Code)</th>
              <th className="px-6 py-4 whitespace-nowrap">รางวัล (Rewards)</th>
              <th className="px-6 py-4 whitespace-nowrap">การใช้งาน</th>
              <th className="px-6 py-4 whitespace-nowrap">รายชื่อผู้ใช้ (Redeemed)</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/60">
            {promos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-dark-400">
                  ยังไม่มีโค้ดโปรโมชั่นในระบบ
                </td>
              </tr>
            )}
            {promos.map((promo) => {
              const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
              const isMaxedOut = promo.max_uses > 0 && promo.used_count >= promo.max_uses;
              const isDead = isExpired || isMaxedOut;

              return (
                <tr key={promo.id} className={`hover:bg-dark-800/20 transition-colors group ${isDead ? 'opacity-70 bg-dark-950/30' : ''}`}>
                  {/* Promo Code Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-dark-800 border flex items-center justify-center shrink-0 ${isDead ? 'border-dark-700 text-dark-500' : 'border-orange-500/30 text-orange-400'}`}>
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base font-mono">
                          {promo.code}
                        </span>
                        <div className="text-[10px] text-dark-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          สร้างเมื่อ: {new Date(promo.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rewards */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          promo.reward_package === 'Premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          promo.reward_package === 'Pro' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-dark-800 text-dark-300 border-dark-700'
                        }`}>
                          {promo.reward_package || 'ไม่แถมแพ็กเกจ'}
                        </span>
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          +{promo.reward_days} วัน
                        </span>
                      </div>
                      {promo.reward_balance > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 w-fit px-2 py-0.5 rounded-md border border-green-500/20">
                          <span className="text-green-500">฿</span> +{promo.reward_balance} THB
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Usage & Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-2">
                         <span className="text-dark-400">ใช้ไปแล้ว:</span>
                         <span className="font-bold text-white bg-dark-800 px-2 py-0.5 rounded-md border border-dark-700">
                           {promo.used_count} / {promo.max_uses === 0 ? '∞' : promo.max_uses}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-dark-400">หมดอายุ:</span>
                        {promo.valid_until ? (
                          <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-dark-300'}`}>
                            {new Date(promo.valid_until).toLocaleString('th-TH')}
                          </span>
                        ) : (
                          <span className="text-dark-600">ไม่มีวันหมดอายุ</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Redemptions List */}
                  <td className="px-6 py-4">
                    {promo.redeemed_by && promo.redeemed_by.length > 0 ? (
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-dark-700 min-w-[200px]">
                        {promo.redeemed_by.map((user: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] border-b border-dark-800/50 pb-1 pt-1 last:border-0 pl-1 group/item hover:bg-dark-800/50 rounded px-1 transition-colors">
                            <span className="text-orange-300 font-medium truncate max-w-[120px]" title={user.email}>{user.username}</span>
                            <span className="text-dark-500 text-[9px] shrink-0">{new Date(user.redeemed_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-dark-500 italic">ยังไม่มีผู้ใช้งาน</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(promo.id, promo.code)}
                      disabled={processing}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบโค้ด
                    </button>
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