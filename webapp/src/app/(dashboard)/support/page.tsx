'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { HelpCircle, Plus, ImageIcon, Send, Loader2, MessageSquare, CheckCircle, Clock, Bell } from 'lucide-react';

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Reply state per ticket
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);
  const [readTicketIds, setReadTicketIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTickets();

    let channel: any;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('support_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ticket_messages' },
          () => {
            fetchTickets(false);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${session.user.id}` },
          () => {
            fetchTickets(false);
          }
        )
        .subscribe();
    };

    setupRealtime();

    // Polling fallback: Fetch new messages every 10 seconds in case Realtime is blocked by RLS
    const intervalId = setInterval(() => {
      fetchTickets(false);
    }, 10000);

    return () => {
      clearInterval(intervalId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/tickets?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) setTickets(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดไฟล์รูปภาพห้ามเกิน 5MB');
        return;
      }
      setImageFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return setError('กรุณาระบุหัวข้อและรายละเอียด');
    if (!phone) return setError('กรุณาระบุเบอร์โทรศัพท์สำหรับติดต่อกลับ');

    setSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('กรุณาล็อกอินใหม่');

      let uploadedUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('support_attachments')
          .upload(filePath, imageFile);

        if (uploadError) throw new Error(`อัพโหลดรูปไม่สำเร็จ: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('support_attachments')
          .getPublicUrl(filePath);

        uploadedUrl = publicUrl;
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ subject, message, phone, image_url: uploadedUrl })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowNewForm(false);
      setSubject('');
      setMessage('');
      setPhone('');
      setImageFile(null);
      fetchTickets(false);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const content = replyTexts[ticketId]?.trim();
    if (!content) return;

    setSendingTicketId(ticketId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('กรุณาล็อกอินใหม่');

      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReplyTexts(prev => ({ ...prev, [ticketId]: '' }));
      fetchTickets(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingTicketId(null);
    }
  };

  const markAsRead = async (ticketId: string) => {
    if (readTicketIds.has(ticketId)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`/api/tickets/${ticketId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setReadTicketIds(prev => new Set([...Array.from(prev), ticketId]));
      // Update local state so unread dots disappear immediately
      setTickets(prev => prev.map(t =>
        t.id === ticketId
          ? { ...t, messages: (t.messages || []).map((m: any) => m.sender_type === 'admin' ? { ...m, read_by_user: true } : m) }
          : t
      ));
    } catch { }
  };

  const canReply = (status: string) => ['pending', 'investigating'].includes(status);

  const statusLabel = (status: string) => {
    if (status === 'resolved') return 'เรียบร้อยแล้ว';
    if (status === 'investigating') return 'กำลังตรวจสอบ';
    return 'รอการตอบกลับ';
  };

  const hasActiveTicket = tickets.some(t => t.status !== 'resolved');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            ติดต่อทีมงาน (Support)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            แจ้งปัญหาการใช้งาน แนะนำฟีเจอร์ใหม่ หรือสอบถามข้อมูลแพ็กเกจ
          </p>
        </div>
        <button
          onClick={() => {
            if (!showNewForm && hasActiveTicket) {
              alert('คุณมีรายการแจ้งปัญหาที่กำลังดำเนินการอยู่ กรุณารอให้รายการเดิมเสร็จสิ้น (สถานะ: เรียบร้อยแล้ว) ก่อนแจ้งปัญหาใหม่ครับ');
              return;
            }
            setShowNewForm(!showNewForm);
          }}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors w-full sm:w-auto justify-center ${
            !showNewForm && hasActiveTicket
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          title={!showNewForm && hasActiveTicket ? 'คุณมีรายการที่กำลังดำเนินการอยู่' : ''}
        >
          {showNewForm ? 'ยกเลิก' : <><Plus className="w-4 h-4" /> แจ้งปัญหาใหม่</>}
        </button>
      </div>

      {hasActiveTicket && !showNewForm && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <p>คุณมีรายการแจ้งปัญหาที่กำลังดำเนินการอยู่ กรุณารอการติดต่อกลับหรือตรวจสอบการตอบกลับในรายการด้านล่างครับ</p>
        </div>
      )}

      {showNewForm && (
        <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-4">แบบฟอร์มส่งเรื่องติดต่อ</h2>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">เบอร์โทรศัพท์ (สำหรับติดต่อกลับ)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="เช่น: 0812345678"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">หัวข้อเรื่อง</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="เช่น: เจอข้อผิดพลาดตอนดูดโพสต์"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">รายละเอียดปัญหา</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors h-32 resize-none"
              placeholder="อธิบายสิ่งที่คุณพบ หรือสิ่งที่ต้องการให้แอดมินรู้..."
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">แนบรูปภาพ (ไม่บังคับ, ขนาดไม่เกิน 5MB)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="bg-dark-950 border border-dark-800 hover:border-dark-700 text-zinc-300 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                {imageFile ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
              </button>
              {imageFile && <span className="text-sm text-orange-400 truncate max-w-xs">{imageFile.name}</span>}
              {imageFile && (
                <button type="button" onClick={() => setImageFile(null)} className="text-red-400 text-xs hover:underline">
                  เอาออก
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="pt-4 border-t border-dark-800 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              ส่งให้ทีมงานพิจารณา
            </button>
          </div>
        </form>
      )}

      {/* Ticket History */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-dark-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-dark-400" />
            ประวัติการส่งเรื่อง
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-dark-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            ยังไม่มีประวัติการส่งเรื่องติดต่อเข้ามา
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {tickets.map(ticket => {
              const messages: any[] = ticket.messages || [];
              const hasThread = messages.length > 0 || ticket.admin_reply;
              const hasUnread = messages.some((m: any) => m.sender_type === 'admin' && !m.read_by_user)
                || (ticket.admin_reply && messages.length === 0 && !readTicketIds.has(ticket.id));

              return (
                <div key={ticket.id} className="transition-colors hover:bg-dark-950/50">
                  <div
                    className="p-4 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4"
                    onClick={() => {
                      const opening = expandedId !== ticket.id;
                      setExpandedId(opening ? ticket.id : null);
                      if (opening && hasUnread) markAsRead(ticket.id);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium line-clamp-1">{ticket.subject}</h3>
                        {hasUnread && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-bold animate-pulse">
                            <Bell className="w-2.5 h-2.5" />
                            มีข้อความใหม่
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-500">{new Date(ticket.created_at).toLocaleString('th-TH')}</p>
                        {hasThread && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {messages.length} ข้อความ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          ticket.status === 'investigating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                        {ticket.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {statusLabel(ticket.status)}
                      </span>
                      <div className="text-zinc-500">
                        {expandedId === ticket.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedId === ticket.id && (
                    <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">

                      {/* Original message */}
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 mb-2">ข้อความแรก</p>
                        <p className="text-sm text-zinc-300 bg-dark-950 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-dark-800">
                          {ticket.message}
                        </p>
                        {ticket.image_url && (
                          <div className="mt-3">
                            <a href={ticket.image_url} target="_blank" rel="noreferrer" className="inline-block relative group">
                              <img src={ticket.image_url} alt="Attached" className="max-h-48 rounded-lg border border-dark-700 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                <span className="text-white text-xs bg-black/80 px-2 py-1 rounded-md">เปิดรูปขยาย</span>
                              </div>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Chat thread */}
                      {(messages.length > 0 || ticket.admin_reply) && (
                        <div className="border-t border-dark-800 pt-4 mb-4 space-y-3">
                          <p className="text-xs text-zinc-500 mb-3">การสนทนา</p>

                          {/* Legacy admin_reply — show only if no messages yet */}
                          {ticket.admin_reply && messages.length === 0 && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] bg-orange-500/10 border border-orange-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                                <p className="text-xs font-bold text-orange-400 mb-1">ทีมงาน</p>
                                <p className="text-sm text-orange-100 whitespace-pre-wrap">{ticket.admin_reply}</p>
                              </div>
                            </div>
                          )}

                          {messages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender_type === 'user'
                                  ? 'bg-orange-500/20 border border-orange-500/30 rounded-tr-sm'
                                  : 'bg-zinc-800 border border-zinc-700 rounded-tl-sm'
                                }`}>
                                <p className={`text-xs font-bold mb-1 ${msg.sender_type === 'user' ? 'text-orange-400' : 'text-blue-400'}`}>
                                  {msg.sender_type === 'user' ? 'คุณ' : 'ทีมงาน'}
                                </p>
                                <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs text-zinc-500 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply box — only for pending/investigating */}
                      {canReply(ticket.status) ? (
                        <div className="border-t border-dark-800 pt-4">
                          <p className="text-xs text-zinc-500 mb-2">ส่งข้อความเพิ่มเติม</p>
                          <div className="flex gap-2">
                            <textarea
                              value={replyTexts[ticket.id] || ''}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendReply(ticket.id);
                                }
                              }}
                              placeholder="พิมพ์ข้อความเพิ่มเติม... (Enter เพื่อส่ง)"
                              rows={2}
                              className="flex-1 bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none text-sm"
                            />
                            <button
                              onClick={() => handleSendReply(ticket.id)}
                              disabled={sendingTicketId === ticket.id || !replyTexts[ticket.id]?.trim()}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-xl flex items-center gap-2 font-medium transition-colors disabled:opacity-50 self-end py-3"
                            >
                              {sendingTicketId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-dark-800 pt-4">
                          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            Ticket นี้เสร็จสิ้นแล้ว หากมีปัญหาใหม่กรุณาสร้าง Ticket ใหม่
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}