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

      addLog(`[SYSTEM] กำลังส่งรูปภาพผ่าน Extension (upload.facebook.com)...`);
      
      // Get fb_dtsg for GraphQL mutation
      const { fb_dtsg, actor_id } = await fetchWebDTSGData();

      // 1. Upload photo directly to upload.facebook.com
      const buffer = await selectedImage.arrayBuffer();
      const byteNumbers = Array.from(new Uint8Array(buffer));
      let val = 0;
      for (let i = 0; i < fb_dtsg.length; i++) val += fb_dtsg.charCodeAt(i);
      const jazoest = '2' + val.toString();

      const photoUrl = `https://upload.facebook.com/ajax/react_composer/attachments/photo/upload?av=${actor_id}&__user=${actor_id}&__a=1`;

      const uploadRes: any = await SendRequestToExtension('PROXY_UPLOAD', {
        url: photoUrl,
        headers: { 'Accept': '*/*' },
        formDataEntries: [
          { type: 'text', name: 'profile_id', value: actor_id },
          { type: 'text', name: 'fb_dtsg', value: fb_dtsg },
          { type: 'text', name: 'jazoest', value: jazoest },
          { type: 'text', name: 'source', value: '8' },
          {
            type: 'file',
            name: 'farr',
            data: byteNumbers,
            mimeType: selectedImage.type || 'image/jpeg',
            fileName: selectedImage.name || 'upload.jpg'
          }
        ]
      });

      if (uploadRes.error) throw new Error(`Facebook API (Upload): ${uploadRes.error}`);

      let cleanData = uploadRes.data;
      if (typeof cleanData === 'string') {
        cleanData = cleanData.replace('for (;;);', '').trim();
      }
      const photoData = typeof cleanData === 'string' ? JSON.parse(cleanData) : cleanData;

      if (photoData.error) {
        throw new Error(`Facebook API (Photos): ${photoData.error.errorSummary || JSON.stringify(photoData.error)}`);
      }

      const uploadedPhotoId = photoData.payload?.photoID || photoData.payload?.fbid;
      if (!uploadedPhotoId) {
        throw new Error(`ไม่สามารถอัปโหลดรูปภาพไปยังเพจได้: ${JSON.stringify(photoData)}`);
      }

      addLog(`[SYSTEM] โอนย้ายรูปภาพไปยังเพจสำเร็จ (Photo ID: ${uploadedPhotoId})`);
      addLog(`[SYSTEM] กำลังเตรียมข้อมูล GraphQL เพื่อเผยแพร่ลง Story...`);

      const variables = JSON.stringify({
        input: {
          audiences: [{ stories: { self: { target_id: effectivePageId } } }],
          audiences_is_complete: true,
          logging: { composer_session_id: crypto.randomUUID() },
          navigation_data: { attribution_id_v2: `StoriesCreateRoot.react,comet.stories.create,unexpected,${Date.now()},572486,,,;CometHomeRoot.react,comet.home,via_cold_start,${Date.now()},639081,4748854339,,` },
          source: "WWW",
          call_to_action_data: {
            link: swipeUpLink,
            type: "SEE_MORE"
          },
          attachments: [{ photo: { id: uploadedPhotoId.toString(), overlays: [] } }],
          tracking: [null],
          actor_id: effectivePageId,
          client_mutation_id: Math.round(Math.random() * 100).toString()
        }
      });

      // 3. Call GraphQL via PROXY_FETCH using manual multipart to bypass parsing bugs
      const boundary = '----WebKitFormBoundaryUpfeed' + Math.random().toString(36).substring(2);
      let gqlBody = `--${boundary}\r\nContent-Disposition: form-data; name="av"\r\n\r\n${effectivePageId}\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="__user"\r\n\r\n${actor_id}\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="__a"\r\n\r\n1\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="fb_dtsg"\r\n\r\n${fb_dtsg}\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="fb_api_caller_class"\r\n\r\nRelayModern\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="fb_api_req_friendly_name"\r\n\r\nStoriesCreateMutation\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="server_timestamps"\r\n\r\ntrue\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="doc_id"\r\n\r\n26770527039211553\r\n`;
      gqlBody += `--${boundary}\r\nContent-Disposition: form-data; name="variables"\r\n\r\n${variables}\r\n`;
      gqlBody += `--${boundary}--\r\n`;

      const storyRes = await SendRequestToExtension('PROXY_FETCH', {
        url: 'https://business.facebook.com/api/graphql/',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        bodyType: 'string',
        body: gqlBody
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
