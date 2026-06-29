'use client';

import { useState, useEffect, useRef } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { Loader2, Trash2, StopCircle, Search, Ticket, FileText, Image as ImageIcon, Link as LinkIcon, Film, LayoutGrid, Copy, Check, CheckCheck, Settings2, X, ListChecks, MonitorPlay, Activity } from 'lucide-react';
import FacebookGroupSelector from '@/components/FacebookGroupSelector';
import { FacebookGroup, fetchWebDTSGData, fetchEAABToken } from '@/utils/facebook';
import { supabase } from '@/utils/supabase/client';
import { fetchSystemQuotas, normalizePackageName } from '@/utils/quotas';

export default function GroupCleanerPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [targetGroup, setTargetGroup] = useState<FacebookGroup | null>(null);
  const abortRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // User Package & Usage
  const [userPkg, setUserPkg] = useState('Free');
  const [usage, setUsage] = useState<any>(null);
  const [maxThreads, setMaxThreads] = useState(1);
  const [quotaLimit, setQuotaLimit] = useState(50);

  // Settings States
  const [contentFilters, setContentFilters] = useState({
    text: true,
    photo: true,
    video: true,
    link: true,
    mediaset: true
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Preview States
  const [scanning, setScanning] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<any[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  // Execution Settings
  const [threads, setThreads] = useState(5);
  const [delay, setDelay] = useState(10);
  const [minDelay, setMinDelay] = useState(10);

  useEffect(() => {
    if (targetGroup) {
      setPreviewPosts([]);
      setSelectedPostIds([]);
      setCurrentPage(1);
    }
  }, [targetGroup]);

  useEffect(() => {
    // Load Package and Usage
    const loadUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const pkgRaw = user.user_metadata?.package || 'Free';
          setUserPkg(pkgRaw);
          const pkg = normalizePackageName(pkgRaw);

          const allQuotas = await fetchSystemQuotas();
          const stats = allQuotas[pkg].group_cleaner;

          setMaxThreads(stats.threads);
          setQuotaLimit(stats.quota);
          setMinDelay(stats.delay);

          // Apply minimum safety boundaries
          setDelay((prev: number) => Math.max(prev, stats.delay));
          setThreads((prev: number) => Math.min(prev, stats.threads));
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
    if (!targetGroup) {
      addLog('Error: กรุณาเลือกกลุ่ม เพื่อแสกน');
      return;
    }

    setScanning(true);
    setCurrentPage(1);
    setSelectedPostIds([]);
    setPreviewPosts([]);
    addLog(`กำลังเชื่อมต่อเข้ากลุ่ม: ${targetGroup.name}...`);

    try {
      const { fb_dtsg, actor_id } = await fetchWebDTSGData();
      // addLog(`[OK] ดึงข้อมูล Session สำเร็จ (Actor: ${actor_id})`);

      // Attempt 1: Try Graph API First with Pagination (to fetch large amounts without timeout)
      try {
        const eaab = await fetchEAABToken();
        let allExtractedPosts: any[] = [];
        let nextUrl = `https://graph.facebook.com/v20.0/${targetGroup.id}/feed?fields=id,message,created_time,full_picture,attachments&limit=50&access_token=${eaab}`;
        let fetchCount = 0;
        const maxPosts = 300; // Target up to 300 posts
        const maxPages = 10; // Safety limit to prevent infinite loops

        while (nextUrl && allExtractedPosts.length < maxPosts && fetchCount < maxPages) {
          fetchCount++;
          addLog(`[INFO] กำลังดึงข้อมูลโพสต์ (หน้าที่ ${fetchCount})...`);
          
          const graphRes: any = await SendRequestToExtension('PROXY_FETCH', {
            url: nextUrl,
            method: 'GET'
          });

          if (graphRes.error || !graphRes.data) {
             addLog(`[INFO] Graph API หยุดการดึง (ล้มเหลว): ${graphRes.error || 'Unknown Error'}`);
             break;
          }

          const parsed = JSON.parse(graphRes.data);
          
          if (parsed.error) {
             addLog(`[INFO] ข้อผิดพลาดจาก Facebook: ${parsed.error.message}`);
             break;
          }

          if (parsed.data && parsed.data.length > 0) {
            const batchPosts = parsed.data.map((p: any) => {
              let detectedType = 'text';
              if (p.attachments?.data?.[0]) {
                const attachType = p.attachments.data[0].type || '';
                if (attachType.includes('video')) detectedType = 'video';
                else if (attachType.includes('album')) detectedType = 'mediaset';
                else if (attachType.includes('share') || attachType.includes('link')) detectedType = 'link';
                else if (attachType.includes('photo') || attachType.includes('profile_media')) detectedType = 'photo';
              } else if (p.full_picture) {
                detectedType = 'photo';
              }

              return {
                id: p.id.includes('_') ? p.id.split('_')[1] : p.id,
                message: p.message || `Group Post #${p.id} (Graph API)`,
                created_time: p.created_time || new Date().toISOString(),
                full_picture: p.full_picture || null,
                type: detectedType
              };
            });

            allExtractedPosts = [...allExtractedPosts, ...batchPosts];

            if (parsed.paging && parsed.paging.next) {
              nextUrl = parsed.paging.next;
            } else {
              nextUrl = ''; // No more pages
            }
          } else {
            // Empty data on this page
            if (fetchCount === 1) {
               addLog(`[INFO] Graph API ตอบกลับสำเร็จ แต่ไม่มีข้อมูล Post (อาจถูกจำกัดสิทธิ์)`);
            }
            break;
          }
        }

        // Apply filters if we got any posts
        if (allExtractedPosts.length > 0) {
          const finalPosts = allExtractedPosts.filter((post: any) => {
            if (!contentFilters[post.type as keyof typeof contentFilters]) return false;
            if (startDate && new Date(post.created_time) < new Date(`${startDate}T00:00:00`)) return false;
            if (endDate && new Date(post.created_time) > new Date(`${endDate}T23:59:59`)) return false;
            return true;
          });

          setPreviewPosts(finalPosts);
          addLog(`[OK] ดึงโพสต์สำเร็จรวม: ${allExtractedPosts.length} โพสต์ (ผ่านตัวกรอง ${finalPosts.length} โพสต์)`);
          setScanning(false);
          return;
        }

      } catch (e: any) {
         addLog(`[INFO] ไม่สามารถดึงผ่าน Graph API ได้: ${e.message || e}`);
      }

      // Attempt 2 & 3: Web and mBasic Scraping
      const [webRes, mbasicRes]: any = await Promise.all([
        SendRequestToExtension('PROXY_FETCH', {
          url: `https://www.facebook.com/groups/${targetGroup.id}/?sorting_setting=CHRONOLOGICAL`,
          method: 'GET'
        }),
        SendRequestToExtension('PROXY_FETCH', {
          url: `https://mbasic.facebook.com/groups/${targetGroup.id}?_fb_noscript=1`,
          method: 'GET'
        })
      ]);

      const htmlWeb = webRes.data || '';
      const htmlBasic = mbasicRes.data || '';
      const combinedHtml = htmlWeb + htmlBasic;

      const idsFull: string[] = [];

      // Robust Regex combination for WWW and mBasic
      const regexPatterns = [
        /"post_id":"(\d+)"/g,
        /"top_level_post_id":"(\d+)"/g,
        /"mf_story_key":"(\d+)"/g,
        /\/groups\/\d+\/permalink\/(\d+)/g,
        /story_fbid=(\d+)/g,
        /view=permalink(?:&amp;|&)id=(\d+)/g,
        /content_id[=":]+(\d+)/g,
        /story_id":"[^"]*:VK:(\d+)"/g,
        /S:_I\d+:(\d+)/g, // Relay ID pattern S:_I<group_id>:<post_id>
        /"feedback":{"id":"[^"]+?(\d+)"/g,
        /group_id=\d+&amp;post_id=(\d+)/g
      ];

      regexPatterns.forEach(regex => {
        let match;
        while ((match = regex.exec(combinedHtml)) !== null) {
          // IDs typically 10-18 chars
          if (match[1].length > 9 && !idsFull.includes(match[1]) && match[1] !== targetGroup.id && match[1] !== actor_id) {
            idsFull.push(match[1]);
          }
        }
      });

      if (idsFull.length > 0) {
        const extractedPosts: any[] = [];
        idsFull.forEach((id) => {
          extractedPosts.push({
            id: id,
            message: `Group Post #${id} (พรีวิวถูกซ่อนไว้โดย Facebook)`,
            created_time: new Date().toISOString(),
            full_picture: null,
            type: 'text' // Fallback to text since we can't extract images easily from Web/mBasic regex
          });
        });

        // For mbasic, we can only reliably filter if text is enabled (virtually all are text here)
        const finalPosts = extractedPosts.filter(p => {
          if (!contentFilters.text) return false;

          if (startDate && new Date(p.created_time) < new Date(`${startDate}T00:00:00`)) return false;
          if (endDate && new Date(p.created_time) > new Date(`${endDate}T23:59:59`)) return false;

          return true;
        });

        setPreviewPosts(finalPosts);
        addLog(`[OK] พบโพสต์ จำนวน: ${finalPosts.length} โพสต์`);
      } else {
        addLog(`[INFO] ไม่พบโพสต์ใดๆ ในกลุ่มนี้ คุณอาจไม่ใช่ Admin, ไม่มีสิทธิ์เข้าถึง หรือกลุ่มไม่มีโพสต์เลย`);
      }

      setScanning(false);
    } catch (e: unknown) {
      if (e instanceof Error) addLog(`Scanning Error: ${e.message}`);
      else addLog('Scanning Error: Unknown error');
      setScanning(false);
    }
  };

  const executeGraphQLDelete = async (postId: string, fb_dtsg: string, actor_id: string): Promise<boolean> => {
    // Generate base64 encoded ID as required by the Group deletion mutation
    const relayId = typeof window !== 'undefined' ? window.btoa(`S_pfS${actor_id}:VK:${postId}`) : '';

    // GraphQL Variables for FewFeedV3-like Group Deletion
    const variables = JSON.stringify({
      input: {
        story_id: relayId,
        source: "group_mall",
        share_feedback: false,
        group_id: targetGroup?.id || "",
        selected_rules: [],
        client_mutation_id: Math.round(Math.random() * 999999).toString(),
        admin_notes: "",
        actor_id: actor_id
      },
      post_id: relayId
    });

    const res: any = await SendRequestToExtension('PROXY_UPLOAD', {
      url: 'https://www.facebook.com/api/graphql/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*'
      },
      formDataEntries: [
        { type: 'text', name: 'fb_dtsg', value: fb_dtsg },
        { type: 'text', name: 'variables', value: variables },
        { type: 'text', name: 'doc_id', value: '3967628089995602' }
      ]
    });

    // We assume true if we reach here and it doesn't give a hard error
    if (res.error) throw new Error(res.error);
    if (res.data && res.data.includes('"error"')) {
      // If GraphQL fails (e.g. bad doc_id), fallback to EAAB Graph API DELETE
      try {
        const eaab = await fetchEAABToken();
        const fallbackRes: any = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/${postId}?access_token=${eaab}`,
          method: 'DELETE'
        });
        if (!fallbackRes.error && fallbackRes.data?.includes('"success": true')) {
          return true;
        }
      } catch (e) { }
      // If both fail:
      throw new Error(`FB GraphQL Error: ${res.data.substring(0, 150)}`);
    }
    return true;
  };

  const startRemoval = async () => {
    if (!targetGroup) {
      addLog('Error: กรุณาเลือกกลุ่มก่อนดำเนินการลบ');
      return;
    }

    const activeFilters = Object.entries(contentFilters).filter(([_, v]) => v).map(([k]) => k).join(', ');
    if (!activeFilters) {
      addLog('Error: กรุณาเลือกประเภทย่างน้อย 1 ประเภท');
      return;
    }

    setLoading(true);
    setIsRunning(true);
    abortRef.current = false;
    addLog(`เริ่มต้นระบบลบโพสต์: ${targetGroup.name}`);
    addLog(`> จำนวน Threads: ${threads} | Delay: ${delay} วิ | เป้าหมาย: ${selectedPostIds.length > 0 ? selectedPostIds.length : previewPosts.length} โพสต์`);

    let deletedCount = 0;

    // [LIVE QUOTA CHECK]
    let currentUsage = usage?.group_posts_removed_count || 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) {
          const fetched = await res.json();
          if (fetched.success) {
            setUsage(fetched.data);
            currentUsage = fetched.data.group_posts_removed_count || 0;
          }
        }
      }
    } catch (e) { }

    if (currentUsage >= quotaLimit) {
      addLog(`[QUOTA EXCEEDED] โควต้าลบโพสต์กลุ่มรายวันของคุณเต็มแล้ว (${quotaLimit}/${quotaLimit})`);
      setIsRunning(false);
      setLoading(false);
      return;
    }

    try {
      const { fb_dtsg, actor_id } = await fetchWebDTSGData();

      let items = selectedPostIds.length > 0 ? previewPosts.filter(p => selectedPostIds.includes(p.id)) : previewPosts;
      const remainingQuota = quotaLimit - currentUsage;
      if (items.length > remainingQuota) {
        addLog(`[INFO] ปรับลดจำนวนโพสต์จาก ${items.length} เหลือ ${remainingQuota} ตามโควต้าคงเหลือ`);
        items = items.slice(0, remainingQuota);
      }

      for (let i = 0; i < items.length; i += threads) {
        if (abortRef.current) {
          addLog('> หยุดการทำงานโดยผู้ใช้');
          break;
        }

        const chunk = items.slice(i, i + threads);

        await Promise.all(chunk.map(async (post: any) => {
          if (abortRef.current) return;
          try {
            // Exec GraphQL Delete
            await executeGraphQLDelete(post.id, fb_dtsg, actor_id);

            deletedCount++;
            currentUsage++;
            addLog(`[OK] ลบโพสต์สำเร็จ: ${post.id}`);

            // Report Usage to API
            const { data: { session } } = await supabase.auth.getSession();
            fetch('/api/usage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({ action: 'group_remove', count: 1, target_type: 'group', target_id: targetGroup.id, target_name: targetGroup.name })
            }).then(async (r) => {
              if (r.ok) {
                setUsage((prev: any) => prev ? { ...prev, group_posts_removed_count: (prev.group_posts_removed_count || 0) + 1 } : prev);
              }
            }).catch(() => { });

            if (currentUsage >= quotaLimit) {
              addLog(`[QUOTA LIMIT REACHED] ถึงขีดจำกัดการใช้งาน ${quotaLimit} รายการแล้ว ระบบกำลังหยุดทำงานอัตโนมัติ`);
              abortRef.current = true;
            }

            // Delay artificially if needed for UI smoothness
            if (delay > 0) {
              await new Promise(r => setTimeout(r, delay * 1000));
            }
          } catch (err: any) {
            addLog(`[FAIL] ไม่สามารถลบโพสต์ ${post.id} ได้: ${err.message}`);
          }
        }));
      }

      addLog(`[สำเร็จ] สิ้นสุดการทำงาน รวมลบโพสต์สำเร็จทั้งหมด: ${deletedCount} โพสต์`);

      // Remove deleted posts from preview manually
      setPreviewPosts((prev: any[]) => prev.filter((p: any) => !items.find((i: any) => i.id === p.id)));
      setSelectedPostIds([]);

    } catch (err: any) {
      addLog(`[ERROR] ระบบขัดข้อง: ${err.message}`);
    }

    setIsRunning(false);
    setLoading(false);
  };

  const stopRemoval = () => {
    abortRef.current = true;
    addLog('> ระบบกำลังหยุดทำงาน...');
    setIsRunning(false);
    setLoading(false);
  };

  // Pagination Logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = previewPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(previewPosts.length / postsPerPage);

  const togglePostSelection = (id: string) => {
    setSelectedPostIds(prev =>
      prev.includes(id) ? prev.filter(postId => postId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = () => {
    const allIdsOnPage = currentPosts.map((p: any) => p.id);
    const areAllSelected = allIdsOnPage.every((id: string) => selectedPostIds.includes(id));

    if (areAllSelected) {
      setSelectedPostIds((prev: string[]) => prev.filter((id: string) => !allIdsOnPage.includes(id)));
    } else {
      setSelectedPostIds((prev: string[]) => Array.from(new Set([...prev, ...allIdsOnPage])));
    }
  };

  const currentUsageCount = usage?.group_posts_removed_count || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Trash2 className="w-7 h-7 text-red-500" />
            Admin Group Posts Remover
          </h1>
          <p className="text-dark-300">
            ลบโพสต์ในกลุ่ม ที่คุณเป็น Admin หรือ Moderator
          </p>
        </div>
        <div className="bg-dark-900/80 border border-dark-700/50 rounded-xl p-4 flex flex-wrap items-center gap-6 shrink-0 w-full xl:w-auto shadow-inner">
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">แพ็กเกจ</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${userPkg === 'Premium' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : userPkg === 'Pro' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></div>
              <span className={`text-sm font-bold ${userPkg === 'Premium' ? 'text-purple-400' : userPkg === 'Pro' ? 'text-orange-400' : 'text-blue-400'}`}>
                {userPkg.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ลบสูงสุด/วัน</span>
            <span className="text-sm font-bold text-white mt-1">
              {currentUsageCount} <span className="text-dark-500 font-medium">/ {quotaLimit === 999999 ? '∞' : quotaLimit.toLocaleString()} โพสต์</span>
            </span>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ดีเลย์ขั้นต่ำ</span>
            <span className="text-sm font-bold text-white mt-1">
              {minDelay} วินาที
            </span>
          </div>
        </div>
      </div>

      <FacebookGroupSelector
        onGroupSelect={(group: FacebookGroup | null) => setTargetGroup(group)}
        adminOnly={true}
      />

      <div className="bg-dark-950 border border-dark-800 rounded-3xl overflow-hidden relative">
        <div className="bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-500 font-sans font-bold tracking-widest uppercase text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ผลลัพธ์การทำงาน
          </div>
          <button
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 text-dark-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 px-3 py-1.5 rounded-lg text-xs font-sans font-bold shadow-sm"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
          </button>
        </div>
        <div
          ref={logContainerRef}
          className="h-40 sm:h-52 overflow-y-auto p-5 font-mono text-[11px] sm:text-xs leading-relaxed custom-scrollbar scroll-smooth w-full"
        >
          {logs.length === 0 ? (
            <div className="text-dark-600 italic h-full flex items-center justify-center">ระบบพร้อมใช้งาน</div>
          ) : (
            logs.map((log: string, index: number) => {
              const isErr = log.toLowerCase().includes('error') || log.toLowerCase().includes('fail') || log.includes('ไม่สามารถ') || log.includes('ขัดข้อง');
              const isSuc = log.toLowerCase().includes('success') || log.toLowerCase().includes('ok') || log.includes('สำเร็จ');
              const isSys = log.includes('System') || log.includes('INFO');
              return (
                <div key={index} className={`
                    ${isErr ? 'text-red-400 font-medium' : ''}
                    ${isSuc ? 'text-green-400' : ''}
                    ${isSys ? 'text-blue-400' : ''}
                    ${!isErr && !isSuc && !isSys ? 'text-orange-300' : ''}
                    py-0.5 whitespace-pre-wrap leading-relaxed
                  `}>
                  <span className="text-dark-600 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">

          {/* Left Column: Input Settings */}
          <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6">

              <div className="space-y-3">
                <label className="text-sm font-medium text-dark-200">ประเภทโพสต์:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'text', label: 'แคปชั่น', icon: FileText, color: 'text-blue-400' },
                    { key: 'photo', label: 'รูปภาพ', icon: ImageIcon, color: 'text-green-400' },
                    { key: 'video', label: 'วิดีโอ', icon: Film, color: 'text-purple-400' },
                    { key: 'link', label: 'ลิงก์', icon: LinkIcon, color: 'text-orange-400' },
                    { key: 'mediaset', label: 'อัลบั้ม', icon: LayoutGrid, color: 'text-pink-400' },
                  ].map((filter) => {
                    const isChecked = contentFilters[filter.key as keyof typeof contentFilters];
                    return (
                      <label key={filter.key} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-orange-500/10 border-orange-500/30' : 'bg-dark-950 border-dark-800 hover:bg-dark-900'
                        }`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => setContentFilters(prev => ({ ...prev, [filter.key]: e.target.checked }))}
                        />
                        <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${isChecked ? 'bg-orange-500 border-orange-500' : 'border-dark-600 bg-dark-900'}`}>
                          {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                        </div>
                        <filter.icon className={`w-3.5 h-3.5 shrink-0 ${filter.color}`} />
                        <span className={`text-xs font-medium ${isChecked ? 'text-white' : 'text-dark-300'}`}>{filter.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <hr className="border-dark-800/50" />

              <div className="space-y-3">
                <label className="text-sm font-medium text-dark-200">ช่วงเวลาของโพสต์ (ถ้าไม่กำหนดจะลบทั้งหมด):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 text-dark-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <span className="text-dark-500 font-bold text-xs">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 text-dark-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <hr className="border-dark-800/50" />

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-dark-200">
                      <Settings2 className="w-4 h-4" /> Threads:
                    </label>
                    <span className="text-orange-400 font-mono font-bold">{threads}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={maxThreads}
                    value={threads}
                    onChange={(e) => setThreads(parseInt(e.target.value))}
                    disabled={userPkg === 'Free'}
                    className="w-full accent-orange-500 disabled:grayscale"
                  />
                  <p className="text-[11px] flex justify-between items-center w-full mt-1">
                    <span className="text-dark-400">Threads:</span>
                    <span className="text-orange-500 font-medium">Max: {maxThreads}</span>
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-dark-200">
                      <Settings2 className="w-4 h-4" /> Delay:
                    </label>
                    <span className="text-orange-400 font-mono font-bold">{delay} s</span>
                  </div>
                  <input
                    type="range"
                    min={minDelay}
                    max="50"
                    value={delay}
                    onChange={(e) => setDelay(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <p className="text-[11px] flex justify-between items-center w-full mt-1">
                    <span className="text-dark-400">ระยะเวลาหน่วงก่อนลบโพสต์ถัดไป</span>
                    <span className="text-dark-500 font-medium">{minDelay}s - 50s</span>
                  </p>
                </div>
              </div>

            </div>

            <div className="space-y-3 pt-2">
              {scanning ? (
                <button
                  onClick={() => { abortRef.current = true; }}
                  className="w-full bg-red-600/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl py-3.5 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> หยุดสแกน
                </button>
              ) : (
                <button
                  onClick={scanPosts}
                  disabled={!targetGroup || scanning || isRunning}
                  className="w-full bg-dark-800 hover:bg-dark-700 disabled:opacity-50 text-white rounded-xl py-4 font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Search className="w-5 h-5" /> สแกนโพสต์
                </button>
              )}

              {isRunning ? (
                <button
                  onClick={stopRemoval}
                  className="w-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] rounded-xl py-5 font-semibold text-xl transition-all flex justify-center items-center gap-2 animate-pulse"
                >
                  <X className="w-6 h-6" /> หยุดการทำงาน
                </button>
              ) : (
                <button
                  onClick={startRemoval}
                  disabled={selectedPostIds.length === 0 || isRunning}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:bg-dark-800 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:shadow-none rounded-xl py-5 font-semibold text-xl transition-all flex justify-center items-center gap-2"
                >
                  <Trash2 className="w-6 h-6" /> เริ่มลบโพสต์ {selectedPostIds.length > 0 ? `(${selectedPostIds.length})` : ''}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Previews */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full rounded-2xl border border-dark-800 overflow-hidden bg-dark-950">
            <div className="bg-dark-900 border-b border-dark-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-white font-medium flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 rounded-lg">
                  <ListChecks className="w-4 h-4 text-green-400" />
                </div>
                โพสต์ที่พบในกลุ่ม
              </h3>
              {previewPosts.length > 0 && (
                <div className="flex items-center justify-end gap-3">
                  <div className="text-xs font-semibold text-dark-400 bg-dark-950 px-3 py-1.5 rounded-full border border-dark-800 whitespace-nowrap">
                    <span className="text-orange-400">{selectedPostIds.length}</span> / {previewPosts.length} จากทั้งหมด
                  </div>
                  <button
                    onClick={toggleSelectAllPage}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    onClick={() => setSelectedPostIds([])}
                    className="text-[11px] font-semibold text-dark-400 hover:text-dark-300 bg-dark-800 px-2 py-1 rounded"
                  >
                    ยกเลิกเลือกทั้งหมด
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-[400px]">
              {previewPosts.length === 0 && !scanning ? (
                <div className="flex-1 flex flex-col items-center justify-center text-dark-500">
                  <MonitorPlay className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-base text-dark-400">กดปุ่ม &quot;แสกนโพสต์&quot; เพื่อดึงรายการโพสต์</p>
                </div>
              ) : scanning ? (
                <div className="flex-1 flex flex-col items-center justify-center text-dark-500">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
                  <p className="text-sm animate-pulse text-orange-400/80 tracking-widest uppercase">Scanning...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {currentPosts.map((post: any) => (
                        <label
                          key={post.id}
                          className={`flex flex-col gap-2 p-2.5 rounded-xl border relative cursor-pointer outline-none transition-all duration-200 ${selectedPostIds.includes(post.id)
                            ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)] ring-1 ring-orange-500'
                            : 'bg-dark-900 border-dark-800 hover:border-dark-700 hover:bg-dark-800 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-1 w-full">
                            <div className="pt-0.5 shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedPostIds.includes(post.id)}
                                onChange={() => togglePostSelection(post.id)}
                                className="w-3.5 h-3.5 rounded border-dark-600 bg-dark-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-dark-900"
                              />
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0 ${post.type === 'photo' ? 'bg-green-500/10 text-green-400' :
                              post.type === 'video' ? 'bg-purple-500/10 text-purple-400' :
                                post.type === 'link' ? 'bg-orange-500/10 text-orange-400' :
                                  'bg-dark-800 text-dark-400'
                              }`}>{post.type}</span>
                          </div>

                          <div className="flex-1 w-full flex flex-col min-w-0">
                            <div className="text-[10px] font-mono text-dark-500 truncate mb-1.5" title={post.id}>ID: <span className="text-dark-300">{post.id}</span></div>
                            {post.full_picture && (
                              <div className="mb-2 w-full h-20 sm:h-24 rounded-lg overflow-hidden border border-dark-800 bg-dark-950 relative shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={post.full_picture} alt="Post preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <p className="text-[11px] sm:text-xs text-dark-200 line-clamp-3 leading-snug break-words">{post.message}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-4 border-t border-dark-800 shrink-0">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold bg-dark-900 border border-dark-700 text-white rounded-lg hover:bg-dark-800 disabled:opacity-50 transition-colors"
                      >ก่อนหน้า</button>
                      <span className="text-xs font-medium text-dark-300">หน้า {currentPage} / {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-semibold bg-dark-900 border border-dark-700 text-white rounded-lg hover:bg-dark-800 disabled:opacity-50 transition-colors"
                      >ถัดไป</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}