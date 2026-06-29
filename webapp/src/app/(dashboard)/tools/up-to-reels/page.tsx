'use client';

import { useState, useRef, useEffect } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { Loader2, Wand2, X, AlertCircle, Building2, UserPlus, Type, Copy, CheckCheck, Video, UploadCloud, Link as LinkIcon, Trash2, Clock, Send, ImageIcon } from 'lucide-react';
import FacebookPageSelector from '@/components/FacebookPageSelector';
import { fetchWebDTSGData, BusinessAccount, FacebookPage } from '@/utils/facebook';
import { supabase } from '@/utils/supabase/client';

export default function UpToReels() {
  const [loading, setLoading] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);

  // Settings
  const [delaySeconds, setDelaySeconds] = useState<number>(20);
  const [captionMode, setCaptionMode] = useState<'CUSTOM' | 'FILENAME'>('CUSTOM');
  const [customCaption, setCustomCaption] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface VideoQueueItem {
    id: string;
    file?: File;
    blobUrl?: string;
    filename: string;
    source: 'LOCAL' | 'TIKTOK';
    status: 'IDLE' | 'DOWNLOADING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
    progress: number;
    errorMsg?: string;
    thumbnailFile?: File;
    thumbnailPreview?: string;
    isScheduled?: boolean;
    scheduleTime?: string;
  }

  const [queue, setQueue] = useState<VideoQueueItem[]>([]);

  // Limits
  const MAX_VIDEOS = 20;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const setStatus = (msg: string) => {
    setGlobalStatus(msg);
    if (msg) setLogs(prev => [...prev, msg]);
  };

  const handleCopyLog = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractVideoThumbnail = (file: File): Promise<{ file: File, url: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(2, video.duration / 2); // Get frame at 2 seconds or middle if shorter
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(video.src);
          return reject(new Error('No ctx'));
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.8);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          if (!blob) return reject(new Error('No blob'));
          resolve({ file: new File([blob], file.name + "_thumb.jpg", { type: 'image/jpeg' }), url });
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject();
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (queue.length + newFiles.length > MAX_VIDEOS) {
        alert(`เพิ่มได้สูงสุดแค่ ${MAX_VIDEOS} วิดีโอเท่านั้น`);
        return;
      }

      setStatus(`กำลังประมวลผลไฟล์และดึงรูปหน้าปกอัตโนมัติ...`);
      const newItems: VideoQueueItem[] = [];
      for (const f of newFiles) {
        let thumbFile, thumbUrl;
        try {
          const extracted = await extractVideoThumbnail(f);
          thumbFile = extracted.file;
          thumbUrl = extracted.url;
        } catch (err) {
          console.warn("Failed to extract thumbnail", err);
        }

        newItems.push({
          id: crypto.randomUUID(),
          file: f,
          filename: f.name,
          source: 'LOCAL',
          status: 'IDLE',
          progress: 0,
          thumbnailFile: thumbFile,
          thumbnailPreview: thumbUrl
        });
      }
      setQueue(prev => [...prev, ...newItems]);
      setStatus(`เพิ่มวิดีโอ จำนวน: ${newFiles.length} รายการแล้ว`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractTikTok = async () => {
    if (!tiktokUrl) return setStatus('Error: กรุณาใส่ลิ้งค์ TikTok');
    if (queue.length >= MAX_VIDEOS) return alert(`เพิ่มได้สูงสุดแค่ ${MAX_VIDEOS} วิดีโอเท่านั้น`);

    // Prevent profile URLs
    if (tiktokUrl.includes('@') && !tiktokUrl.includes('/video/')) {
      alert('❌ กรุณาใส่ "ลิงก์วิดีโอ" เท่านั้น (ไม่รองรับการใส่หน้าลิงก์โปรไฟล์)');
      return setStatus('❌ Error: ใส่ลิงก์โปรไฟล์มา ระบบต้องการลิงก์ของวิดีโอ');
    }

    setTiktokLoading(true);
    setStatus(`กำลังดึงขอมูล TikTok URL: ${tiktokUrl}`);
    try {
      // Use tikwm to extract data without CORS issues directly from frontend (tikwm allows cors)
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);
      const data = await res.json();

      if (data.code === 0 && data.data) {
        const playUrl = data.data.play;
        const title = data.data.title || `tiktok_${Date.now()}`;

        setQueue(prev => [...prev, {
          id: crypto.randomUUID(),
          blobUrl: playUrl, // Store remote URL, we will download it during process loop
          filename: `${title}.mp4`,
          source: 'TIKTOK',
          status: 'IDLE',
          progress: 0
        }]);
        setTiktokUrl('');
        setStatus(`✅ เพิ่มวิดีโอ จาก TikTok: ${title} สำเร็จ`);
      } else {
        throw new Error(data.msg || 'ไม่สามารถดึงข้อมูลได้');
      }
    } catch (e: any) {
      setStatus(`❌ TikTok Error: ${e.message}`);
    } finally {
      setTiktokLoading(false);
    }
  };

  const removeQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleThumbnailUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setQueue(q => q.map(item => item.id === id ? { ...item, thumbnailFile: file, thumbnailPreview: url } : item));
    }
  };

  const updateItemSchedule = (id: string, isScheduled: boolean) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, isScheduled, scheduleTime: q.scheduleTime || '' } : q));
  };

  const updateItemTime = (id: string, time: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, scheduleTime: time } : q));
  };

  const startReelUpload = async () => {
    if (queue.length === 0) return alert('กรุณาเพิ่มวิดีโอก่อน');
    if (!selectedPage) return alert('กรุณาเลือกเพจปลายทางก่อน');

    if (queue.some(item => item.isScheduled && !item.scheduleTime)) {
      return alert('กรุณาระบุเวลาโพสต์ให้ครบสำหรับวิดีโอที่คุณตั้งเวลาไว้');
    }

    // Check limit strictly
    if (queue.length > MAX_VIDEOS) {
      return alert(`จำนวนวิดีโอของคุณมี ${queue.length} รายการ ระบบจำกัดไม่เกิน ${MAX_VIDEOS} วิดีโอเพื่อความปลอดภัยของเพจ`);
    }

    setLoading(true);
    try {
      // setStatus('กำลังดึง Session Facebook (fb_dtsg)...');
      const authData = await fetchWebDTSGData();
      if (!authData.fb_dtsg || !authData.actor_id) {
        throw new Error('ไม่พบข้อมูล Session กรุณาล็อกอิน Facebook ใหม่');
      }

      // Execute Queue
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.status === 'SUCCESS') continue; // Skip finished items

        updateQueueStatus(item.id, 'UPLOADING', 0);
        setStatus(`[${i + 1}/${queue.length}] กำลังอัพโหลด: ${item.filename}`);

        try {
          await processReel(item, authData, selectedPage);
          successCount++;
          updateQueueStatus(item.id, 'SUCCESS', 100);
          setStatus(`[${i + 1}/${queue.length}] ✅ อัพโหลดเสร็จสิ้น: ${item.filename}`);
        } catch (e: any) {
          failCount++;
          updateQueueStatus(item.id, 'ERROR', 0, e.message);
          setStatus(`[${i + 1}/${queue.length}] ❌ อัพโหลดล้มเหลว (${item.filename}): ${e.message}`);
        }

        // Delay between reels (if not last)
        if (i < queue.length - 1) {
          setStatus(`รอ ${delaySeconds} วินาที ก่อนเริ่มโพสต์ถัดไป...`);
          await new Promise(r => setTimeout(r, delaySeconds * 1000));
        }
      }

      setStatus(`🎉 ทำงานเสร็จสมบูรณ์! สำเร็จ: ${successCount} ล้มเหลว: ${failCount}`);
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateQueueStatus = (id: string, status: VideoQueueItem['status'], progress: number, errorMsg?: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status, progress, errorMsg } : q));
  };


  // CORE UPLOAD PIPELINE
  const processReel = async (item: VideoQueueItem, authData: any, page: FacebookPage) => {
    let videoFileOrBlob: File | Blob;

    // 1. Resolve Binary File
    if (item.source === 'LOCAL' && item.file) {
      videoFileOrBlob = item.file;
    } else if (item.source === 'TIKTOK' && item.blobUrl) {
      setStatus(`  -> กำลังดาวน์โหลดไฟล์ MP4 ของ TikTok...`);
      // Warning: direct fetch to tikwm cdn might block CORS. If it does, we will use PROXY_FETCH.
      try {
        const res = await fetch(item.blobUrl);
        if (!res.ok) throw new Error('Download Failed');
        videoFileOrBlob = await res.blob();
      } catch (err) {
        setStatus(`  -> ⚠️ ติด CORS, เปลี่ยนไปโหลดผ่าน Extension Proxy`);
        // Fallback to proxy byte fetching
        // This is a placeholder logic for proxy fetching blobs if needed
        throw new Error('ไม่สามารถดาวน์โหลดวิดีโอจากเซิร์ฟเวอร์ TikTok ได้ (CORS/Proxy Error)');
      }
    } else {
      throw new Error('Invalid Video Item Source');
    }

    if (videoFileOrBlob.size === 0) throw new Error('ขนาดไฟล์ผิดพลาด (0 Bytes)');

    const fileSize = videoFileOrBlob.size;
    setStatus(`  -> ได้รับไฟล์สมบูรณ์ ขนาด: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // 1. init_upload (Initialize composer session)
    setStatus(`  -> สร้าง Video Composer Session...`);
    const initBoundary = '----WebKitFormBoundaryUpfeed' + Math.random().toString(36).substring(2);
    let initBody = `--${initBoundary}\r\nContent-Disposition: form-data; name="fb_dtsg"\r\n\r\n${authData.fb_dtsg}\r\n`;
    initBody += `--${initBoundary}\r\nContent-Disposition: form-data; name="__user"\r\n\r\n${authData.actor_id}\r\n`;
    initBody += `--${initBoundary}\r\nContent-Disposition: form-data; name="__a"\r\n\r\n1\r\n`;
    initBody += `--${initBoundary}--\r\n`;

    const initUrl = `https://business.facebook.com/video/composer/init_upload/?target_id=${page.id}&composer_entry_point_ref=cs_global_upload_reel&video_publisher_action_source[product]=creator_studio&video_publisher_action_source[feature]=cs_reel_composer&video_publisher_action_source[entry_point]=cs_global_upload_reel&av=${page.id}`;

    await SendRequestToExtension('PROXY_FETCH', {
      url: initUrl,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${initBoundary}` },
      bodyType: 'string',
      body: initBody
    });

    // 2. Fetch Video ID via /requests/start/
    setStatus(`  -> กำลังบีบอัดคลิปวิดีโอ...`);
    const boundary = '----WebKitFormBoundaryUpfeed' + Math.random().toString(36).substring(2);
    const waterfallId = Math.random().toString(36).substring(2, 13);

    let startBody = `--${boundary}\r\nContent-Disposition: form-data; name="fb_dtsg"\r\n\r\n${authData.fb_dtsg}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="av"\r\n\r\n${page.id}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="server_timestamps"\r\n\r\ntrue\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="waterfall_id"\r\n\r\n${waterfallId}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="__comet_req"\r\n\r\n11\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="target_id"\r\n\r\n${page.id}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="source"\r\n\r\ncomposer\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="composer_entry_point_ref"\r\n\r\nbiz_web_home\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="supports_chunking"\r\n\r\ntrue\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="supports_file_api"\r\n\r\ntrue\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="has_file_been_replaced"\r\n\r\nfalse\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="file_size"\r\n\r\n${fileSize}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="file_extension"\r\n\r\nmp4\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="partition_start_offset"\r\n\r\n0\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="partition_end_offset"\r\n\r\n${fileSize}\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="video_publisher_action_source[product]"\r\n\r\nbusiness_suite\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name="video_publisher_action_source[feature]"\r\n\r\ncs_reel_composer\r\n`;
    startBody += `--${boundary}\r\nContent-Disposition: form-data; name=" video_publisher_action_source[entry_point]"\r\n\r\nbiz_web_home\r\n`;
    startBody += `--${boundary}--\r\n`;

    const startUrl = `https://business.facebook.com/ajax/video/upload/requests/start/?av=${page.id}&__a=1`;

    // Call PROXY
    const startResRaw = await SendRequestToExtension('PROXY_FETCH', {
      url: startUrl,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      bodyType: 'string',
      body: startBody
    }) as any;

    let startRes;
    try {
      startRes = typeof startResRaw?.data === 'string' ? JSON.parse(startResRaw.data.replace('for (;;);', '')) : startResRaw?.data;
    } catch {
      throw new Error(`ไม่สามารถอ่านข้อมูล JSON จาก Facebook (start): ${typeof startResRaw?.data === 'string' ? startResRaw.data.substring(0, 150) : JSON.stringify(startResRaw)}`);
    }

    const videoId = startRes?.payload?.video_id;
    if (!videoId) {
      throw new Error(`สร้าง Session ไม่สำเร็จ (ไม่มี Video ID): ${JSON.stringify(startRes || startResRaw).substring(0, 2000)}`);
    }

    setStatus(`  -> ได้รับ Video ID: ${videoId}`);

    // Wait 1 second before rupload
    await new Promise(r => setTimeout(r, 1000));

    setStatus(`  -> เริ่มอัปโหลดไฟล์วิดีโอ...`);
    const clientRandom = Math.random().toString(36).substring(2, 34);
    const CHUNK_SIZE = 1048576 * 4; // 4MB chunks

    let durationMs = 15000;
    try {
      durationMs = await new Promise<number>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve(Math.round(video.duration * 1000));
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(videoFileOrBlob as Blob);
      });
      setStatus(`  -> ความยาววิดีโอถูกตรวจสอบแล้ว: ${durationMs} ms`);
    } catch {
      setStatus(`  -> ⚠️ ไม่สามารถตรวจสอบความยาววิดีโอได้ล่วงหน้า ใช้ค่าพื้นฐาน 15 วินาที`);
    }

    const chunkTokens: string[] = [];

    for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
      const endOffset = Math.min(offset + CHUNK_SIZE, fileSize);
      const chunkBlob = videoFileOrBlob.slice(offset, endOffset);

      const arrayBuffer = await chunkBlob.arrayBuffer();
      const numberArray = Array.from(new Uint8Array(arrayBuffer));

      setStatus(`  -> กำลังอัปโหลดวิดีโอ (${((endOffset / fileSize) * 100).toFixed(0)}%)...`);

      const ruploadUrl = `https://rupload-bkk1-1.up.facebook.com/fb_video/${clientRandom}-${offset}-${endOffset}?__user=${authData.actor_id}&__a=1&fb_dtsg=${authData.fb_dtsg}&reel_video=${videoId}`;

      const ruploadResRaw = await SendRequestToExtension('PROXY_FETCH', {
        url: ruploadUrl,
        method: 'POST',
        headers: {
          'offset': offset.toString(),
          'end_offset': endOffset.toString(),
          'x-entity-length': fileSize.toString(),
          'x-total-asset-size': fileSize.toString(),
          'x-entity-name': `${waterfallId}_${encodeURIComponent(item.filename)}`,
          'x_fb_video_waterfall_id': '',
          'content-type': 'text/javascript; charset=utf-8'
        },
        bodyType: 'arraybuffer',
        body: numberArray
      }) as any;

      const ruploadData = ruploadResRaw?.data || '';
      // Facebook's rupload sometimes returns a JSON object with stream_id, or simply the string itself depending on the endpoint variant.
      let chunkStr = ruploadData;
      try {
        const parsed = JSON.parse(ruploadData);
        if (parsed.stream_id) chunkStr = parsed.stream_id;
      } catch (e) {
        // Plain string
      }
      chunkTokens.push(chunkStr);
    }

    setStatus(`  -> กำลังประกอบไฟล์วิดีโอบนเซิร์ฟเวอร์...`);
    const receiveParams = new URLSearchParams();
    receiveParams.append("waterfall_id", waterfallId);
    receiveParams.append("target_id", page.id);
    receiveParams.append("video_id", videoId);
    receiveParams.append("source", "composer");
    receiveParams.append("composer_entry_point_ref", "cs_global_upload_reel");
    receiveParams.append("supports_chunking", "true");
    receiveParams.append("supports_upload_service", "true");
    receiveParams.append("partition_start_offset", "0");
    receiveParams.append("partition_end_offset", fileSize.toString());
    receiveParams.append("start_offset", "0");
    receiveParams.append("end_offset", fileSize.toString());
    receiveParams.append("fbuploader_video_file_chunk", chunkTokens.join('\n'));
    receiveParams.append("has_file_been_replaced", "false");
    receiveParams.append("__user", authData.actor_id);
    receiveParams.append("__a", "1");
    receiveParams.append("fb_dtsg", authData.fb_dtsg);
    receiveParams.append("__comet_req", "11");

    const receiveUrl = `https://business.facebook.com/ajax/video/upload/requests/receive/?av=${page.id}&__a=1&upfeedth_urlencoded&wall_reel_id=${videoId}`;
    await SendRequestToExtension('PROXY_FETCH', {
      url: receiveUrl,
      method: 'POST',
      bodyType: 'string',
      body: receiveParams.toString(),
      headers: {
        'Content-Type': `application/x-www-form-urlencoded`
      }
    });

    setStatus(`  -> อัปโหลดไฟล์เสร็จสิ้น ระบบกำลังเตรียมโพสต์...`);

    // 3.5 Optional Thumbnail Upload
    let thumbnailId = null;
    let thumbnailType = "generated_default";

    if (item.thumbnailFile) {
      setStatus(`  -> กำลังอัปโหลดหน้าปกวิดีโอ...`);
      try {
        const photoBoundary = '----WebKitFormBoundaryUpfeedPhoto' + Math.random().toString(36).substring(2);
        const photoUrl = `https://upload-business.facebook.com/ajax/react_composer/attachments/photo/upload?av=${page.id}&__a=1&__user=${authData.actor_id}&fb_dtsg=${authData.fb_dtsg}`;

        const enc = new TextEncoder();

        // Headers
        let preStr = `--${photoBoundary}\r\n`;
        preStr += `Content-Disposition: form-data; name="source"\r\n\r\n8\r\n`;
        preStr += `--${photoBoundary}\r\n`;
        preStr += `Content-Disposition: form-data; name="profile_id"\r\n\r\n${page.id}\r\n`;
        preStr += `--${photoBoundary}\r\n`;
        preStr += `Content-Disposition: form-data; name="farr"; filename="${encodeURIComponent(item.thumbnailFile.name)}"\r\n`;
        preStr += `Content-Type: ${item.thumbnailFile.type || 'image/jpeg'}\r\n\r\n`;

        const preBytes = enc.encode(preStr);

        // File Content
        const fileBuf = await item.thumbnailFile.arrayBuffer();
        const fileBytes = new Uint8Array(fileBuf);

        // Boundary End
        const postStr = `\r\n--${photoBoundary}--\r\n`;
        const postBytes = enc.encode(postStr);

        // Combine into Uint8Array
        const totalLength = preBytes.length + fileBytes.length + postBytes.length;
        const combined = new Uint8Array(totalLength);
        combined.set(preBytes, 0);
        combined.set(fileBytes, preBytes.length);
        combined.set(postBytes, preBytes.length + fileBytes.length);

        const numberArray = Array.from(combined);

        const photoResRaw = await SendRequestToExtension('PROXY_FETCH', {
          url: photoUrl,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${photoBoundary}`
          },
          bodyType: 'arraybuffer',
          body: numberArray
        }) as any;

        const photoRes = typeof photoResRaw?.data === 'string' ? JSON.parse(photoResRaw.data.replace('for (;;);', '')) : photoResRaw?.data;
        // The API returns payload > fbid
        if (photoRes?.payload?.fbid) {
          thumbnailId = photoRes.payload.fbid.toString();
          thumbnailType = "custom";
          setStatus(`  -> ✅ อัปโหลดหน้าปกสำเร็จ: ${thumbnailId}`);
        } else if (photoRes?.payload?.photo_id || photoRes?.payload?.media_id) {
          thumbnailId = (photoRes.payload.photo_id || photoRes.payload.media_id).toString();
          thumbnailType = "custom";
          setStatus(`  -> ✅ อัปโหลดหน้าปกสำเร็จ: ${thumbnailId}`);
        } else {
          setStatus(`  -> ⚠️ ไม่สามารถอัปโหลดปกได้ ใช้ปกสุ่มแทน`);
        }
      } catch (err: any) {
        setStatus(`  -> ⚠️ ขัดข้องในการอัปโหลดปก: ${err.message}`);
      }
    }

    // Wait a brief moment for FB backend processing
    await new Promise(r => setTimeout(r, 2000));

    // 4. GraphQL Publish
    const finalCaption = captionMode === 'FILENAME' ? item.filename.replace('.mp4', '') : customCaption;
    const scheduleUnix = item.isScheduled && item.scheduleTime ? Math.floor(new Date(item.scheduleTime).getTime() / 1000) : null;

    const clientMutationId = Math.random().toString(36).substring(2, 13);
    const graphqlVariables = {
      input: {
        client_mutation_id: clientMutationId,
        actor_id: page.id,
        video_id: videoId,
        should_skip_encoding: false,
        should_enforce_video_editor_path: false,
        metadata: {
          title: finalCaption,
          enable_remix: true,
          is_draft: false,
          is_scheduled: !!(item.isScheduled && item.scheduleTime),
          scheduled_publish_time: scheduleUnix || 1669799926
        },
        trim_timestamps: null,
        reframe_aspect_ratio: null,
        client_info: {
          feature: "CS_REEL_COMPOSER",
          entry_point: "biz_web_home_create_reel",
          product: "BUSINESS_SUITE",
          client_session_id: clientMutationId
        },
        reframe_aggressiveness: 1,
        video_collaboration: { collaborators: [] },
        video_thumbnail_file_id: thumbnailId,
        thumbnail_type: thumbnailType,
        audio_enhancement: { processing: 0 },
        music_overlay: null,
        placements: ["FACEBOOK_REEL"],
        manual_reframe: null,
        audio_mixing: { original_volume: 1, music_volume: 1 },
        targeted_privacy_data: null,
        overlay: [],
        main_track: [
          {
            video_id: videoId,
            original_resolution: { height: 1280, width: 720 }
          }
        ],
        original_resolution: { height: 1280, width: 720 },
        is_receiving_stars_enabled: true,
        linked_vod_data: null,
        videolist: null,
        hashtags_logging_data: { added_hashtags: [] },
        fb_monetization_data: { ads_enabled: false, stars_enabled: false },
        embeddable: true,
        total_video_duration: durationMs
      }
    };

    const gqlBoundary = '----WebKitFormBoundaryUpfeed' + Math.random().toString(36).substring(2);
    let gqlBody = `--${gqlBoundary}\r\nContent-Disposition: form-data; name="fb_dtsg"\r\n\r\n${authData.fb_dtsg}\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="__req"\r\n\r\n9z\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="__a"\r\n\r\n1\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="__comet_req"\r\n\r\n11\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="av"\r\n\r\n${page.id}\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="variables"\r\n\r\n${JSON.stringify(graphqlVariables)}\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="server_timestamps"\r\n\r\ntrue\r\n`;
    gqlBody += `--${gqlBoundary}\r\nContent-Disposition: form-data; name="doc_id"\r\n\r\n5807526529347282\r\n`;
    gqlBody += `--${gqlBoundary}--\r\n`;

    const pubResRaw = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://business.facebook.com/api/graphql/`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${gqlBoundary}`
      },
      bodyType: 'string',
      body: gqlBody
    }) as any;

    const rawString = typeof pubResRaw?.data === 'string' ? pubResRaw.data.split('\n')[0] : JSON.stringify(pubResRaw?.data || {});
    let pubRes;
    try {
      pubRes = typeof pubResRaw?.data === 'string' ? JSON.parse(pubResRaw.data.split('\n')[0]) : pubResRaw?.data;
    } catch {
      throw new Error(`ไม่สามารถอ่านข้อมูล GraphQL: ${rawString.substring(0, 500)}`);
    }

    if (pubRes?.errors || pubRes?.error) {
      throw new Error(`อัพโหลดล้มเหลว: ${pubRes?.errors?.[0]?.message || pubRes?.error?.message || JSON.stringify(pubRes)}`);
    }

    setStatus(`  -> ✅ ส่งคำสั่ง Reel ${videoId} สำเร็จ! [Meta: ${JSON.stringify(pubRes?.data || pubRes).substring(0, 150)}]`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-8 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">UP TO REELS (ยังไม่สามารถใช้งานได้)</h1>
          <p className="text-dark-300">
            อัปโหลด Reels ทีละหลายไฟล์ และรองรับการดึงวิดีโอจาก TikTok
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
          <Video className="w-7 h-7 text-orange-400" />
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 gap-6 divide-y lg:divide-y-0 divide-dark-800">
        <FacebookPageSelector
          onPageSelect={setSelectedPage}
          className=""
        />
      </div>

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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-800/80 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors text-[10px] font-medium"
            title="คัดลอก Logs"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? <span className="text-green-400 text-[10px]">คัดลอกแล้ว!</span> : <span className="text-[10px]">คัดลอก</span>}
          </button>
        </div>
        <div
          ref={logContainerRef}
          className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6] select-text bg-dark-950"
        >
          {logs.length === 0 ? (
            <div className="text-dark-600 flex flex-col items-center justify-center h-full gap-2">
              <Type className="w-8 h-8 opacity-20" />
              ระบบพร้อมทำงาน
            </div>
          ) : (
            logs.map((log, i) => {
              const isErr = log.includes('❌') || log.includes('Error') || log.includes('Failed');
              const isSuc = log.includes('✅') || log.includes('Success') || log.includes('สำเร็จ');
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

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6">

              <h3 className="text-white font-semibold flex items-center gap-2 mb-4 border-b border-dark-800 pb-3">
                <Wand2 className="w-5 h-5 text-orange-500" /> ตั้งค่า
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Delay:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(Math.max(5, Math.min(50, parseInt(e.target.value) || 20)))}
                    className="input-primary w-24"
                  />
                  <span className="text-xs text-dark-400 font-medium">(แนะนำ: 5-50 วินาที)</span>
                </div>
              </div>



              <div className="pt-4 border-t border-dark-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-200">แคปชั่น</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCaptionMode('FILENAME')}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${captionMode === 'FILENAME' ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-400'}`}
                    >
                      ใช้ชื่อตามไฟล์
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
                      placeholder="ใส่แคปชั่นที่คุณต้องการ..."
                      rows={4}
                      className="input-primary w-full text-sm leading-relaxed block"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={startReelUpload}
              disabled={loading || queue.length === 0}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg items-center"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              เริ่มอัพโหลด Reels
            </button>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6 flex flex-col">
              <h3 className="text-white font-semibold flex mb-2 items-center justify-between">
                <span>อัพโหลดวิดีโอ</span>
                <span className="text-xs text-orange-400">({queue.length}/{MAX_VIDEOS})</span>
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-4 w-4 text-dark-400" />
                    </div>
                    <input
                      type="text"
                      value={tiktokUrl}
                      onChange={e => setTiktokUrl(e.target.value)}
                      placeholder="ลิ้งค์ TikTok"
                      className="input-primary w-full pl-10"
                    />
                  </div>
                  <button
                    onClick={extractTikTok}
                    disabled={tiktokLoading}
                    className="px-6 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {tiktokLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ดึงข้อมูล'}
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="h-px bg-dark-800 flex-1"></div>
                  <span className="text-xs text-dark-500 font-bold uppercase">หรือ</span>
                  <div className="h-px bg-dark-800 flex-1"></div>
                </div>

                <div>
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-dark-700 bg-dark-900 rounded-xl flex items-center justify-center text-dark-400 hover:bg-dark-800 hover:border-orange-500/50 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-8 h-8" />
                      <span className="text-sm font-medium">คลิกเพื่ออัปโหลด สามารถเลือกได้หลายไฟล์</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex flex-col bg-dark-900 border border-dark-700/50 rounded-lg p-3 relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="shrink-0 group-hover:scale-105 transition-transform">
                        <label className="cursor-pointer block relative w-16 h-16 rounded overflow-hidden bg-dark-950 border border-dark-700 flex items-center justify-center hover:border-orange-500">
                          {item.thumbnailPreview ? (
                            <img src={item.thumbnailPreview} className="w-full h-full object-cover" alt="Thumb" />
                          ) : (
                            <div className="text-xs text-dark-500 text-center flex flex-col items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-[9px]">ใส่ปก</span>
                            </div>
                          )}
                          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleThumbnailUpload(item.id, e)} />
                        </label>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center py-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs font-mono font-bold text-dark-500 w-5">{idx + 1}.</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.source === 'TIKTOK' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {item.source}
                          </span>
                          <span className="text-sm text-dark-200 truncate pr-4" title={item.filename}>{item.filename}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${item.status === 'SUCCESS' ? 'text-green-400' :
                            item.status === 'ERROR' ? 'text-red-400' :
                              item.status === 'UPLOADING' ? 'text-orange-400' : 'text-dark-500'
                            }`}>
                            {item.status} {item.status === 'UPLOADING' && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                          </span>
                        </div>

                        {item.status === 'IDLE' && (
                          <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-dark-800/50">
                            <label className="flex items-center gap-1.5 text-xs text-dark-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!item.isScheduled}
                                onChange={(e) => updateItemSchedule(item.id, e.target.checked)}
                                className="w-3.5 h-3.5 rounded appearance-none border border-orange-500 bg-dark-800 checked:bg-orange-500 cursor-pointer form-tick flex-shrink-0"
                              />
                              <Clock className="w-3.5 h-3.5 text-orange-400" /> ตั้งเวลาล่วงหน้า
                            </label>
                            {item.isScheduled && (
                              <input
                                type="datetime-local"
                                value={item.scheduleTime || ''}
                                onChange={(e) => updateItemTime(item.id, e.target.value)}
                                className="input-primary py-0.5 px-2 text-[10px] w-full max-w-[150px] h-7"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex pt-1">
                        {item.status === 'IDLE' && (
                          <button onClick={() => removeQueue(item.id)} className="text-dark-500 hover:text-red-400 transition-colors p-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {item.errorMsg && <div className="text-[10px] text-red-500 mt-2 p-2 bg-red-500/10 rounded">{item.errorMsg}</div>}
                  </div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-6 text-dark-500 text-sm font-medium">ไม่มีวิดีโอในคิว...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}