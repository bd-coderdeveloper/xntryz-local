'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Check, UploadCloud, Ticket, ArrowLeft, Loader2, Info, Wallet, ArrowUpCircle, ArrowDownCircle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface Transaction {
  id: string;
  created_at: string;
  transaction_type: string;
  amount: number;
  requested_package?: string;
  status: string;
}

export default function BillingPage() {
  const [topupMode, setTopupMode] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userPkg, setUserPkg] = useState('Free');
  const [pkgExpire, setPkgExpire] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setWalletBalance(parseFloat(user.user_metadata?.wallet_balance || '0'));
        setUserPkg(user.user_metadata?.package || 'Free');
        setPkgExpire(user.user_metadata?.package_expire || '');

        // Fetch transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (txs) setTransactions(txs);
      }
    } catch (e) { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handlePurchase = async (pkg: 'Pro' | 'Premium', cost: number) => {
    if (walletBalance < cost) {
      alert(`เครดิตไม่เพียงพอ! คุณมี ${walletBalance.toLocaleString()} ฿ แต่แพ็กเกจราคา ${cost.toLocaleString()} ฿ กรุณาเติมเงิน`);
      setTopupMode(true);
      return;
    }

    if (!confirm(`ยืนยันการใช้เครดิต ${cost} ฿ เพื่อเปิดใช้งานแพ็กเกจ ${pkg} ใช่หรือไม่?`)) return;

    try {
      setProcessing(pkg);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ package: pkg })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      await fetchSession(); // Refresh balance
      router.refresh(); // Refresh overall layout UI
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  return (
    <div className="h-full flex flex-col gap-6 relative animate-fade-in">
      <div className="glass-panel p-8 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {topupMode ? 'เติมเงินเข้ากระเป๋า (Top-Up)' : 'อัปเกรดแพ็กเกจ'}
          </h1>
          <p className="text-dark-300 max-w-2xl">
            {topupMode
              ? `กรุณาแสกน QR Code เข้าบัญชีบริษัท และอัปโหลดสลิปเพื่อรับเครดิตอัตโนมัติ`
              : 'เลือกแพ็กเกจที่ต้องการ หรือคลิกเติมเงินเก็บไว้ใน Wallet เพื่อความสะดวกสบายอย่างต่อเนื่อง'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!topupMode && (
            <div className="flex items-center gap-3 bg-dark-900 border border-dark-800 px-4 py-3 rounded-xl shadow-inner">
              <Wallet className="w-5 h-5 text-green-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider leading-none mb-1">ยอดเงินคงเหลือ</span>
                <span className="text-xl font-black text-white leading-none tracking-tight">{walletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-dark-500">THB</span></span>
              </div>
            </div>
          )}

          {topupMode ? (
            <button
              onClick={() => { setTopupMode(false); fetchSession(); }}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-3 rounded-xl border border-dark-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
          ) : (
            <button
              onClick={() => setTopupMode(true)}
              className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-3 rounded-xl border border-green-500/30 transition font-bold"
            >
              <ArrowLeft className="w-4 h-4 rotate-90" /> เติมเงิน/ใช้โค้ดโปรโมชัน
            </button>
          )}
        </div>
      </div>

      {!topupMode && (
        <div className={`rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden mb-8 mt-2 border ${userPkg === 'Premium' ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)]' :
          userPkg === 'Pro' ? 'bg-gradient-to-r from-orange-900/30 to-red-900/20 border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
            'bg-dark-900 border-dark-700'
          }`}>
          <div className="flex items-center gap-4 z-10 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-md ${userPkg === 'Premium' ? 'bg-purple-900/50 border-purple-400/50 text-purple-300 shadow-purple-500/20' :
              userPkg === 'Pro' ? 'bg-orange-900/50 border-orange-400/50 text-orange-300 shadow-orange-500/20' :
                'bg-dark-800 border-dark-600 text-dark-400'
              }`}>
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center h-10 pt-1">
              <p className="text-dark-300 text-[11px] font-medium tracking-wide">แพ็กเกจปัจจุบันของคุณ</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={`text-lg font-bold uppercase tracking-wider leading-none ${userPkg === 'Premium' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300' :
                  userPkg === 'Pro' ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300' :
                    'text-white'
                  }`}>
                  {userPkg} PLAN
                </span>
                {userPkg !== 'Free' && pkgExpire && (
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border ${userPkg === 'Premium' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                    'bg-orange-500/10 text-orange-300 border-orange-500/30'
                    }`}>
                    หมดอายุ: {new Date(pkgExpire).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {userPkg !== 'Free' && (
            <div className={`z-10 px-4 py-3 rounded-lg text-sm border backdrop-blur-md flex flex-col justify-center w-full md:w-auto ${userPkg === 'Premium' ? 'bg-purple-950/40 border-purple-500/20' :
              'bg-orange-950/40 border-orange-500/20'
              }`}>
              <span className={`font-bold flex items-center gap-2 ${userPkg === 'Premium' ? 'text-purple-300' : 'text-orange-300'
                }`}>
                <Info className="w-4 h-4" />
                คุณมีแพ็กเกจที่ใช้งานอยู่แล้ว
              </span>
              <p className={`text-xs mt-1.5 font-medium ${userPkg === 'Premium' ? 'text-purple-300/70' : 'text-orange-300/70'
                }`}>อัปเกรดหรือต่ออายุเพิ่มเติม กรุณาติดต่อแอดมิน</p>
            </div>
          )}
          <div className="absolute -right-12 -bottom-16 opacity-15 pointer-events-none mix-blend-screen transition-transform duration-1000 rotate-12 scale-110">
            <Crown className={`w-64 h-64 ${userPkg === 'Premium' ? 'text-purple-400/30' :
              userPkg === 'Pro' ? 'text-orange-400/30' :
                'text-dark-600/20'
              }`} />
          </div>
        </div>
      )}

      {!topupMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 relative">
          {/* Free Plan */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 flex flex-col shadow-xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
              <div className="text-3xl font-extrabold text-white">0<span className="text-lg font-medium text-dark-400">/ตลอดชีพ</span></div>
              <p className="text-dark-400 text-sm mt-2">สำหรับให้ทดลองระบบ</p>
            </div>
            <div className="flex-1 space-y-3 mb-8 text-sm">
              <Feature check text="One Card & Carousel ติดลายน้ำ" />
              <Feature check text="PAGE REMOVAL ได้สูงสุด 50 โพสต์/วัน (1 Thread)" />
              <Feature check text="DEEP CLONE 3 โพสต์/วัน (แคปชั่น,ลิงก์,รูปภาพเดี่ยว)" />
              <Feature check text="Post To Groups เลือกลงได้ 5 กลุ่ม/รอบ (ดีเลย์ 10 วินาที)" />
              <Feature check text="Auto Create สร้างได้ 2 เพจ/วัน (ดีเลย์ 180s)" />
              <Feature check={false} text="DEEP CLONE ดูดภาพอัลบั้ม / วิดีโอไม่ได้" />
              <Feature check={false} text="DEEP CLONE ไม่สามารถดึงรูปจากคลังบัญชีโฆษณามาใช้ได้" />
              <Feature check={false} text="Proxy Facebook Bypass API" />
            </div>
            <button disabled className="w-full bg-dark-800 text-dark-400 font-semibold rounded-xl py-3 transition-colors cursor-not-allowed border border-dark-700">
              ใช้งานฟรี
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 flex flex-col shadow-xl relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-orange-400 mb-2">Pro Plan</h3>
              <div className="text-3xl font-extrabold text-white">499<span className="text-lg font-medium text-dark-400">/เดือน</span></div>
              <p className="text-dark-400 text-sm mt-2">สำหรับแอดมินเพจทั่วไป</p>
            </div>
            <div className="flex-1 space-y-3 mb-8 text-sm">
              <Feature check text="One Card & Carousel โพสต์ได้ไม่จำกัด" />
              <Feature check text="PAGE REMOVAL ได้สูงสุด 1000 โพสต์/วัน (30 Thread)" />
              <Feature check text="DEEP CLONE 50 โพสต์/วัน (แคปชั่น,ลิงก์,รูปภาพเดี่ยว,รูปภาพอัลบั้ม)" />
              <Feature check text="Post To Groups เลือกลงได้ 50 กลุ่ม/รอบ (ดีเลย์ 5 วินาที)" />
              <Feature check text="Auto Create สร้างได้ 20 เพจ/วัน (ดีเลย์ 120s)" />
              <Feature check text="DEEP CLONE ดึงวิดีโอ Full HD / Reels" />
              <Feature check text="DEEP CLONE สามารถดึงรูปจากคลังบัญชีโฆษณามาใช้ได้" />
              <Feature check text="Normal Proxy Facebook API" />
            </div>
            <button
              disabled={processing === 'Pro' || userPkg !== 'Free'}
              onClick={() => handlePurchase('Pro', 499)}
              className="w-full bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-xl py-3 border border-dark-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing === 'Pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : '499 THB'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/30 rounded-3xl p-6 flex flex-col relative shadow-[0_0_40px_rgba(168,85,247,0.15)] mt-4 md:mt-0">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold px-4 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg shadow-purple-500/30 whitespace-nowrap">
              <Sparkles className="w-3 h-3" /> คุ้มค่าที่สุดสำหรับ Agency & สายเทา
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-xl font-bold text-purple-400 mb-2">Premium Plan</h3>
              <div className="text-3xl font-extrabold text-white">899<span className="text-lg font-medium text-dark-400">/เดือน</span></div>
              <p className="text-dark-400 text-sm mt-2">ใช้งานได้ไม่อั้น!</p>
            </div>
            <div className="flex-1 space-y-3 mb-8 text-sm">
              <Feature check text="One Card & Carousel โพสต์ได้ไม่จำกัด" />
              <Feature check text="PAGE REMOVAL ไม่จำกัด (70 Thread)" />
              <Feature check text="DEEP CLONE 200 โพสต์/วัน (ดึงได้ทุกอย่าง)" />
              <Feature check text="Post To Groups ไม่จำกัด (ดีเลย์ 3 วินาที)" />
              <Feature check text="Auto Create สร้างได้ 200 เพจ/วัน (ดีเลย์ 60s)" />
              <Feature check text="ไม่ต้องทิ้งจอไว้ รันไวขึ้น X3" />
              <Feature check text="ลัดคิว Server VIP ไวกว่าปกติ X2" />
              <Feature check text="Special+ Proxy Facebook API" />
            </div>
            <button
              disabled={processing === 'Premium' || userPkg !== 'Free'}
              onClick={() => handlePurchase('Premium', 899)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing === 'Premium' ? <Loader2 className="w-5 h-5 animate-spin" /> : '899 THB'}
            </button>
          </div>
        </div>
      ) : (
        <TopupForm onSuccess={() => { setTopupMode(false); fetchSession(); }} />
      )}

      {/* Transaction History */}
      {!topupMode && (
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-xl mt-8">
          <h2 className="text-xl font-bold text-white mb-6">ประวัติการทำรายการ</h2>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-dark-400 uppercase bg-dark-950/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">วันที่ - เวลา</th>
                    <th className="px-4 py-3">ประเภทรายการ</th>
                    <th className="px-4 py-3">แพ็กเกจ</th>
                    <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-center rounded-r-xl">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: Transaction) => (
                    <tr key={tx.id} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                      <td className="px-4 py-4 text-dark-200">
                        {new Date(tx.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-4">
                        {tx.transaction_type === 'promo' ? (
                          <span className="text-purple-400 flex items-center gap-1 font-medium"><Ticket className="w-4 h-4" /> โปรโมชันโค้ด</span>
                        ) : tx.transaction_type === 'topup' ? (
                          <span className="text-green-400 flex items-center gap-1 font-medium"><ArrowUpCircle className="w-4 h-4" /> เติมเงิน</span>
                        ) : (
                          <span className="text-orange-400 flex items-center gap-1 font-medium"><ArrowDownCircle className="w-4 h-4" /> สั่งซื้อ</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-dark-300 font-medium">
                        {tx.requested_package ? (
                          <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${tx.requested_package === 'Premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {tx.requested_package}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 font-mono font-medium text-right">
                        {tx.amount > 0 ? (
                          <span className="text-green-400">+{tx.amount.toLocaleString()} ฿</span>
                        ) : (
                          <span className="text-white">{tx.amount.toLocaleString()} ฿</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {tx.status === 'approved' && <span className="bg-green-500/10 border border-green-500/20 text-green-500 px-2.5 py-1 rounded-md text-[11px] font-bold">สำเร็จ</span>}
                        {tx.status === 'pending' && <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-md text-[11px] font-bold">รอตรวจสอบ</span>}
                        {tx.status === 'rejected' && <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-2.5 py-1 rounded-md text-[11px] font-bold">ถูกปฏิเสธ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-dark-400 bg-dark-950/30 rounded-2xl border border-dark-800/50">
              <span className="block mb-4 text-4xl opacity-50">🧾</span>
              <p className="font-medium">ยังไม่มีประวัติการทำรายการในระบบ</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopupForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('500');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('กรุณาอัปโหลดรูปภาพสลิปที่โอนเงินสำเร็จ');
    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) return alert('กรุณาระบุจำนวนเงินให้ถูกต้อง');

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('amount', amount);

      const res = await fetch('/api/billing/checkout', { // Checkout API now acts as Topup
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      if (data.autoApproved) {
        router.refresh();
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redeemPromo = async () => {
    if (!promoCode) return alert('กรุณากรอกรหัสโปรโมชั่น');
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/promo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setPromoCode('');
      router.refresh();
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:max-h-[70vh]">
      {/* Left: Payment Info */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 blur-[80px] pointer-events-none" />

        <div className="text-center mb-6">
          <h2 className="text-white font-bold text-xl mb-1">โอนเงิน</h2>
          <p className="text-dark-400 text-sm">สแกน QR Code ด้านล่างผ่านแอปธนาคารใดก็ได้</p>
        </div>

        <div className="w-56 h-56 bg-white overflow-hidden rounded-2xl p-2 shadow-sm border-4 border-dark-700/50 mb-6 relative">
          <img src="/QRCode/SCB_QRCode.jpg" alt="PromptPay QR Code" className="w-full h-full object-contain" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-dark-400 text-sm">ธนาคารไทยพาณิชย์ (SCB)</p>
          {/* <p className="text-white text-sm font-bold bg-dark-800 px-4 py-1.5 rounded-lg border border-dark-700 inline-block mt-2">บจก. อัปฟีด (UPFEED CO.,LTD)</p> */}
        </div>

        <div className="mt-6 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-4 py-3 rounded-lg text-left">
          <Info className="w-5 h-5 shrink-0" />
          <p className="leading-relaxed">เมื่อสแกนและโอนเงินเสร็จสิ้น ให้อัปโหลดสลิปที่แนบทางขวา<br />ระบบบตรวจสอบสลิปจะทำการตรวจสอบยอดและเพิ่มเครดิตเข้า Wallet อัตโนมัติ</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-6">

        {/* Promo Code Top */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] pointer-events-none" />
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-400" /> มีโค้ดโปรโมชั่น?
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="กรอกรหัส Promo Code"
              className="flex-1 bg-dark-950 border border-dark-700 rounded-xl px-4 text-sm text-white focus:outline-hidden focus:border-purple-500/50 uppercase"
            />
            <button
              type="button"
              onClick={redeemPromo}
              disabled={loading || !promoCode}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              ใช้โค้ด
            </button>
          </div>
        </div>

        {/* Slip Upload */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-green-500" /> อัปโหลดหลักฐานการโอน
          </h3>
          <form onSubmit={handleUpload} className="flex-1 flex flex-col">

            <div className="mb-4">
              <label className="block text-sm text-dark-400 mb-1">ยอดเงินที่โอน (ตรงตามสลิป)</label>
              <div className="flex items-center bg-dark-950 border border-dark-700 rounded-xl overflow-hidden focus-within:border-green-500/50 transition-colors">
                <span className="pl-4 pr-2 text-dark-400 font-bold">฿</span>
                <input type="number" step="0.01" min="1" required value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 bg-transparent border-none px-2 py-3 text-white font-bold outline-hidden" />
              </div>
            </div>

            <label className="flex-1 border-2 border-dashed border-dark-700 hover:border-green-500/50 bg-dark-950/50 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-colors group">
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
              }} />
              <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-dark-400 group-hover:text-green-400" />
              </div>
              <p className="text-dark-300 font-medium mb-1">
                {file ? <span className="text-green-400">✅ {file.name}</span> : 'คลิกเพื่ออัปโหลดสลิป'}
              </p>
              <p className="text-dark-500 text-xs">รองรับไฟล์ JPG, PNG</p>
            </label>

            <button disabled={loading} type="submit" className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยัน'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

function Feature({ check, text }: { check: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${check ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-600'}`}>
        <Check className="w-3 h-3 stroke-2" />
      </div>
      <span className={check ? 'text-dark-100' : 'text-dark-500 line-through'}>{text}</span>
    </div>
  );
}