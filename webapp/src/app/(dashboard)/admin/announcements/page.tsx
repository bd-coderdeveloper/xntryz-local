'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Megaphone, Plus, Trash2, Edit2, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [displayStyle, setDisplayStyle] = useState('banner');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/announcements', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) setAnnouncements(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (a: any) => {
    setEditId(a.id);
    setTitle(a.title);
    setContent(a.content);
    setType(a.type);
    setDisplayStyle(a.display_style);
    setIsActive(a.is_active);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setTitle('');
    setContent('');
    setType('info');
    setDisplayStyle('banner');
    setIsActive(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const payload = { title, content, type, display_style: displayStyle, is_active: isActive, id: editId };
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch('/api/admin/announcements', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      handleCancelForm();
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบประกาศนี้?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (a: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id: a.id, is_active: !a.is_active })
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            จัดการประกาศ (Announcements)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">ตั้งค่า Banner หรือ Pop-up แนะนำต่างๆ</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
        >
          {showForm ? 'ปิด' : <><Plus className="w-4 h-4" /> สร้างประกาศ</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white mb-4">{editId ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h2>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">หัวข้อประกาศ (Title)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">ชนิด (Type)</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="info">Info (ฟ้า)</option>
                  <option value="success">Success (เขียว)</option>
                  <option value="warning">Warning (เหลือง)</option>
                  <option value="maintenance">Maintenance (แดง)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">รูปแบบการแสดงผล (Display Style)</label>
                <select
                  value={displayStyle}
                  onChange={(e) => setDisplayStyle(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="banner">Banner (แถบด้านบน)</option>
                  <option value="popup">Pop-up (หน้าต่างเด้งตรงกลาง)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">รายละเอียด (Content)</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-32 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-indigo-500"
                />
                <label htmlFor="isActive" className="text-white font-medium cursor-pointer">
                  เปิดใช้งานประกาศนี้ทันที
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'บันทึกประกาศ'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-zinc-900 border-b border-zinc-800/50 text-zinc-400 text-sm">
            <tr>
              <th className="p-4 font-medium w-16">สถานะ</th>
              <th className="p-4 font-medium">ประกาศ</th>
              <th className="p-4 font-medium w-32 text-center">ชนิด</th>
              <th className="p-4 font-medium w-32 text-center">รูปแบบ</th>
              <th className="p-4 font-medium w-48 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500">ไม่มีประกาศในระบบ</td></tr>
            ) : (
              announcements.map(a => (
                <tr key={a.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-4">
                    <button onClick={() => handleToggleActive(a)} className="focus:outline-none">
                      {a.is_active ?
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                        <XCircle className="w-6 h-6 text-zinc-600 hover:text-zinc-400" />
                      }
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white mb-1">{a.title}</div>
                    <div className="text-zinc-500 truncate max-w-md">{a.content}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs border ${a.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        a.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          a.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      {a.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-zinc-300 font-medium bg-zinc-800 px-2 py-1 rounded text-xs">
                      {a.display_style.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(a)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}