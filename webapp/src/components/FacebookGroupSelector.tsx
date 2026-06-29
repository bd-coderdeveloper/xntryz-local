'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchFacebookToken, fetchUserGroups, FacebookGroup } from '@/utils/facebook';
import { Loader2, RefreshCw, Users, CheckCircle2, AlertCircle, ChevronDown, CheckSquare, Square, Search } from 'lucide-react';

interface FacebookGroupSelectorProps {
  onGroupSelect?: (group: FacebookGroup | null) => void;
  multiSelect?: boolean;
  onMultiGroupSelect?: (groups: FacebookGroup[]) => void;
  className?: string;
  adminOnly?: boolean;
}

export default function FacebookGroupSelector({ onGroupSelect, multiSelect = false, onMultiGroupSelect, className, adminOnly = false }: FacebookGroupSelectorProps) {
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const syncGroups = async (forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      const token = await fetchFacebookToken(forceRefresh);
      const userGroups = await fetchUserGroups(token, adminOnly);

      // Sort alphabetically
      userGroups.sort((a, b) => a.name.localeCompare(b.name));

      setGroups(userGroups);
      // Wait for user to manually select a group
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลจาก Facebook');
      }
      setGroups([]);
      if (onGroupSelect) onGroupSelect(null);
      if (onMultiGroupSelect) onMultiGroupSelect([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      syncGroups();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCustomSelect = (group: FacebookGroup) => {
    if (multiSelect) {
      const newIds = selectedGroupIds.includes(group.id)
        ? selectedGroupIds.filter(id => id !== group.id)
        : [...selectedGroupIds, group.id];

      setSelectedGroupIds(newIds);
      const selectedNodes = groups.filter(g => newIds.includes(g.id));
      if (onGroupSelect) onGroupSelect(selectedNodes[0] || null);
      if (onMultiGroupSelect) onMultiGroupSelect(selectedNodes);
    } else {
      setSelectedGroupIds([group.id]);
      if (onGroupSelect) onGroupSelect(group);
      if (onMultiGroupSelect) onMultiGroupSelect([group]);
      setDropdownOpen(false);
    }
  };

  const handleSelectAllFiltered = (e: React.MouseEvent) => {
    e.stopPropagation();
    const filteredIds = filteredGroups.map(g => g.id);
    const allFilteredSelected = filteredIds.every(id => selectedGroupIds.includes(id));

    let newIds = [...selectedGroupIds];
    if (allFilteredSelected && filteredIds.length > 0) {
      // Unselect all visible
      newIds = newIds.filter(id => !filteredIds.includes(id));
    } else {
      // Select all visible
      filteredIds.forEach(id => {
        if (!newIds.includes(id)) newIds.push(id);
      });
    }

    setSelectedGroupIds(newIds);
    const selectedNodes = groups.filter(g => newIds.includes(g.id));
    if (onGroupSelect) onGroupSelect(selectedNodes[0] || null);
    if (onMultiGroupSelect) onMultiGroupSelect(selectedNodes);
  };

  const selectedGroupsObject = groups.filter(g => selectedGroupIds.includes(g.id));
  const primarySelectedGroup = selectedGroupsObject[0] || null;

  return (
    <div className={className || "bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl mb-6"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">เลือกกลุ่ม</h3>
            <p className="text-xs text-dark-400">กลุ่มที่คุณเป็นสมาชิกหรือผู้ดูแล</p>
          </div>
        </div>
        <button
          onClick={() => syncGroups(true)}
          disabled={loading}
          className="p-2 text-dark-400 hover:text-green-400 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
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
                  syncGroups(true);
                }, 5000);
              }}
              className="ml-8 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> เปิดระบบเชื่อมต่ออัตโนมัติ
            </button>
          )}
        </div>
      )}

      {!error && groups.length === 0 && !loading && (
        <div className="text-sm text-dark-400 p-4 border border-dashed border-dark-700 rounded-xl text-center">
          กำลังโหลดข้อมูล กรุณารอสักครู่...
        </div>
      )}

      {groups.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-dark-950 border border-dark-700 text-white rounded-xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {primarySelectedGroup?.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={primarySelectedGroup.icon} alt={primarySelectedGroup.name} className="w-8 h-8 rounded-xl object-cover border border-dark-700" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-dark-800 flex items-center justify-center border border-dark-700">
                  <Users className="w-4 h-4 text-dark-400" />
                </div>
              )}
              <div className="flex flex-col items-start leading-tight">
                {multiSelect ? (
                  <span className="font-medium text-sm text-white">
                    {selectedGroupIds.length} กลุ่มที่เลือก
                  </span>
                ) : (
                  <span className="font-medium text-sm text-white">{primarySelectedGroup?.name || 'Select a Group'}</span>
                )}
                {multiSelect && selectedGroupIds.length > 0 ? (
                  <span className="text-[11px] text-dark-400 mt-0.5 truncate max-w-[200px] md:max-w-[400px]">
                    {selectedGroupsObject.map(g => g.name).join(', ')}
                  </span>
                ) : (
                  <span className="text-[11px] text-dark-400 mt-0.5">ID: {primarySelectedGroup?.id}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedGroupIds.length > 0 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">

              {/* Search Bar */}
              <div className="p-3 border-b border-dark-800 bg-dark-950/80">
                <div className="relative">
                  <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหากลุ่ม..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {multiSelect && (
                <div className="p-3 border-b border-dark-800 bg-dark-950 flex justify-between items-center">
                  <span className="text-xs text-dark-400 font-medium">เจอทั้งหมด {filteredGroups.length} กลุ่ม</span>
                  <button
                    onClick={handleSelectAllFiltered}
                    className="text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                  >
                    {filteredGroups.length > 0 && filteredGroups.every(g => selectedGroupIds.includes(g.id)) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด (ที่ค้นหา)'}
                  </button>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredGroups.length === 0 && (
                  <div className="p-4 text-center text-dark-400 text-sm">
                    ไม่พบกลุ่มที่ค้นหา
                  </div>
                )}
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleCustomSelect(group)}
                      className={`w-full flex items-center p-3 gap-3 transition-colors text-left hover:bg-dark-800 ${isSelected ? 'bg-dark-800/50' : ''
                        }`}
                    >
                      {multiSelect && (
                        <div className="shrink-0 text-dark-400">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5" />}
                        </div>
                      )}

                      {group.icon ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={group.icon} alt={group.name} className="w-9 h-9 rounded-xl object-cover border border-dark-700 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center border border-dark-700 shrink-0">
                          <Users className="w-4 h-4 text-dark-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-dark-200'}`}>{group.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-dark-400 truncate">ID: {group.id}</span>
                          {group.privacy && (
                            <span className="text-[10px] bg-dark-800 text-dark-400 px-1.5 rounded">{group.privacy}</span>
                          )}
                        </div>
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