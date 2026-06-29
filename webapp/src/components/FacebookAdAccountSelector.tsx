'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchFacebookToken, fetchAdAccounts, AdAccount } from '@/utils/facebook';
import { Loader2, RefreshCw, Briefcase, CheckCircle2, AlertCircle, ChevronDown, Lock } from 'lucide-react';

interface FacebookAdAccountSelectorProps {
  onAccountSelect: (account: AdAccount | null) => void;
  className?: string;
}

export default function FacebookAdAccountSelector({ onAccountSelect, className }: FacebookAdAccountSelectorProps) {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
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
      // 2. Get ad accounts
      const adAccounts = await fetchAdAccounts(token);

      // Sort so ACTIVE (1) accounts are at the top
      const sorted = adAccounts.sort((a, b) => {
        if (a.account_status === 1 && b.account_status !== 1) return -1;
        if (a.account_status !== 1 && b.account_status === 1) return 1;
        return 0;
      });

      setAccounts(sorted);
      if (sorted.length > 0 && !selectedAccountId) {
        // Auto select first active
        const firstActive = sorted.find(a => a.account_status === 1) || sorted[0];
        setSelectedAccountId(firstActive.id);
        onAccountSelect(firstActive);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีโฆษณา');
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
    }, 1500); // 1.5s delay to ensure token/proxy is ready, matching PageSelector
    return () => clearTimeout(timer);
  }, []);

  const handleCustomSelect = (account: AdAccount) => {
    setSelectedAccountId(account.id);
    onAccountSelect(account);
    setDropdownOpen(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  return (
    <div className={className || "bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl mb-6"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">เลือกบัญชีโฆษณา</h3>
            <p className="text-xs text-dark-400">เลือกบัญชีโฆษณาของคุณที่ถืออยู่</p>
          </div>
        </div>
        <button
          onClick={syncAccounts}
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
          {(error.includes('ไม่พบข้อมูล Facebook') || error.includes('ไม่พบ EAAB Token') || error.includes('บัญชีโฆษณา')) && (
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
          กำลังโหลดข้อมูล กรุณารอสักครู่...
        </div>
      )}

      {accounts.length > 0 && selectedAccount && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-dark-950 border border-dark-700 text-white rounded-xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${selectedAccount.account_status === 1 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {selectedAccount.account_status === 1 ? <Briefcase className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm leading-tight text-white">{selectedAccount.name}</span>
                  {selectedAccount.account_status !== 1 && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded leading-none">DISABLED</span>}
                </div>
                <span className="text-[11px] text-dark-400 mt-0.5 font-mono">{selectedAccount.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedAccount.account_status === 1 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
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
                    } ${account.account_status !== 1 ? 'opacity-60' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${account.account_status === 1 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    {account.account_status === 1 ? <Briefcase className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{account.name}</span>
                      {account.account_status !== 1 && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded leading-none shrink-0">DISABLED</span>}
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