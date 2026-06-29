// PRODUCTION BY BD CODER & DEVELOPER

'use client';

import { useState, useRef, useEffect } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { Loader2, Wand2, UploadCloud, Image as ImageIcon, X, MonitorPlay, Copy, CheckCheck } from 'lucide-react';
import FacebookPageSelector from '@/components/FacebookPageSelector';
import { supabase } from '@/utils/supabase/client';
import FacebookAdAccountSelector from '@/components/FacebookAdAccountSelector';
import AdImageGalleryModal from '@/components/AdImageGalleryModal';
import FacebookPostPreview from '@/components/FacebookPostPreview';
import { FacebookPage, AdAccount, AdImage, fetchFacebookToken } from '@/utils/facebook';
const buildFormBody = (data: Record<string, any>) => {
  const params = new URLSearchParams();
  for (const key in data) {
    if (data[key] !== undefined) {
      params.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]));
    }
  }
  return params.toString();
};

interface FileUpload {
  file: File | null;
  previewUrl: string;
  hash?: string;
}

const BUTTON_TYPES = [
  // { label: 'Learn More', value: 'LEARN_MORE' },
  { label: 'Apply Now', value: 'APPLY_NOW' },
  { label: 'See More', value: 'SEE_MORE' },
  { label: 'Sign Up', value: 'SIGN_UP' },
  { label: 'Download', value: 'DOWNLOAD' },
  { label: 'Open Link', value: 'OPEN_LINK' },
  { label: 'Like Page', value: 'LIKE_PAGE' },
  { label: 'No Button', value: 'NO_BUTTON' },
];

export default function OneCardPage() {
  const [loading, setLoading] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [userPkg, setUserPkg] = useState('Free');

  useEffect(() => {
    const loadPkg = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserPkg(user.user_metadata?.package || 'Free');
      }
    };
    loadPkg();
  }, []);

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
  const [targetPages, setTargetPages] = useState<FacebookPage[]>([]);

  // Settings
  const [mode, setMode] = useState<'A' | 'B'>('B'); // B default
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(null);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [titleOne, setTitleOne] = useState('');
  const [titleTwo, setTitleTwo] = useState('');
  const [buttonType, setButtonType] = useState('SEE_MORE');
  const [displayLink, setDisplayLink] = useState('UPFEEDTH.COM');

  // Caption
  const [captionMode, setCaptionMode] = useState<'NONE' | 'CUSTOM'>('NONE');
  const [customCaption, setCustomCaption] = useState('');

  const isFreePkg = (userPkg || 'Free').toLowerCase() === 'free';
  const safeDisplayLink = isFreePkg ? 'UPFEEDTH.COM' : displayLink;

  // Images
  const [primaryImage, setPrimaryImage] = useState<FileUpload | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<FileUpload | null>(null);
  const [galleryOpenFor, setGalleryOpenFor] = useState<'PRIMARY' | 'SECONDARY' | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft Image
  useEffect(() => {
    const saved = localStorage.getItem('upfeed_onecard_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.destinationUrl) setDestinationUrl(parsed.destinationUrl);
        if (parsed.titleOne) setTitleOne(parsed.titleOne);
        if (parsed.titleTwo) setTitleTwo(parsed.titleTwo);
        if (parsed.buttonType) setButtonType(parsed.buttonType);
        if (parsed.displayLink) setDisplayLink(parsed.displayLink);
        if (parsed.captionMode) setCaptionMode(parsed.captionMode);
        if (parsed.customCaption) setCustomCaption(parsed.customCaption);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    setDraftLoaded(true);
  }, []);

  // Save draft Image
  useEffect(() => {
    if (!draftLoaded) return;
    const draft = {
      mode,
      destinationUrl,
      titleOne,
      titleTwo,
      buttonType,
      displayLink,
      captionMode,
      customCaption
    };
    localStorage.setItem('upfeed_onecard_draft', JSON.stringify(draft));
  }, [mode, destinationUrl, titleOne, titleTwo, buttonType, displayLink, captionMode, customCaption, draftLoaded]);

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const fileToWatermarkedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');

        ctx.drawImage(img, 0, 0);

        const watermarkText = 'UPFEEDTH';
        const fontSize = Math.max(20, Math.floor(img.width * 0.04));
        ctx.font = `bold ${fontSize}px sans-serif`;

        const padding = fontSize * 0.6;
        const textWidth = ctx.measureText(watermarkText).width;

        // Move to absolute center to survive Facebook's aggressive Link Ad Center-Cropping (1.91:1 ratio crops off top and bottom 25%)
        const x = (img.width - textWidth) / 2;
        const y = (img.height + fontSize * 0.4) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - padding, y - fontSize + padding / 2, textWidth + padding * 2, fontSize + padding);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(watermarkText, x, y);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToFacebookAdImages = async (base64File: string, adAccountId: string, token: string) => {
    // Clean token in case of quotes from localStorage
    const safeToken = token.replace(/["']/g, "").trim();

    // Extract base64 without prefix
    const pureBase64 = base64File.replace(/^data:image\/\w+;base64,/, '');

    const uploadResRaw = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://graph.facebook.com/v21.0/${adAccountId}/adimages?upfeedthcors=0`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bytes: pureBase64, access_token: safeToken })
    }) as any;

    const parsedRes = typeof uploadResRaw?.data === 'string' ? JSON.parse(uploadResRaw.data) : (uploadResRaw?.data || uploadResRaw);

    if (parsedRes?.error) {
      throw new Error("Failed to upload image natively to FB: " + parsedRes.error.message);
    }

    // Facebook returns
    const imagesObj = parsedRes.images || parsedRes;
    const firstKey = Object.keys(imagesObj)[0];
    const finalHash = imagesObj[firstKey]?.hash;

    if (!finalHash) {
      throw new Error("Facebook did not return an image hash! Response: " + JSON.stringify(parsedRes));
    }

    return finalHash;
  };

  const executeVariableSwap = (text: string) => {
    const today = new Date();
    let computed = text;
    computed = computed.replace(/\[Date\]/gi, today.toLocaleDateString());
    computed = computed.replace(/\[Time\]/gi, today.toLocaleTimeString());
    computed = computed.replace(/\[Year\]/gi, today.getFullYear().toString());
    computed = computed.replace(/\[Month\]/gi, (today.getMonth() + 1).toString());
    return computed;
  };

  const generateCard = async () => {
    if (targetPages.length === 0) return setStatus('Error: Please select at least one Target Page first.');
    if (!primaryImage) return setStatus('Error: Primary image is required.');
    if (!selectedAdAccount) return setStatus('Error: Please select an active Ad Account first.');
    if (!destinationUrl) return setStatus('Error: Destination URL is required.');

    setLoading(true);
    try {
      setStatus('กำลังประมวลผลรูปภาพ...');
      const token = await fetchFacebookToken();

      let primaryMediaPayload: Record<string, any> = {};
      if (primaryImage.hash) {
        primaryMediaPayload = { image_hash: primaryImage.hash };
      } else if (primaryImage.file) {
        setStatus('กำลังอัปโหลดรูปภาพ...');
        const primaryBase64 = isFreePkg ? await fileToWatermarkedBase64(primaryImage.file) : await fileToBase64(primaryImage.file);
        primaryMediaPayload = { image_hash: await uploadToFacebookAdImages(primaryBase64, selectedAdAccount.id, token) };
      }

      let secondaryMediaPayload: Record<string, any> = { image_hash: primaryMediaPayload.image_hash }; // Fallback to primary if unselected
      if (mode === 'B') {
        if (secondaryImage?.hash) {
          secondaryMediaPayload = { image_hash: secondaryImage.hash };
        } else if (secondaryImage?.file) {
          setStatus('กำลังอัปโหลดรูปภาพ...');
          const secBase64 = isFreePkg ? await fileToWatermarkedBase64(secondaryImage.file) : await fileToBase64(secondaryImage.file);
          secondaryMediaPayload = { image_hash: await uploadToFacebookAdImages(secBase64, selectedAdAccount.id, token) };
        }
      }

      setStatus(`กำลังเชื่อมต่อ API Facebook...`);

      const finalCaption = captionMode === 'NONE' ? " " : executeVariableSwap(customCaption);

      let linkData: Record<string, any> = {};

      if (mode === 'A') {
        linkData = {
          link: destinationUrl,
          message: finalCaption,
          name: titleOne || ' ',
          caption: safeDisplayLink.trim() || ' ',
          description: '   ',
          multi_share_optimized: true,
          multi_share_end_card: false,
          image_hash: primaryMediaPayload.image_hash
        };
      } else {
        linkData = {
          link: destinationUrl,
          message: finalCaption,
          multi_share_optimized: true,
          multi_share_end_card: false,
          child_attachments: [
            {
              link: destinationUrl,
              image_hash: primaryMediaPayload.image_hash,
              name: titleOne || ' ',
              description: '   '
            },
            {
              link: destinationUrl,
              image_hash: secondaryMediaPayload.image_hash || primaryMediaPayload.image_hash,
              name: titleTwo || ' ',
              description: '   '
            }
          ]
        };
      }

      for (let pIdx = 0; pIdx < targetPages.length; pIdx++) {
        const targetPage = targetPages[pIdx];
        const progressPrefix = targetPages.length > 1 ? `[${pIdx + 1}/${targetPages.length}] ` : '';
        const pageLinkData = JSON.parse(JSON.stringify(linkData));

        if (mode === 'A' && buttonType !== 'NO_BUTTON') {
          if (buttonType === 'LIKE_PAGE') {
            pageLinkData.call_to_action = {
              type: 'LIKE_PAGE',
              value: { page: targetPage.id }
            };
          } else {
            pageLinkData.call_to_action = {
              type: buttonType,
              value: { link: destinationUrl }
            };
          }
        }

        const payload = {
          object_story_spec: {
            page_id: targetPage.id,
            link_data: pageLinkData
          }
        };

        // 1. Create Ad Image
        setStatus(`${progressPrefix}กำลังสร้างโพสต์สำหรับเพจ: ${targetPage.name} ...`);
        const createRes = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/${selectedAdAccount.id}/adcreatives?access_token=${token}&fields=effective_object_story_id&upfeedthcors=0`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }) as any;

        const parsedCreate = typeof createRes?.data === 'string' ? JSON.parse(createRes.data) : (createRes?.data || createRes);

        if (parsedCreate?.error) {
          throw new Error(parsedCreate.error.message ? (parsedCreate.error.message + ' | Details: ' + JSON.stringify(parsedCreate.error)) : JSON.stringify(parsedCreate.error));
        }

        const creativeId = parsedCreate.id;
        let effectiveObjId = parsedCreate.effective_object_story_id;

        if (!creativeId) {
          throw new Error(`${progressPrefix}Facebook did not return a creative ID. Response: ` + JSON.stringify(parsedCreate));
        }

        if (!effectiveObjId) {
          setStatus(`${progressPrefix}รอ Facebook สร้าง Post ID...`);
          let attempts = 0;
          while (attempts < 10 && !effectiveObjId) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            setStatus(`${progressPrefix}รอ Facebook สร้าง Post ID... (Attempt ${attempts}/10)`);

            const getResRaw = await SendRequestToExtension('PROXY_FETCH', {
              url: `https://graph.facebook.com/v21.0/${creativeId}?fields=effective_object_story_id&access_token=${token}&upfeedthcors=0`,
              method: 'GET'
            }) as any;

            const parsedGet = typeof getResRaw?.data === 'string' ? JSON.parse(getResRaw.data) : (getResRaw?.data || getResRaw);
            effectiveObjId = parsedGet.effective_object_story_id;
          }

          if (!effectiveObjId) {
            throw new Error(`${progressPrefix}Creative constructed but NO post returned after 20 seconds! ID: ${creativeId}`);
          }
        }

        setStatus(`${progressPrefix}สร้างโพสต์สำเร็จ ID: ${effectiveObjId}`);

        // 2. PUBLISH
        setStatus(`${progressPrefix}กำลังเผยแพร่โพสต์...`);
        const pubResRaw = await SendRequestToExtension('PROXY_FETCH', {
          url: `https://graph.facebook.com/v21.0/${effectiveObjId}?access_token=${targetPage.access_token}&upfeedthcors=0`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_published: true })
        }) as any;

        const parsedPub = typeof pubResRaw?.data === 'string' ? JSON.parse(pubResRaw.data) : (pubResRaw?.data || pubResRaw);
        if (parsedPub?.error) {
          throw new Error(`${progressPrefix}` + (parsedPub.error.message || 'Facebook API Error during publish.'));
        }

        setStatus(`${progressPrefix}เผยแพร่โพสต์สำเร็จ ID: ${effectiveObjId}`);

        // Record Quota
        const { data: { session } } = await supabase.auth.getSession();
        fetch('/api/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ action: 'onecard', count: 1, target_type: 'page', target_id: targetPage.id, target_name: targetPage.name })
        }).catch(() => { });

        if (pIdx < targetPages.length - 1) {
          setStatus(`${progressPrefix}รอ 3 วินาที...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setStatus(`เผยแพร่โพสต์สำเร็จ ${targetPages.length} เพจ`);


    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: FileUpload) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setter({ file, previewUrl });
    }
  };

  const handleGallerySelect = (img: AdImage) => {
    if (galleryOpenFor === 'PRIMARY') setPrimaryImage({ file: null, previewUrl: img.url, hash: img.hash });
    if (galleryOpenFor === 'SECONDARY') setSecondaryImage({ file: null, previewUrl: img.url, hash: img.hash });
  };

  return (
    <div className="flex flex-col gap-6">
      <AdImageGalleryModal
        isOpen={galleryOpenFor !== null}
        onClose={() => setGalleryOpenFor(null)}
        adAccount={selectedAdAccount}
        onSelect={handleGallerySelect}
      />

      <div className="glass-panel p-8 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">One Card & Carousel Link Image Post</h1>
          <p className="text-dark-300">
            สร้างภาพปกโพสต์ลิงค์ขนาดใหญ่ พร้อมเข้าสู่เว็บไซต์
          </p>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-dark-800">
        <FacebookPageSelector
          multiSelect={true}
          onMultiPageSelect={setTargetPages}
          className="lg:pr-8"
        />
        <FacebookAdAccountSelector
          onAccountSelect={setSelectedAdAccount}
          className="pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center"
        />
      </div>

      {/* Logs Output */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl flex flex-col h-48 shrink-0 overflow-hidden shadow-xl mb-6">
        <div className="px-4 py-2 border-b border-dark-800 bg-dark-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 relative">
              {loading && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>}
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
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
          </button>
        </div>
        <div
          ref={logContainerRef}
          className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6] select-text bg-dark-950"
        >
          {logs.length === 0 ? (
            <div className="text-dark-600 flex items-center h-full justify-center">ระบบพร้อมใช้งาน</div>
          ) : (
            logs.map((log, i) => {
              const isErr = log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
              const isSuc = log.toLowerCase().includes('success') || log.toLowerCase().includes('complete');
              const isSys = log.includes('System') || log.includes('Start') || log.includes('Finish');
              const isTarget = log.includes('Page') || log.includes('Publish');
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

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Configuration */}
          <div className="space-y-6">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6">
              <div className="flex bg-dark-900 p-1 rounded-xl border border-dark-700 w-fit">
                <button
                  onClick={() => setMode('A')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'A' ? 'bg-orange-500 text-white shadow-md' : 'text-dark-300 hover:text-white'}`}
                >
                  แบบที่ 1 (One Card)
                </button>
                <button
                  onClick={() => setMode('B')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'B' ? 'bg-orange-500 text-white shadow-md' : 'text-dark-300 hover:text-white'}`}
                >
                  แบบที่ 2 (Carousel Card)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">ลิ้งค์ปลายทาง</label>
                <input
                  type="text"
                  value={destinationUrl}
                  onChange={e => setDestinationUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-primary w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">แสดงผลลิ้งค์ (ไม่จำเป็น)</label>
                <input
                  type="text"
                  value={safeDisplayLink}
                  onChange={e => {
                    if (!isFreePkg) setDisplayLink(e.target.value);
                  }}
                  disabled={isFreePkg}
                  placeholder="youtube.com เป็นต้น"
                  className={`input-primary w-full ${isFreePkg ? 'opacity-70 cursor-not-allowed bg-dark-900 border-orange-500/30 text-orange-400 font-bold' : ''}`}
                />
                {isFreePkg && <p className="text-xs text-orange-400">แพ็กเกจ ฟรี ถูกจำกัดให้แสดงผลได้เฉพาะ UPFEEDTH.COM เท่านั้น</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">ประเภทปุ่ม Call To Action</label>
                <select
                  value={buttonType}
                  onChange={e => setButtonType(e.target.value)}
                  className="input-primary w-full"
                >
                  {BUTTON_TYPES.map(bt => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">หัวข้อที่ 1 <span className="text-orange-400">*</span></label>
                <input
                  type="text"
                  value={titleOne}
                  onChange={e => setTitleOne(e.target.value)}
                  placeholder=""
                  className="input-primary w-full font-medium"
                />
              </div>

              {mode === 'B' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-200">หัวข้อที่ 2 <span className="text-orange-400">*</span></label>
                  <input
                    type="text"
                    value={titleTwo}
                    onChange={e => setTitleTwo(e.target.value)}
                    placeholder=""
                    className="input-primary w-full font-medium"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-dark-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-200">แคปชั่น</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCaptionMode('NONE')}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${captionMode === 'NONE' ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-400'}`}
                    >
                      ไม่มี
                    </button>
                    <button
                      onClick={() => setCaptionMode('CUSTOM')}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${captionMode === 'CUSTOM' ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-400'}`}
                    >
                      กำหนดเอง
                    </button>
                  </div>
                </div>

                {captionMode === 'CUSTOM' && (
                  <div className="space-y-2">
                    <textarea
                      value={customCaption}
                      onChange={e => setCustomCaption(e.target.value)}
                      placeholder="เขียนแคปชั่นของคุณเอง รองรับตัวแปร: [Date], [Time]..."
                      rows={4}
                      className="input-primary w-full text-sm leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-dark-400">ตัวแปร:</span>
                      <code className="text-orange-400 px-1.5 py-0.5 bg-dark-800 rounded">[Date]</code>
                      <code className="text-orange-400 px-1.5 py-0.5 bg-dark-800 rounded">[Time]</code>
                      <code className="text-orange-400 px-1.5 py-0.5 bg-dark-800 rounded">[Year]</code>
                      <code className="text-orange-400 px-1.5 py-0.5 bg-dark-800 rounded">[Month]</code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generateCard}
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
              เริ่มทำงาน
            </button>
          </div>

          {/* Media & Preview */}
          <div className="space-y-6 flex flex-col">

            {/* Live Preview */}
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2 text-sm"><MonitorPlay className="w-4 h-4 text-orange-500" /> ตัวอย่างโพสต์</h3>
              <div className="border border-dark-700/50 rounded-xl overflow-hidden bg-white/5 py-4">
                <FacebookPostPreview
                  pageName={targetPages[0]?.name}
                  pageAvatar={targetPages[0]?.picture_url}
                  mode={mode}
                  caption={captionMode === 'NONE' ? "" : executeVariableSwap(customCaption)}
                  primaryImageUrl={primaryImage?.previewUrl}
                  secondaryImageUrl={secondaryImage?.previewUrl}
                  titleOne={titleOne}
                  titleTwo={titleTwo}
                  displayLink={safeDisplayLink}
                  buttonType={buttonType}
                />
              </div>
            </div>

            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6 flex flex-col">
              <h3 className="text-white font-semibold flex mb-2">เลือกรูปภาพ</h3>

              {/* Primary Image */}
              <div className="space-y-2 flex-grow">
                <label className="text-sm font-medium text-dark-200">คลิกเพื่ออัปโหลดรูปภาพ <span className="text-orange-400">*</span></label>
                <input type="file" accept="image/*" className="hidden" ref={primaryInputRef} onChange={e => handleFileChange(e, setPrimaryImage)} />

                {!primaryImage ? (
                  <div className="space-y-3 mt-4">
                    <div
                      onClick={() => primaryInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-dark-700 bg-dark-900 rounded-xl flex items-center justify-center text-dark-400 hover:bg-dark-800 hover:border-orange-500/50 hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <UploadCloud className="w-10 h-10" />
                        <span className="text-sm font-medium">คลิกเพื่ออัปโหลดรูปภาพ</span>
                        <span className="text-xs text-dark-500">แนะนำรูปภาพขนาด 1200x628</span>
                      </div>
                    </div>
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-dark-800"></div>
                      <span className="flex-shrink-0 mx-4 text-dark-500 text-xs font-semibold uppercase">หรือ</span>
                      <div className="flex-grow border-t border-dark-800"></div>
                    </div>
                    <button
                      type="button"
                      disabled={userPkg === 'Free'}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!selectedAdAccount) return setStatus('Please select an Ad Account first');
                        console.log('Opening PRIMARY gallery mode for account:', selectedAdAccount.id);
                        setGalleryOpenFor('PRIMARY');
                      }}
                      className={`w-full py-3 border font-medium rounded-xl flex items-center justify-center gap-2 transition-colors ${userPkg === 'Free' ? 'bg-dark-950 border-dark-800 text-dark-500 cursor-not-allowed opacity-50' : 'bg-dark-800 hover:bg-dark-700 border-dark-700 text-orange-400'}`}
                    >
                      <ImageIcon className="w-4 h-4" /> คลังรูปภาพ Meta Business {userPkg === 'Free' && '(Pro)'}
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-dark-700 bg-black group mt-4">
                    <img src={primaryImage.previewUrl} className="w-full h-full object-contain" alt="Primary" />
                    {primaryImage.hash && (
                      <div className="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-green-400/50 flex items-center gap-1.5">
                        รูปภาพ Meta <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                    <button onClick={() => setPrimaryImage(null)} className="absolute top-2 right-2 bg-dark-950/80 p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Image for Mode B */}
              {mode === 'B' && (
                <div className="space-y-2 pt-6 border-t border-dark-800">
                  <label className="text-sm font-medium text-dark-200">รูปภาพปกที่ 2 <span className="text-dark-500">(ไม่จำเป็น)</span></label>
                  <p className="text-xs text-dark-400 leading-relaxed mb-3">เว้นว่างไว้เพื่อใช้รูปภาพซ้ำกัน +3</p>
                  <input type="file" accept="image/*" className="hidden" ref={secondaryInputRef} onChange={e => handleFileChange(e, setSecondaryImage)} />

                  {!secondaryImage ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => secondaryInputRef.current?.click()}
                        className="flex-1 h-14 border-2 border-dashed border-dark-700 bg-dark-900 rounded-xl flex items-center justify-center text-dark-400 hover:bg-dark-800 hover:border-orange-500/50 hover:text-orange-400 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UploadCloud className="w-5 h-5" />
                          <span className="text-sm font-medium">อัปโหลดรูปภาพ</span>
                        </div>
                      </div>
                      <span className="text-dark-500 text-xs font-semibold uppercase">หรือ</span>
                      <button
                        type="button"
                        disabled={userPkg === 'Free'}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!selectedAdAccount) return setStatus('Please select an Ad Account first');
                          console.log('Opening SECONDARY gallery mode for account:', selectedAdAccount.id);
                          setGalleryOpenFor('SECONDARY');
                        }}
                        className={`flex-1 h-14 border font-medium rounded-xl flex items-center justify-center gap-2 transition-colors ${userPkg === 'Free' ? 'bg-dark-950 border-dark-800 text-dark-500 cursor-not-allowed opacity-50' : 'bg-dark-800 hover:bg-dark-700 border-dark-700 text-orange-400'}`}
                      >
                        <ImageIcon className="w-4 h-4" /> คลังรูปภาพ {userPkg === 'Free' && '(Pro)'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-dark-700 bg-black group">
                      <img src={secondaryImage.previewUrl} className="w-full h-full object-contain" alt="Secondary" />
                      {secondaryImage.hash && (
                        <div className="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-green-400/50">รูปภาพ Meta</div>
                      )}
                      <button onClick={() => setSecondaryImage(null)} className="absolute top-2 right-2 bg-dark-950/80 p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {globalStatus && (
          <div className="mt-8 p-4 rounded-xl bg-dark-950 border border-dark-800 text-orange-200 font-mono text-sm shadow-inner break-words">
            <span className="text-orange-500 mr-2">&gt;</span> {globalStatus}
          </div>
        )}
      </div>
    </div>
  );
}