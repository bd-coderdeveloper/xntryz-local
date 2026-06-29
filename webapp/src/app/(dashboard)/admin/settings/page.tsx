'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Loader2, Settings, Save, ShieldAlert, CheckCircle, Download, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DEFAULT_QUOTAS, AllQuotas, PackageTier } from '@/utils/quotas';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [extVersion, setExtVersion] = useState('1.5');
  const [extDownloadUrl, setExtDownloadUrl] = useState('');

  // Quota Management
  const [quotas, setQuotas] = useState<AllQuotas>(DEFAULT_QUOTAS);

  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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

      const res = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/tools/one-card');
          return;
        }
        throw new Error('ไม่สามารถเชื่อมต่อข้อมูลการตั้งค่าได้, กรูณาตรวจสอบว่าตาราง system_settings มีอยู่จริง');
      }

      const data = await res.json();
      if (data.settings) {
        if (data.settings.extension_version) setExtVersion(data.settings.extension_version);
        if (data.settings.extension_download_url) setExtDownloadUrl(data.settings.extension_download_url);
        
        if (data.settings.package_quotas) {
          try {
            const parsedQuotas = JSON.parse(data.settings.package_quotas);
            // Merge fetched quotas over defaults to ensure no blanks
            setQuotas(prev => {
              const merged: any = JSON.parse(JSON.stringify(prev));
              for (const tier of ['Free', 'Pro', 'Premium'] as PackageTier[]) {
                if (parsedQuotas[tier]) {
                  if (parsedQuotas[tier].post_remover) merged[tier].post_remover = { ...merged[tier].post_remover, ...parsedQuotas[tier].post_remover };
                  if (parsedQuotas[tier].deep_clone) merged[tier].deep_clone = { ...merged[tier].deep_clone, ...parsedQuotas[tier].deep_clone };
                  if (parsedQuotas[tier].group_post) merged[tier].group_post = { ...merged[tier].group_post, ...parsedQuotas[tier].group_post };
                  if (parsedQuotas[tier].group_cleaner) merged[tier].group_cleaner = { ...merged[tier].group_cleaner, ...parsedQuotas[tier].group_cleaner };
                  if (parsedQuotas[tier].auto_page) merged[tier].auto_page = { ...merged[tier].auto_page, ...parsedQuotas[tier].auto_page };
                }
              }
              return merged;
            });
          } catch (e) {
            console.error("Failed to parse quotas JSON from DB", e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value })
    });

    const responseData = await res.json();
    if (!res.ok) {
      throw new Error(responseData.error || 'เกิดข้อผิดพลาดในการอัปเดต Server');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      
      await handleUpdateSetting('extension_version', extVersion);
      await handleUpdateSetting('extension_download_url', extDownloadUrl);
      
      // Save Quotas
      await handleUpdateSetting('package_quotas', JSON.stringify(quotas));
      
      setSuccess('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quota Input Helper
  const handleQuotaChange = (tier: PackageTier, tool: keyof AllQuotas['Free'], field: string, value: any) => {
    setQuotas({
      ...quotas,
      [tier]: {
        ...quotas[tier],
        [tool]: {
          ...quotas[tier][tool] as any,
          [field]: value
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-dark-300">กำลังโหลดการตั้งค่าระบบ...</p>
      </div>
    );
  }

  if (error && !extVersion && !quotas) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto mt-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied / Error</h2>
        <p className="text-dark-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-500" />
            ตั้งค่าระบบ (Global Settings)
          </h1>
          <p className="text-dark-400 mt-2">จัดการการแจ้งเตือนเวอร์ชั่น Extension, โควต้า และระบบอื่นๆ สำหรับผู้ใช้ทุกคน</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mt-8">
        {/* Module 1: Extension Settings */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-dark-800 pb-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">UPFEEDTH Extension Update</h2>
              <p className="text-dark-400 text-sm">ผู้ใช้งานที่เวอร์ชั่นต่ำกว่าที่กำหนดจะเห็นป๊อปอัปแจ้งเตือนให้อัปเดตอัตโนมัติ</p>
            </div>
          </div>

          <div className="space-y-5 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">เวอร์ชั่นล่าสุดของ Extension (Latest Version)</label>
              <input
                type="text"
                value={extVersion}
                onChange={e => setExtVersion(e.target.value)}
                placeholder="เช่น 1.5.0"
                className="w-full bg-dark-900 border border-dark-700 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">ลิงก์สำหรับดาวน์โหลดไฟล์อัปเดต</label>
              <input
                type="text"
                value={extDownloadUrl}
                onChange={e => setExtDownloadUrl(e.target.value)}
                placeholder="https://example.com/download/upfeed.zip"
                className="w-full bg-dark-900 border border-dark-700 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Quota settings */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-dark-800 pb-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ตั้งค่าโควต้าแพ็กเกจ (Package Quotas)</h2>
              <p className="text-dark-400 text-sm">กำหนดสิทธิ์การใช้งานแต่ละเครื่องมือแบบรายวัน โปรดตรวจสอบความถูกต้องก่อนกดบันทึก</p>
            </div>
          </div>

          <div className="space-y-10">
            {(['Free', 'Pro', 'Premium'] as PackageTier[]).map(tier => (
              <div key={tier} className="bg-dark-950/50 border border-dark-800 rounded-xl p-6">
                <h3 className={`text-xl font-bold mb-4 ${tier === 'Premium' ? 'text-purple-400' : tier === 'Pro' ? 'text-blue-400' : 'text-gray-400'}`}>
                  {tier} Package
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {/* Post Remover */}
                  <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-white/80 border-b border-dark-800 pb-2">Post Remover</h4>
                    <div>
                      <label className="text-xs text-dark-400">Posts/Day</label>
                      <input type="number" value={quotas[tier].post_remover.quota} onChange={e => handleQuotaChange(tier, 'post_remover', 'quota', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Max Threads</label>
                      <input type="number" value={quotas[tier].post_remover.threads} onChange={e => handleQuotaChange(tier, 'post_remover', 'threads', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Min Delay (s)</label>
                      <input type="number" value={quotas[tier].post_remover.delay} onChange={e => handleQuotaChange(tier, 'post_remover', 'delay', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                  </div>

                  {/* Deep Clone */}
                  <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-white/80 border-b border-dark-800 pb-2">Deep Clone</h4>
                    <div>
                      <label className="text-xs text-dark-400">Posts/Day</label>
                      <input type="number" value={quotas[tier].deep_clone.quota} onChange={e => handleQuotaChange(tier, 'deep_clone', 'quota', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" checked={quotas[tier].deep_clone.albums} onChange={e => handleQuotaChange(tier, 'deep_clone', 'albums', e.target.checked)} className="accent-orange-500 w-4 h-4 cursor-pointer" />
                      <label className="text-xs text-dark-300">Allow Albums</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={quotas[tier].deep_clone.videos} onChange={e => handleQuotaChange(tier, 'deep_clone', 'videos', e.target.checked)} className="accent-orange-500 w-4 h-4 cursor-pointer" />
                      <label className="text-xs text-dark-300">Allow Videos</label>
                    </div>
                  </div>

                  {/* Group Auto Post */}
                  <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-white/80 border-b border-dark-800 pb-2">Group Auto Post</h4>
                    <div>
                      <label className="text-xs text-dark-400">Groups/Day</label>
                      <input type="number" value={quotas[tier].group_post.quota} onChange={e => handleQuotaChange(tier, 'group_post', 'quota', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Min Delay (s)</label>
                      <input type="number" value={quotas[tier].group_post.delay} onChange={e => handleQuotaChange(tier, 'group_post', 'delay', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                  </div>

                  {/* Group Cleaner */}
                  <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-white/80 border-b border-dark-800 pb-2">Group Cleaner</h4>
                    <div>
                      <label className="text-xs text-dark-400">Posts/Day</label>
                      <input type="number" value={quotas[tier].group_cleaner.quota} onChange={e => handleQuotaChange(tier, 'group_cleaner', 'quota', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Max Threads</label>
                      <input type="number" value={quotas[tier].group_cleaner.threads} onChange={e => handleQuotaChange(tier, 'group_cleaner', 'threads', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Min Delay (s)</label>
                      <input type="number" value={quotas[tier].group_cleaner.delay} onChange={e => handleQuotaChange(tier, 'group_cleaner', 'delay', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                  </div>

                  {/* Auto Create Page */}
                  <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-white/80 border-b border-dark-800 pb-2">Auto Create Page</h4>
                    <div>
                      <label className="text-xs text-dark-400">Pages/Day</label>
                      <input type="number" value={quotas[tier].auto_page.quota} onChange={e => handleQuotaChange(tier, 'auto_page', 'quota', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400">Min Delay (s)</label>
                      <input type="number" value={quotas[tier].auto_page.delay} onChange={e => handleQuotaChange(tier, 'auto_page', 'delay', Number(e.target.value))} className="w-full bg-dark-950 border border-dark-700 text-sm rounded px-2 py-1.5 focus:border-orange-500" />
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-dark-800">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 w-full md:w-auto text-base"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'กำลังอัปเดต...' : 'บันทึกการตั้งค่าทั้งหมด'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
