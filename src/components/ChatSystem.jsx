import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, X, Users, Clock, CheckCheck,
  ChevronLeft, Search, Handshake, Circle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const ChatSystem = ({ session, storeName, onClose }) => {
  const [activeChats, setActiveChats] = useState([]); // match_requests แบบ accepted
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // โหลดรายการแชทที่ accepted
  const fetchChats = async () => {
    setLoadingChats(true);
    const { data, error } = await supabase
      .from('match_requests')
      .select('id, partner_id, receiver_user_id, sender_id, message, business_purpose, match_score, created_at, partners(name, type, tags), receiver_profile:profiles!receiver_user_id(store_name, store_type), sender_profile:profiles!sender_id(store_name, store_type)')
      .or(`sender_id.eq.${session.user.id},receiver_user_id.eq.${session.user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedChats = data.map(chat => {
        const isIncoming = chat.receiver_user_id === session.user.id;
        let pName = 'Unknown';
        let pType = 'SME';
        
        if (isIncoming) {
          pName = chat.sender_profile?.store_name || 'ไม่ระบุชื่อ';
          pType = chat.sender_profile?.store_type || 'ไม่ระบุ';
        } else {
          pName = chat.partners?.name || chat.receiver_profile?.store_name || 'ไม่ระบุชื่อ';
          pType = chat.partners?.type || chat.receiver_profile?.store_type || 'Unspecified';
        }
        
        return {
          ...chat,
          displayPartner: {
            name: pName,
            type: pType
          }
        };
      });
      setActiveChats(mappedChats);
    }
    setLoadingChats(false);
  };

  // โหลดข้อความใน chat
  const fetchMessages = async (matchRequestId) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('match_request_id', matchRequestId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
  };

  // Real-time subscription สำหรับ chat_messages
  useEffect(() => {
    if (!selectedChat) return;

    fetchMessages(selectedChat.id);

    const channel = supabase
      .channel(`chat:${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_request_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedChat]);

  // auto-scroll ลงล่าง
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchChats();

    const channel = supabase
      .channel('chat_list_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_requests' },
        () => fetchChats()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMsg) return;
    setSendingMsg(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert({
      match_request_id: selectedChat.id,
      sender_id: session.user.id,
      content,
    });

    if (error) {
      console.error('Chat send error:', error);
      setNewMessage(content);
    }
    setSendingMsg(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredChats = activeChats.filter(c =>
    c.displayPartner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'เมื่อกี้';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const typeColor = {
    'Supplier': 'text-blue-500',
    'Logistics': 'text-orange-500',
    'Retailer / Partner': 'text-green-500',
    'Financial': 'text-purple-500',
  };

  return (
    <div className="flex h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" style={{ minHeight: '600px' }}>
      {/* Sidebar — Chat List */}
      <div className={`w-80 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-blue-600" />
              แชทธุรกิจ
            </h3>
            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
              {activeChats.length} ห้อง
            </span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาพาร์ทเนอร์..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">กำลังโหลด...</div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <Handshake size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">ยังไม่มีห้องแชท</p>
              <p className="text-xs text-slate-400 mt-1">ต้องส่งคำขอจับคู่และรอการยืนยันก่อน</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 border-b border-slate-100 transition hover:bg-white ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
                    {chat.displayPartner?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`font-bold text-sm truncate ${selectedChat?.id === chat.id ? 'text-blue-700' : 'text-slate-800'}`}>
                        {chat.displayPartner?.name}
                      </p>
                      <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{formatTime(chat.created_at)}</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${typeColor[chat.displayPartner?.type] || 'text-slate-500'} font-semibold`}>
                      {chat.displayPartner?.type}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-1">{chat.message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedChat ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle size={36} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">เลือกห้องแชท</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              เลือกพาร์ทเนอร์ที่ยืนยันการร่วมมือแล้วเพื่อเริ่มการเจรจาธุรกิจ
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg">
                {selectedChat.displayPartner?.name?.[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{selectedChat.displayPartner?.name}</h4>
                <div className="flex items-center gap-1.5">
                  <Circle size={8} className="text-green-500 fill-green-500" />
                  <span className="text-xs text-green-600 font-medium">ยืนยันการร่วมมือแล้ว</span>
                  <span className="text-xs text-slate-400">• Match {selectedChat.match_score}%</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* Deal Info Banner */}
            <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <Handshake size={14} className="text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                <strong>ข้อตกลงที่ยืนยันแล้ว:</strong> {selectedChat.message}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-8">
                  เริ่มการเจรจาธุรกิจได้เลย! 👋
                </div>
              )}
              {messages.map((msg) => {
                const isMyMsg = msg.sender_id === session.user.id;
                return (
                  <div key={msg.id} className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'}`}>
                    {!isMyMsg && (
                      <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs mr-2 flex-shrink-0 mt-1">
                        {selectedChat.displayPartner?.name?.[0]}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isMyMsg ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMyMsg
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                        {isMyMsg && <CheckCheck size={12} className="text-blue-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
                  rows={2}
                  className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-sm resize-none transition"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMsg}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 flex-shrink-0 active:scale-95"
                >
                  {sendingMsg ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;
