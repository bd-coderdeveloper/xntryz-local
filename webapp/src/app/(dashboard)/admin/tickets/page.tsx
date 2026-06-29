'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { MessageSquare, Loader2, CheckCircle, Clock, ExternalLink, Send } from 'lucide-react';

export default function AdminTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/tickets', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) setTickets(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const content = replyTexts[ticketId]?.trim();
    if (!content) return;

    setSendingTicketId(ticketId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setReplyTexts(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTicketId(null);
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'resolved') return 'เรียบร้อยแล้ว';
    if (status === 'investigating') return 'กำลังตรวจสอบ';
    return 'รอการตอบกลับ';
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-zinc-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-400" />
            Support Tickets (ระบบแจ้งปัญหา)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">รายการแจ้งปัญหา ข้อเสนอแนะ และคำถามจากผู้ใช้งาน</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-zinc-800/50">
          {tickets.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">ไม่มีรายการ Support Ticket</div>
          ) : (
            tickets.map(ticket => {
              const messages: any[] = ticket.messages || [];

              return (
                <div key={ticket.id} className="transition-colors border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <div
                    className="p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.admin-controls')) return;
                      setExpandedId(expandedId === ticket.id ? null : ticket.id);
                    }}
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          ticket.status === 'investigating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                        {ticket.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {statusLabel(ticket.status)}
                      </span>
                      <div className="flex flex-col overflow-hidden">
                        <h3 className="text-white font-bold text-base line-clamp-1">{ticket.subject}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span className="font-medium text-zinc-300">{ticket.user?.username}</span>
                          <span className="text-zinc-600">•</span>
                          <span>{new Date(ticket.created_at).toLocaleString('th-TH')}</span>
                          {messages.length > 0 && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {messages.length} ข้อความ
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 admin-controls">
                      <div className="flex bg-zinc-950/50 rounded-lg p-1 border border-zinc-800">
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'pending')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ticket.status === 'pending' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'investigating')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ticket.status === 'investigating' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Investigating
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ticket.status === 'resolved' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Resolved
                        </button>
                      </div>
                      <div className="text-zinc-500 hidden md:block">
                        {expandedId === ticket.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedId === ticket.id && (
                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300 border-t border-zinc-800/30 mt-2">
                      <div className="text-xs text-zinc-500 mb-3 flex flex-wrap gap-2">
                        <span className="bg-zinc-900 inline-block px-3 py-1 rounded-md">
                          Email ผู้แจ้ง: <span className="text-zinc-300">{ticket.user?.email}</span>
                        </span>
                        {ticket.phone && (
                          <span className="bg-zinc-900 inline-block px-3 py-1 rounded-md">
                            เบอร์โทร: <span className="text-zinc-300">{ticket.phone}</span>
                          </span>
                        )}
                      </div>

                      {/* Original message */}
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 mb-2">ข้อความแรก</p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                          {ticket.message}
                        </div>
                        {ticket.image_url && (
                          <div className="mt-3">
                            <a href={ticket.image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                              <ExternalLink className="w-4 h-4" /> ดูรูปภาพแนบ
                            </a>
                            <img src={ticket.image_url} alt="Attached" className="max-h-32 mt-2 rounded-lg border border-zinc-700 opacity-80 hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      {/* Legacy admin_reply — show only if no messages */}
                      {ticket.admin_reply && messages.length === 0 && (
                        <div className="mb-4 border-t border-zinc-800 pt-4">
                          <p className="text-xs text-zinc-500 mb-2">การตอบกลับเดิม (legacy)</p>
                          <div className="flex justify-start">
                            <div className="max-w-[80%] bg-orange-500/10 border border-orange-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                              <p className="text-xs font-bold text-orange-400 mb-1">Admin</p>
                              <p className="text-sm text-orange-100 whitespace-pre-wrap">{ticket.admin_reply}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Chat thread */}
                      {messages.length > 0 && (
                        <div className="border-t border-zinc-800 pt-4 mb-4 space-y-3">
                          <p className="text-xs text-zinc-500 mb-3">การสนทนา</p>
                          {messages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender_type === 'admin'
                                  ? 'bg-indigo-500/20 border border-indigo-500/30 rounded-tr-sm'
                                  : 'bg-zinc-800 border border-zinc-700 rounded-tl-sm'
                                }`}>
                                <p className={`text-xs font-bold mb-1 ${msg.sender_type === 'admin' ? 'text-indigo-400' : 'text-orange-400'}`}>
                                  {msg.sender_type === 'admin' ? 'Admin' : ticket.user?.username || 'User'}
                                </p>
                                <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs text-zinc-500 mt-1 text-right">{new Date(msg.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply section */}
                      <div className="border-t border-zinc-800 pt-4 admin-controls">
                        <p className="text-xs text-zinc-500 mb-2">ตอบกลับ</p>
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
                            placeholder="พิมพ์ข้อความตอบกลับ... (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัด)"
                            rows={2}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none"
                          />
                          <button
                            onClick={() => handleSendReply(ticket.id)}
                            disabled={sendingTicketId === ticket.id || !replyTexts[ticket.id]?.trim()}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-xl flex items-center gap-2 font-medium transition-colors disabled:opacity-50 self-end py-3"
                          >
                            {sendingTicketId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}