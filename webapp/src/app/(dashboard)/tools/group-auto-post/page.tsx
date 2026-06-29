'use client';

import { useState, useRef, useEffect } from 'react';
import { SendRequestToExtension } from '@/utils/extensionBridge';
import { Loader2, Send, UploadCloud, X, Play, Image as ImageIcon, Settings2, Copy, CheckCheck, Type } from 'lucide-react';
import FacebookGroupSelector from '@/components/FacebookGroupSelector';
import { supabase } from '@/utils/supabase/client';
import { FacebookGroup, fetchFacebookToken, fetchWebDTSGData } from '@/utils/facebook';
import { fetchSystemQuotas, normalizePackageName } from '@/utils/quotas';

interface FileUpload {
  file: File | null;
  previewUrl: string;
  type: 'image' | 'video';
  hash?: string;
  uploadedId?: string; // ID returned from Graph API
}

export default function GroupAutoPostPage() {
  const [loading, setLoading] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [targetGroups, setTargetGroups] = useState<FacebookGroup[]>([]);
  const [postMode, setPostMode] = useState<'TEXT' | 'PHOTO' | 'VIDEO'>('PHOTO');
  const [userPackage, setUserPackage] = useState<'FREE' | 'PRO' | 'PREMIUM'>('FREE');
  const [packageLimits, setPackageLimits] = useState({ maxGroups: 5, minDelay: 10 });
  const [usage, setUsage] = useState<any>(null);
  const [firstComment, setFirstComment] = useState('');
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    async function loadUserPackage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.package) {
        const pkgRaw = user.user_metadata.package;
        const pkg = normalizePackageName(pkgRaw);
        setUserPackage(pkg.toUpperCase() as 'FREE' | 'PRO' | 'PREMIUM');

        const allQuotas = await fetchSystemQuotas();
        const stats = allQuotas[pkg].group_post;

        setPackageLimits({ maxGroups: stats.quota, minDelay: stats.delay });
        setDelaySeconds(stats.delay);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) {
          const fetched = await res.json();
          if (fetched.success) setUsage(fetched.data);
        }
      }
    }
    loadUserPackage();
  }, []);

  const getPackageLimits = () => packageLimits;

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [caption, setCaption] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(10);

  const [mediaFiles, setMediaFiles] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        const isVideo = file.type.startsWith('video/');
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          type: isVideo ? 'video' : 'image' as 'video' | 'image'
        };
      });

      if (postMode === 'VIDEO') {
        // Video mode usually supports single video per post on generic graph api
        setMediaFiles([newFiles[0]]);
      } else {
        setMediaFiles(prev => [...prev, ...newFiles.filter(f => f.type === 'image')]);
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert File to Base64 String
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Fetch User's Pages to use as Staging Ground
  const fetchLocalAdminPages = async (token: string) => {
    try {
      const res = await SendRequestToExtension('PROXY_FETCH', {
        url: `https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`,
        method: 'GET'
      });
      const parsed = typeof (res as any).data === 'string' ? JSON.parse((res as any).data) : (res as any).data;
      if (parsed && parsed.data) return parsed.data;
      return [];
    } catch {
      return [];
    }
  };

  const uploadPhotoToGraphViaExtension = async (fileObj: File, actorId: string, dtsg: string): Promise<string> => {
    const buffer = await fileObj.arrayBuffer();
    const byteNumbers = Array.from(new Uint8Array(buffer));

    let val = 0;
    for (let i = 0; i < dtsg.length; i++) val += dtsg.charCodeAt(i);
    const jazoest = '2' + val.toString();

    const url = `https://upload.facebook.com/ajax/react_composer/attachments/photo/upload?av=${actorId}&__user=${actorId}&__a=1`;

    const res: any = await SendRequestToExtension('PROXY_UPLOAD', {
      url,
      headers: { 'Accept': '*/*' },
      formDataEntries: [
        { type: 'text', name: 'profile_id', value: actorId },
        { type: 'text', name: 'fb_dtsg', value: dtsg },
        { type: 'text', name: 'jazoest', value: jazoest },
        { type: 'text', name: 'source', value: '8' },
        {
          type: 'file',
          name: 'farr',
          data: byteNumbers,
          mimeType: fileObj.type || 'image/jpeg',
          fileName: fileObj.name || 'upload.jpg'
        }
      ]
    });

    if (res.error) throw new Error(res.error);

    let cleanData = res.data;
    if (typeof cleanData === 'string') {
      cleanData = cleanData.replace('for (;;);', '').trim();
      const parsed = JSON.parse(cleanData);
      if (parsed.error) throw new Error(parsed.error.errorSummary || parsed.error.errorDescription || JSON.stringify(parsed.error));
      // Some FB endpoints return fbid, others return photoID
      const uploadedId = parsed.payload?.photoID || parsed.payload?.fbid;
      if (uploadedId) return uploadedId.toString();

      throw new Error('Unknown response: ' + cleanData);
    }

    // In case the extension already parsed JSON
    const uploadedId = cleanData?.payload?.photoID || cleanData?.payload?.fbid;
    if (uploadedId) return uploadedId.toString();

    return '';
  };

  const uploadVideoViaWebEmulation = async (fileObj: File, targetId: string, actorId: string, dtsg: string, token: string): Promise<string> => {
    const buffer = await fileObj.arrayBuffer();
    const byteNumbers = Array.from(new Uint8Array(buffer));
    const fileSize = fileObj.size;
    const fileName = fileObj.name || "video.mp4";
    const waterfallId = Math.random().toString(36).substring(2, 13);

    let val = 0;
    for (let i = 0; i < dtsg.length; i++) val += dtsg.charCodeAt(i);
    const jazoest = '2' + val.toString();

    // PHASE 1: START
    const startPayload = new URLSearchParams({
      fb_dtsg: dtsg,
      server_timestamps: "true",
      waterfall_id: waterfallId,
      target_id: targetId, // Use the real target group/page ID
      source: "composer",
      composer_entry_point_ref: "group",
      supports_chunking: "true",
      supports_file_api: "true",
      file_size: fileSize.toString(),
      file_extension: "mp4",
      partition_start_offset: "0",
      partition_end_offset: fileSize.toString(),
      jazoest: jazoest,
      __a: "1",
      __user: actorId
    }).toString();

    const startUrl = `https://business.facebook.com/ajax/video/upload/requests/start/?__a=1`;
    const startRes: any = await SendRequestToExtension('PROXY_FETCH', {
      url: startUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: startPayload
    });

    if (startRes.error) throw new Error("Phase 1 Failed: " + startRes.error);

    let startData = startRes.data;
    if (typeof startData === 'string') {
      startData = startData.replace('for (;;);', '').trim();
      try {
        startData = JSON.parse(startData);
      } catch (e: any) {
        throw new Error(`Phase 1 Start API returned HTML/Invalid JSON: ${startData.substring(0, 100)}...`);
      }
    }
    if (startData.error) throw new Error("Phase 1 API Error: " + (startData.error.errorSummary || JSON.stringify(startData.error)));

    const videoId = startData?.payload?.video_id;
    if (!videoId) throw new Error("Phase 1 didn't return video_id: " + JSON.stringify(startData));

    // In web endpoints, usually there's an upload_session_id. If missing, fallback to video_id.
    const uploadSessionId = startData?.payload?.upload_session_id || videoId;
    const uploadDomain = startData?.payload?.upload_domain || "rupload.facebook.com";

    // PHASE 2: TRANSFER
    const transferUrl = `https://${uploadDomain}/fb_video/${uploadSessionId}-0-${fileSize}?__user=${actorId}&__a=1&fb_dtsg=${dtsg}`;
    const transferRes: any = await SendRequestToExtension('PROXY_FETCH', {
      url: transferUrl,
      method: 'POST',
      headers: {
        "offset": "0",
        "start_offset": "0",
        "end_offset": fileSize.toString(),
        "x-entity-name": encodeURIComponent(fileName),
        "x-entity-length": fileSize.toString(),
        "x-total-asset-size": fileSize.toString(),
        "x_fb_video_waterfall_id": waterfallId
      },
      bodyType: "arraybuffer", // Important to keep it binary
      body: byteNumbers
    });

    if (transferRes.error) throw new Error(`Phase 2 Failed: ${transferRes.error} | StartData payload was: ${JSON.stringify(startData?.payload || {})}`);

    let transferStr = transferRes.data;
    if (typeof transferStr === 'string') {
      if (transferStr.includes('for (;;);')) transferStr = transferStr.replace('for (;;);', '').trim();
      try {
        transferStr = JSON.parse(transferStr);
      } catch (e) {
        if (transferStr.trim().startsWith('<')) {
          throw new Error(`Phase 2 Transfer API returned HTML/Invalid JSON: ${transferStr.substring(0, 100)}...`);
        }
      }
    }

    // Attempt to extract chunk string handle
    let chunkString = "";
    if (typeof transferStr === 'string') {
      chunkString = transferStr;
    } else if (transferStr?.payload) {
      chunkString = typeof transferStr.payload === 'string' ? transferStr.payload : JSON.stringify(transferStr.payload);
    } else if (transferStr?.h || transferStr?.handle) {
      chunkString = transferStr.h || transferStr.handle;
    }

    if (!chunkString) {
      console.warn("Missing fileHandle in Phase 2, relying on fallback format.");
      chunkString = JSON.stringify({ video_id: videoId.toString(), start_offset: 0, end_offset: fileSize });
    }

    // PHASE 3: RECEIVE
    const receivePayload = new URLSearchParams({
      waterfall_id: waterfallId,
      target_id: targetId,
      video_id: videoId.toString(),
      source: "composer",
      composer_entry_point_ref: "group",
      supports_chunking: "true",
      supports_upload_service: "true",
      partition_start_offset: "0",
      partition_end_offset: fileSize.toString(),
      start_offset: "0",
      end_offset: fileSize.toString(),
      fbuploader_video_file_chunk: chunkString,
      has_file_been_replaced: "false",
      jazoest: jazoest,
      __a: "1",
      __user: actorId,
      fb_dtsg: dtsg
    }).toString();

    const receiveRes: any = await SendRequestToExtension('PROXY_FETCH', {
      url: `https://business.facebook.com/ajax/video/upload/requests/receive/?av=${actorId}&__a=1`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: receivePayload
    });

    if (receiveRes.error) throw new Error("Phase 3 Failed: " + receiveRes.error);

    let receiveData = receiveRes.data;
    if (typeof receiveData === 'string') {
      receiveData = receiveData.replace('for (;;);', '').trim();
      try {
        receiveData = JSON.parse(receiveData);
      } catch (e: any) {
        throw new Error(`Phase 3 Receive API returned HTML/Invalid JSON: ${receiveData.substring(0, 100)}...`);
      }
    }
    if (receiveData.error) throw new Error("Phase 3 API Error: " + (receiveData.error.errorSummary || JSON.stringify(receiveData.error)));

    // Wait for the video ID to fully commit
    return videoId.toString();
  };

  const executeAutoPost = async () => {
    isCancelledRef.current = false;
    const limits = getPackageLimits();

    if (targetGroups.length === 0) return setStatus('Error: กรุณาเลือกกลุ่มอย่างน้อย 1 กลุ่ม');

    // [LIVE QUOTA CHECK]
    let currentUsage = usage?.group_auto_posts_count || 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) {
          const fetched = await res.json();
          if (fetched.success) {
            setUsage(fetched.data);
            currentUsage = fetched.data.group_auto_posts_count || 0;
          }
        }
      }
    } catch (e) { }

    const remaining = limits.maxGroups - currentUsage;
    if (remaining <= 0) {
      return setStatus(`Error: โควต้าใช้งานรายวันของคุณเต็มแล้ว (${limits.maxGroups}/${limits.maxGroups})`);
    }

    let processGroups = targetGroups;
    if (processGroups.length > remaining) {
      setStatus(`System: [QUOTA] ลดจำนวนกลุ่มจาก ${processGroups.length} เหลือ ${remaining} ตามโควต้ารายวันที่มีอยู่`);
      processGroups = processGroups.slice(0, remaining);
    }

    if (delaySeconds < limits.minDelay) return setStatus(`Error: แพ็กเกจ ${userPackage} มีดีเลย์ขั้นต่ำ ${limits.minDelay} วินาที`);

    if (postMode === 'TEXT' && !caption) return setStatus('Error: กรุณาระบุข้อความอย่างน้อย 1 ตัวอักษร');
    if (postMode === 'PHOTO' && mediaFiles.length === 0) return setStatus('Error: กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป');
    if (postMode === 'VIDEO' && mediaFiles.length === 0) return setStatus('Error: กรุณาอัปโหลดวิดีโอ 1 คลิป');
    if (mediaFiles.length === 0 && !caption) return setStatus('Error: กรุณาระบุข้อความหรือเพิ่มไฟล์สื่อประกอบ');

    setLoading(true);
    setStatus('System: เริ่มการทำงาน...');

    try {
      // setStatus('System: กำลังดึงข้อมูล Web Session (fb_dtsg)...');
      let dtsgData: { fb_dtsg: string; actor_id: string } | null = null;
      try {
        dtsgData = await fetchWebDTSGData();
        // setStatus(`System: พบ Web Session (Actor ID: ${dtsgData.actor_id})`);
      } catch (err: any) {
        setLoading(false);
        return setStatus(`Error: ${err.message}`);
      }

      let token = '';
      if (mediaFiles.length > 0) {
        // setStatus('System: กำลังดึง Access Token สำหรับอัปโหลดไฟล์...');
        try {
          token = await fetchFacebookToken();
        } catch (err: any) {
          setLoading(false);
          return setStatus(`Error: ${err.message}`);
        }
      }

      let successCount = 0;
      for (let pIdx = 0; pIdx < processGroups.length; pIdx++) {
        if (isCancelledRef.current) {
          setStatus('System: 🛑 หยุดการทำงาน...');
          break;
        }

        const targetGroup = processGroups[pIdx];
        const progressPrefix = `[${pIdx + 1}/${processGroups.length}] [${targetGroup.name}] `;

        setStatus(`${progressPrefix}กำลังประมวลผล...`);

        try {
          if (postMode === 'PHOTO' && mediaFiles.length > 0) {
            const pages = await fetchLocalAdminPages(token);
            const stagingTarget = pages.length > 0 ? pages[0].id : targetGroup.id;

            const attachedMediaGraphQL = [];
            const attachedMediaGraphAPI = [];
            for (let i = 0; i < mediaFiles.length; i++) {
              if (isCancelledRef.current) break;
              setStatus(`${progressPrefix}กำลังอัปโหลดรูปภาพ ${i + 1}/${mediaFiles.length}...`);
              try {
                const photoId = await uploadPhotoToGraphViaExtension(mediaFiles[i].file!, dtsgData!.actor_id, dtsgData!.fb_dtsg);
                attachedMediaGraphQL.push({ photo: { id: photoId.toString() } });
                attachedMediaGraphAPI.push({ media_fbid: photoId.toString() });
              } catch (uploadErr: any) {
                throw new Error(`อัปโหลดรูปภาพไม่สำเร็จ: ${uploadErr.message}`);
              }
            }

            if (isCancelledRef.current) {
              setStatus('System: 🛑 หยุดการทำงาน...');
              break;
            }

            // setStatus(`${progressPrefix}Publishing Post with ${attachedMediaGraphQL.length} photos via GraphQL...`);

            const variables = {
              input: {
                source: "WWW",
                attachments: attachedMediaGraphQL,
                message: { ranges: [], text: caption },
                inline_activities: [],
                explicit_place_id: "0",
                tracking: [null],
                audience: { to_id: targetGroup.id },
                actor_id: dtsgData!.actor_id,
                client_mutation_id: Math.round(Math.random() * 100000).toString()
              }
            };

            const payloadBody = new URLSearchParams({
              av: dtsgData!.actor_id,
              __user: dtsgData!.actor_id,
              fb_dtsg: dtsgData!.fb_dtsg,
              variables: JSON.stringify(variables),
              doc_id: "3559434960802556"
            }).toString();

            const postRes: any = await SendRequestToExtension('PROXY_FETCH', {
              url: 'https://www.facebook.com/api/graphql/',
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: payloadBody
            });

            let isGraphQLErr = false;
            let graphQLErrMsg = '';
            let createdStoryId = '';

            if (postRes.error) {
              isGraphQLErr = true;
              graphQLErrMsg = postRes.error;
            } else {
              try {
                const parsedGraphQL = JSON.parse(postRes.data);
                const storyNode = parsedGraphQL.data?.story_create?.story;
                const hasStoryId = !!storyNode?.id || !!storyNode?.legacy_story_hideable_id;

                if (hasStoryId) {
                  createdStoryId = storyNode.legacy_story_hideable_id || storyNode.id;
                }

                const hasFatalErrors = parsedGraphQL.errors?.some((e: any) => e.severity !== 'WARNING') || !!parsedGraphQL.error;
                if (!hasStoryId && hasFatalErrors) {
                  isGraphQLErr = true;
                  graphQLErrMsg = JSON.stringify(parsedGraphQL.errors || parsedGraphQL.error);
                }
              } catch (e) { }
            }

            if (isGraphQLErr) {
              setStatus(`System: รูปแบบ GraphQL ผิดพลาด (${graphQLErrMsg}) กำลังใช้ Graph API สำรอง...`);
              const fbRes: any = await SendRequestToExtension('PROXY_FETCH', {
                url: `https://graph.facebook.com/v21.0/${targetGroup.id}/feed?access_token=${token}&upfeedthcors=0`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: caption, attached_media: attachedMediaGraphAPI })
              });
              const parsed = typeof fbRes.data === 'string' ? JSON.parse(fbRes.data) : (fbRes.data || fbRes);
              if (parsed.error) throw new Error(`[Graph API สำรองล้มเหลว]: ${parsed.error.message || parsed.error}`);
              createdStoryId = parsed.id;
              setStatus(`${progressPrefix}ส่งคำสั่งโพสต์รูปภาพสำเร็จแล้ว! (ผ่าน Graph API)`);
            } else {
              setStatus(`${progressPrefix}ส่งคำสั่งโพสต์รูปภาพสำเร็จแล้ว! (ตรวจสอบที่กลุ่ม)`);
            }

            // --- FIRST COMMENT BUMP ---
            if (firstComment && createdStoryId && userPackage === 'PREMIUM') {
              setStatus(`${progressPrefix}กำลังส่งคอมเมนต์ดันโพสต์...`);
              try {
                const numericPostId = createdStoryId.includes('_') ? createdStoryId.split('_')[1] : createdStoryId;
                const commentVariables = {
                  feedLocation: "GROUP",
                  feedbackSource: 0,
                  groupID: targetGroup.id,
                  input: {
                    actor_id: dtsgData!.actor_id,
                    client_mutation_id: Math.round(Math.random() * 100).toString(),
                    attachments: null,
                    feedback_id: btoa(`feedback:${numericPostId}`),
                    formatting_style: null,
                    message: { ranges: [], text: firstComment },
                    reply_target_clicked: false,
                    attribution_id_v2: `CometGroupDiscussionRoot.react,comet.group,via_cold_start,${Date.now()},351678,2361831622,,`,
                    vod_video_timestamp: null,
                    is_tracking_encrypted: true,
                    tracking: [],
                    feedback_source: "PROFILE",
                    idempotence_token: "client:" + Math.random().toString(36).substring(2),
                    session_id: Math.random().toString(36).substring(2)
                  },
                  inviteShortLinkKey: null,
                  renderLocation: null,
                  scale: 1,
                  useDefaultActor: false,
                  focusCommentID: null,
                  __relay_internal__pv__groups_comet_use_glvrelayprovider: false,
                  __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: false,
                  __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
                  __relay_internal__pv__IsWorkUserrelayprovider: false,
                  __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: "ORIGINAL"
                };

                const commentPayload = new URLSearchParams({
                  av: dtsgData!.actor_id,
                  __user: dtsgData!.actor_id,
                  fb_dtsg: dtsgData!.fb_dtsg,
                  variables: JSON.stringify(commentVariables),
                  doc_id: "26166818606310826"
                }).toString();

                const commentRes: any = await SendRequestToExtension('PROXY_FETCH', {
                  url: 'https://www.facebook.com/api/graphql/',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: commentPayload
                });

                const commentParsed = typeof commentRes.data === 'string' ? JSON.parse(commentRes.data) : (commentRes.data || commentRes);
                if (commentParsed.errors) {
                  throw new Error(`ดันคอมเมนต์ไม่สำเร็จ (${JSON.stringify(commentParsed.errors)})`);
                } else {
                  setStatus(`${progressPrefix}ดันคอมเมนต์สำเร็จแล้ว! 🎉`);
                }
              } catch (cErr: any) {
                throw new Error(`ระบบดันคอมเมนต์ขัดข้อง (${cErr.message})`);
              }
            }

          } else if (postMode === 'VIDEO' && mediaFiles.length > 0) {
            // SINGLE VIDEO LOGIC
            setStatus(`${progressPrefix}กำลังประมวลผลวิดีโอ... (อาจใช้เวลานาน)`);
            const pages = await fetchLocalAdminPages(token);
            const stagingTarget = pages.length > 0 ? pages[0].id : targetGroup.id;

            let videoId = '';
            try {
              videoId = await uploadVideoViaWebEmulation(mediaFiles[0].file!, targetGroup.id, dtsgData!.actor_id, dtsgData!.fb_dtsg, token);
            } catch (uploadErr: any) {
              throw new Error(`อัปโหลดวิดีโอไม่สำเร็จ: ${uploadErr.message}`);
            }

            if (isCancelledRef.current) {
              setStatus('System: 🛑 หยุดการทำงาน... (อัพโหลดเสร็จแต่ไม่ส่งโพสต์)');
              break;
            }

            const variables = {
              input: {
                source: "WWW",
                attachments: [{ video: { id: videoId.toString() } }],
                message: { ranges: [], text: caption },
                inline_activities: [],
                explicit_place_id: "0",
                tracking: [null],
                audience: { to_id: targetGroup.id },
                actor_id: dtsgData!.actor_id,
                client_mutation_id: Math.round(Math.random() * 100000).toString()
              }
            };

            const payloadBody = new URLSearchParams({
              av: dtsgData!.actor_id,
              __user: dtsgData!.actor_id,
              fb_dtsg: dtsgData!.fb_dtsg,
              variables: JSON.stringify(variables),
              doc_id: "3559434960802556"
            }).toString();

            const postRes: any = await SendRequestToExtension('PROXY_FETCH', {
              url: 'https://www.facebook.com/api/graphql/',
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: payloadBody
            });

            let isGraphQLErr = false;
            let graphQLErrMsg = '';
            let createdStoryId = '';

            if (postRes.error) {
              isGraphQLErr = true;
              graphQLErrMsg = postRes.error;
            } else {
              try {
                const parsedGraphQL = JSON.parse(postRes.data);
                console.log("[DEBUG GraphQL Video] Response: ", parsedGraphQL);
                const storyNode = parsedGraphQL.data?.story_create?.story;
                const hasStoryId = !!storyNode?.id || !!storyNode?.legacy_story_hideable_id;

                if (hasStoryId) {
                  createdStoryId = storyNode.legacy_story_hideable_id || storyNode.id;
                }

                const hasFatalErrors = parsedGraphQL.errors?.some((e: any) => e.severity !== 'WARNING') || !!parsedGraphQL.error;

                if (!hasStoryId && hasFatalErrors) {
                  isGraphQLErr = true;
                  graphQLErrMsg = JSON.stringify(parsedGraphQL.errors || parsedGraphQL.error);
                }
              } catch (e) { }
            }

            if (isGraphQLErr) {
              setStatus(`System: รูปแบบ GraphQL วิดีโอผิดพลาด (${graphQLErrMsg}) กำลังใช้ Graph API สำรอง...`);
              const fbRes: any = await SendRequestToExtension('PROXY_FETCH', {
                url: `https://graph.facebook.com/v21.0/${targetGroup.id}/feed?access_token=${token}&upfeedthcors=0`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: caption, attached_media: [{ media_fbid: videoId.toString() }] })
              });
              const parsed = typeof fbRes.data === 'string' ? JSON.parse(fbRes.data) : (fbRes.data || fbRes);
              if (parsed.error) throw new Error(`[Graph API สำรองล้มเหลว]: ${parsed.error.message || parsed.error}`);
              createdStoryId = parsed.id;
              setStatus(`${progressPrefix}ส่งคำสั่งโพสต์วิดีโอสำเร็จแล้ว! (ผ่าน Graph API ตัวสำรอง)`);
            } else {
              setStatus(`${progressPrefix}ส่งคำสั่งโพสต์วิดีโอสำเร็จแล้ว! (วิดีโออาจใช้เวลาประมวลผล)`);
            }
            // (No First Comment for Video Mode)

          } else {
            // TEXT ONLY
            const variables = {
              input: {
                source: "WWW",
                attachments: [],
                message: { ranges: [], text: caption },
                inline_activities: [],
                explicit_place_id: "0",
                tracking: [null],
                audience: { to_id: targetGroup.id },
                actor_id: dtsgData!.actor_id,
                client_mutation_id: Math.round(Math.random() * 100).toString()
              }
            };

            const payloadBody = new URLSearchParams({
              av: dtsgData!.actor_id,
              __user: dtsgData!.actor_id,
              fb_dtsg: dtsgData!.fb_dtsg,
              variables: JSON.stringify(variables),
              doc_id: "3559434960802556"
            }).toString();

            const postRes: any = await SendRequestToExtension('PROXY_FETCH', {
              url: 'https://www.facebook.com/api/graphql/',
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: payloadBody
            });

            let createdStoryId = '';
            if (postRes.error) {
              throw new Error(postRes.error);
            } else {
              try {
                const parsedGraphQL = JSON.parse(postRes.data);
                const hasFatalErrors = parsedGraphQL.errors?.some((e: any) => e.severity !== 'WARNING') || !!parsedGraphQL.error;
                const storyNode = parsedGraphQL.data?.story_create?.story;
                const fetchedStoryId = storyNode?.legacy_story_hideable_id || storyNode?.id || '';

                if (hasFatalErrors && !fetchedStoryId) {
                  throw new Error(JSON.stringify(parsedGraphQL.errors || parsedGraphQL.error));
                }
                createdStoryId = fetchedStoryId;
              } catch (e: any) {
                throw new Error(`คำสั่งโพสต์ถูกส่งแล้ว แต่อ่านรหัสโพสต์ไม่สำเร็จ (${e.message})`);
              }
            }

            setStatus(`${progressPrefix}ส่งคำสั่งโพสต์ข้อความสำเร็จ!`);

            // --- FIRST COMMENT BUMP ---
            if (firstComment && createdStoryId && userPackage === 'PREMIUM') {
              setStatus(`${progressPrefix}กำลังคอมเมนต์ดันโพสต์...`);
              try {
                const numericPostId = createdStoryId.includes('_') ? createdStoryId.split('_')[1] : createdStoryId;
                const commentVariables = {
                  feedLocation: "GROUP",
                  feedbackSource: 0,
                  groupID: targetGroup.id,
                  input: {
                    actor_id: dtsgData!.actor_id,
                    client_mutation_id: Math.round(Math.random() * 100).toString(),
                    attachments: null,
                    feedback_id: btoa(`feedback:${numericPostId}`),
                    formatting_style: null,
                    message: { ranges: [], text: firstComment },
                    reply_target_clicked: false,
                    attribution_id_v2: `CometGroupDiscussionRoot.react,comet.group,via_cold_start,${Date.now()},351678,2361831622,,`,
                    vod_video_timestamp: null,
                    is_tracking_encrypted: true,
                    tracking: [],
                    feedback_source: "PROFILE",
                    idempotence_token: "client:" + Math.random().toString(36).substring(2),
                    session_id: Math.random().toString(36).substring(2)
                  },
                  inviteShortLinkKey: null,
                  renderLocation: null,
                  scale: 1,
                  useDefaultActor: false,
                  focusCommentID: null,
                  __relay_internal__pv__groups_comet_use_glvrelayprovider: false,
                  __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: false,
                  __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
                  __relay_internal__pv__IsWorkUserrelayprovider: false,
                  __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: "ORIGINAL"
                };

                const commentPayload = new URLSearchParams({
                  av: dtsgData!.actor_id,
                  __user: dtsgData!.actor_id,
                  fb_dtsg: dtsgData!.fb_dtsg,
                  variables: JSON.stringify(commentVariables),
                  doc_id: "26166818606310826"
                }).toString();

                const commentRes: any = await SendRequestToExtension('PROXY_FETCH', {
                  url: 'https://www.facebook.com/api/graphql/',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: commentPayload
                });

                const commentParsed = typeof commentRes.data === 'string' ? JSON.parse(commentRes.data) : (commentRes.data || commentRes);
                if (commentParsed.errors) {
                  throw new Error(`ดันคอมเมนต์ไม่สำเร็จ (${JSON.stringify(commentParsed.errors)})`);
                } else {
                  setStatus(`${progressPrefix}ดันคอมเมนต์สำเร็จแล้ว! 🎉`);
                }
              } catch (cErr: any) {
                throw new Error(`ระบบดันคอมเมนต์ขัดข้อง (${cErr.message})`);
              }
            }
          }

          // ✅ SUCCESS POINT
          successCount++;
          const { data: { session } } = await supabase.auth.getSession();
          fetch('/api/usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ action: 'group_auto_post', count: 1, target_type: 'group', target_id: targetGroup.id, target_name: targetGroup.name })
          }).then(r => {
            if (r.ok) setUsage((prev: any) => prev ? { ...prev, group_auto_posts_count: (prev.group_auto_posts_count || 0) + 1 } : prev);
          }).catch(() => { });

        } catch (groupError: any) {
          setStatus(`${progressPrefix}Error: ${groupError.message}`);
        }

        if (isCancelledRef.current) {
          setStatus('System: 🛑 หยุดการทำงาน...');
          break;
        }

        if (pIdx < processGroups.length - 1) {
          setStatus(`System: ดีเลย์เป็นเวลา: ${delaySeconds} วินาทีเพื่อป้องกันการถูกแบน...`);
          let delayCount = 0;
          while (delayCount < delaySeconds * 10) {
            if (isCancelledRef.current) break;
            await new Promise(r => setTimeout(r, 100)); // Sleep 100ms
            delayCount++;
          }
        }
      }

      if (isCancelledRef.current) {
        setStatus(`System: การประมวลผลถูกยกเลิก (ทำสำเร็จไป ${successCount} กลุ่ม)`);
      } else {
        setStatus(`System: ระบบได้ทำการโพสต์เสร็จสิ้น สำเร็จทั้งหมด: ${successCount} กลุ่ม`);
      }

    } catch (e: any) {
      console.error(e);
      setStatus(`System Error: ${e.message || 'Unknown error during execution.'}`);
    } finally {
      setLoading(false);
    }
  };
  const limits = getPackageLimits();

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-8 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Auto Post To Facebook Groups</h1>
          <p className="text-dark-300">
            ระบบโพสต์ลงกลุ่ม Facebook อัตโนมัติ รองรับโพสต์รูปภาพหลายรูปและวิดีโอพร้อมกัน
          </p>
        </div>

        {/* Quota Status */}
        <div className="bg-dark-900/80 border border-dark-700/50 rounded-xl p-4 flex flex-wrap items-center gap-6 shrink-0 w-full xl:w-auto shadow-inner">
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">แพ็กเกจ</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${userPackage === 'PREMIUM' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : userPackage === 'PRO' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></div>
              <span className={`text-sm font-bold ${userPackage === 'PREMIUM' ? 'text-purple-400' : userPackage === 'PRO' ? 'text-orange-400' : 'text-blue-400'}`}>
                {userPackage}
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">โพสต์สูงสุด/วัน</span>
            <span className="text-sm font-bold text-white mt-1">
              {usage?.group_auto_posts_count || 0} / {limits.maxGroups === 9999 ? 'ไม่จำกัด' : `${limits.maxGroups}`}
            </span>
          </div>
          <div className="w-px h-8 bg-dark-700 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">ดีเลย์ขั้นต่ำ</span>
            <span className="text-sm font-bold text-white mt-1">
              {limits.minDelay} วินาที
            </span>
          </div>
        </div>
      </div>

      <FacebookGroupSelector
        multiSelect={true}
        onMultiGroupSelect={setTargetGroups}
      />

      {/* Sub-Terminal Output */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl flex flex-col h-48 shrink-0 overflow-hidden shadow-xl mb-6">
        <div className="px-4 py-2 border-b border-dark-800 bg-dark-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 relative">
              {loading && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>}
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ผลลัพธ์การทำงาน</span>
          </div>
          <button
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2 py-1 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy Logs"
          >
            {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
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
              const isSuc = log.toLowerCase().includes('success') || log.toLowerCase().includes('สำเร็จ') || log.includes('Complete');
              const isSys = log.includes('System');
              const isWait = log.includes('หน่วงเวลา') || log.includes('Waiting');
              return (
                <div key={i} className={`
                    ${isErr ? 'text-red-400 font-medium' : ''}
                    ${isSuc ? 'text-green-400' : ''}
                    ${isSys ? 'text-blue-400 font-medium' : ''}
                    ${isWait ? 'text-orange-300' : ''}
                    ${!isErr && !isSuc && !isSys && !isWait ? 'text-purple-300' : ''}
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

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">

          {/* Left Column: Input Settings */}
          <div className={`space-y-6 ${postMode === 'TEXT' ? 'lg:col-span-8 lg:col-start-3 w-full' : 'lg:col-span-5'}`}>
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6">

              <div className="space-y-3">
                <label className="text-sm font-medium text-dark-200">ประเภท:</label>
                <div className="flex bg-dark-900 p-1 rounded-xl border border-dark-700 w-full overflow-x-auto custom-scrollbar whitespace-nowrap">
                  <button
                    onClick={() => { setPostMode('TEXT'); setMediaFiles([]); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${postMode === 'TEXT' ? 'bg-green-600 text-white shadow-md' : 'text-dark-300 hover:text-white hover:bg-dark-800/50'}`}
                  >
                    <Type className="w-4 h-4" /> แคปชั่น
                  </button>
                  <button
                    onClick={() => { setPostMode('PHOTO'); setMediaFiles([]); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${postMode === 'PHOTO' ? 'bg-green-600 text-white shadow-md' : 'text-dark-300 hover:text-white hover:bg-dark-800/50'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> รูปภาพ
                  </button>
                  <button
                    onClick={() => { setPostMode('VIDEO'); setMediaFiles([]); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${postMode === 'VIDEO' ? 'bg-green-600 text-white shadow-md' : 'text-dark-300 hover:text-white hover:bg-dark-800/50'}`}
                  >
                    <Play className="w-4 h-4" /> วิดีโอ
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200 flex justify-between">
                  <span>ข้อความ:</span>
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="เขียนข้อความในโพสต์ของคุณที่นี่..."
                  rows={6}
                  className="input-primary w-full text-sm leading-relaxed resize-none"
                />
              </div>

              <div className={`space-y-2 relative transition-all ${userPackage !== 'PREMIUM' || postMode === 'VIDEO' ? 'opacity-50 grayscale' : ''}`}>
                <label className="text-sm font-medium text-dark-200 flex justify-between items-center">
                  <span>คอมเมนต์ดันโพสต์อัตโนมัติ:</span>
                  {userPackage !== 'PREMIUM' ? (
                    <span className="text-[10px] bg-dark-800 text-dark-400 px-2 py-0.5 rounded-full font-bold">Premium Only</span>
                  ) : postMode === 'VIDEO' ? (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">ไม่รองรับวิดีโอ</span>
                  ) : null}
                </label>
                <textarea
                  value={firstComment}
                  onChange={e => setFirstComment(e.target.value)}
                  disabled={userPackage !== 'PREMIUM' || postMode === 'VIDEO'}
                  placeholder={userPackage !== 'PREMIUM' ? "กรุณาอัปเกรดเป็นแพ็กเกจ Premium เพื่อใช้งานฟีเจอร์นี้" : postMode === 'VIDEO' ? "ฟีเจอร์คอมเมนต์ดันโพสต์ไม่รองรับโพสต์ประเภทวิดีโอ" : "พิมพ์ข้อความคอมเมนต์ใต้โพสต์ (เช่น ข้อมูลสั่งซื้อ หรือ ลิงก์ URL)"}
                  rows={2}
                  className="input-primary w-full text-sm leading-relaxed resize-none border-green-500/20 focus:border-green-500 disabled:cursor-not-allowed disabled:bg-dark-900"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-dark-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2 text-dark-200">
                    <Settings2 className="w-4 h-4" /> Delay:
                  </label>
                  <span className="text-orange-400 font-mono font-bold">{delaySeconds < packageLimits.minDelay ? packageLimits.minDelay : delaySeconds} s</span>
                </div>
                <input
                  type="range"
                  min={packageLimits.minDelay}
                  max="50"
                  step="1"
                  value={delaySeconds < packageLimits.minDelay ? packageLimits.minDelay : delaySeconds}
                  onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
                <p className="text-[11px] flex justify-between items-center w-full">
                  <span className="text-dark-400">ระยะเวลาหน่วงก่อนเริ่มโพสต์กลุ่มถัดไป</span>
                  <span className="text-green-500 font-medium">✨ แพ็กเกจ {userPackage} (ขั้นต่ำ {packageLimits.minDelay} วิ)</span>
                </p>
              </div>

            </div>

            {loading ? (
              <button
                onClick={() => { isCancelledRef.current = true; }}
                className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
              >
                <X className="w-6 h-6" /> หยุด
              </button>
            ) : (
              <button
                onClick={executeAutoPost}
                className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <Send className="w-6 h-6" /> เริ่มโพสต์
              </button>
            )}
          </div>

          {/* Right Column: Media Uploader (Hidden in TEXT mode) */}
          {postMode !== 'TEXT' && (
            <div className="lg:col-span-7">
              <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-green-500" />
                    อัพโหลด
                  </h3>
                  {mediaFiles.length > 0 && postMode === 'PHOTO' && (
                    <span className="text-xs text-dark-400 font-medium bg-dark-900 px-3 py-1 rounded-full border border-dark-800">
                      {mediaFiles.length} รูป
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept={postMode === 'VIDEO' ? 'video/mp4,video/mov,video/avi' : 'image/jpeg,image/png,image/gif'}
                  multiple={postMode === 'PHOTO'}
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {/* Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full min-h-[160px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all cursor-pointer mb-6
                  ${mediaFiles.length === 0 ? 'border-dark-600 hover:border-green-500 hover:bg-green-500/5 bg-dark-900/50' : 'border-dark-800 bg-dark-900 p-6'}`}
                >
                  {mediaFiles.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 text-dark-400 px-6 text-center">
                      <UploadCloud className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-base font-semibold text-dark-200">
                        {postMode === 'VIDEO' ? 'คลิกอัปโหลดวิดีโอ (1 ไฟล์)' : 'คลิกอัปโหลดรูปภาพ (เลือกพร้อมกันได้หลายรูป)'}
                      </span>
                      <span className="text-xs text-dark-500">
                        หรือลากไฟล์มาวางที่นี่
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-green-500">
                      <UploadCloud className="w-8 h-8" />
                      <span className="text-sm font-medium">เพิ่มไฟล์อีก?</span>
                    </div>
                  )}
                </div>

                {/* Media Preview Grid */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-[120px]">
                    {mediaFiles.map((fileObj, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-dark-700 bg-black">
                        {fileObj.type === 'video' ? (
                          <video src={fileObj.previewUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={fileObj.previewUrl} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                        )}

                        {fileObj.type === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white/80" />
                          </div>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-2 left-2 bg-dark-950/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-dark-700">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
