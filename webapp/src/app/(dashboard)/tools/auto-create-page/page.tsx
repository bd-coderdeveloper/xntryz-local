'use client';

import { useState, useRef, useEffect } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { Loader2, Wand2, X, AlertCircle, Building2, UserPlus, Type, Copy, CheckCheck } from 'lucide-react';
import FacebookBusinessSelector from '@/components/FacebookBusinessSelector';
import { fetchWebDTSGData, BusinessAccount } from '@/utils/facebook';
import { supabase } from '@/utils/supabase/client';
import { fetchSystemQuotas, normalizePackageName } from '@/utils/quotas';

export default function AutoCreatePage() {
  const [loading, setLoading] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [selectedBizAccount, setSelectedBizAccount] = useState<BusinessAccount | null>(null);

  // Settings
  const [delaySeconds, setDelaySeconds] = useState<number>(180);
  const [pageBio, setPageBio] = useState<string>('');
  const [pageNames, setPageNames] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Package & Limits
  const [userPkg, setUserPkg] = useState('Free');
  const [pkgLimit, setPkgLimit] = useState(2);
  const [minDelay, setMinDelay] = useState(180);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const pkgRaw = session.user.user_metadata?.package || 'Free';
      setUserPkg(pkgRaw);
      const pkg = normalizePackageName(pkgRaw);

      const allQuotas = await fetchSystemQuotas();
      const stats = allQuotas[pkg].auto_page;

      setPkgLimit(stats.quota);
      setMinDelay(stats.delay);
      setDelaySeconds(prev => Math.max(prev, stats.delay));

      // Fetch usage count
      const res = await fetch('/api/usage', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setUsageCount(data.data.auto_create_pages_count || 0);
        }
      }
    } catch { }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const setStatus = (msg: string) => {
    setGlobalStatus(msg);
    if (msg) {
      setLogs(prev => [...prev, msg]);
    }
  };

  const handleCopyLog = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNames = () => {
    // Basic english random name generator
    const firstNames = ['Tech', 'Global', 'Future', 'Smart', 'Bright', 'Vision', 'Alpha', 'Pro', 'Elite', 'Next', 'Neo', 'Urban', 'Metro', 'Prime', 'Apex', 'Core', 'Evo', 'Max', 'Nova', 'Ultra'];
    const lastNames = ['Solutions', 'Group', 'Media', 'Ventures', 'Digital', 'Dynamics', 'Studio', 'Labs', 'Works', 'Network', 'Systems', 'Global', 'Hub', 'Space', 'Tech', 'Services'];

    const count = 100;
    const generated = [];
    for (let i = 0; i < count; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      generated.push(`${first} ${last} ${Math.floor(Math.random() * 899) + 100}`); // Added random digits to ensure uniqueness
    }
    setPageNames(generated.join('\n'));
    setStatus('ระบบได้ทำการสุ่มชื่อเพจแล้ว');
  };

  const startCreation = async () => {
    const namesList = pageNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);

    if (namesList.length === 0) return setStatus('Error: กรุณาใส่ชื่อเพจอย่างน้อย 1 ชื่อ');
    if (namesList.length > 100) return setStatus('Error: ไม่สามารถสร้างเพจได้เกิน 100 เพจต่อครั้ง');

    // [LIVE QUOTA CHECK]
    let currentUsageCount = usageCount;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) {
          const fetched = await res.json();
          if (fetched.success && fetched.data) {
            setUsageCount(fetched.data.auto_create_pages_count || 0);
            currentUsageCount = fetched.data.auto_create_pages_count || 0;
          }
        }
      }
    } catch (e) {}

    // Validate Limits
    if (currentUsageCount + namesList.length > pkgLimit) {
      alert(`แพ็กเกจ ${userPkg} ของคุณสร้างได้สูงสุด ${pkgLimit} เพจ/วัน\n(วันนี้สร้างไปแล้ว ${currentUsageCount} เพจ)\nกรุณาลดจำนวนลง หรืออัปเกรดแพ็กเกจครับ`);
      return setStatus(`Error: โควต้าไม่เพียงพอ ขาดอีก ${currentUsageCount + namesList.length - pkgLimit} เพจ`);
    }
    if (delaySeconds < minDelay) {
      alert(`แพ็กเกจ ${userPkg} ของคุณต้องตั้งดีเลย์ขั้นต่ำ ${minDelay} วินาทีครับ`);
      setDelaySeconds(minDelay);
      return setStatus(`Error: ดีเลย์เร็วกว่าที่แพ็กเกจกำหนด (${minDelay}s)`);
    }
    // if (!selectedBizAccount) return setStatus('Error: Please select a Business Account first.'); // Optional depending on requirement

    setLoading(true);
    try {
      setStatus(`ระบบกำลังทำงาน... จำนวนเพจ: ${namesList.length} เพจ ดีเลย์: ${delaySeconds} วินาที`);

      setStatus('ดึงข้อมูล Session จาก Browser...');
      const authData = await fetchWebDTSGData();

      const { fb_dtsg, actor_id } = authData;
      if (!fb_dtsg || !actor_id) {
        throw new Error('Failed to extract Facebook session tokens. Please login to Facebook in your browser.');
      }
      // setStatus(`Session Active. UID: ${actor_id}`);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < namesList.length; i++) {
        const pName = namesList[i];
        setStatus(`[${i + 1}/${namesList.length}] ระบบกำลังสร้างเพจ: "${pName}"...`);

        // Prepare GraphQL variables based on provided User Payload
        const variables = {
          input: {
            bio: pageBio || " ",
            categories: ["2201"], // Default to something like Business/Service
            creation_source: "comet",
            name: pName,
            page_referrer: "launch_point",
            actor_id: actor_id, // Inject real actor id
            client_mutation_id: Math.floor(Math.random() * 1000).toString(),
          }
        };

        // Graph API for page creation expects multipart/form-data
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15);
        let multipartBody = '';
        const appendField = (name: string, value: string) => {
          multipartBody += `--${boundary}\r\n`;
          multipartBody += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
          multipartBody += `${value}\r\n`;
        };

        appendField('fb_dtsg', fb_dtsg);
        appendField('av', actor_id);
        appendField('server_timestamps', 'true');
        appendField('doc_id', '5903223909690825'); // The exact doc_id from upfeedth
        appendField('variables', JSON.stringify(variables));
        multipartBody += `--${boundary}--\r\n`;

        let callSuccess = false;
        try {
          const resRaw = await SendRequestToExtension('PROXY_FETCH', {
            url: `https://www.facebook.com/api/graphql`,
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            bodyType: 'string',
            body: multipartBody
          }) as any;

          let parsedRes;
          try {
            // If Facebook sent an HTML document (Checkpoint or generic error redirect) instead of JSON
            if (typeof resRaw?.data === 'string' && resRaw.data.trim().startsWith('<')) {
              throw new Error('Facebook แจ้งเตือนข้อผิดพลาดกลับมาเป็นหน้า HTML (อาจจะติด Checkpoint, ถูกจำกัดสิทธิ์, หรือ Session หลุด) กรุณาล็อกอินและเข้าหน้าเบราว์เซอร์ Facebook ใหม่');
            }
            parsedRes = typeof resRaw?.data === 'string' ? JSON.parse(resRaw.data) : (resRaw?.data || resRaw);
          } catch (jsonErr: any) {
            if (jsonErr.message.includes('Facebook แจ้งเตือน')) {
              throw jsonErr;
            }
            throw new Error(`ไม่สามารถแกะข้อมูล JSON จาก Facebook ได้: ${jsonErr.message}`);
          }

          if (parsedRes?.errors && parsedRes.errors.length > 0) {
            throw new Error(parsedRes.errors[0].message || 'GraphQL Error occurred');
          } else {
            const createData = parsedRes?.data?.additional_profile_plus_create || parsedRes?.data?.page_create;

            if (createData?.name_error) {
              setStatus(`[${i + 1}/${namesList.length}] ❌ เกิดข้อผิดพลาด: ${createData.name_error}`);
              failCount++;
            } else if (createData?.error_msg) {
              setStatus(`[${i + 1}/${namesList.length}] ❌ เกิดข้อผิดพลาด: ${createData.error_msg}`);
              failCount++;
            } else if (createData?.page || createData?.additional_profile) {
              const createdProfile = createData.page || createData.additional_profile;
              setStatus(`[${i + 1}/${namesList.length}] ✅ สร้างเพจสำเร็จ: ${createdProfile.name} (ID: ${createdProfile.id})`);
              callSuccess = true;
              successCount++;

              // Record specific creation usage directly to DB on success
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                await fetch('/api/usage', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${currentSession.access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'auto_create', count: 1, target_type: 'page', target_id: createdProfile.id, target_name: createdProfile.name })
                });
                setUsageCount(prev => prev + 1); // update local state safely
              }
            } else {
              setStatus(`[${i + 1}/${namesList.length}] ❓ เกิดข้อผิดพลาด: ${JSON.stringify(parsedRes).substring(0, 150)}`);
              if (parsedRes?.error) {
                failCount++;
              } else {
                // Unknown format, maybe success? We'll count as fail to be safe
                failCount++;
              }
            }
          }
        } catch (callErr: any) {
          setStatus(`[${i + 1}/${namesList.length}] ❌ ไม่สามารถสร้างเพจ: "${pName}": ${callErr.message}`);
          failCount++;
        }

        // Wait for the specific delay before the next creation (if not the last one)
        if (i < namesList.length - 1) {
          setStatus(`รอ ${delaySeconds} วินาที เพื่อสร้างเพจถัดไป...`);
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
      }

      // Usage is already recorded individually above

      setStatus(`ระบบทำงานเสร็จสิ้น! สร้างเพจสำเร็จ: ${successCount} เพจ ล้มเหลว: ${failCount} เพจ`);
    } catch (e: any) {
      console.error(e);
      setStatus(`เกิดข้อผิดพลาด: ${e.message || 'ที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Auto Create Multiple Pages</h1>
          <p className="text-dark-300">
            สร้าง Facebook Page จำนวนมากๆ
          </p>
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
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">สร้างสูงสุด/วัน</span>
            <span className="text-sm font-bold text-white mt-1">
              {usageCount} <span className="text-dark-500 font-medium">/ {pkgLimit.toLocaleString()} เพจ</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">

          <FacebookBusinessSelector
            onAccountSelect={setSelectedBizAccount}
          />

          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-orange-500" />
              ตั้งค่าการสร้างเพจ
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-200">จำนวนเพจทั้งหมด (ที่อยู่ในลิสต์):</label>
                  <input
                    type="text"
                    value={pageNames.split('\n').filter(n => n.trim().length > 0).length}
                    disabled
                    className="input-primary w-full bg-dark-950 font-mono text-center opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-dark-200">Delay: <span className="text-orange-400">*</span></label>
                    <span className="text-[10px] text-dark-400 uppercase font-bold tracking-wider">โควต้า: {usageCount}/{pkgLimit}</span>
                  </div>
                  <input
                    type="number"
                    min={minDelay}
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(parseInt(e.target.value) || minDelay)}
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-dark-400">ขั้นต่ำ {minDelay} วินาที (คุณใช้แพ็กเกจ: {userPkg})</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">คำอธิบายเพจ: <span className="text-dark-500">(ไม่จำเป็น)</span></label>
                <input
                  type="text"
                  value={pageBio}
                  onChange={e => setPageBio(e.target.value)}
                  placeholder="This page was generated by UPFEEDTH"
                  className="input-primary w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-200">ลิสต์รายชื่อเพจ (1 บรรทัด ต่อ 1 ชื่อ) <span className="text-orange-400">*</span></label>
                  <button
                    onClick={generateNames}
                    className="text-xs px-3 py-1.5 rounded-lg bg-dark-800 text-orange-400 font-medium hover:bg-dark-700 transition"
                  >
                    สุ่มชื่อเพจ 100 ชื่อ(ภาษาอังกฤษ)
                  </button>
                </div>
                <textarea
                  value={pageNames}
                  onChange={e => setPageNames(e.target.value)}
                  placeholder="ป้อนชื่อเพจที่นี่..."
                  rows={8}
                  className="input-primary w-full text-sm leading-relaxed custom-scrollbar font-mono resize-y"
                />
              </div>
            </div>

            <button
              onClick={startCreation}
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg mt-8"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
              เริ่มสร้างเพจ
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          {/* Sub-Terminal Output */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl flex flex-col h-full min-h-[500px] overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-dark-800 bg-dark-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 relative">
                  {loading && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>}
                </div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">ผลลัพธ์การทำงาน</span>
              </div>
              <button
                onClick={handleCopyLog}
                disabled={logs.length === 0}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                title="คัดลอก"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
            </div>
            <div
              ref={logContainerRef}
              className="p-5 flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6] select-text bg-dark-950"
            >
              {logs.length === 0 ? (
                <div className="text-dark-600 flex flex-col items-center justify-center h-full gap-2">
                  <Type className="w-8 h-8 opacity-20" />
                  ระบบพร้อมทำงาน
                </div>
              ) : (
                logs.map((log, i) => {
                  const isErr = log.includes('❌') || log.includes('Error');
                  const isSuc = log.includes('✅') || log.includes('Success');
                  const isSys = log.includes('System') || log.includes('Session');
                  return (
                    <div key={i} className={`
                            ${isErr ? 'text-red-400 font-medium' : ''}
                            ${isSuc ? 'text-green-400' : ''}
                            ${isSys ? 'text-blue-400 font-medium' : ''}
                            ${!isErr && !isSuc && !isSys ? 'text-gray-300' : ''}
                            py-1 border-b border-dark-800/30 whitespace-pre-wrap break-words
                          `}>
                      <span className="text-dark-600 mr-2 opacity-50">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
