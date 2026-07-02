import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import StoreSettings from './components/StoreSettings';
import CustomerDemands from './components/CustomerDemands';
import BusinessNetwork from './components/BusinessNetwork';
import MatchRequestModal from './components/MatchRequestModal';
import ChatSystem from './components/ChatSystem';
import { supabase } from './supabaseClient';
import {
  LayoutDashboard,
  Users,
  Handshake,
  Settings,
  Bell,
  TrendingUp,
  ChevronRight,
  Cpu,
  Store,
  Network,
  Share2,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Info,
  ShoppingCart,
  Zap,
  LogOut,
  SlidersHorizontal,
  Activity,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Check,
  X,
  AlertTriangle,
  Download,
  Search,
  MapPin,
  Star,
  Trash2
} from 'lucide-react';

// Fallback ถ้า DB ว่างหรือ fetch ไม่ได้
const fallbackPartners = [
  {
    id: 'p1', name: "Global Tech Wholesale", type: "Supplier", score: 0,
    matchReason: "โดดเด่นด้านราคาต้นทุนสินค้าที่ถูกที่สุด", targetDemand: "d1",
    features: { price: 95, location: 30, logistics: 60, reliability: 90 }, tags: ["Import", "Bulk Price"]
  },
  {
    id: 'p2', name: "Safe Express", type: "Logistics", score: 0,
    matchReason: "ครอบคลุมพื้นที่จัดส่งของคุณด้วยต้นทุนต่ำสุด", targetDemand: "d3",
    features: { price: 60, location: 80, logistics: 95, reliability: 85 }, tags: ["Express", "Regional"]
  },
  {
    id: 'p3', name: "Khon Kaen IT Hub", type: "Retailer / Partner", score: 0,
    matchReason: "อยู่ในพื้นที่เดียวกัน สามารถแลกเปลี่ยนสต็อกได้ทันที", targetDemand: "d2",
    features: { price: 70, location: 100, logistics: 90, reliability: 80 }, tags: ["Local", "Instant Exchange"]
  },
  {
    id: 'p4', name: "FinTech SME Supply", type: "Financial", score: 0,
    matchReason: "มีความน่าเชื่อถือสูงมาก และให้เครดิตการค้าได้", targetDemand: "d1",
    features: { price: 85, location: 40, logistics: 50, reliability: 100 }, tags: ["Credit Line", "Trusted"]
  }
];


const App = () => {
  const [authState, setAuthState] = useState('login');
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMatching, setIsMatching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [toast, setToast] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);

  // UI states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);

  // Match Request Modal
  const [showMatchRequestModal, setShowMatchRequestModal] = useState(false);
  const [requestPartner, setRequestPartner] = useState(null);

  // Match Requests & notifications
  const [matchRequests, setMatchRequests] = useState([]);
  const [notifList, setNotifList] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Reject flow
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Store Search
  const [storeList, setStoreList] = useState([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeLoading, setStoreLoading] = useState(false);

  const notificationsList = notifList.length > 0 ? notifList : [
    { id: 1, title: 'AI Matching Update', desc: 'คะแนนร้านค้าคุณเพิ่มขึ้น +5% เนื่องจากอัปเดตข้อมูล KYC ล่าสุด', time: '2 mins ago', unread: true },
    { id: 2, title: 'Market Trend Alert', desc: 'พบความต้องการ "Laptops" พุ่งสูงในพื้นที่ขอนแก่น (Node: NE-01)', time: '1 hour ago', unread: true },
    { id: 3, title: 'New Enterprise Joined', desc: 'Global Tech Co. เข้าร่วมเครือข่ายและกำลังมองหาพาร์ทเนอร์รายย่อย', time: '3 hours ago', unread: false }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [matchWeights, setMatchWeights] = useState({
    price: 50,
    location: 50,
    logistics: 50,
    reliability: 50
  });

  const [partners, setPartners] = useState(fallbackPartners);
  const [matchHistory, setMatchHistory] = useState([]);

  const [smeProfile, setSmeProfile] = useState({
    id: "001",
    name: "กำลังโหลด...",
    type: "",
    location: "",
    specialty: "PC Components & Gaming Gear",
    matchingScore: 85,
    connections: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        updateProfileFromSession(session);
        fetchConnectionCount(session.user.id);
        fetchMatchHistory(session.user.id);
        fetchMatchRequests(session.user.id);
        fetchNotifications(session.user.id);
        fetchStores();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        updateProfileFromSession(session);
        fetchConnectionCount(session.user.id);
        fetchMatchHistory(session.user.id);
        fetchMatchRequests(session.user.id);
        fetchNotifications(session.user.id);
      }
    });

    fetchPartners();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const matchReqRefetch = () => {
      fetchMatchRequests(session.user.id);
      fetchConnectionCount(session.user.id);
      fetchMatchHistory(session.user.id);
    };

    const matchRequestChannel = supabase
      .channel('match_requests_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_requests' },
        () => matchReqRefetch()
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        () => fetchNotifications(session.user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchRequestChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [session]);


  const updateProfileFromSession = (currentSession) => {
    const meta = currentSession?.user?.user_metadata || {};
    setSmeProfile({
      id: currentSession?.user?.id.substring(0, 8) || "001",
      name: meta.storeName || "ผู้ใช้งานใหม่",
      type: meta.storeType || "ไม่ระบุ",
      location: meta.location || "ไม่ระบุ",
      specialty: "PC Components & Gaming Gear",
      matchingScore: 85,
      connections: 12
    });
  };

  // โหลด partners จาก Supabase DB
  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('fetchPartners: using fallback data', error?.message);
      setPartners(fallbackPartners);
      return;
    }

    // แปลงข้อมูล DB ให้ตรงกับโครงสร้าง App
    const mapped = data.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      score: 0,
      matchReason: p.match_reason,
      targetDemand: p.target_demand,
      features: {
        price: p.feature_price,
        location: p.feature_location,
        logistics: p.feature_logistics,
        reliability: p.feature_reliability,
      },
      tags: p.tags || []
    }));
    setPartners(mapped);
  };

  // โหลดประวัติการจับคู่ (match_history) และ real match requests ที่ยอมรับแล้ว มารวมกัน
  const fetchMatchHistory = async (userId) => {
    try {
      // 1. ดึงข้อมูลคู่ค้าจำลอง
      const { data: historyData } = await supabase
        .from('match_history')
        .select('id, match_score, action, created_at, partner_id, partners(name, type, tags)')
        .eq('user_id', userId)
        .eq('action', 'connect')
        .order('created_at', { ascending: false });

      // 2. ดึงข้อมูลคำขอคู่ค้าจริงที่กดยอมรับสำเร็จแล้ว
      const { data: requestsData } = await supabase
        .from('match_requests')
        .select('id, status, match_score, created_at, partner_id, receiver_user_id, sender_id, partners(name, type, tags), receiver_profile:profiles!receiver_user_id(store_name, store_type), sender_profile:profiles!sender_id(store_name, store_type)')
        .or(`sender_id.eq.${userId},receiver_user_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      let combined = [];

      if (historyData) {
        combined.push(...historyData.map(h => ({
          id: h.id,
          db_id: h.id,
          match_score: h.match_score,
          action: h.action,
          created_at: h.created_at,
          isRealUser: false,
          partners: h.partners
        })));
      }

      if (requestsData) {
        combined.push(...requestsData.map(r => {
          const isIncoming = r.receiver_user_id === userId;
          let pName = 'ไม่ระบุชื่อ';
          let pType = 'SME';
          let pTags = [];

          if (isIncoming) {
            pName = r.sender_profile?.store_name || 'ไม่ระบุชื่อ';
            pType = r.sender_profile?.store_type || 'ไม่ระบุ';
          } else {
            pName = r.partners?.name || r.receiver_profile?.store_name || 'ไม่ระบุชื่อ';
            pType = r.partners?.type || r.receiver_profile?.store_type || 'Unspecified';
            pTags = r.partners?.tags || [];
          }

          return {
            id: r.id,
            db_id: r.id,
            match_score: r.match_score,
            action: 'connect',
            created_at: r.created_at,
            isRealUser: true,
            partners: {
              name: pName,
              type: pType,
              tags: pTags
            }
          };
        }));
      }

      // เรียงจากใหม่ไปเก่า
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // กรองเพื่อป้องกันแสดงผลซ้ำทางฝั่ง Frontend (กรองตามชื่อและประเภท)
      const seen = new Set();
      const uniqueCombined = [];
      for (const item of combined) {
        const partnerKey = `${item.partners?.name || ''}-${item.partners?.type || ''}`;
        if (!seen.has(partnerKey)) {
          seen.add(partnerKey);
          uniqueCombined.push(item);
        }
      }

      setMatchHistory(uniqueCombined);
    } catch (err) {
      console.error('Error combining match history:', err);
    }
  };

  const fetchConnectionCount = async (userId) => {
    try {
      const { count: simulatedCount } = await supabase
        .from('match_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', 'connect');

      const { count: realCount } = await supabase
        .from('match_requests')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_user_id.eq.${userId}`)
        .eq('status', 'accepted');

      const total = (simulatedCount || 0) + (realCount || 0);
      setConnectionCount(total);
      setSmeProfile(prev => ({ ...prev, connections: total }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatchRequests = async (userId) => {
    const { data, error } = await supabase
      .from('match_requests')
      .select('id, status, message, business_purpose, match_score, created_at, updated_at, reject_reason, partner_id, receiver_user_id, sender_id, partners(name, type, tags), receiver_profile:profiles!receiver_user_id(store_name, store_type), sender_profile:profiles!sender_id(store_name, store_type)')
      .or(`sender_id.eq.${userId},receiver_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch requests error:', error.message);
    } else if (data) {
      setMatchRequests(data);
      // count pending incoming requests
      setPendingRequestsCount(data.filter(r => r.status === 'pending' && r.receiver_user_id === userId).length);
    }
  };

  const fetchNotifications = async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data && data.length > 0) {
      setNotifList(data.map(n => ({ id: n.id, title: n.title, desc: n.description, time: new Date(n.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }), unread: !n.is_read })));
    }
  };

  const markAllNotifRead = async (userId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setNotifList(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const fetchStores = async (searchQuery = '') => {
    setStoreLoading(true);
    try {
      // Try the view first
      let query = supabase
        .from('store_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`store_name.ilike.%${searchQuery}%,store_type.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Exclude own store
        const myId = (await supabase.auth.getUser()).data.user?.id;
        setStoreList(data.filter(s => s.id !== myId));
      } else {
        // Fallback: query profiles directly
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, store_name, store_type, location, created_at')
          .order('created_at', { ascending: false });
        if (profileData) {
          const myId = (await supabase.auth.getUser()).data.user?.id;
          setStoreList(profileData
            .filter(s => s.id !== myId)
            .filter(s => !searchQuery || s.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.location?.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
      }
    } catch (e) {
      console.warn('fetchStores error:', e);
    } finally {
      setStoreLoading(false);
    }
  };

  // เปิด Modal ส่งคำขอ
  const openMatchRequestModal = (partner) => {
    setRequestPartner(partner);
    setShowMatchRequestModal(true);
  };

  const handleRequestSent = () => {
    setShowMatchRequestModal(false);
    setRequestPartner(null);
    setSelectedMatch(null);
    if (session) {
      fetchMatchRequests(session.user.id);
      fetchMatchHistory(session.user.id);
      fetchConnectionCount(session.user.id);
    }
  };

  const handleCancelRequest = async (requestId) => {
    const { error } = await supabase.from('match_requests').update({ status: 'cancelled' }).eq('id', requestId);
    if (!error) {
      showToast('ยกเลิกคำขอแล้ว');
      if (session) fetchMatchRequests(session.user.id);
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const openRejectModal = (request) => {
    setRejectTarget(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveRequest = async (requestId) => {
    const { error } = await supabase.from('match_requests').update({ status: 'accepted' }).eq('id', requestId);
    if (!error) {
      showToast('✅ ยอมรับข้อเสนอแล้ว! เปิดแชทได้เลย');
      if (session) { fetchMatchRequests(session.user.id); fetchConnectionCount(session.user.id); }
    } else showToast('เกิดข้อผิดพลาด', 'error');
  };

  const handleRejectRequest = async () => {
    if (!rejectTarget) return;
    const { error } = await supabase.from('match_requests').update({ status: 'rejected', reject_reason: rejectReason || 'ไม่ระบุเหตุผล' }).eq('id', rejectTarget.id);
    if (!error) {
      showToast('ปฏิเสธข้อเสนอแล้ว');
      setShowRejectModal(false);
      setRejectTarget(null);
      if (session) fetchMatchRequests(session.user.id);
    } else showToast('เกิดข้อผิดพลาด', 'error');
  };

  const handleDeleteConnection = async (conn) => {
    const partnerName = conn.partners?.name || conn.name || 'ไม่ระบุชื่อ';
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบความร่วมมือกับร้านค้า "${partnerName}"?`)) {
      if (conn.isRealUser) {
        const { error } = await supabase
          .from('match_requests')
          .delete()
          .eq('id', conn.id);
        if (!error) {
          showToast('ลบการเชื่อมต่อคู่ค้าแล้ว');
          if (session) {
            fetchMatchRequests(session.user.id);
            fetchMatchHistory(session.user.id);
            fetchConnectionCount(session.user.id);
          }
        } else {
          showToast('เกิดข้อผิดพลาดในการลบ', 'error');
        }
      } else {
        const { error } = await supabase
          .from('match_history')
          .delete()
          .eq('id', conn.id);
        if (!error) {
          showToast('ลบการเชื่อมต่อคู่ค้าแล้ว');
          if (session) {
            fetchMatchHistory(session.user.id);
            fetchConnectionCount(session.user.id);
          }
        } else {
          showToast('เกิดข้อผิดพลาดในการลบ', 'error');
        }
      }
    }
  };

  const handleConnect = async (partner) => {
    if (!session) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partner.id);

      if (partner.isRealUser || (isUUID && !partner.id.startsWith('p'))) {
        // หากเป็นร้านค้าจริงที่มีโปรไฟล์ ให้เปิด modal เพื่อกรอกรายละเอียดส่งคำขอ
        openMatchRequestModal(partner);
        return;
      }

      // ดึง ID สากลจากตาราง partners สำหรับพาร์ทเนอร์จำลอง เพื่อไม่เกิด UUID mismatch
      let pId = partner.id;
      if (!pId || String(pId).startsWith('p')) {
        const { data: dbP } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partner.name)
          .limit(1);
        if (dbP && dbP.length > 0) pId = dbP[0].id;
      }

      // ตรวจสอบข้อมูลก่อนเพื่อป้องกันการเชื่อมต่อซ้ำ
      const { data: existing } = await supabase
        .from('match_history')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('partner_id', pId)
        .eq('action', 'connect')
        .limit(1);

      if (existing && existing.length > 0) {
        showToast('คุณได้เพิ่มคู่ค้ารายนี้ในระบบแล้ว', 'error');
        return;
      }

      const { error } = await supabase.from('match_history').insert({
        user_id: session.user.id,
        partner_id: pId,
        weight_price: matchWeights.price,
        weight_location: matchWeights.location,
        weight_logistics: matchWeights.logistics,
        weight_reliability: matchWeights.reliability,
        match_score: partner.score || 0,
        action: 'connect'
      });

      if (!error) {
        showToast(`🤝 เชื่อมต่อความร่วมมือกับ "${partner.name}" สำเร็จ!`);
        fetchMatchHistory(session.user.id);
        fetchConnectionCount(session.user.id);
      } else {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleAIFeedback = async (type, partner) => {
    if (!session) return;
    try {
      let partnerId = partner?.id;
      if (!partnerId || String(partnerId).startsWith('p')) {
        const { data: dbP } = await supabase.from('partners').select('id').eq('name', partner.name).limit(1);
        if (dbP && dbP.length > 0) partnerId = dbP[0].id; else partnerId = null;
      }
      await supabase.from('ai_feedback').insert({ user_id: session.user.id, partner_id: partnerId || null, feedback: type });
      showToast(type === 'positive' ? '👍 ขอบคุณ! AI จะเรียนรู้คำแนะนำของคุณ' : '👎 รับทราบแล้ว AI จะปรับปรุงการแนะนำต่อไป');
    } catch (err) { showToast('บันทึก feedback ไม่สำเร็จ', 'error'); }
  };

  const handleSharePartner = async (partner) => {
    const text = `พาร์ทเนอร์แนะนำ: ${partner.name} (${partner.type}) — Match Score ${partner.score}%`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 คัดลอกข้อมูลพาร์ทเนอร์แล้ว!');
    } catch { showToast('ไม่สามารถคัดลอกได้', 'error'); }
  };

  const handleDownloadPDF = () => {
    window.print();
    showToast('📄 เปิด Print Dialog แล้ว — บันทึกเป็น PDF');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ดึงข้อมูล Real-time จาก API ภายนอก (DummyJSON)
  const [customerDemands, setCustomerDemands] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(true);

  // ฟังชันก์ดึงข้อมูลตลาดโลก (DummyJSON + Local PC Hardware Database)
  const fetchLiveDemands = useCallback(async (searchQuery = '') => {
    setIsApiLoading(true);
    try {
      // 1. ดึงข้อมูลจาก Global API (DummyJSON) สำหรับหมวดหมู่ Laptops, Phones
      const url = searchQuery
        ? `https://dummyjson.com/products/search?q=${searchQuery}&limit=50`
        : 'https://dummyjson.com/products/category/laptops?limit=5';

      let apiItProducts = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 วินาที timeout
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const itCategories = ["smartphones", "laptops", "tablets", "mobile-accessories", "laptops"];
          apiItProducts = data.products.filter(p => itCategories.includes(p.category));
        }
      } catch (err) {
        console.warn("Global API Fetch Timeout or Error, using Local DB fallback:", err.message);
      }

      // 2. Local Database สำหรับอุปกรณ์ PC Hardware เชิงลึกแบรนด์ดัง 
      // แก้ไขเป็นใช้ Premium Dark Placeholder เพื่องานระดับ B2B Enterprise ที่ดูสะอาดตายิ่งขึ้น
      const localHardwareDB = [
        { id: 101, title: 'GeForce RTX 5090 24GB GDDR7', brand: 'NVIDIA', category: 'gpu', price: 1599, stock: 2, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=RTX+5090' },
        { id: 102, title: 'Ryzen 9 7950X3D', brand: 'AMD', category: 'cpu', price: 699, stock: 12, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=CPU+Ryzen' },
        { id: 103, title: 'ROG Strix Z790-E Gaming WiFi', brand: 'ASUS', category: 'mainboard', price: 499, stock: 8, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Motherboard' },
        { id: 104, title: 'Vengeance RGB 64GB DDR5', brand: 'Corsair', category: 'ram', price: 250, stock: 45, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=DDR5+RAM' },
        { id: 105, title: 'Odyssey G9 49" OLED 240Hz', brand: 'Samsung', category: 'monitor', price: 1799, stock: 3, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Ultrawide' },
        { id: 106, title: 'G Pro X Superlight 2', brand: 'Logitech', category: 'mouse', price: 159, stock: 120, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Gaming+Mouse' },
        { id: 107, title: 'Q1 Pro Custom Mechanical', brand: 'Keychron', category: 'keyboard', price: 199, stock: 15, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Keyboard' },
        { id: 108, title: 'Kraken Elite 360 RGB', brand: 'NZXT', category: 'fan', price: 279, stock: 20, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Liquid+Cooler' },
        { id: 109, title: 'O11 Dynamic EVO XL', brand: 'Lian Li', category: 'case', price: 249, stock: 10, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=PC+Case' },
        { id: 110, title: 'INZONE H9 Wireless PC', brand: 'Sony', category: 'headphone', price: 299, stock: 35, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=Headset' },
        { id: 111, title: '990 PRO 2TB PCIe 4.0 NVMe', brand: 'Samsung', category: 'ssd', price: 169, stock: 50, thumbnail: 'https://placehold.co/200x200/1e293b/ffffff.png?text=NVMe+SSD' }
      ];

      // 3. รวม Database ทั้ง 2 แหล่งเข้าด้วยกัน
      let combinedProducts = [...apiItProducts, ...localHardwareDB];

      // 4. ค้นหาสินค้าจาก Database ที่รวมแล้ว
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        combinedProducts = combinedProducts.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      } else {
        // หากไม่มีการค้นหา ให้โชว์ Local Hardware เป็นหลัก (เพราะภาพสวยกว่า) + Laptops จาก API
        combinedProducts = [...apiItProducts.slice(0, 2), ...localHardwareDB].sort(() => Math.random() - 0.5).slice(0, 6);
      }

      // 5. นำ Data มาคำนวณ Business Logic
      const liveDemands = combinedProducts.slice(0, 6).map((p, i) => {
        const urgencyScore = Math.min(100, Math.max(20, 100 - p.stock));

        // แก้ปัญหาชื่อแบรนด์ซ้ำ
        const brand = p.brand ? p.brand.trim() : '';
        const title = p.title ? p.title.trim() : '';
        let displayName = title;
        if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
          displayName = `${brand} ${title}`;
        }

        return {
          id: `demand-${p.id ?? i}-${i}`, // unique id per entry
          item: `${displayName} (${p.category})`,
          demandLevel: urgencyScore > 70 ? "High" : "Medium",
          gap: p.stock < 20 ? `วิกฤตสต็อกตลาดโลกเหลือ ${p.stock} ชิ้น` : `ต้นทุนแปรปรวน ($${p.price})`,
          urgency: urgencyScore,
          image: p.thumbnail // เก็บรูปภาพ
        };
      });

      setCustomerDemands(liveDemands);
    } catch (error) {
      console.error("Live API Fetch Failed:", error);
    } finally {
      setIsApiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDemands();
  }, []);

  const handleRunMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      const calculated = partners.map(p => {
        const totalWeight = matchWeights.price + matchWeights.location + matchWeights.logistics + matchWeights.reliability;
        let score = 0;
        if (totalWeight > 0) {
          score = (
            (p.features.price * matchWeights.price) +
            (p.features.location * matchWeights.location) +
            (p.features.logistics * matchWeights.logistics) +
            (p.features.reliability * matchWeights.reliability)
          ) / totalWeight;
        } else {
          score = (p.features.price + p.features.location + p.features.logistics + p.features.reliability) / 4;
        }

        let newReason = p.matchReason;
        const maxWeightKey = Object.keys(matchWeights).reduce((a, b) => matchWeights[a] > matchWeights[b] ? a : b);
        if (matchWeights[maxWeightKey] > 70) {
          if (maxWeightKey === 'price' && p.features.price > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ราคาสินค้าที่ถูกที่สุด'";
          if (maxWeightKey === 'location' && p.features.location > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'พื้นที่ใกล้เคียงจัดการง่าย'";
          if (maxWeightKey === 'logistics' && p.features.logistics > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ค่าขนส่งที่คุ้มค่า'";
          if (maxWeightKey === 'reliability' && p.features.reliability > 80) newReason = "ถูกเลือกเพราะตอบโจทย์น้ำหนักด้าน 'ความน่าเชื่อถือสูงสุด'";
        }

        return { ...p, score: Math.round(score), matchReason: newReason };
      });

      const sorted = calculated.sort((a, b) => b.score - a.score);
      setPartners(sorted);
      setIsMatching(false);
    }, 1000);
  };

  useEffect(() => {
    handleRunMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) {
    if (authState === 'register') {
      return <Register onNavigateLogin={() => setAuthState('login')} />;
    }
    return <Login onNavigateRegister={() => setAuthState('register')} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-bold text-white text-sm animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          <span>{toast.message}</span>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2 py-4 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Handshake size={24} />
          </div>
          <h1 className="text-xl font-bold leading-tight">SME IT<br /><span className="text-blue-400">Matchmaking</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> แผงควบคุม (Dashboard)
          </button>
          <button onClick={() => setActiveTab('matching')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'matching' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <Cpu size={20} /> ระบบจับคู่ (AI Engine)
          </button>
          <button onClick={() => setActiveTab('network')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'network' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}>
            <Network size={20} /> โครงข่ายธุรกิจ (Graph)
          </button>
          <div className="pt-4 pb-2 px-3 text-[15px] font-bold text-slate-500 uppercase tracking-widest">การจัดการ</div>
          <button
            onClick={() => setActiveTab('demands')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${activeTab === 'demands'
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/40 text-white font-bold scale-[1.02]'
              : 'bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-slate-700 hover:to-orange-900/40 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]'
              }`}
          >
            <div className={`flex items-center gap-3 relative z-10 ${activeTab !== 'demands' ? 'group-hover:translate-x-1 transition-transform' : ''}`}>
              <div className="relative">
                <ShoppingCart size={20} className={activeTab === 'demands' ? 'text-white' : 'text-orange-500'} />
                {activeTab !== 'demands' && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-slate-800"></span>
                  </span>
                )}
              </div>
              <span className={`font-bold ${activeTab === 'demands' ? '' : 'tracking-wide'}`}>ความต้องการลูกค้า</span>
            </div>

            {activeTab !== 'demands' && (
              <span className="relative z-10 text-[9px] font-black bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse shadow-sm tracking-wider">
                Hot
              </span>
            )}
            {activeTab !== 'demands' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500 rounded-l-xl"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'connections' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Users size={20} /> รายชื่อคู่ค้า
            {connectionCount > 0 && (
              <span className="ml-auto bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{connectionCount}</span>
            )}
          </button>

          {/* ค้นหาร้านค้า Tab */}
          <button
            onClick={() => { setActiveTab('storebrowse'); fetchStores(storeSearch); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'storebrowse' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Search size={20} /> ค้นหาร้านค้า
            {storeList.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{storeList.length}</span>
            )}
          </button>

          {/* คำขอจับคู่ Tab */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'requests' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <FileText size={20} /> คำขอจับคู่
            {pendingRequestsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingRequestsCount}</span>
            )}
          </button>

          {/* แชท Tab */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'chat' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <MessageCircle size={20} /> แชทธุรกิจ
            {matchRequests.filter(r => r.status === 'accepted').length > 0 && (
              <span className="ml-auto bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {matchRequests.filter(r => r.status === 'accepted').length}
              </span>
            )}
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-4">
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Settings size={20} /> ตั้งค่าร้านค้า (KYC)
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition text-slate-400 mt-1">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-xl font-bold">สวัสดี, {smeProfile.name}</h2>
            <p className="text-sm text-slate-500">Node ID: {smeProfile.id} | <span className="text-green-600 font-medium">System Ready</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="bg-slate-100 p-2 rounded-full relative cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && session) markAllNotifRead(session.user.id);
              }}
            >
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800">การแจ้งเตือนจาก AI</h3>
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">2 ใหม่</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsList.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold ${notif.unread ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.unread && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>}
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">{notif.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pl-4">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer rounded-b-2xl transition" onClick={() => { setShowNotifications(false); setActiveTab('notifications'); }}>
                    ดูทั้งหมด
                  </div>
                </div>
              )}
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              IT
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">Match Rate</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">85%</span>
                  <span className="text-green-500 text-xs font-bold mb-1 flex items-center"><TrendingUp size={12} /> +2.4%</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">ความต้องการที่รอการแก้ไข</p>
                <span className="text-3xl font-bold text-orange-500">{customerDemands.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">พาร์ทเนอร์แนะนำ</p>
                <span className="text-3xl font-bold text-blue-600">{partners.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-2">คู่ค้าที่เชื่อมต่อแล้ว</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-green-600">{connectionCount}</span>
                  <span className="text-green-500 text-xs font-bold mb-1">Connections</span>
                </div>
              </div>
            </div>

            {/* Customer Demand Section - Added Back */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><ShoppingCart className="text-orange-500" size={20} /> ความต้องการจากลูกค้าในร้าน (Live Demand)</h3>
                <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold">อัปเดตแบบ Real-time</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customerDemands.map(demand => (
                  <div key={demand.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition group">
                    <div className="flex justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${demand.demandLevel === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {demand.demandLevel} Demand
                      </span>
                      <Zap size={14} className={demand.urgency > 80 ? 'text-orange-500 fill-orange-500' : 'text-slate-300'} />
                    </div>
                    <h4 className="font-bold text-slate-800">{demand.item}</h4>
                    <p className="text-xs text-slate-500 mt-1">ปัญหา: {demand.gap}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden mr-4">
                        <div className="h-full bg-orange-500" style={{ width: `${demand.urgency}%` }}></div>
                      </div>
                      <button onClick={() => setActiveTab('matching')} className="text-blue-600 opacity-0 group-hover:opacity-100 transition"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold">ขยายขอบเขตธุรกิจด้วย AI</h3>
                  <p className="text-slate-300 max-w-md">ระบบ GNN กำลังประมวลผลความสัมพันธ์แบบหลายมิติ เพื่อค้นหา Supplier และ Partner ที่เหมาะสมที่สุดสำหรับร้านค้าของคุณในไตรมาสนี้</p>
                  <div className="flex gap-4">
                    <button onClick={() => setActiveTab('matching')} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2">
                      <BarChart3 size={18} /> ดูการวิเคราะห์การจับคู่
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md text-center">
                  <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Trust Score</p>
                  <p className="text-4xl font-bold text-green-400">9.2</p>
                  <p className="text-[10px] text-slate-500 mt-2 tracking-widest">RANKED #1 IN KHON KAEN</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matching' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6">
              {/* Sliders UI */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h4 className="font-bold flex items-center gap-2 mb-4"><SlidersHorizontal size={18} className="text-purple-600" /> ปรับแต่งความสำคัญ (AI Preferences)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ราคาสินค้าถูก (Price/Cost)</span>
                      <span className="text-blue-600">{matchWeights.price}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.price} onChange={(e) => setMatchWeights({ ...matchWeights, price: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ระยะทางใกล้ชิด (Location)</span>
                      <span className="text-blue-600">{matchWeights.location}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.location} onChange={(e) => setMatchWeights({ ...matchWeights, location: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ค่าจัดส่งถูก (Logistics)</span>
                      <span className="text-blue-600">{matchWeights.logistics}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.logistics} onChange={(e) => setMatchWeights({ ...matchWeights, logistics: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>ความน่าเชื่อถือ (Reliability)</span>
                      <span className="text-blue-600">{matchWeights.reliability}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={matchWeights.reliability} onChange={(e) => setMatchWeights({ ...matchWeights, reliability: parseInt(e.target.value) })} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2"><Cpu size={18} className="text-blue-600" /> รายการแนะนำที่คำนวณจาก Preferences</h3>
                <button onClick={handleRunMatch} className={`text-sm font-bold px-4 py-2 border rounded-lg transition-all ${isMatching ? 'text-slate-400 bg-slate-50' : 'text-blue-600 hover:bg-blue-50 border-blue-200'}`} disabled={isMatching}>
                  {isMatching ? 'กำลังประมวลผล...' : 'รัน AI จัดอันดับใหม่'}
                </button>
              </div>

              <div className="space-y-4">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => setSelectedMatch(partner)}
                    className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${selectedMatch?.id === partner.id ? 'border-blue-500 ring-4 ring-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl">{partner.name[0]}</div>
                        <div>
                          <h4 className="font-bold">{partner.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{partner.type}</span>
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <ShoppingCart size={10} /> แก้ไขปัญหา: {customerDemands.find(d => d.id === partner.targetDemand)?.item}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-blue-600 leading-none">{partner.score}%</div>
                        <p className="text-[8px] text-slate-400 uppercase font-black mt-1">Match Score</p>
                      </div>
                    </div>
                    {selectedMatch?.id === partner.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-sm font-bold text-slate-700 mb-3">AI Analysis Features:</p>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(partner.features).map(([key, val]) => (
                            <div key={key}>
                              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                                <span>{key}</span>
                                <span>{val}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex gap-3">
                          <button
                            onClick={() => openMatchRequestModal(partner)}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Send size={15} /> ส่งคำขอจับคู่
                          </button>
                          <button onClick={() => handleSharePartner(partner)} className="px-5 py-3 border rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-500 transition" title="คัดลอกข้อมูลพาร์ทเนอร์">
                            <Share2 size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Insight Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none group-hover:from-blue-100/50 transition-all"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><Info size={18} className="text-blue-600" /> AI Strategic Insight</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-white border border-blue-100 rounded-xl text-sm border-l-4 border-l-blue-500 shadow-sm">
                        <p className="text-slate-700 leading-relaxed font-medium">
                          "จากการวิเคราะห์ Demand ของลูกค้า พบว่ามีความต้องการ <strong>อุปกรณ์กลุ่ม High-End PC</strong> สูงมากในพื้นที่ของคุณ เราจึงดึงข้อมูลพาร์ทเนอร์ที่มี Edge ความสัมพันธ์ที่แข็งแกร่งกับแบรนด์โดยตรงมาแนะนำ เพื่อลดต้นทุน Logistics ลง 15%"
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Feedback สำหรับ AI โมเดล</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleAIFeedback('positive', selectedMatch)} className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition" title="AI แนะนำถูกต้อง">
                            <ThumbsUp size={18} />
                          </button>
                          <button onClick={() => handleAIFeedback('negative', selectedMatch)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition" title="AI แนะนำไม่ตรง">
                            <ThumbsDown size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAIReport(true)}
                    className="hidden md:flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 ml-6 min-w-[140px]"
                  >
                    <div className="bg-white/20 p-2 rounded-full mb-2">
                      <Activity size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Generate</span>
                    <span className="text-sm font-black">AI Report</span>
                  </button>
                </div>
              </div>


              {/* Technical Graph Visualization */}
              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-2 z-10">
                  <h4 className="font-bold flex items-center gap-2 text-blue-400 uppercase text-xs tracking-widest">
                    <Network size={16} /> Topological Matchmaking
                  </h4>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-6 z-10">Real-time graph neural network connecting you with optimal business nodes.</p>

                <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                  {/* Glowing Background Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  {/* SVG Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                      <linearGradient id="gradTopRight" x1="50%" y1="50%" x2="80%" y2="25%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="gradBottomLeft" x1="50%" y1="50%" x2="25%" y2="80%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="gradTopLeft" x1="50%" y1="50%" x2="25%" y2="20%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="url(#gradTopRight)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_3s_ease-in-out_infinite]" />
                    <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="url(#gradBottomLeft)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_2.5s_ease-in-out_infinite]" />
                    <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="url(#gradTopLeft)" strokeWidth="2" strokeDasharray="4,4" className="animate-[pulse_4s_ease-in-out_infinite]" />
                  </svg>

                  {/* Central Node (Your Store) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20 relative">
                      <Store size={26} className="text-white" />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <span className="mt-2 text-[10px] font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-md border border-slate-700">Central Node</span>
                  </div>

                  {/* Partner 1 Node (Supplier - Green) */}
                  <div className="absolute top-[25%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-green-500/50 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:bg-green-500/20 group-hover:border-green-400 group-hover:scale-110 transition-all duration-300">
                      <ShoppingCart size={16} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-green-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-green-500/30 shadow-lg">
                      Supplier (98%)
                    </div>
                  </div>

                  {/* Partner 2 Node (Logistics - Orange) */}
                  <div className="absolute top-[80%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:bg-orange-500/20 group-hover:border-orange-400 group-hover:scale-110 transition-all duration-300">
                      <Zap size={16} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-orange-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-orange-500/30 shadow-lg">
                      Logistics (92%)
                    </div>
                  </div>

                  {/* Partner 3 Node (Financial - Purple) */}
                  <div className="absolute top-[20%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer hover:z-30">
                    <div className="w-9 h-9 bg-slate-800 rounded-full border-2 border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:bg-purple-500/20 group-hover:border-purple-400 group-hover:scale-110 transition-all duration-300">
                      <Users size={14} />
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-purple-300 group-hover:-translate-y-1 transition-all duration-300 border border-transparent group-hover:border-purple-500/30 shadow-lg">
                      FinTech (88%)
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex flex-col">
                    <span className="uppercase text-slate-500 mb-0.5">Algorithm</span>
                    <span className="text-blue-400 font-bold">GNN-LinkPredict</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="uppercase text-slate-500 mb-0.5">Edges Processed</span>
                    <span className="text-white font-bold tracking-wider">2.4M / SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'demands' && (
          <CustomerDemands
            demands={customerDemands}
            partners={partners}
            onNavigateMatch={() => setActiveTab('matching')}
            onSearch={fetchLiveDemands}
            isApiLoading={isApiLoading}
          />
        )}

        {activeTab === 'network' && (
          <BusinessNetwork
            partners={partners}
            demands={customerDemands}
            session={session}
            storeName={smeProfile.name}
            onConnect={(partner) => {
              handleConnect(partner);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettings smeProfile={smeProfile} />
        )}

        {activeTab === 'connections' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Users size={24} className="text-blue-600" />
                  รายชื่อคู่ค้าของฉัน
                </h2>
                <p className="text-sm text-slate-500 mt-1">ข้อมูลจากฐานข้อมูล Supabase — แบบ Real-time</p>
              </div>
              <button
                onClick={() => session && fetchMatchHistory(session.user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Activity size={16} /> Refresh ข้อมูล
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-3xl font-black text-green-600">{matchHistory.length}</div>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">การเชื่อมต่อทั้งหมด</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-3xl font-black text-blue-600">
                  {matchHistory.length > 0
                    ? Math.round(matchHistory.reduce((s, h) => s + h.match_score, 0) / matchHistory.length)
                    : 0}%
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Match Score เฉลี่ย</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-3xl font-black text-orange-500">
                  {new Set(matchHistory.map(h => h.partners?.type)).size}
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">ประเภทคู่ค้า</p>
              </div>
            </div>

            {/* Connection List */}
            {matchHistory.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={32} className="text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-600 text-lg">ยังไม่มีคู่ค้า</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">ไปที่หน้า "ระบบจับคู่" แล้วกดปุ่ม "สร้างความร่วมมือธุรกิจ" เพื่อเพิ่มคู่ค้าครับ</p>
                <button
                  onClick={() => setActiveTab('matching')}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  ไปหน้าระบบจับคู่ →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchHistory.map((h, i) => {
                  const p = h.partners;
                  const typeColor = {
                    'Supplier': 'bg-blue-100 text-blue-700',
                    'Logistics': 'bg-orange-100 text-orange-700',
                    'Retailer / Partner': 'bg-green-100 text-green-700',
                    'Financial': 'bg-purple-100 text-purple-700',
                  }[p?.type] || 'bg-slate-100 text-slate-700';

                  return (
                    <div
                      key={h.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">{p?.name || 'Unknown Partner'}</h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColor} mt-1 inline-block`}>
                            {p?.type || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-600">{h.match_score}%</div>
                          <div className="text-[10px] text-slate-400">Match Score</div>
                        </div>
                      </div>

                      {/* Score Bar */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                          style={{ width: `${h.match_score}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50">
                        <div className="flex gap-1 flex-wrap">
                          {(p?.tags || []).slice(0, 2).map((tag, ti) => (
                            <span key={ti} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDeleteConnection(h)}
                            className="bg-red-50 hover:bg-rose-50 text-red-500 hover:text-red-700 p-2 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
                            title="ลบคู่ค้า"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="font-medium">
                            {new Date(h.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: ค้นหาร้านค้า ========== */}
        {activeTab === 'storebrowse' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Search size={24} className="text-blue-600" />
                  ค้นหาร้านค้าในระบบ
                </h2>
                <p className="text-sm text-slate-500 mt-1">ร้านค้าที่ลงทะเบียนทั้งหมดในระบบ SME IT Matching</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">{storeList.length} ร้านค้า</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อร้าน, ประเภท, หรือพื้นที่..."
                value={storeSearch}
                onChange={e => {
                  setStoreSearch(e.target.value);
                  fetchStores(e.target.value);
                }}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition shadow-sm"
              />
              {storeLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin" />
              )}
            </div>

            {/* Store Grid */}
            {storeLoading && storeList.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">กำลังโหลดข้อมูลร้านค้า...</div>
            ) : storeList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                <Search size={36} className="text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-600">ไม่พบร้านค้า</h3>
                <p className="text-slate-400 text-sm mt-2">
                  {storeSearch ? `ไม่พบร้านที่ตรงกับ "${storeSearch}"` : 'ยังไม่มีร้านค้าอื่นลงทะเบียนในระบบ หรือกรุณารัน SQL ก่อน'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeList.map(store => {
                  const typeColor = {
                    'Retailer': 'bg-blue-100 text-blue-700',
                    'Supplier': 'bg-green-100 text-green-700',
                    'Logistics': 'bg-orange-100 text-orange-700',
                    'Financial': 'bg-purple-100 text-purple-700',
                  }[store.store_type] || 'bg-slate-100 text-slate-700';

                  const totalScore = Math.round(
                    ((store.score_reliability || 0) + (store.score_logistics || 0) + (store.score_price || 0)) / 3
                  );
                  const hasKYC = (store.score_reliability || 0) + (store.score_logistics || 0) + (store.score_price || 0) > 0;

                  return (
                    <div key={store.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-blue-400 font-black text-xl flex-shrink-0 shadow-lg">
                            {(store.store_name || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-base">{store.store_name || 'ไม่ระบุชื่อ'}</h3>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColor}`}>{store.store_type || 'ไม่ระบุ'}</span>
                          </div>
                        </div>
                        {hasKYC && (
                          <div className="text-right">
                            <div className={`text-2xl font-black ${totalScore >= 70 ? 'text-green-600' : totalScore >= 40 ? 'text-orange-500' : 'text-slate-400'}`}>{totalScore}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">KYC Score</div>
                          </div>
                        )}
                      </div>

                      {store.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <MapPin size={12} className="text-blue-400" />
                          <span>{store.location}</span>
                        </div>
                      )}

                      {hasKYC && (
                        <div className="space-y-2 mb-4">
                          {[
                            { label: 'Reliability', val: store.score_reliability || 0, color: 'bg-purple-500' },
                            { label: 'Logistics', val: store.score_logistics || 0, color: 'bg-orange-500' },
                            { label: 'Sourcing', val: store.score_price || 0, color: 'bg-green-500' },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span className="font-bold">{s.label}</span><span>{s.val}/100</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!hasKYC && (
                        <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 mb-4 text-center">
                          ยังไม่ได้ยืนยัน KYC
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          สมัครเมื่อ {new Date(store.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                        <button
                          onClick={() => openMatchRequestModal({
                            id: store.id,
                            name: store.store_name || 'ไม่ระบุชื่อ',
                            type: store.store_type || 'ไม่ระบุ',
                            score: totalScore,
                            matchReason: `ร้านค้าที่ลงทะเบียนในระบบ — ${store.location || 'ไม่ระบุพื้นที่'}`,
                            tags: [store.store_type || 'SME'].filter(Boolean),
                            features: {
                              reliability: store.score_reliability || 0,
                              logistics: store.score_logistics || 0,
                              price: store.score_price || 0,
                              location: store.score_location || 50,
                            }
                          })}
                          className="text-xs px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95"
                        >
                          <Send size={12} /> ส่งคำขอ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: คำขอจับคู่ ========== */}
        {activeTab === 'requests' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <FileText size={24} className="text-amber-500" />
                  คำขอจับคู่ของฉัน
                </h2>
                <p className="text-sm text-slate-500 mt-1">ติดตามสถานะคำขอทั้งหมดที่ส่งออกไป</p>
              </div>
              <button onClick={() => session && fetchMatchRequests(session.user.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95">
                <Activity size={16} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'ทั้งหมด', count: matchRequests.length, color: 'text-slate-700' },
                { label: 'รอยืนยัน', count: matchRequests.filter(r => r.status === 'pending').length, color: 'text-amber-600' },
                { label: 'ยอมรับแล้ว', count: matchRequests.filter(r => r.status === 'accepted').length, color: 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {matchRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                <FileText size={36} className="text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-600">ยังไม่มีคำขอ</h3>
                <p className="text-slate-400 text-sm mt-2">ไปหน้าระบบจับคู่แล้วกดส่งคำขอเพื่อเริ่มต้น</p>
                <button onClick={() => setActiveTab('matching')} className="mt-6 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                  ไปหน้าระบบจับคู่ →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {matchRequests.map(req => {
                  const isIncoming = req.receiver_user_id === session?.user?.id;

                  let pName = 'ไม่ระบุชื่อ';
                  let pType = 'SME';

                  if (isIncoming) {
                    pName = req.sender_profile?.store_name || 'ไม่ระบุชื่อ';
                    pType = req.sender_profile?.store_type || 'ไม่ระบุ';
                  } else {
                    pName = req.partners?.name || req.receiver_profile?.store_name || 'ไม่ระบุชื่อ';
                    pType = req.partners?.type || req.receiver_profile?.store_type || 'Unspecified';
                  }

                  const pInitial = pName[0] || '?';
                  const statusMap = {
                    pending: { label: 'รอยืนยัน', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> },
                    accepted: { label: 'ยอมรับแล้ว', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
                    rejected: { label: 'ปฏิเสธแล้ว', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> },
                    cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-slate-100 text-slate-500', icon: <X size={12} /> },
                  };
                  const st = statusMap[req.status] || { label: req.status, color: 'bg-slate-100 text-slate-700', icon: null };
                  return (
                    <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
                            {pInitial.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800">{pName}</h3>
                              {isIncoming ? (
                                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold">ได้รับคำขอ</span>
                              ) : (
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">ส่งคำขอไป</span>
                              )}
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">{pType}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${st.color}`}>{st.icon} {st.label}</span>
                          <div className="text-2xl font-black text-blue-600 mt-1">{req.match_score}%</div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 mb-3">
                        <span className="font-bold text-slate-400 text-xs uppercase">ข้อความ: </span>{req.message}
                      </div>
                      {req.status === 'rejected' && req.reject_reason && (
                        <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 mb-3">
                          <span className="font-bold">เหตุผลปฏิเสธ:</span> {req.reject_reason}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {new Date(req.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-2">
                          {req.status === 'pending' && isIncoming && (
                            <>
                              <button onClick={() => openRejectModal(req)} className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition font-medium">
                                ปฏิเสธ
                              </button>
                              <button onClick={() => handleApproveRequest(req.id)} className="text-xs px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-bold flex items-center gap-1.5 shadow-md shadow-green-500/20">
                                ยอมรับ
                              </button>
                            </>
                          )}
                          {req.status === 'pending' && !isIncoming && (
                            <button onClick={() => handleCancelRequest(req.id)} className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition font-medium">
                              ยกเลิกคำขอ
                            </button>
                          )}
                          {req.status === 'accepted' && (
                            <button onClick={() => setActiveTab('chat')} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                              <MessageCircle size={13} /> เปิดแชท
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: แชทธุรกิจ ========== */}
        {activeTab === 'chat' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <MessageCircle size={24} className="text-blue-600" /> แชทธุรกิจ B2B
              </h2>
              <p className="text-sm text-slate-500 mt-1">เจรจากับพาร์ทเนอร์ที่ยอมรับข้อเสนอแล้วเท่านั้น</p>
            </div>
            <ChatSystem session={session} storeName={smeProfile.name} onClose={() => { }} />
          </div>
        )}
      </main>


      {/* AI Report Modal (Wow Factor UI for Presentation) */}
      {showAIReport && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60 transition-all">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.8),transparent)]"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-3 inline-flex mb-3 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Executive Summary generated by AI</span>
                </div>
                <h2 className="text-3xl font-black">Business Matching Report</h2>
                <p className="text-slate-400 text-sm mt-1">Generated exclusively for Node: <span className="text-blue-400 font-mono">{smeProfile.name}</span></p>
              </div>
              <button
                onClick={() => setShowAIReport(false)}
                className="relative z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-500" />
                    Network Value Estimation
                  </h3>
                  <div className="text-4xl font-black text-slate-900 mb-2">฿1.24M</div>
                  <p className="text-sm text-slate-500">Projected cost-saving over 12 months using optimized logistics routes and bulk pricing.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Top Synergies</h3>
                  <ul className="space-y-3">
                    {partners.slice(0, 3).map((p, i) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span className="font-medium flex items-center gap-2 text-slate-700">
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                          {p.name}
                        </span>
                        <span className="font-bold text-blue-600">{p.score}% Match</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-2xl text-white h-full shadow-lg relative overflow-hidden">
                  <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm text-center">Graph Distance Matrix</h3>
                  <div className="flex justify-center items-center h-[200px] relative">
                    {/* Decorative graph visualization */}
                    <div className="absolute w-32 h-32 border border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute w-48 h-48 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] z-10 shadow-[0_0_20px_rgba(37,99,235,0.8)]">YOU</div>

                    <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-[10%] left-[20%]"></div>
                    <div className="absolute w-2 h-2 bg-green-400 rounded-full bottom-[20%] right-[10%]"></div>
                    <div className="absolute w-2 h-2 bg-cyan-400 rounded-full top-[30%] right-[20%]"></div>

                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                      <path d="M50 50 L20 10 M50 50 L90 80 M50 50 L80 30" stroke="white" strokeWidth="0.5" fill="none" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-4 uppercase tracking-widest">Topology mapped and optimized. <br />All shortest paths computed.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-4 rounded-b-[2rem]">
              <button onClick={() => setShowAIReport(false)} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">
                Close Report
              </button>
              <button onClick={handleDownloadPDF} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MatchRequest Modal */}
      {showMatchRequestModal && requestPartner && (
        <MatchRequestModal
          partner={requestPartner}
          session={session}
          matchWeights={matchWeights}
          onClose={() => { setShowMatchRequestModal(false); setRequestPartner(null); }}
          onSent={handleRequestSent}
          showToast={showToast}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">ปฏิเสธคำขอ</h3>
                <p className="text-red-200 text-sm">{rejectTarget.partners?.name}</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <label className="text-sm font-bold text-slate-700 mb-2 block">เหตุผลการปฏิเสธ (ไม่บังคับ)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="เช่น ไม่ตรงกับความต้องการในขณะนี้ / มีพาร์ทเนอร์แล้ว..."
                rows={3}
                className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-red-400 outline-none text-sm resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">
                  ยกเลิก
                </button>
                <button onClick={handleRejectRequest} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition active:scale-95 shadow-lg">
                  ยืนยันปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;