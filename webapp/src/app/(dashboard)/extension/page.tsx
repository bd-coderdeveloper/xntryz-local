'use client';

import { useEffect, useState } from 'react';
import { DownloadCloud, Info, CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function ExtensionDownloadPage() {
  const [latestVersion, setLatestVersion] = useState<string>('กำลังโหลด...');
  const [downloadUrl, setDownloadUrl] = useState<string>('#');
  const [extVersion, setExtVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check system settings
    const checkSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setLatestVersion(data.settings.extension_version || 'N/A');
            setDownloadUrl(data.settings.extension_download_url || '#');
          }
        }
      } catch (e) { }
    };
    checkSettings();

    // Check currently installed version
    const checkExt = () => {
      if (typeof window !== 'undefined') {
        const versionEl = document.getElementById('upfeedth-extension-version');
        if (versionEl) {
          setExtVersion(versionEl.getAttribute('data-version'));
        } else if ((window as any).upfeedth_ext_version) {
          setExtVersion((window as any).upfeedth_ext_version);
        } else if ((window as any).upfeedth?.installed || (window as any).upfeed?.installed) {
          setExtVersion('เวอร์ชั่นเก่าควรอัพเดท');
        } else {
          setExtVersion('ยังไม่ได้ติดตั้ง');
        }
      }
    };
    checkExt();
    const interval = setInterval(checkExt, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center mt-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          <Package className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">ดาวน์โหลด UPFEEDTH Extension</h1>
        <p className="text-dark-300 max-w-xl text-lg">
          ส่วนเสริมสำหรับ Google Chrome หรือ Microsoft Edge ที่จำเป็นต้องใช้ควบคู่กับระบบ
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            สถานะของคุณ
          </h2>

          <div className="space-y-4">
            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 flex justify-between items-center">
              <span className="text-dark-300">สถานะการติดตั้ง:</span>
              <span className={`font-bold ${extVersion === 'ยังไม่ได้ติดตั้ง' ? 'text-red-400' : 'text-green-400 flex items-center gap-1'}`}>
                {extVersion !== 'ยังไม่ได้ติดตั้ง' && <CheckCircle className="w-4 h-4" />}
                {extVersion === 'ยังไม่ได้ติดตั้ง' ? 'ยังไม่ติดตั้ง' : 'ติดตั้งแล้ว'}
              </span>
            </div>

            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 flex justify-between items-center">
              <span className="text-dark-300">เวอร์ชั่นที่คุณใช้:</span>
              <span className="font-bold text-blue-400">{extVersion || 'กำลังตรวจสอบ...'}</span>
            </div>

            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 flex justify-between items-center">
              <span className="text-dark-300">เวอร์ชั่นล่าสุด:</span>
              <span className="font-bold text-orange-400">{latestVersion}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-dark-800/60 pt-6">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-base font-bold"
            >
              <DownloadCloud className="w-5 h-5" />
              ดาวน์โหลดเวอร์ชั่น {latestVersion}
            </a>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl bg-linear-to-b from-dark-900 to-dark-950">
          <h2 className="text-xl font-bold text-white mb-6">วิธีติดตั้งและอัปเดต</h2>

          <ol className="space-y-5 text-sm text-dark-200">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-sm font-bold text-orange-400 shadow-sm shadow-orange-500/10">1</span>
              <span className="pt-1">คลิกปุ่มดาวน์โหลด แล้วนำไฟล์ <code className="bg-dark-800 px-1.5 py-0.5 rounded text-orange-300 border border-dark-700">.ZIP</code> ที่ได้ไปแตกไฟล์ (Extract ZIP) ไว้ในโฟลเดอร์ที่คุณหาได้ง่าย</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-sm font-bold text-orange-400 shadow-sm shadow-orange-500/10">2</span>
              <div className="pt-1">
                เปิดบราวเซอร์ Google Chrome พิมพ์ <code className="bg-dark-800 px-1.5 py-0.5 rounded text-orange-300 border border-dark-700 ml-1 select-all">chrome://extensions</code> ในช่อง URL ด้านบน
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-sm font-bold text-orange-400 shadow-sm shadow-orange-500/10">3</span>
              <span className="pt-1">เปิดสวิตช์ <strong>"โหมดนักพัฒนาซอฟต์แวร์" (Developer mode)</strong> ที่มุมขวาบน</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-sm font-bold text-orange-400 shadow-sm shadow-orange-500/10">4</span>
              <span className="pt-1">
                <span className="text-green-400 font-medium block mb-1">ถ้าเคยติดตั้งแล้ว:</span>
                ให้กดปุ่ม <strong>Remove (นำออก)</strong> อันเก่าทิ้งก่อน
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-sm font-bold text-orange-400 shadow-sm shadow-orange-500/10">5</span>
              <span className="pt-1">คลิกปุ่ม <strong>"โหลดส่วนขยายที่ยังไม่ได้แพ็ก" (Load unpacked)</strong> แล้วเลือกโฟลเดอร์ที่เพิ่งแตกไฟล์มา</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
