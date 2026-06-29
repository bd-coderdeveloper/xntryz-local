'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { supabase } from '@/utils/supabase/client';
import { fetchSystemQuotas, normalizePackageName } from '@/utils/quotas';
import FacebookPageSelector from '@/components/FacebookPageSelector';
import { Loader2, Play, StopCircle, Image as ImageIcon, Copy, Check, CheckCheck, Search, Activity, Image } from 'lucide-react';

export default function PostRemoverPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [targetPage, setTargetPage] = useState<any>(null);
  const [targetPageIdInput, setTargetPageIdInput] = useState('');
  const abortRef = useRef(false);

  const [userPkg, setUserPkg] = useState('Free');
  const [usage, setUsage] = useState<any>(null);
  const [maxThreads, setMaxThreads] = useState(1);
  const [quotaLimit, setQuotaLimit] = useState(50);

  const [contentFilters, setContentFilters] = useState({
    status: true,
    photo: true,
    video: true,
    reel: true,
    link: true
  });

  const [scanning, setScanning] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<any[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  const [threads, setThreads] = useState(5);
  const [delay, setDelay] = useState(10);
  const [minDelay, setMinDelay] = useState(10);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const pkgRaw = user.user_metadata?.package || 'Free';
          setUserPkg(pkgRaw);
          const pkg = normalizePackageName(pkgRaw);

          const allQuotas = await fetchSystemQuotas();
          const stats = allQuotas[pkg].post_remover;

          setMaxThreads(stats.threads);
          setQuotaLimit(stats.quota);
          setMinDelay(stats.delay);

          setDelay(Math.max(10, stats.delay));
          setThreads(Math.min(5, stats.threads));
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/usage', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setUsage(data.data);
            }
          }
        }
      } catch (e) { }
    };
    loadUsage();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('th-TH')}] ${msg}`]);
  };

  const scanPosts = async () => {
    if (!targetPage || !targetPage.access_token) {
      addLog('Error: กรุณาเลือกเพจที่ต้องการลบโพสต์.');
      return;
    }
    setScanning(true);
    addLog(`กำลังสแกนโพสต์ในเพจ: ${targetPage.name}...`);
    
    try {
      let extracted: any[] = [];
      const effectivePageId = targetPageIdInput || targetPage.id;

      if (contentFilters.status || contentFilters.photo || contentFilters.video || contentFilters.link) {
        const res: any = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/${effectivePageId}/posts?access_token=${targetPage.access_token}&fields=id,message,created_time,full_picture,status_type,attachments&limit=100`,
          method: 'GET'
        });

        if (res.error) throw new Error(res.error);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

        if (data && data.data) {
          const filtered = data.data.filter((p: any) => {
            const type = p.attachments?.data?.[0]?.type || 'status';
            if (type.includes('photo') || type === 'album') return contentFilters.photo;
            if (type.includes('video')) return contentFilters.video;
            if (type.includes('share') || type === 'share') return contentFilters.link;
            return contentFilters.status;
          });
          extracted = [...filtered];
        }
      }

      if (contentFilters.reel) {
        const res: any = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/${effectivePageId}/video_reels?access_token=${targetPage.access_token}&fields=id,description,updated_time,picture&limit=100`,
          method: 'GET'
        });
        if (!res.error) {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (data && data.data) {
            const reels = data.data.map((r: any) => ({
              id: r.id,
              message: r.message || r.description || '',
              created_time: r.created_time || r.updated_time || new Date().toISOString(),
              full_picture: r.full_picture || r.picture || null,
              isReel: true
            }));
            extracted = [...extracted, ...reels];
          }
        }
      }

      if (extracted.length > 0) {
        extracted.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
        setPreviewPosts(extracted);
        setSelectedPostIds([]);
        setCurrentPage(1);
        addLog(`พบโพสต์ จำนวน: ${extracted.length} รายการ`);
      } else {
        throw new Error('ไม่พบโพสต์ที่ตรงกับเงื่อนไขที่เลือก หรือเลือกประเภทเนื้อหาอื่น');
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const startRemove = async () => {
    if (!targetPage) {
      addLog('Error: กรุณาเลือกเพจที่ต้องการลบโพสต์.');
      return;
    }

    const postsToRemove = selectedPostIds.length > 0 ? previewPosts.filter(p => selectedPostIds.includes(p.id)) : previewPosts;
    
    if (postsToRemove.length === 0) {
      addLog('Error: ไม่พบโพสต์ที่ตรงกับเงื่อนไขที่เลือก หรือเลือกประเภทเนื้อหาอื่น');
      return;
    }

    setLoading(true);
    setIsRunning(true);
    abortRef.current = false;
    addLog(`เริ่มทำการลบโพสต์ในเพจ: ${targetPage.name}`);

    let successCount = 0;
    let failCount = 0;
    let currentUsage = usage?.posts_removed_count || 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsage(data.data);
            currentUsage = data.data.posts_removed_count || 0;
          }
        }
      }
    } catch (e) { }

    if (currentUsage >= quotaLimit) {
      addLog(`[QUOTA] โควต้าลบโพสต์รายวันของคุณเต็มแล้ว (${quotaLimit}/${quotaLimit}) กรุณารอวันพรุ่งนี้ หรือ อัปเกรดแพ็กเกจ`);
      setIsRunning(false);
      setLoading(false);
      return;
    }

    try {
      addLog('[SYSTEM] กำลังเชื่อมต่อ API UPFEEDTH...');
      let targetPosts = [...postsToRemove];
      const remainingQuota = quotaLimit - currentUsage;

      if (targetPosts.length > remainingQuota) {
        addLog(`[QUOTA] ปรับจำนวนจาก ${targetPosts.length} เหลือ ${remainingQuota} ตามโควต้าที่เหลืออยู่ของคุณ`);
        targetPosts = targetPosts.slice(0, remainingQuota);
      }

      for (let i = 0; i < targetPosts.length; i += threads) {
        if (abortRef.current) {
          addLog('> หยุดการทำงานโดยผู้ใช้');
          break;
        }

        const batch = targetPosts.slice(i, i + threads);
        await Promise.all(batch.map(async (post) => {
          if (abortRef.current) return;
          try {
            const res: any = await SendRequestToExtension('PROXY_FETCH', {
              url: `https://graph.facebook.com/v21.0/${post.id}?access_token=${targetPage.access_token}`,
              method: 'DELETE'
            });

            if (res.success && res.data?.includes('"success": true') && !res.data?.includes('"error"')) {
              successCount++;
              currentUsage++;
              addLog(`[OK] ลบโพสต์สำเร็จ: ${post.id}`);

              const { data: { session } } = await supabase.auth.getSession();
              fetch('/api/usage', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ action: 'remove', count: 1, target_type: 'page', target_id: targetPage.id, target_name: targetPage.name })
              }).then(async (r) => {
                if (r.ok) {
                  setUsage((prev: any) => prev ? { ...prev, posts_removed_count: (prev.posts_removed_count || 0) + 1 } : prev);
                } else {
                  const d = await r.json().catch(() => ({}));
                  addLog(`[SYSTEM] ระบบนับโควต้าขัดข้อง: ${d.error || r.status}`);
                }
              }).catch(() => { });

              setPreviewPosts(prev => prev.filter(p => p.id !== post.id));
              setSelectedPostIds(prev => prev.filter(id => id !== post.id));

              if (currentUsage >= quotaLimit) {
                addLog(`[QUOTA] ถึงขีดจำกัดการใช้งาน ${quotaLimit} รายการแล้ว ระบบกำลังหยุดทำงานอัตโนมัติ`);
                abortRef.current = true;
              }
            } else {
              failCount++;
              addLog(`[FAIL] ${post.id} - ${res.error || res.data || 'Unknown error'}`);
            }
          } catch (err: any) {
            failCount++;
            addLog(`[ERR] ${post.id} - ${err.message}`);
          }
        }));

        if (i + threads < targetPosts.length && !abortRef.current) {
          addLog(`> ดีเลย์: ${delay} วินาที...`);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      }

      addLog(`> ดำเนินการเสร็จสิ้น! ลบ: ${successCount}, ล้มเหลว: ${failCount}`);
    } catch (e: any) {
      addLog(`[ERROR] ${e.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Post Remover</h1>
          <p className="text-dark-300">ลบโพสต์หน้าเพจจำนวนมาก รองรับการทำงานแบบหลายเธรดเพื่อการทำงานพร้อมกันที่เร็วขึ้น 10 เท่า</p>
        </div>
        <div className="bg-dark-900/80 border border-dark-700/50 rounded-xl p-4 flex flex-wrap items-center gap-6 shrink-0 w-full xl:w-auto shadow-inner">
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">แพ็กเกจ</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${userPkg === 'Premium' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : userPkg === 'Pro' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
              <span className={`text-sm font-bold ${userPkg === 'Premium' ? 'text-purple-400' : userPkg === 'Pro' ? 'text-orange-400' : 'text-blue-400'}`}>
                {userPkg.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ลบสูงสุด/วัน</span>
            <span className="text-sm font-bold text-white mt-1">
              {usage?.posts_removed_count || 0} <span className="text-dark-500 font-medium">/ {quotaLimit === 999999 ? '∞' : quotaLimit.toLocaleString()} โพสต์</span>
            </span>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ดีเลย์ขั้นต่ำ</span>
            <span className="text-sm font-bold text-white mt-1">{minDelay} วินาที</span>
          </div>
        </div>
      </div>

      <FacebookPageSelector onPageSelect={setTargetPage} />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-dark-900 border border-dark-800 rounded-3xl p-6 flex flex-col gap-6 h-fit shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-200">กำหนด ID ของเพจ (ไม่จำเป็น)</label>
            <input type="text" value={targetPageIdInput} onChange={(e) => setTargetPageIdInput(e.target.value)} placeholder="100080123456 เป็นต้น" className="input-primary w-full" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-dark-200">ประเภทของโพสต์:</label>
            <div className="grid grid-cols-2 gap-3 p-3 bg-dark-950 border border-dark-800 rounded-xl">
              {[
                { id: 'status', label: 'แคปชั่น' },
                { id: 'photo', label: 'รูปภาพ' },
                { id: 'video', label: 'วิดีโอ' },
                { id: 'link', label: 'ลิงก์/แชร์' },
                { id: 'reel', label: 'Reels' }
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      className="absolute opacity-0 w-full h-full cursor-pointer peer"
                      checked={(contentFilters as any)[id]}
                      onChange={(e) => setContentFilters(prev => ({ ...prev, [id]: e.target.checked }))}
                    />
                    <div className="w-5 h-5 rounded flex-shrink-0 bg-dark-800 border fill-current border-dark-600 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-dark-300 group-hover:text-dark-100 transition-colors select-none">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5 pt-2 border-t border-dark-800">
            <h3 className="text-sm font-bold text-dark-300 uppercase tracking-widest flex gap-2 items-center">ตั้งค่าการทำงาน</h3>
            <div className="space-y-3 p-4 bg-dark-950 border border-dark-800 rounded-xl">
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-medium text-dark-200">
                  <span>Threads {userPkg === 'Free' ? '(ล็อคสำหรับ Free)' : ':'}</span>
                  <span className="text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded">{threads} ⚡</span>
                </label>
                <input type="range" min="1" max={maxThreads} value={threads} disabled={userPkg === 'Free'} onChange={(e) => setThreads(parseInt(e.target.value))} className={`w-full h-1.5 rounded-lg appearance-none ${userPkg === 'Free' ? 'bg-dark-800 accent-dark-500 cursor-not-allowed' : 'bg-dark-800 accent-orange-500 cursor-pointer'}`} />
                <div className="flex justify-between text-[10px] text-dark-500 font-mono">
                  <span>1</span>
                  <span>{maxThreads}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-dark-800/50">
                <label className="flex items-center justify-between text-xs font-medium text-dark-200">
                  <span>Delay:</span>
                  <span className="text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded">{delay}s ⏱️</span>
                </label>
                <input type="range" min={minDelay} max="50" step="1" value={delay} onChange={(e) => setDelay(parseInt(e.target.value))} className="w-full accent-orange-500 h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] text-dark-500 font-mono">
                  <span>{minDelay}s</span>
                  <span>50s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-800 space-y-3">
            {isRunning ? (
              <button onClick={() => { abortRef.current = true; setIsRunning(false); addLog('[STOP] ระบบกำลังหยุดการทำงาน...'); }} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 font-bold rounded-lg px-4 py-3 shadow-lg transform hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2">
                <StopCircle className="w-5 h-5" />
                หยุดทำงาน
              </button>
            ) : (
              <>
                <button onClick={scanPosts} disabled={loading || scanning} className="bg-dark-800 hover:bg-dark-700 text-white w-full rounded-xl py-3 font-medium flex justify-center items-center gap-2 border border-dark-700 transition-colors">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  สแกนโพสต์
                </button>
                <button onClick={startRemove} disabled={loading || scanning} className="btn-primary w-full flex justify-center items-center gap-2">
                  {loading && !scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  เริ่มลบโพสต์
                </button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-[500px]">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 flex flex-col shadow-xl flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-dark-300 uppercase tracking-widest flex gap-2 items-center">
                <Image className="w-4 h-4" /> ตัวอย่างโพสต์ที่ต้องการลบ
              </h3>
              {previewPosts.length > 0 && (
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer text-dark-200 hover:text-white transition-colors">
                    <input type="checkbox" onChange={(e) => { e.target.checked ? setSelectedPostIds(previewPosts.map(p => p.id)) : setSelectedPostIds([]) }} checked={selectedPostIds.length > 0 && selectedPostIds.length === previewPosts.length} className="rounded border-dark-700 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                    เลือกทั้งหมด {previewPosts.length}
                  </label>
                  <span className="text-orange-400 bg-orange-500/10 px-2 py-1 rounded">เลือกแล้ว: {selectedPostIds.length}</span>
                </div>
              )}
            </div>

            {previewPosts.length === 0 ? (
              <div className="p-8 border border-dashed border-dark-700 rounded-xl flex items-center justify-center text-dark-500 text-sm">
                {scanning ? 'Scanning Facebook Graph...' : 'Click "Preview Recent Posts" to see what will be removed.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[300px] pr-2 pb-2">
                  {previewPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage).map(post => {
                    const isSelected = selectedPostIds.includes(post.id);
                    return (
                      <div key={post.id} onClick={() => setSelectedPostIds(prev => isSelected ? prev.filter(id => id !== post.id) : [...prev, post.id])} className={`bg-dark-950 border ${isSelected ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-orange-500/5' : 'border-dark-800'} rounded-xl p-4 flex flex-col gap-3 relative transition-all hover:scale-[1.02] cursor-pointer group`}>
                        <div className="absolute top-2 left-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-dark-900 border-dark-600'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                        {post.isReel && <div className="absolute top-2 right-2 bg-pink-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow border border-pink-500/50 backdrop-blur-sm">REEL</div>}
                        <div className="w-full h-24 rounded-lg bg-dark-900 flex items-center justify-center overflow-hidden border border-dark-800 relative group">
                          {post.full_picture ? <img src={post.full_picture} alt="Post preview" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" /> : <ImageIcon className="w-8 h-8 text-dark-700" />}
                        </div>
                        <div>
                          <div className="text-xs text-dark-400 flex items-center gap-2 line-clamp-1 mb-1">
                            <Search className="w-3 h-3" /> {new Date(post.created_time).toLocaleString()}
                          </div>
                          <div className="text-sm text-dark-200 line-clamp-2">
                            {post.message || <span className="text-dark-500 italic">ไม่มีแคปชั่น</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {previewPosts.length > postsPerPage && (
                  <div className="flex items-center justify-between pt-2 border-t border-dark-800">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => Math.max(1, c - 1))} className="px-3 py-1.5 text-xs font-medium text-white bg-dark-800 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-dark-700">ก่อนหน้า</button>
                    <div className="text-xs font-medium text-dark-300">หน้า {currentPage} จาก {Math.ceil(previewPosts.length / postsPerPage)}</div>
                    <button disabled={currentPage === Math.ceil(previewPosts.length / postsPerPage)} onClick={() => setCurrentPage(c => Math.min(Math.ceil(previewPosts.length / postsPerPage), c + 1))} className="px-3 py-1.5 text-xs font-medium text-white bg-dark-800 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-dark-700">ถัดไป</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 bg-dark-950 border border-dark-800 rounded-3xl p-6 flex flex-col shadow-inner relative overflow-hidden">
            <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-dark-950 to-transparent z-10" />
            <div className="flex items-center justify-between mb-4 z-20 relative">
              <h3 className="text-sm font-bold text-dark-300 uppercase tracking-widest">ผลลัพธ์การทำงาน</h3>
              <button onClick={() => { if (logs.length !== 0) { navigator.clipboard.writeText(logs.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); } }} disabled={logs.length === 0} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'}`} title="คัดลอก">
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 text-dark-100/90 pr-2">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-dark-600">ระบบพร้อมใช้งาน</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="animate-fade-in-up">
                    <span className="text-orange-500/70 mr-3 hidden sm:inline">{`[${new Date().toLocaleTimeString()}]`}</span>
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
