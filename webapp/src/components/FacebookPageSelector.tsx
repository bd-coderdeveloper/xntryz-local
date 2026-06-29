'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchFacebookToken, fetchAdminPages, FacebookPage } from '@/utils/facebook';
import { Loader2, RefreshCw, Facebook, CheckCircle2, AlertCircle, ChevronDown, CheckSquare, Square } from 'lucide-react';

interface FacebookPageSelectorProps {
  onPageSelect?: (page: FacebookPage | null) => void;
  multiSelect?: boolean;
  onMultiPageSelect?: (pages: FacebookPage[]) => void;
  className?: string;
}

export default function FacebookPageSelector({ onPageSelect, multiSelect = false, onMultiPageSelect, className }: FacebookPageSelectorProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const syncPages = async (forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      const token = await fetchFacebookToken(forceRefresh);
      const adminPages = await fetchAdminPages(token);

      setPages(adminPages);
      if (adminPages.length > 0 && selectedPageIds.length === 0) {
        setSelectedPageIds([adminPages[0].id]);
        if (onPageSelect) onPageSelect(adminPages[0]);
        if (onMultiPageSelect) onMultiPageSelect([adminPages[0]]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลจาก Facebook');
      }
      setPages([]);
      if (onPageSelect) onPageSelect(null);
      if (onMultiPageSelect) onMultiPageSelect([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      syncPages();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCustomSelect = (page: FacebookPage) => {
    if (multiSelect) {
      const newIds = selectedPageIds.includes(page.id)
        ? selectedPageIds.filter(id => id !== page.id)
        : [...selectedPageIds, page.id];

      // Prevent unselecting the last one if you want? No, let them unselect.
      setSelectedPageIds(newIds);
      const selectedNodes = pages.filter(p => newIds.includes(p.id));
      if (onPageSelect) onPageSelect(selectedNodes[0] || null);
      if (onMultiPageSelect) onMultiPageSelect(selectedNodes);
    } else {
      setSelectedPageIds([page.id]);
      if (onPageSelect) onPageSelect(page);
      if (onMultiPageSelect) onMultiPageSelect([page]);
      setDropdownOpen(false);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPageIds.length === pages.length) {
      setSelectedPageIds([]);
      if (onPageSelect) onPageSelect(null);
      if (onMultiPageSelect) onMultiPageSelect([]);
    } else {
      const allIds = pages.map(p => p.id);
      setSelectedPageIds(allIds);
      if (onPageSelect) onPageSelect(pages[0] || null);
      if (onMultiPageSelect) onMultiPageSelect(pages);
    }
  };

  const selectedPagesObject = pages.filter(p => selectedPageIds.includes(p.id));
  const primarySelectedPage = selectedPagesObject[0] || null;

  return (
    <div className={className || "bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl mb-6"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Facebook className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">เลือกเพจ</h3>
            <p className="text-xs text-dark-400">เลือกเพจของคุณที่ถืออยู่</p>
          </div>
        </div>
        <button
          onClick={() => syncPages(true)}
          disabled={loading}
          className="p-2 text-dark-400 hover:text-orange-400 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          ซิ้งค์ข้อมูล
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-start gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
          {(error.includes('ไม่พบข้อมูล Facebook') || error.includes('ไม่พบ EAAB Token')) && (
            <button
              onClick={() => {
                const popup = window.open('https://business.facebook.com/latest/home', '_blank', 'width=800,height=600,left=200,top=200');
                setLoading(true);
                setError('กำลังเชื่อมต่อ Facebook อัตโนมัติ... (โปรดรอสักครู่ ห้ามปิดหน้าต่างป๊อปอัป)');
                setTimeout(() => {
                  if (popup) popup.close();
                  syncPages(true);
                }, 5000);
              }}
              className="ml-8 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> เปิดระบบเชื่อมต่ออัตโนมัติ
            </button>
          )}
        </div>
      )}

      {!error && pages.length === 0 && !loading && (
        <div className="text-sm text-dark-400 p-4 border border-dashed border-dark-700 rounded-xl text-center">
          กำลังโหลดข้อมูล กรุณารอสักครู่...
        </div>
      )}

      {pages.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-dark-950 border border-dark-700 text-white rounded-xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {primarySelectedPage?.picture_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={primarySelectedPage.picture_url} alt={primarySelectedPage.name} className="w-8 h-8 rounded-full object-cover border border-dark-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center border border-dark-700">
                  <Facebook className="w-4 h-4 text-dark-400" />
                </div>
              )}
              <div className="flex flex-col items-start leading-tight">
                {multiSelect ? (
                  <span className="font-medium text-sm text-white">
                    {selectedPageIds.length} เพจที่เลือก
                  </span>
                ) : (
                  <span className="font-medium text-sm text-white">{primarySelectedPage?.name || 'Select a Page'}</span>
                )}
                {multiSelect && selectedPageIds.length > 0 ? (
                  <span className="text-[11px] text-dark-400 mt-0.5 truncate max-w-[200px] md:max-w-[400px]">
                    {selectedPagesObject.map(p => p.name).join(', ')}
                  </span>
                ) : (
                  <span className="text-[11px] text-dark-400 mt-0.5">ID: {primarySelectedPage?.id}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedPageIds.length > 0 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              {multiSelect && (
                <div className="p-3 border-b border-dark-800 bg-dark-950 flex justify-between items-center">
                  <span className="text-xs text-dark-400 font-medium">เลือกเพจที่ต้องการใช้งาน</span>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {selectedPageIds.length === pages.length ? 'ยกเลิก' : 'เลือกทั้งหมด'}
                  </button>
                </div>
              )}
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {pages.map((page) => {
                  const isSelected = selectedPageIds.includes(page.id);
                  return (
                    <button
                      key={page.id}
                      onClick={() => handleCustomSelect(page)}
                      className={`w-full flex items-center p-3 gap-3 transition-colors text-left hover:bg-dark-800 ${isSelected ? 'bg-dark-800/50' : ''
                        }`}
                    >
                      {multiSelect && (
                        <div className="shrink-0 text-dark-400">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5" />}
                        </div>
                      )}

                      {page.picture_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={page.picture_url} alt={page.name} className="w-9 h-9 rounded-full object-cover border border-dark-700 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center border border-dark-700 shrink-0">
                          <Facebook className="w-4 h-4 text-dark-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-dark-200'}`}>{page.name}</span>
                        <span className="text-[11px] text-dark-400 truncate mt-0.5">ID: {page.id}</span>
                      </div>
                      {!multiSelect && isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}