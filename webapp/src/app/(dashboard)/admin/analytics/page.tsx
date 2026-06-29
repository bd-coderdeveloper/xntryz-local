'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Activity, Trash2, Copy, Image as ImageIcon, Users, Loader2, Users2, RefreshCw, Check } from 'lucide-react';

type RangeKey = 'today' | '7d' | '15d' | 'month' | 'year' | 'custom';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'วันนี้' },
  { key: '7d', label: '7 วัน' },
  { key: '15d', label: '15 วัน' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'year', label: 'ปีนี้' },
  { key: 'custom', label: 'กำหนดเอง' },
];

const getRangeDescription = (range: RangeKey, startDate: string, endDate: string) => {
  if (!startDate || !endDate) return '';
  if (range === 'today') return `วันที่ ${new Date(endDate + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState<RangeKey>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [targetPage, setTargetPage] = useState(1);
  const targetsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (range !== 'custom' || (range === 'custom' && customStart && customEnd)) {
      setTargetPage(1);
      setSearchQuery('');
      fetchAnalytics(range, customStart, customEnd);
    }
  }, [range, customStart, customEnd]);

  const fetchAnalytics = async (r: RangeKey, customS?: string, customE?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let url = `/api/admin/analytics?range=${r}`;
      if (r === 'custom') {
        const s = customS || customStart;
        const e = customE || customEnd;
        if (s && e) url += `&start=${s}&end=${e}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { today, topUsers, topTargets, startDate, endDate } = stats || {};

  const filteredTargets = topTargets ? topTargets.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) return true;
    if (t.users?.some((u: any) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return true;
    return false;
  }) : [];

  const currentTargets = filteredTargets.slice((targetPage - 1) * targetsPerPage, targetPage * targetsPerPage);
  const totalTargetPages = Math.ceil(filteredTargets.length / targetsPerPage);
  const totalActions = (today?.totalRemoved || 0) + (today?.totalCloned || 0) + (today?.totalOneCard || 0) + (today?.totalGroupRemoved || 0) + (today?.totalGroupAutoPost || 0) + (today?.totalAutoCreatePages || 0);

  const tools = [
    { name: 'ONE CARD', count: today?.totalOneCard || 0, color: 'bg-blue-500', icon: <ImageIcon className="w-4 h-4 mr-2" /> },
    { name: 'DEEP CLONE', count: today?.totalCloned || 0, color: 'bg-emerald-500', icon: <Copy className="w-4 h-4 mr-2" /> },
    { name: 'PAGE REMOVE', count: today?.totalRemoved || 0, color: 'bg-red-500', icon: <Trash2 className="w-4 h-4 mr-2" /> },
    { name: 'GROUP REMOVE', count: today?.totalGroupRemoved || 0, color: 'bg-orange-500', icon: <Trash2 className="w-4 h-4 mr-2" /> },
    { name: 'GROUP POST', count: today?.totalGroupAutoPost || 0, color: 'bg-purple-500', icon: <Activity className="w-4 h-4 mr-2" /> },
    { name: 'AUTO CREATE PAGE', count: today?.totalAutoCreatePages || 0, color: 'bg-indigo-500', icon: <Users2 className="w-4 h-4 mr-2" /> },
  ];
  tools.sort((a, b) => b.count - a.count);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Analytics Dashboard
          </h1>
          {stats && !loading && (
            <p className="text-sm text-zinc-400 mt-1">
              {getRangeDescription(range, startDate, endDate)}
            </p>
          )}
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r.key
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(range)}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">ตั้งแต่:</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">ถึง:</label>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          iconClass="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"
          gradientClass="from-indigo-500/10"
          label="USERS:"
          value={loading ? null : (today?.dau || 0)}
        />
        <StatCard
          icon={<ImageIcon className="w-6 h-6" />}
          iconClass="p-3 bg-blue-500/20 text-blue-400 rounded-xl"
          gradientClass="from-blue-500/10"
          label="ONE CARD"
          value={loading ? null : (today?.totalOneCard || 0)}
        />
        <StatCard
          icon={<Copy className="w-6 h-6" />}
          iconClass="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"
          gradientClass="from-emerald-500/10"
          label="DEEP CLONE"
          value={loading ? null : (today?.totalCloned || 0)}
        />
        <StatCard
          icon={<Trash2 className="w-6 h-6" />}
          iconClass="p-3 bg-red-500/20 text-red-400 rounded-xl"
          gradientClass="from-red-500/10"
          label="PAGE REMOVE"
          value={loading ? null : (today?.totalRemoved || 0)}
        />
        <StatCard
          icon={<Trash2 className="w-6 h-6" />}
          iconClass="p-3 bg-orange-500/20 text-orange-400 rounded-xl"
          gradientClass="from-orange-500/10"
          label="GROUP REMOVE"
          value={loading ? null : (today?.totalGroupRemoved || 0)}
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          iconClass="p-3 bg-purple-500/20 text-purple-400 rounded-xl"
          gradientClass="from-purple-500/10"
          label="GROUP POST"
          value={loading ? null : (today?.totalGroupAutoPost || 0)}
        />
        <StatCard
          icon={<Users2 className="w-6 h-6" />}
          iconClass="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"
          gradientClass="from-indigo-500/10"
          label="AUTO CREATE"
          value={loading ? null : (today?.totalAutoCreatePages || 0)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Tool Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 lg:col-span-1 border-t-4 border-t-indigo-500">
          <h2 className="text-lg font-semibold text-white mb-6">สถิติการใช้งานแต่ละประเภท</h2>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : (
            <div className="space-y-6">
              {tools.map((tool, idx) => {
                const percent = totalActions > 0 ? Math.round((tool.count / totalActions) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center text-zinc-300 font-medium">
                        {tool.icon}
                        {tool.name}
                      </span>
                      <span className="text-white font-bold">
                        {tool.count.toLocaleString()} <span className="text-zinc-500 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${tool.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 p-4 bg-black/20 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-400 text-center">
              Total actions{range !== 'today' ? ' in period' : ' today'}:{' '}
              <strong className="text-white">{loading ? '...' : totalActions.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 xl:col-span-2 shadow-xl shadow-black/50">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            🏆 Top Users{range !== 'today' ? ` (${RANGES.find(r => r.key === range)?.label})` : ' Today'}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : topUsers && topUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="pb-3 px-4 font-medium w-16">อันดับ</th>
                    <th className="pb-3 px-4 font-medium">User</th>
                    <th className="pb-3 px-4 font-medium text-center">ONE CARD</th>
                    <th className="pb-3 px-4 font-medium text-center">DEEP CLONE</th>
                    <th className="pb-3 px-4 font-medium text-center">PAGE REMOVE</th>
                    <th className="pb-3 px-4 font-medium text-center">GROUP REMOVE</th>
                    <th className="pb-3 px-4 font-medium text-center">GROUP POST</th>
                    <th className="pb-3 px-4 font-medium text-center">AUTO CREATE</th>
                    <th className="pb-3 px-4 font-medium text-right text-indigo-400 w-24">ทั้งหมด</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {topUsers.map((user: any, idx: number) => (
                    <tr key={user.user_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          idx === 1 ? 'bg-zinc-300/20 text-zinc-300' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-500' :
                              'text-zinc-500'
                          }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[150px]">{user.email}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-blue-400">{user.one_card}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-emerald-400">{user.posts_cloned}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-red-400">{user.posts_removed || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-orange-400">{user.group_removed || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-purple-400">{user.group_auto_post || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-indigo-400">{user.auto_create_pages || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white">
                        {user.total_actions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <p>ไม่มีข้อมูลการใช้งานในช่วงนี้</p>
            </div>
          )}
        </div>

        {/* Top Targets */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 xl:col-span-3 shadow-xl shadow-black/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🎯 Top Pages & Groups{range !== 'today' ? ` (${RANGES.find(r => r.key === range)?.label})` : ' Today'}
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อเพจ, ID, หรือ User..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setTargetPage(1); }}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-indigo-500"
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : topTargets && topTargets.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="pb-3 px-4 font-medium w-16">อันดับ</th>
                    <th className="pb-3 px-4 font-medium">ชื่อเพจ / กลุ่ม (ID)</th>
                    <th className="pb-3 px-4 font-medium text-center">ประเภท</th>
                    <th className="pb-3 px-4 font-medium">ผู้ใช้งาน (Users)</th>
                    <th className="pb-3 px-4 font-medium">เครื่องมือที่ใช้</th>
                    <th className="pb-3 px-4 font-medium text-right text-indigo-400">จำนวนครั้ง</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentTargets.map((target: any, idx: number) => {
                    const rank = idx + 1 + (targetPage - 1) * targetsPerPage;
                    return (
                    <tr key={`${target.type}_${target.id}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                          rank === 2 ? 'bg-zinc-300/20 text-zinc-300' :
                            rank === 3 ? 'bg-amber-700/20 text-amber-500' :
                              'text-zinc-500'
                          }`}>
                          {rank}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 group/name">
                          <div className="font-medium text-white">{target.name}</div>
                          <button onClick={() => handleCopy(target.name, `name_${target.id}`)} className="text-zinc-500 hover:text-white opacity-0 group-hover/name:opacity-100 transition-opacity" title="Copy Name">
                            {copiedId === `name_${target.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 group/id mt-1">
                          <div className="text-xs text-zinc-500">{target.id}</div>
                          <button onClick={() => handleCopy(target.id, `id_${target.id}`)} className="text-zinc-500 hover:text-white opacity-0 group-hover/id:opacity-100 transition-opacity" title="Copy ID">
                            {copiedId === `id_${target.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${target.type === 'page' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {target.type === 'page' ? 'Page' : 'Group'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {target.users?.map((u: any) => (
                            <span key={u.user_id} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded" title={u.email}>
                              {u.username}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {target.actions?.map((act: string) => {
                            let label = act;
                            let color = 'bg-zinc-800 text-zinc-300';
                            if (act === 'clone') { label = 'DEEP CLONE'; color = 'bg-emerald-500/20 text-emerald-400'; }
                            else if (act === 'remove') { label = 'PAGE REMOVE'; color = 'bg-red-500/20 text-red-400'; }
                            else if (act === 'group_remove') { label = 'GROUP REMOVE'; color = 'bg-orange-500/20 text-orange-400'; }
                            else if (act === 'group_auto_post') { label = 'GROUP POST'; color = 'bg-purple-500/20 text-purple-400'; }
                            else if (act === 'auto_create_page') { label = 'AUTO CREATE'; color = 'bg-indigo-500/20 text-indigo-400'; }
                            else if (act === 'onecard') { label = 'ONE CARD'; color = 'bg-blue-500/20 text-blue-400'; }
                            return (
                              <span key={act} className={`px-2 py-1 text-[10px] rounded font-medium ${color}`}>
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white">
                        {target.count.toLocaleString()}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            {totalTargetPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                <button
                  disabled={targetPage === 1}
                  onClick={() => setTargetPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-zinc-700"
                >
                  ก่อนหน้า
                </button>
                <div className="text-sm font-medium text-zinc-400">
                  หน้า {targetPage} จาก {totalTargetPages}
                </div>
                <button
                  disabled={targetPage === totalTargetPages}
                  onClick={() => setTargetPage(p => Math.min(totalTargetPages, p + 1))}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-zinc-700"
                >
                  ถัดไป
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <p>ไม่มีข้อมูลการใช้งานเพจ/กลุ่มในช่วงนี้</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({
  icon, iconClass, gradientClass, label, value
}: {
  icon: React.ReactNode;
  iconClass: string;
  gradientClass: string;
  label: string;
  value: number | null;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center gap-4 relative">
        <div className={iconClass}>{icon}</div>
        <div>
          <p className="text-sm text-zinc-400 font-medium">{label}</p>
          {value === null ? (
            <div className="w-16 h-8 mt-1 bg-zinc-800 animate-pulse rounded" />
          ) : (
            <h3 className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</h3>
          )}
        </div>
      </div>
    </div>
  );
}