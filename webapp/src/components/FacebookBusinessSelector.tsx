'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchFacebookToken, fetchBusinessAccounts, BusinessAccount } from '@/utils/facebook';
import { Loader2, RefreshCw, Briefcase, CheckCircle2, AlertCircle, ChevronDown, Building2 } from 'lucide-react';

interface FacebookBusinessSelectorProps {
  onAccountSelect: (account: BusinessAccount | null) => void;
  className?: string;
}

export default function FacebookBusinessSelector({ onAccountSelect, className }: FacebookBusinessSelectorProps) {
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
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

  const syncAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Get Token
      const token = await fetchFacebookToken();
      // 2. Get business accounts
      const bizAccounts = await fetchBusinessAccounts(token);

      setAccounts(bizAccounts);
      if (bizAccounts.length > 0 && !selectedAccountId) {
        // Auto select first
        setSelectedAccountId(bizAccounts[0].id);
        onAccountSelect(bizAccounts[0]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีธุรกิจ (Business Manager)');
      }
      setAccounts([]);
      onAccountSelect(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      syncAccounts();
    }, 1500); // 1.5s delay to ensure token/proxy is ready
    return () => clearTimeout(timer);
  }, []);

  const handleCustomSelect = (account: BusinessAccount) => {
    setSelectedAccountId(account.id);
    onAccountSelect(account);
    setDropdownOpen(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  return (
    <div className={className || "bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl mb-6"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">เลือกบัญชีธุรกิจ</h3>
            <p className="text-xs text-dark-400">บัญชีธุกิจไม่ส่งผลต่อการสร้างเพจ (เพื่อไว้หลอกระบบเฟสบุ๊ค)</p>
          </div>
        </div>
        <button
          onClick={syncAccounts}
          disabled={loading}
          className="p-2 text-dark-400 hover:text-blue-400 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
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
          {(error.includes('ไม่พบข้อมูล Facebook') || error.includes('ไม่พบ EAAB Token') || error.includes('บัญชีธุรกิจ')) && (
            <button
              onClick={() => {
                const popup = window.open('https://business.facebook.com/latest/home', '_blank', 'width=800,height=600,left=200,top=200');
                setLoading(true);
                setError('กำลังเชื่อมต่อ Facebook อัตโนมัติ... (โปรดรอสักครู่ ห้ามปิดหน้าต่างป๊อปอัป)');
                setTimeout(() => {
                  if (popup) popup.close();
                  syncAccounts();
                }, 5000);
              }}
              className="ml-8 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> เปิดระบบเชื่อมต่ออัตโนมัติ
            </button>
          )}
        </div>
      )}

      {!error && accounts.length === 0 && !loading && (
        <div className="text-sm text-dark-400 p-4 border border-dashed border-dark-700 rounded-xl text-center">
          กำลังโหลดข้อมูลบัญชีธุรกิจ กรุณารอสักครู่...
        </div>
      )}

      {accounts.length > 0 && selectedAccount && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-dark-950 border border-dark-700 text-white rounded-xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-blue-500/10 border-blue-500/30">
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm leading-tight text-white">{selectedAccount.name}</span>
                </div>
                <span className="text-[11px] text-dark-400 mt-0.5 font-mono">{selectedAccount.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto custom-scrollbar overflow-hidden">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleCustomSelect(account)}
                  className={`w-full flex items-center p-3 gap-3 transition-colors text-left hover:bg-dark-800 ${account.id === selectedAccountId ? 'bg-dark-800/50' : ''
                    }`}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0 bg-blue-500/10 border-blue-500/30">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{account.name}</span>
                    </div>
                    <span className="text-[11px] text-dark-400 truncate mt-0.5 font-mono">{account.id}</span>
                  </div>
                  {account.id === selectedAccountId && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
