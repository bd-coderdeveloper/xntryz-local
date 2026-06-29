'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { CreditCard, Loader2, ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const username = (session.user.user_metadata?.username || '').toLowerCase();
      const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
      if (!adminUsernames.includes(username)) return router.push('/tools/one-card');

      const res = await fetch('/api/admin/transactions', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    let comment = '';
    if (action === 'reject') {
      const p = prompt('กรุณาระบุเหตุผลที่ปฏิเสธ (ไม่อนุมัติสลิปนี้):');
      if (p === null) return;
      comment = p;
    } else {
      if (!confirm('คุณต้องการอนุมัติสลิปนี้ และมอบแพ็กเกจให้ผู้ใช้ใช่หรือไม่?')) return;
    }

    try {
      setProcessing(id);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, action, admin_comment: comment })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
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
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-orange-500" />
        ตารางตรวจสอบสลิปโอนเงิน (Billing)
      </h1>
      <p className="text-dark-400">ประวัติการชำระเงินและบิลที่รอการอนุมัติ</p>

      <div className="glass-panel rounded-2xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-950/50 border-b border-dark-800 text-dark-300 text-sm">
                <th className="p-4 rounded-tl-2xl">วันเวลาส่งสลิป</th>
                <th className="p-4">ผู้ใช้งาน (Username)</th>
                <th className="p-4">แพ็กเกจ</th>
                <th className="p-4">หลักฐานสลิป</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right rounded-tr-2xl">การจัดการสลิป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">ไม่มีประวัติรายการชำระเงิน</td>
                </tr>
              )}
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="p-4 text-dark-300 text-sm">
                    {new Date(tx.created_at).toLocaleString('th-TH')}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-white">{tx.username}</div>
                    <div className="text-xs text-dark-500">{tx.user_email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tx.requested_package === 'Premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                      {tx.requested_package}
                    </span>
                  </td>
                  <td className="p-4">
                    {tx.slip_url_signed ? (
                      <a href={tx.slip_url_signed} target="_blank" rel="noreferrer" className="block w-16 h-20 bg-dark-950 border border-dark-700 hover:border-orange-500 rounded-lg overflow-hidden transition group">
                        <img src={tx.slip_url_signed} alt="Slip" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-dark-500 text-xs">ไม่มีรูปสลิป</span>
                    )}
                  </td>
                  <td className="p-4">
                    {tx.status === 'pending' && <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm"><Clock className="w-4 h-4" /> รอตรวจสอบ</span>}
                    {tx.status === 'approved' && <span className="flex items-center gap-1 text-green-400 font-bold text-sm"><CheckCircle className="w-4 h-4" /> อนุมัติแล้ว</span>}
                    {tx.status === 'rejected' && (
                      <div>
                        <span className="flex items-center gap-1 text-red-400 font-bold text-sm"><XCircle className="w-4 h-4" /> ไม่อนุมัติ</span>
                        {tx.admin_comment && <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={tx.admin_comment}>{tx.admin_comment}</p>}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {tx.status === 'pending' ? (
                      <div className="flex justify-end gap-2 text-sm">
                        <button
                          onClick={() => handleAction(tx.id, 'approve')}
                          disabled={processing === tx.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 disabled:opacity-50 transition"
                        >
                          {processing === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} กดรับยอดนี้
                        </button>
                        <button
                          onClick={() => handleAction(tx.id, 'reject')}
                          disabled={processing === tx.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition"
                        >
                          <XCircle className="w-4 h-4" /> ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-dark-500 text-xs text-right block pr-4">ปิดรายการแล้ว</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}