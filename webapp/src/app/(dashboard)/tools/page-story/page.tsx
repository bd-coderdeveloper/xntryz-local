'use client';

import { useState, useRef } from 'react';
import FacebookPageSelector from '@/components/FacebookPageSelector';
import { Loader2, Play, Copy, CheckCheck, Upload, Smartphone, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { fetchWebDTSGData } from '@/utils/facebook';

export default function PageStoryPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [targetPage, setTargetPage] = useState<any>(null);
  const [targetPageIdInput, setTargetPageIdInput] = useState('');
  
  const [swipeUpLink, setSwipeUpLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('th-TH')}] ${msg}`]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startPublish = async () => {
    if (!targetPage) {
      addLog('Error: กรุณาเลือกเพจที่ต้องการลงสตอรี่');
      return;
    }

    if (!selectedImage) {
      addLog('Error: กรุณาอัปโหลดรูปภาพสำหรับสตอรี่');
      return;
    }

    if (!swipeUpLink || !swipeUpLink.startsWith('http')) {
      addLog('Error: กรุณาใส่ลิงก์เว็บให้ถูกต้อง (ต้องขึ้นต้นด้วย http หรือ https)');
      return;
    }

    setLoading(true);
    const effectivePageId = targetPageIdInput || targetPage.id;
    addLog(`กำลังเตรียมไฟล์และอัปโหลดไปที่เพจ: ${targetPage.name}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('Error: กรุณาล็อกอินเข้าระบบก่อน');
        setLoading(false);
        return;
      }

      addLog(`[SYSTEM] กำลังอัปโหลดรูปภาพชั่วคราว...`);
      
      // 1. Upload to Supabase
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedImage);

      if (uploadError) {
        throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      addLog(`[SYSTEM] อัปโหลดรูปสำเร็จ! กำลังสั่งการผ่าน Extension...`);

      // 2. Call Graph API via PROXY_FETCH to upload unpublished photo from URL
      const uploadRes = await SendRequestToExtension('PROXY_FETCH', {
        url: `https://graph.facebook.com/v21.0/${effectivePageId}/photos`,
        method: 'POST',
        body: JSON.stringify({
          access_token: targetPage.access_token,
          published: false,
          url: publicUrl
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }) as any;

      const photoData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;

      if (photoData.error) {
        throw new Error(`Facebook API (Photos): ${photoData.error.message}`);
      }

      if (!photoData.id) {
        throw new Error(`ไม่สามารถอัปโหลดรูปภาพไปยังเพจได้`);
      }

      addLog(`[SYSTEM] โอนย้ายรูปภาพไปยังเพจสำเร็จ (Photo ID: ${photoData.id})`);
      addLog(`[SYSTEM] กำลังเตรียมข้อมูล GraphQL เพื่อเผยแพร่ลง Story...`);

      // Get fb_dtsg for GraphQL mutation
      const { fb_dtsg } = await fetchWebDTSGData();

      const variables = JSON.stringify({
        input: {
          audiences: [{ stories: { self: { target_id: effectivePageId } } }],
          audiences_is_complete: true,
          source: "WWW",
          call_to_action_data: {
            is_cta_share_post: true,
            link: swipeUpLink,
            page: effectivePageId,
            type: "SEE_MORE"
          },
          attachments: [{ photo: { id: photoData.id, overlays: [] } }],
          tracking: [null],
          actor_id: effectivePageId,
          client_mutation_id: Math.round(Math.random() * 100).toString()
        }
      });

      const gqlBody = new URLSearchParams({
        av: effectivePageId,
        __user: effectivePageId,
        __a: "1",
        fb_dtsg: fb_dtsg,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "StoriesCreateMutation",
        variables: variables,
        doc_id: "26770527039211553"
      }).toString();

      // 3. Call GraphQL via PROXY_FETCH to publish the story
      const storyRes = await SendRequestToExtension('PROXY_FETCH', {
        url: `https://www.facebook.com/api/graphql/`,
        method: 'POST',
        body: gqlBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }) as any;

      let rawData = storyRes.data;
      if (typeof rawData === 'string' && rawData.indexOf('for (;;);') === 0) {
        rawData = rawData.replace('for (;;);', '');
      }
      const storyData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      if (storyData.error || storyData.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(storyData.error || storyData.errors)}`);
      }

      if (storyData.data && storyData.data.story_create) {
        addLog(`[OK] โพสต์สตอรี่สำเร็จ!`);
        // Cleanup storage to save space
        supabase.storage.from('uploads').remove([filePath]).catch(() => {});
        
        // Reset form on success
        setSwipeUpLink('');
        removeImage();
      } else {
        addLog(`[FAIL] เกิดข้อผิดพลาด: ${JSON.stringify(storyData)}`);
      }
    } catch (e: any) {
      addLog(`[ERROR] ${e.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-orange-400" />
            Page Story & Link
          </h1>
          <p className="text-dark-300">อัปโหลดรูปภาพลงสตอรี่เพจ พร้อมปุ่มแนบลิงก์ (See More / Swipe Up) เพื่อเพิ่มยอดคนเข้าชมเว็บไซต์</p>
        </div>
      </div>

      <FacebookPageSelector onPageSelect={setTargetPage} />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 flex flex-col gap-6 h-fit shadow-xl">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-200">กำหนด ID ของเพจ (ไม่จำเป็น)</label>
            <input type="text" value={targetPageIdInput} onChange={(e) => setTargetPageIdInput(e.target.value)} placeholder="100080123456 เป็นต้น" className="input-primary w-full" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" /> รูปภาพสตอรี่
            </label>
            {!previewUrl ? (
              <div 
                className="w-full h-64 border-2 border-dashed border-dark-700 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all bg-dark-950/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-dark-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm text-dark-300 text-center">
                  <span className="text-orange-400 font-medium">คลิกเพื่ออัปโหลด</span><br/>
                  หรือลากไฟล์มาวางที่นี่
                </div>
                <div className="text-[10px] text-dark-500">รองรับ JPG, PNG สัดส่วน 9:16</div>
              </div>
            ) : (
              <div className="relative w-full h-80 rounded-2xl border border-dark-700 overflow-hidden bg-black flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className="h-full object-contain" />
                <button 
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-orange-400" /> ลิงก์เว็บปลายทาง (Swipe Up Link)
            </label>
            <input 
              type="url" 
              value={swipeUpLink} 
              onChange={(e) => setSwipeUpLink(e.target.value)} 
              placeholder="https://www.yourwebsite.com" 
              className="input-primary w-full text-sm py-3" 
            />
            <p className="text-[10px] text-dark-400">ผู้เข้าชมจะเห็นปุ่ม See More / Swipe up ด้านล่างของสตอรี่ และเมื่อกดจะถูกพามาที่ลิงก์นี้</p>
          </div>

          <div className="pt-4 border-t border-dark-800">
            <button 
              onClick={startPublish} 
              disabled={loading || !selectedImage || !swipeUpLink} 
              className="btn-primary w-full flex justify-center items-center gap-2 py-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {loading ? 'กำลังดำเนินการ...' : 'โพสต์สตอรี่ทันที'}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-dark-950 border border-dark-800 rounded-3xl p-6 flex flex-col shadow-inner relative overflow-hidden h-full min-h-[400px]">
          <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-dark-950 to-transparent z-10" />
          <div className="flex items-center justify-between mb-4 z-20 relative">
            <h3 className="text-sm font-bold text-dark-300 uppercase tracking-widest">บันทึกการทำงาน</h3>
            <button 
              onClick={() => { 
                if (logs.length !== 0) { 
                  navigator.clipboard.writeText(logs.join('\n')); 
                  setCopied(true); 
                  setTimeout(() => setCopied(false), 2000); 
                } 
              }} 
              disabled={logs.length === 0} 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 text-dark-100/90 pr-2 pb-4">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-dark-600">รอรับคำสั่ง...</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="animate-fade-in-up">
                  {l.includes('[OK]') ? (
                    <span className="text-green-400 font-bold">{l}</span>
                  ) : l.includes('[FAIL]') || l.includes('[ERROR]') || l.includes('Error:') ? (
                    <span className="text-red-400 font-bold">{l}</span>
                  ) : (
                    <span>
                      <span className="text-orange-500/70 mr-3 hidden sm:inline">{l.split('] ')[0] + ']'}</span>
                      {l.split('] ')[1]}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
