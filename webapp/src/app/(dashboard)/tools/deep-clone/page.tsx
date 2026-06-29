'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { CopyPlus, Network, Loader2, Search, Calendar, Image as ImageIcon, Clock, PlayCircle, CheckCircle2, SlidersHorizontal, ArrowUpDown, Filter, Edit3, Type, ChevronDown, Copy } from 'lucide-react';
import FacebookPageSelector from '@/components/FacebookPageSelector';
import { FacebookPage, fetchEAABToken } from '@/utils/facebook';
import { supabase } from '@/utils/supabase/client';
import { fetchSystemQuotas, normalizePackageName } from '@/utils/quotas';

export default function DeepClonePage() {
  const [loading, setLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Custom Select Component for beautiful dropdowns
  const CustomSelect = ({ value, onChange, options, icon: Icon }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], icon?: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.value === value) || options[0];

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center bg-dark-950 border transition-all rounded-lg h-9 px-3 gap-3 group min-w-[150px] justify-between focus:outline-none ${isOpen ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-dark-700/80 hover:border-orange-500/50'}`}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-3.5 h-3.5 transition-colors ${isOpen ? 'text-orange-500' : 'text-dark-400 group-hover:text-orange-500/80'}`} />}
            <span className="text-[11px] font-medium text-gray-200">{selectedOption?.label || ''}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-dark-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full min-w-[160px] bg-dark-900 border border-dark-700 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1.5 animate-fade-in-up">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[11px] font-medium transition-colors flex items-center justify-between group-hover:bg-dark-800 ${isSelected ? 'text-orange-400 bg-orange-500/10' : 'text-gray-300 hover:bg-dark-800 hover:text-white'}`}
                >
                  {opt.label}
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Scraper Settings
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetPages, setTargetPages] = useState<FacebookPage[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Clone Execution Settings
  const [threads, setThreads] = useState('3');
  const [delaySeconds, setDelaySeconds] = useState('1');
  const [cloneSettings, setCloneSettings] = useState({
    albums: true,
    videos: true,
    links: true,
    status: true,
    schedule: false
  });

  // Custom Caption Settings
  const [captionMode, setCaptionMode] = useState('original'); // original, custom, none
  const [customCaption, setCustomCaption] = useState('[original]\n\n#Cr [page]');
  const [customSchedules, setCustomSchedules] = useState<Record<string, string>>({});

  // State
  const [sourcePosts, setSourcePosts] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Filters and Sorting
  const [sortBy, setSortBy] = useState('time_desc');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');

  const abortControllerRef = useRef<AbortController | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Limits state
  const [userPkg, setUserPkg] = useState('Free');
  const [usage, setUsage] = useState<any>(null);
  const [quotaLimit, setQuotaLimit] = useState(3);

  // Init Usage Fetch
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const pkgRaw = user.user_metadata?.package || 'Free';
          setUserPkg(pkgRaw);
          const pkg = normalizePackageName(pkgRaw);
          
          const allQuotas = await fetchSystemQuotas();
          const stats = allQuotas[pkg].deep_clone;

          setQuotaLimit(stats.quota);
          // Apply capability settings based on quota config
          setCloneSettings(prev => ({ 
            ...prev, 
            albums: prev.albums && stats.albums, // only allow if package allows
            videos: prev.videos && stats.videos
          }));
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

  const addLog = (log: string) => {
    setLogs(prev => [...prev.slice(-199), log]);
    if (logContainerRef.current) {
      setTimeout(() => {
        if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleCopyLog = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scanSourcePosts = async () => {
    let sourceId = sourceUrl;

    // Parse URL (e.g. https://www.facebook.com/pagename or https://facebook.com/profile.php?id=...)
    const urlMatch = sourceUrl.match(/facebook\.com\/([^\/\?]+)/);
    if (urlMatch && urlMatch[1]) {
      sourceId = urlMatch[1];
      if (sourceId === 'profile.php' && sourceUrl.includes('id=')) {
        const idMatch = sourceUrl.match(/id=([0-9]+)/);
        if (idMatch) sourceId = idMatch[1];
      }
    }

    if (!sourceId) {
      addLog('Error: Invalid Source URL.');
      return;
    }

    if (targetPages.length === 0) {
      addLog('Error: Destination Page required to authenticate API. Please select at least one page.');
      return;
    }

    setLoading(true);
    setSourcePosts([]);
    setSelectedPosts([]);
    setCustomSchedules({});
    addLog(`Scanning Source: ${sourceId}...`);

    try {
      let scanToken = targetPages[0].access_token;
      let usingEAAB = false;
      try {
        const eaab = await fetchEAABToken();
        if (eaab) {
          scanToken = eaab;
          usingEAAB = true;
          addLog(`[System] Initializing with Business Token`);
        }
      } catch (e) {
        addLog(`[System] Initializing with Page Token`);
      }

      // Format Date Parameters if provided
      let dateParams = '';
      if (startDate) {
        const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
        dateParams += `&since=${startUnix}`;
      }
      if (endDate) {
        // Add 24h to include the entire end date day
        const endUnix = Math.floor(new Date(endDate).getTime() / 1000) + 86400;
        dateParams += `&until=${endUnix}`;
      }

      const fetchWithFields = async (fieldsStr: string, useJoey: boolean = false) => {
        const joeyParam = useJoey ? '&date_format=U&pretty=0&sdk=joey' : '';
        const reqUrl = `https://graph.facebook.com/v21.0/${sourceId}/posts?fields=${fieldsStr}&limit=100&offset=0&access_token=${scanToken}${joeyParam}${dateParams}`;

        const res = await SendRequestToExtension('PROXY_FETCH', {
          url: reqUrl,
          method: 'GET'
        });
        const proxyRes = res as { success?: boolean; data?: string; error?: string };
        let data;
        if (typeof proxyRes.data === 'string') {
          try { data = JSON.parse(proxyRes.data); } catch (e) { data = proxyRes.data; }
        } else {
          data = proxyRes.data;
        }
        if (proxyRes.error || (data && data.error)) {
          throw new Error(proxyRes.error || data.error.message);
        }
        return data;
      };

      let data;
      try {
        addLog(`[Fetch] Attempting Strategy 1 (Deep Subattachments)...`);
        const maxFields = 'id,permalink_url,from,story,message,attachments{title,type,description,url,subattachments.limit(100)},picture,full_picture,created_time,shares,reactions.limit(0).summary(true),comments.limit(0).summary(true)';
        data = await fetchWithFields(maxFields, true);
        addLog(`[Fetch] Strategy 1 Success.`);
      } catch (e1: any) {
        addLog(`[Fetch] Strategy 1 blocked: ${e1.message}`);
        try {
          addLog(`[Fetch] Attempting Strategy 2 (Standard Attachments)...`);
          const midFields = 'id,permalink_url,from,story,message,attachments,picture,full_picture,created_time,shares,reactions.limit(0).summary(true),comments.limit(0).summary(true)';
          data = await fetchWithFields(midFields, false);
          addLog(`[Fetch] Strategy 2 Success.`);
        } catch (e2: any) {
          addLog(`[Fetch] Strategy 2 blocked: ${e2.message}`);
          addLog(`[Fetch] Attempting Strategy 3 (Minimal Thumbnail only)...`);
          const minFields = 'id,permalink_url,from,story,message,picture,full_picture,created_time';
          data = await fetchWithFields(minFields, false);
          addLog(`[Fetch] Strategy 3 Success. (Some albums may not clone fully without attachments metadata)`);
        }
      }

      if (data && data.data) {
        setSourcePosts(data.data);
        const validPostsCount = data.data.length;
        addLog(`Found ${validPostsCount} posts within criteria.`);
      } else {
        setSourcePosts([]);
        addLog('No posts found matching criteria.');
      }
    } catch (err: any) {
      addLog(`[Error] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayedPosts = useMemo(() => {
    let filtered = [...sourcePosts];

    // Type filtering
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(p => {
        const hasAtt = p.attachments && p.attachments.data && p.attachments.data.length > 0;
        const attType = hasAtt ? (p.attachments.data[0].type || '') : 'status';
        const isVideo = attType.includes('video');
        const isPhotoAlbum = attType.includes('album') || attType.includes('photo') || !!p.full_picture;
        const isLink = attType.includes('share') || attType.includes('link');

        if (contentTypeFilter === 'video') return isVideo;
        if (contentTypeFilter === 'photo_album') return isPhotoAlbum && !isVideo;
        if (contentTypeFilter === 'link') return isLink;
        if (contentTypeFilter === 'status') return !hasAtt && !p.full_picture && !isLink;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'time_desc') return b.created_time - a.created_time;
      if (sortBy === 'likes') return (b.reactions?.summary?.total_count || 0) - (a.reactions?.summary?.total_count || 0);
      if (sortBy === 'comments') return (b.comments?.summary?.total_count || 0) - (a.comments?.summary?.total_count || 0);
      if (sortBy === 'shares') return (b.shares?.count || 0) - (a.shares?.count || 0);
      return 0;
    });

    return filtered;
  }, [sourcePosts, contentTypeFilter, sortBy]);

  const handleSelectAll = () => {
    // Select all displayed filters
    const displayedIds = displayedPosts.map(p => p.id);
    const allSelected = displayedIds.every(id => selectedPosts.includes(id));

    if (allSelected) {
      setSelectedPosts(selectedPosts.filter(id => !displayedIds.includes(id)));
    } else {
      const merged = new Set([...selectedPosts, ...displayedIds]);
      setSelectedPosts(Array.from(merged));
    }
  };

  const togglePostSelection = (id: string) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(selectedPosts.filter(pId => pId !== id));
    } else {
      setSelectedPosts([...selectedPosts, id]);
    }
  };

  const executeCloneTask = async () => {
    if (targetPages.length === 0 || selectedPosts.length === 0) return;

    let postsToClone = sourcePosts.filter(p => selectedPosts.includes(p.id));
    if (postsToClone.length === 0) return;

    // [LIVE QUOTA CHECK]
    let currentUsage = usage?.posts_cloned_count || 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) {
          const fetched = await res.json();
          if (fetched.success) {
            setUsage(fetched.data);
            currentUsage = fetched.data.posts_cloned_count || 0;
          }
        }
      }
    } catch (e) {}

    const remaining = quotaLimit - currentUsage;

    if (remaining <= 0) {
      addLog(`[QUOTA EXCEEDED] โควต้าดึงโพสต์รายวันของคุณเต็มแล้ว (${quotaLimit}/${quotaLimit}) กรุณาอัปเกรด`);
      setIsCloning(false);
      return;
    }

    if (postsToClone.length > remaining) {
      addLog(`[ระบบแจ้งเตือนโควต้า] ลดจำนวนโพสต์ที่ดึงจาก ${postsToClone.length} เหลือ ${remaining} โพสต์ตามโควต้าที่มีอยู่`);
      postsToClone = postsToClone.slice(0, remaining);
    }

    const allTasks: { post: any, targetPage: FacebookPage, postIndex: number }[] = [];
    postsToClone.forEach((post, i) => {
      targetPages.forEach(page => {
        allTasks.push({ post, targetPage: page, postIndex: i });
      });
    });

    setIsCloning(true);
    abortControllerRef.current = new AbortController();

    addLog(`----------------------------------------`);
    addLog(`[Start] Multithreaded Clone Protocol (Threads: ${threads}, Delay: ${delaySeconds}s)`);
    addLog(`[Target] Cloning ${postsToClone.length} post(s) to ${targetPages.length} page(s) (Total Tasks: ${allTasks.length})`);

    let currentIndex = 0;
    const activeThreads = new Set<number>();
    let totalSuccess = 0;
    let totalFailed = 0;

    const recordSuccess = async (targetPageId: string, targetPageName: string) => {
      totalSuccess++;
      const { data: { session } } = await supabase.auth.getSession();
      fetch('/api/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'clone', count: 1, target_type: 'page', target_id: targetPageId, target_name: targetPageName })
      }).then(async (r) => {
        if (r.ok) {
          setUsage((prev: any) => prev ? { ...prev, posts_cloned_count: (prev.posts_cloned_count || 0) + 1 } : prev);
        }
      }).catch(() => { });
    };

    const runThread = async (threadId: number) => {
      activeThreads.add(threadId);

      while (currentIndex < allTasks.length) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const index = currentIndex++;
        const currentTask = allTasks[index];
        const post = currentTask.post;
        const targetPage = currentTask.targetPage;

        addLog(`[T${threadId}] Processing Post: ${post.id} -> ${targetPage.name}`);

        try {
          const hasAttachments = post.attachments && post.attachments.data && post.attachments.data.length > 0;
          const attData = hasAttachments ? post.attachments.data[0] : null;
          let attType = attData ? attData.type : 'status';

          if (attType === 'album' || (attData && attData.subattachments)) {
            attType = 'album';
          }

          let fbUrl = `https://graph.facebook.com/v21.0/${targetPage.id}/feed`;
          const payload: Record<string, any> = {
            access_token: targetPage.access_token,
          };

          // Apply Text Editor Logic
          const originalMessage = post.message || '';
          if (captionMode === 'original') {
            payload.message = originalMessage;
          } else if (captionMode === 'none') {
            payload.message = '';
          } else if (captionMode === 'custom') {
            let processedCustom = customCaption.replace(/\[original\]/gi, originalMessage);
            processedCustom = processedCustom.replace(/\[page\]/gi, targetPage.name);
            payload.message = processedCustom;
          }

          // FACEBOOK GRAPH API SAFEGUARD: If message is entirely empty, delete it from payload
          // Empty string parameters frequently cause "Invalid request" OAuth errors.
          if (typeof payload.message === 'string' && payload.message.trim() === '') {
            delete payload.message;
          }

          let hasCustomSchedule = false;
          if (customSchedules[post.id]) {
            const customDate = new Date(customSchedules[post.id]);
            if (!isNaN(customDate.getTime())) {
              payload.published = false;
              payload.scheduled_publish_time = Math.floor(customDate.getTime() / 1000);
              hasCustomSchedule = true;
            }
          }

          if (!hasCustomSchedule && cloneSettings.schedule) {
            const bufferMinutes = 15;
            // Spread scheduling across the items (add sequential minutes based on index)
            const scheduleTime = Math.floor(Date.now() / 1000) + (bufferMinutes * 60) + (currentTask.postIndex * 60 * 5); // 5 mins apart
            payload.published = false;
            payload.scheduled_publish_time = scheduleTime;
          }

          try {
            // Facebook Graph API accepts JSON, but for media /url uploads, it heavily prefers Form-Encoded.
            // Converting the payload to application/x-www-form-urlencoded solves Code 1 "Invalid Request".
            const buildFormBody = (data: Record<string, any>) => {
              const params = new URLSearchParams();
              for (const key in data) {
                if (data[key] !== undefined) {
                  params.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]));
                }
              }
              return params.toString();
            };

            if (attType.includes('video') && cloneSettings.videos) {
              // Video cloning
              fbUrl = `https://graph.facebook.com/v21.0/${targetPage.id}/videos`;
              const videoUrl = post.source || (attData && attData.media ? attData.media.source : null);
              if (!videoUrl) throw new Error('Video URL missing in source');

              payload.file_url = videoUrl;
              if (payload.message) {
                payload.description = payload.message;
                delete payload.message; // videos use 'description'
              }

              const res = await SendRequestToExtension('PROXY_FETCH', {
                url: fbUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: buildFormBody(payload)
              });
              const proxyRes = res as { success?: boolean; data?: string; error?: string };
              const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
              if (proxyRes.error || (data && data.error)) {
                const errObj = data?.error ? JSON.stringify(data.error) : proxyRes.error;
                throw new Error(`Graph API Rejected payload: ${errObj} | Payload URL: ${fbUrl} | AttType: ${attType}`);
              }
              addLog(`[T${threadId}] Cloned Video to ${targetPage.name}`);
              recordSuccess(targetPage.id, targetPage.name);

            } else if (attType === 'album' && cloneSettings.albums) {
              // Album cloning
              const subAtt = attData.subattachments && attData.subattachments.data ? attData.subattachments.data : [attData];
              const uploadedMediaIds: string[] = [];

              for (let j = 0; j < subAtt.length; j++) {
                if (abortControllerRef.current?.signal.aborted) break;

                const photoUrl = subAtt[j].media ? subAtt[j].media.image.src : null;
                if (!photoUrl) continue;

                const upUrlBody = new URLSearchParams();
                upUrlBody.append('access_token', targetPage.access_token);
                upUrlBody.append('url', photoUrl);
                upUrlBody.append('published', 'false');

                const upRes = await SendRequestToExtension('PROXY_FETCH', {
                  url: `https://graph.facebook.com/v21.0/${targetPage.id}/photos`,
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: upUrlBody.toString()
                });

                const upProxyRes = upRes as { success?: boolean; data?: string; error?: string };
                if (upProxyRes.success && upProxyRes.data) {
                  const upData = typeof upProxyRes.data === 'string' ? JSON.parse(upProxyRes.data) : upProxyRes.data;
                  if (upData.id) {
                    uploadedMediaIds.push(upData.id);
                  } else if (upData.error) {
                    throw new Error(`Media Upload Failed: ${JSON.stringify(upData.error)}`);
                  }
                }
              }

              if (uploadedMediaIds.length > 0) {
                // For x-www-form-urlencoded, Facebook accepts attached_media as JSON array string
                payload.attached_media = uploadedMediaIds.map(id => ({ media_fbid: id }));
                const res = await SendRequestToExtension('PROXY_FETCH', {
                  url: fbUrl,
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: buildFormBody(payload)
                });
                const proxyRes = res as { success?: boolean; data?: string; error?: string };
                const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
                if (proxyRes.error || (data && data.error)) {
                  throw new Error(`Album Submission Failed: ${data?.error ? JSON.stringify(data.error) : proxyRes.error}`);
                }
                addLog(`[T${threadId}] Cloned Album (${uploadedMediaIds.length} photos)`);
                recordSuccess(targetPage.id, targetPage.name);
              } else {
                throw new Error('No photos could be extracted for album');
              }

            } else if ((attType.includes('photo') || post.full_picture) && cloneSettings.albums) {
              // Single photo (Via Feed Pipeline to bypass /photos OPES blocks on scheduling)
              const photoUrl = post.full_picture || (attData && attData.media ? attData.media.image.src : '');
              if (!photoUrl) throw new Error('Missing URL for Single Photo API');

              // Step 1: Upload photo un-published
              const upUrlBody = new URLSearchParams();
              upUrlBody.append('access_token', targetPage.access_token);
              upUrlBody.append('url', photoUrl);
              upUrlBody.append('published', 'false');

              const upRes = await SendRequestToExtension('PROXY_FETCH', {
                url: `https://graph.facebook.com/v21.0/${targetPage.id}/photos`,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: upUrlBody.toString()
              });
              const upProxyRes = upRes as { success?: boolean; data?: string; error?: string };
              const upData = typeof upProxyRes.data === 'string' ? JSON.parse(upProxyRes.data) : upProxyRes.data;
              if (!upData?.id) {
                throw new Error(`Media Upload Failed: ${upData?.error ? JSON.stringify(upData.error) : upProxyRes.error}`);
              }

              // Step 2: Publish to Feed with precise schedule & message
              payload.attached_media = [{ media_fbid: upData.id }];

              const res = await SendRequestToExtension('PROXY_FETCH', {
                url: `https://graph.facebook.com/v21.0/${targetPage.id}/feed`,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: buildFormBody(payload)
              });
              const proxyRes = res as { success?: boolean; data?: string; error?: string };
              const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
              if (proxyRes.error || (data && data.error)) {
                throw new Error(`Single Photo FEED Failed: ${data?.error ? JSON.stringify(data.error) : proxyRes.error}`);
              }
              addLog(`[T${threadId}] Cloned Single Photo`);
              recordSuccess(targetPage.id, targetPage.name);

            } else if ((attType === 'share' || attType === 'link') && cloneSettings.links) {
              // Share / Link Clone
              const linkUrl = attData.url || post.link;
              if (!linkUrl) throw new Error('Skipped: Extracted share type but missing URL link.');

              payload.link = linkUrl;

              const res = await SendRequestToExtension('PROXY_FETCH', {
                url: fbUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: buildFormBody(payload)
              });
              const proxyRes = res as { success?: boolean; data?: string; error?: string };
              const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
              if (proxyRes.error || (data && data.error)) {
                throw new Error(`Link Post Failed: ${data?.error ? JSON.stringify(data.error) : proxyRes.error}`);
              }
              addLog(`[T${threadId}] Cloned Link Post`);
              recordSuccess(targetPage.id, targetPage.name);

            } else if (attType === 'status' && cloneSettings.status) {
              // Status only
              if (!payload.message) {
                throw new Error('Skipped: Cannot clone a status post without text content.');
              }
              const res = await SendRequestToExtension('PROXY_FETCH', {
                url: fbUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: buildFormBody(payload)
              });
              const proxyRes = res as { success?: boolean; data?: string; error?: string };
              const data = typeof proxyRes.data === 'string' ? JSON.parse(proxyRes.data) : proxyRes.data;
              if (proxyRes.error || (data && data.error)) {
                throw new Error(`Status Failed: ${data?.error ? JSON.stringify(data.error) : proxyRes.error}`);
              }
              addLog(`[T${threadId}] Cloned Status Post`);
              recordSuccess(targetPage.id, targetPage.name);
            }
          } catch (innerErr: any) {
            addLog(`[T${threadId} Failed] Post ${post.id}: ${innerErr.message}`);
            totalFailed++;
          }

        } catch (err: any) {
          addLog(`[T${threadId} Error] processing ${post.id}: ${err.message}`);
          totalFailed++;
        }

        const delayMs = parseInt(delaySeconds) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      activeThreads.delete(threadId);
    };

    const threadCount = Math.min(parseInt(threads), allTasks.length);
    const workerPromises = [];
    for (let i = 0; i < threadCount; i++) {
      workerPromises.push(runThread(i + 1));
    }

    await Promise.all(workerPromises);

    if (abortControllerRef.current?.signal.aborted) {
      addLog(`[System] Process Stopped Successfully.`);
    } else {
      addLog(`[Finish] Task Completed! ${totalSuccess} Success / ${totalFailed} Failed.`);
      // Clear selection upon normal completion
      setSelectedPosts([]);
    }
    setIsCloning(false);
  };

  const stopTask = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog(`[System] Stopping process... waiting for running requests.`);
    }
  };

  const formatUnixTime = (timeInfo: string | number) => {
    if (!timeInfo) return '';
    if (typeof timeInfo === 'number' || /^\d+$/.test(String(timeInfo))) {
      const date = new Date(Number(timeInfo) * 1000);
      return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    return String(timeInfo).split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Page Posts Deep Clone</h1>
          <p className="text-dark-400">ดึงเนื้อหาจากเพจ Facebook ใดก็ได้ไปยังเพจของคุณเอง เครื่องมือนี้รองรับ อัลบั้ม, วิดีโอ, รูปภาพ, ลิงก์, แคปชั่น</p>
        </div>

        {/* Quota Status */}
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
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ดึงสูงสุด/วัน</span>
            <span className="text-sm font-bold text-white mt-1">
              {usage?.posts_cloned_count || 0} <span className="text-dark-500 font-medium">/ {quotaLimit.toLocaleString()} โพสต์</span>
            </span>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ดีเลย์ขั้นต่ำ</span>
            <span className="text-sm font-bold text-white mt-1">
              1 วินาที
            </span>
          </div>
        </div>
      </div>

      <FacebookPageSelector multiSelect={true} onMultiPageSelect={setTargetPages} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none" />}

            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-orange-400" />
              เพจต้นฉบับ
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">กรอก URL หรือ ID</label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="กรอก URL"
                  className="w-full bg-dark-950 border border-dark-700 text-white rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-700 text-white rounded-xl py-2 px-3 focus:outline-none text-[13px] accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-700 text-white rounded-xl py-2 px-3 focus:outline-none text-[13px] accent-orange-500"
                  />
                </div>
              </div>

              <button
                onClick={scanSourcePosts}
                disabled={loading || targetPages.length === 0 || !sourceUrl}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-2.5 px-4 font-medium transition-colors flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                สแกนข้อมูล
              </button>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {isCloning && <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-[2px] z-10 block pointer-events-none" />}

            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CopyPlus className="w-4 h-4 text-orange-400" />
              รูปแบบข้อมูล
            </h3>
            <div className="space-y-4">

              {/* Extraction Options */}
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-start gap-2 p-2 bg-dark-950 border border-dark-800 rounded-lg ${userPkg === 'Free' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-dark-600'}`}>
                  <input type="checkbox" disabled={userPkg === 'Free'} checked={cloneSettings.albums} onChange={e => setCloneSettings({ ...cloneSettings, albums: e.target.checked })} className="rounded bg-dark-800 border-dark-600 text-orange-500 w-3.5 h-3.5 mt-0.5 cursor-pointer disabled:cursor-not-allowed flex-shrink-0" />
                  <span className="text-[11px] leading-tight text-gray-300">รูปภาพ/อัลบั้ม <span className="text-orange-400 block mt-0.5 text-[9px]">{userPkg === 'Free' ? '(Pro)' : ''}</span></span>
                </label>
                <label className={`flex items-start gap-2 p-2 bg-dark-950 border border-dark-800 rounded-lg ${userPkg !== 'Premium' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-dark-600'}`}>
                  <input type="checkbox" disabled={userPkg !== 'Premium'} checked={cloneSettings.videos} onChange={e => setCloneSettings({ ...cloneSettings, videos: e.target.checked })} className="rounded bg-dark-800 border-dark-600 text-orange-500 w-3.5 h-3.5 mt-0.5 cursor-pointer disabled:cursor-not-allowed flex-shrink-0" />
                  <span className="text-[11px] leading-tight text-gray-300">วิดีโอ/Reels <span className="text-orange-400 block mt-0.5 text-[9px]">{userPkg !== 'Premium' ? '(Premium)' : ''}</span></span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-dark-950 border border-dark-800 rounded-lg cursor-pointer hover:border-dark-600">
                  <input type="checkbox" checked={cloneSettings.links} onChange={e => setCloneSettings({ ...cloneSettings, links: e.target.checked })} className="rounded bg-dark-800 border-dark-600 text-orange-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0" />
                  <span className="text-[11px] text-gray-300">Links</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-dark-950 border border-dark-800 rounded-lg cursor-pointer hover:border-dark-600">
                  <input type="checkbox" checked={cloneSettings.status} onChange={e => setCloneSettings({ ...cloneSettings, status: e.target.checked })} className="rounded bg-dark-800 border-dark-600 text-orange-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0" />
                  <span className="text-[11px] text-gray-300">แคปชั่น</span>
                </label>
              </div>

              {/* Caption Editor Module */}
              <div className="pt-2 border-t border-dark-800">
                <span className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5"><Edit3 className="w-3 h-3 text-blue-400" /> แคปชั่น</span>

                <div className="flex bg-dark-950 p-1 rounded-lg border border-dark-800 mb-3">
                  <button onClick={() => setCaptionMode('original')} className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all ${captionMode === 'original' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400'}`}>ต้นฉบับ</button>
                  <button onClick={() => setCaptionMode('none')} className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all ${captionMode === 'none' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400'}`}>ไม่ใส่</button>
                  <button onClick={() => setCaptionMode('custom')} className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all ${captionMode === 'custom' ? 'bg-orange-500 text-white shadow-sm' : 'text-dark-400'}`}>กำหนดเอง</button>
                </div>

                {captionMode === 'custom' && (
                  <div className="animate-fade-in-up">
                    <textarea
                      value={customCaption}
                      onChange={e => setCustomCaption(e.target.value)}
                      className="w-full h-24 bg-dark-950 border border-dark-700 rounded-xl p-3 text-xs text-white custom-scrollbar focus:ring-1 focus:ring-orange-500 outline-none"
                      placeholder="Write custom caption..."
                    ></textarea>
                    <p className="text-[10px] text-dark-400 mt-1 flex items-center gap-1">
                      <Type className="w-3 h-3" /> ตัวแปร:
                      <span className="bg-dark-800 px-1 py-0.5 rounded text-gray-300 font-mono">[original]</span>
                      <span className="bg-dark-800 px-1 py-0.5 rounded text-gray-300 font-mono">[page]</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Concurrency Settings */}
              <div className="pt-2 border-t border-dark-800 space-y-3">
                <div>
                  <label className="flex flex-col text-xs font-medium text-gray-300 mb-2">
                    <div className="flex justify-between items-center w-full">
                      <span>Threads: <span className="text-dark-500">(1-5)</span></span>
                      <span className="bg-dark-800 px-1.5 py-0.5 rounded text-[10px] tracking-wider text-orange-400">{threads}</span>
                    </div>
                  </label>
                  <input type="range" min="1" max="5" value={threads} onChange={(e) => setThreads(e.target.value)} className="w-full accent-orange-500 h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer" />
                </div>

                <div>
                  <label className="flex flex-col text-xs font-medium text-gray-300 mb-2">
                    <div className="flex justify-between items-center w-full">
                      <span>Delay: <span className="text-dark-500">(1-10s)</span></span>
                      <span className="bg-dark-800 px-1.5 py-0.5 rounded text-[10px] tracking-wider text-orange-400">{delaySeconds}s</span>
                    </div>
                  </label>
                  <input type="range" min="1" max="10" value={delaySeconds} onChange={(e) => setDelaySeconds(e.target.value)} className="w-full accent-orange-500 h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>

              {/* <div className="pt-2 border-t border-dark-800">
                 <label className="flex items-center gap-3 p-2 bg-dark-950 border border-dark-800 rounded-xl cursor-pointer hover:border-dark-600 transition-colors">
                   <input type="checkbox" checked={cloneSettings.schedule} onChange={e => setCloneSettings({...cloneSettings, schedule: e.target.checked})} className="rounded bg-dark-800 border-dark-600 text-blue-500 focus:ring-blue-500 w-4 h-4" />
                   <div className="flex-1">
                     <span className="text-sm text-gray-200 block">Schedule Buffer Config</span>
                     <span className="text-[10px] text-dark-400 block mt-0.5">+15 mins initial buffer limit</span>
                   </div>
                 </label>
               </div> */}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4 flex flex-col min-h-0">

          {/* Top Control Bar for Filters/Sorts */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  disabled={displayedPosts.length === 0 || isCloning}
                  className="bg-dark-800 hover:bg-dark-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-dark-600"
                >
                  ข้อมูลที่พบ
                </button>
                <div className="text-xs text-dark-400">
                  <span className="text-orange-400 font-bold">{selectedPosts.length}</span> ที่เลือก
                </div>
              </div>

              <div className="h-6 w-px bg-dark-800 hidden md:block"></div>

              <div className="flex flex-wrap items-center gap-3">
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  icon={ArrowUpDown}
                  options={[
                    { value: 'time_desc', label: 'เวลา (เก่า-ใหม่)' },
                    { value: 'likes', label: 'ไลค์เยอะสุด' },
                    { value: 'comments', label: 'คอมเมนต์เยอะสุด' },
                    { value: 'shares', label: 'แชร์เยอะสุด' }
                  ]}
                />

                <CustomSelect
                  value={contentTypeFilter}
                  onChange={setContentTypeFilter}
                  icon={Filter}
                  options={[
                    { value: 'all', label: 'ทุกโพสต์' },
                    { value: 'video', label: 'วิดีโอ' },
                    { value: 'photo_album', label: 'รูปภาพ/อัลบั้ม' },
                    { value: 'link', label: 'ลิงก์' },
                    { value: 'status', label: 'แคปชั่น' }
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {!isCloning ? (
                <button
                  onClick={executeCloneTask}
                  disabled={selectedPosts.length === 0 || targetPages.length === 0}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  เริ่มทำงาน
                </button>
              ) : (
                <button
                  onClick={stopTask}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-2 rounded-xl text-sm font-bold transition-colors border border-red-500/20 flex items-center gap-2"
                >
                  หยุดทำงาน
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-[500px] flex flex-col gap-4">
            
            {/* Sub-Terminal Output */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl flex flex-col h-40 shrink-0 overflow-hidden shadow-inner">
              <div className="px-4 py-2 border-b border-dark-800 bg-dark-950/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 relative">
                    {isCloning && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>}
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ผลลัพธ์การทำงาน</span>
                </div>
                <button
                  onClick={handleCopyLog}
                  disabled={logs.length === 0}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  title="คัดลอก"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
              </div>
              <div
                ref={logContainerRef}
                className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6] select-text"
              >
                {logs.length === 0 ? (
                  <div className="text-dark-600 flex items-center h-full justify-center">ระบบพร้อมใช้งาน</div>
                ) : (
                  logs.map((log, i) => {
                    const isErr = log.includes('Error') || log.includes('Failed');
                    const isSuc = log.includes('Success');
                    const isSys = log.includes('System') || log.includes('Start') || log.includes('Finish');
                    const isTarget = log.includes('Target');
                    return (
                      <div key={i} className={`
                          ${isErr ? 'text-red-400 font-medium' : ''}
                          ${isSuc ? 'text-green-400' : ''}
                          ${isSys ? 'text-blue-400 font-medium' : ''}
                          ${isTarget ? 'text-purple-400 font-medium' : ''}
                          ${!isErr && !isSuc && !isSys && !isTarget ? 'text-gray-300' : ''}
                          py-0.5 whitespace-pre-wrap
                        `}>
                        <span className="text-dark-600 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Grid Preview Display */}
            <div className="bg-dark-950/50 rounded-2xl border border-dark-800 flex-1 overflow-y-auto custom-scrollbar p-6">

              {sourcePosts.length === 0 && !loading && (
                <div className="h-full flex items-center justify-center text-dark-500 text-sm flex-col gap-3">
                  <Network className="w-8 h-8 opacity-50" />
                  ยังไม่มีข้อมูล... กรุณาสแกนเพจ
                </div>
              )}
              {loading && sourcePosts.length === 0 && (
                <div className="h-full flex items-center justify-center text-dark-500 text-sm flex-col gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <span>กำลังดึงข้อมูล...</span>
                </div>
              )}

              {sourcePosts.length > 0 && displayedPosts.length === 0 && (
                <div className="h-full flex items-center justify-center text-dark-500 text-sm">
                  ไม่พบข้อมูล
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedPosts.map((post) => {
                  const isSelected = selectedPosts.includes(post.id);
                  const hasAttachments = post.attachments && post.attachments.data && post.attachments.data.length > 0;
                  const isVideo = post.attachments?.data?.[0]?.type?.includes('video');
                  const isLink = post.attachments?.data?.[0]?.type?.includes('share');

                  return (
                    <div
                      key={post.id}
                      onClick={() => !isCloning && togglePostSelection(post.id)}
                      className={`relative rounded-xl border ${isSelected ? 'border-orange-500 bg-dark-900 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-dark-800 bg-dark-900 hover:border-dark-600'} transition-all cursor-pointer overflow-hidden flex flex-col group h-64`}
                    >
                      <div className="h-32 bg-dark-950 relative overflow-hidden flex-shrink-0">
                        {(post.full_picture || (hasAttachments && post.attachments.data[0].media?.image?.src)) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={post.full_picture || post.attachments.data[0].media?.image?.src} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dark-600 bg-dark-900">
                            <Type className="w-8 h-8 opacity-50" />
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider backdrop-blur-md">
                            วิดีโอ
                          </div>
                        )}
                        {isLink && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider backdrop-blur-md">
                            ลิงก์
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2 py-1 bg-dark-950/90 backdrop-blur rounded-md border border-dark-800 flex items-center gap-1.5 shadow-lg">
                          <MapInteractionStatus post={post} />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-dark-950 to-transparent"></div>

                        <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shadow-lg ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-dark-500/50 bg-dark-900/80 backdrop-blur-sm'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col relative z-20 bg-dark-950">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-300 line-clamp-2 leading-relaxed break-words">{post.message || <span className="italic text-dark-600">-- ไม่มีข้อความ --</span>}</span>
                        </div>

                        {/* Custom Schedule Input */}
                        {isSelected && (
                          <div className="mt-2 text-[10px] animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-dark-400 mb-1 font-medium">กำหนดเวลาโพสต์</label>
                            <div className="flex gap-2">
                              {/* Date Picker */}
                              <input
                                type="date"
                                value={customSchedules[post.id]?.split('T')[0] || ''}
                                onChange={(e) => {
                                  const t = customSchedules[post.id]?.split('T')[1] || '12:00';
                                  setCustomSchedules(p => ({ ...p, [post.id]: `${e.target.value}T${t}` }));
                                }}
                                className="w-full bg-dark-900 border border-dark-700 text-white rounded-lg py-1 px-2 focus:outline-none focus:border-orange-500 accent-orange-500 min-w-0"
                              />

                              {/* Time Picker (24H Masked) */}
                              <div className="flex items-center bg-dark-900 border border-dark-700 rounded-lg px-2 focus-within:border-orange-500 shrink-0">
                                <input
                                  type="text"
                                  maxLength={2}
                                  placeholder="00"
                                  value={(customSchedules[post.id]?.split('T')[1] || '').split(':')[0] || ''}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length === 2 && parseInt(v) > 23) v = '23';
                                    const d = customSchedules[post.id]?.split('T')[0] || new Date().toISOString().split('T')[0];
                                    const m = (customSchedules[post.id]?.split('T')[1] || '').split(':')[1] || '00';
                                    setCustomSchedules(p => ({ ...p, [post.id]: `${d}T${v}:${m}` }));
                                  }}
                                  onBlur={(e) => {
                                    let v = e.target.value;
                                    if (v.length === 1) v = '0' + v;
                                    const d = customSchedules[post.id]?.split('T')[0] || new Date().toISOString().split('T')[0];
                                    const m = (customSchedules[post.id]?.split('T')[1] || '').split(':')[1] || '00';
                                    setCustomSchedules(p => ({ ...p, [post.id]: `${d}T${v}:${m}` }));
                                  }}
                                  className="w-5 bg-transparent text-white text-center focus:outline-none text-[13px] placeholder-dark-600 p-0"
                                />
                                <span className="text-dark-500 font-bold mx-0.5">:</span>
                                <input
                                  type="text"
                                  maxLength={2}
                                  placeholder="00"
                                  value={(customSchedules[post.id]?.split('T')[1] || '').split(':')[1] || ''}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length === 2 && parseInt(v) > 59) v = '59';
                                    const d = customSchedules[post.id]?.split('T')[0] || new Date().toISOString().split('T')[0];
                                    const h = (customSchedules[post.id]?.split('T')[1] || '').split(':')[0] || '12';
                                    setCustomSchedules(p => ({ ...p, [post.id]: `${d}T${h}:${v}` }));
                                  }}
                                  onBlur={(e) => {
                                    let v = e.target.value;
                                    if (v.length === 1) v = '0' + v;
                                    const d = customSchedules[post.id]?.split('T')[0] || new Date().toISOString().split('T')[0];
                                    const h = (customSchedules[post.id]?.split('T')[1] || '').split(':')[0] || '12';
                                    setCustomSchedules(p => ({ ...p, [post.id]: `${d}T${h}:${v}` }));
                                  }}
                                  className="w-5 bg-transparent text-white text-center focus:outline-none text-[13px] placeholder-dark-600 p-0"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-dark-800/50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-orange-500/70" />
                            <span className="text-[10px] text-dark-400 font-medium tracking-wide">{formatUnixTime(post.created_time)}</span>
                          </div>
                          <span className="text-[9px] text-dark-500 font-mono">{post.id.split('_').pop()?.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapInteractionStatus({ post }: { post: any }) {
  const likes = post.reactions?.summary?.total_count || 0;
  const comments = post.comments?.summary?.total_count || 0;
  if (likes === 0 && comments === 0) return <span className="text-[10px] text-dark-300">0 Engagements</span>;
  return (
    <span className="text-[10px] text-orange-400 font-bold whitespace-nowrap drop-shadow-md">
      {likes > 0 ? `${likes.toLocaleString()} Likes ` : ''}
      {comments > 0 ? `•  ${comments.toLocaleString()} Comments` : ''}
    </span>
  );
}