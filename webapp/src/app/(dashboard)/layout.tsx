'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, CreditCard, Trash2, CopyPlus, LogOut, DownloadCloud, X, ShieldCheck, User, Ticket, Activity, HelpCircle, Megaphone, MessageSquare, Facebook, ChevronRight, Users, Send, FilePlus, Video, Settings, ShieldAlert, Menu, Smartphone } from 'lucide-react';
import AnnouncementSystem from '@/components/AnnouncementSystem';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import SupportPage from '@/app/(dashboard)/support/page';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [extConnected, setExtConnected] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [dismissedModal, setDismissedModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [unreadTicketCount, setUnreadTicketCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Update System States
  const [extVersion, setExtVersion] = useState<string | null>(null);
  const [latestExtVersion, setLatestExtVersion] = useState<string | null>(null);
  const [extDownloadUrl, setExtDownloadUrl] = useState<string>('');
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const isBannedRef = useRef(false);

  useEffect(() => {
    isBannedRef.current = userData?.user_metadata?.is_banned === true;
  }, [userData]);

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Check if user is admin & lazily verify package expiration
    const checkUserAndAdmin = async () => {
      // Use getUser() to fetch the freshest metadata from DB instead of local session cache
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        if (error?.message?.toLowerCase().includes('ban') || error?.message?.toLowerCase().includes('suspend') || error?.message?.toLowerCase().includes('not found')) {
          alert('🚨 บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อทีมงาน');
        }
        await supabase.auth.signOut();
        router.push('/login?banned=true');
        return;
      }

      if (user) {
        // Verify User Package Expiration Lazily BEFORE setting state
        const userPackage = user.user_metadata?.package;
        const packageExpire = user.user_metadata?.package_expire;

        if (userPackage === 'Pro' || userPackage === 'Premium') {
          const expireDate = packageExpire ? new Date(packageExpire) : null;
          if (expireDate && new Date() >= expireDate) {
            // Tell backend to formally downgrade asynchronously
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              fetch('/api/auth/verify-package', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              }).catch(() => {});
            }
            // Mute local state so UI instantly shows Free without flash or reload
            user.user_metadata.package = 'Free';
            user.user_metadata.package_expire = null;
          }
        }

        setUserData(user);

        // Admin check logic
        const username = (user.user_metadata?.username || '').toLowerCase();
        const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map((u: string) => u.trim().toLowerCase());
        if (adminUsernames.includes(username)) {
          setIsAdmin(true);
        }

        // Fetch User Daily Usage + Unread Ticket Count
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const [usageRes, unreadRes] = await Promise.all([
              fetch('/api/usage', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
              fetch('/api/tickets/unread-count', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
            ]);
            if (usageRes.ok) {
              const data = await usageRes.json();
              if (data.success) setUsage(data.data);
            }
            if (unreadRes.ok) {
              const data = await unreadRes.json();
              setUnreadTicketCount(data.count || 0);
            }
          }
        } catch (e) { }
      }
    };
    checkUserAndAdmin();

    // Usage Poller update every 15s to keep overview fresh
    const usageInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/usage', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUsage(data.data);

          // If frontend thinks user is banned, but backend says OK -> Unbanned!
          if (isBannedRef.current) {
            window.location.reload();
          }
        } else if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          // If backend says banned, but frontend doesn't know -> Banned!
          if (data.is_banned && !isBannedRef.current) {
            window.location.reload();
          }
        } else if (res.status === 401) {
          alert('🚨 บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อทีมงาน');
          await supabase.auth.signOut();
          window.location.href = '/login?banned=true';
        }
      } catch (e) { }
    }, 5000);

    // Unread ticket poller every 30s
    const unreadInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/tickets/unread-count', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadTicketCount(data.count || 0);
        }
      } catch (e) { }
    }, 30000);

    const checkSystemSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setLatestExtVersion(data.settings.extension_version || null);
            setExtDownloadUrl(data.settings.extension_download_url || '');
          }
        }
      } catch (e) {
        console.error('Failed to fetch system_settings API');
      }
    };
    checkSystemSettings();
    const settingsInterval = setInterval(checkSystemSettings, 1000); // Check every 1 second

    // Initial delay to give extension time to inject
    const initialTimer = setTimeout(() => {
      setIsChecking(false);
    }, 1500);

    const checkExt = () => {
      if (typeof window !== 'undefined' && ((window as any).upfeedth?.installed || (window as any).upfeed?.installed)) {
        setExtConnected(true);

        // Try reading from DOM element injected by content.js
        const versionEl = document.getElementById('upfeedth-extension-version');
        if (versionEl) {
          const v = versionEl.getAttribute('data-version');
          if (v) setExtVersion(v);
        } else if ((window as any).upfeedth_ext_version) {
          // Fallback
          setExtVersion((window as any).upfeedth_ext_version);
        }
      } else {
        setExtConnected(false);
      }
    };
    checkExt();
    const interval = setInterval(checkExt, 2000);
    return () => {
      clearInterval(settingsInterval);
      clearInterval(interval);
      clearInterval(usageInterval);
      clearInterval(unreadInterval);
      clearTimeout(initialTimer);
    };
  }, []);

  useEffect(() => {
    if (!isChecking && !extConnected && !dismissedModal) {
      setShowInstallModal(true);
    } else {
      setShowInstallModal(false);
    }
  }, [isChecking, extConnected, dismissedModal]);

  useEffect(() => {
    if (extConnected && latestExtVersion) {
      if (!extVersion || extVersion !== latestExtVersion) {
        setShowUpdateBanner(true);
      } else {
        setShowUpdateBanner(false);
      }
    }
  }, [extConnected, extVersion, latestExtVersion]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { name: 'One Card & Carousel', icon: Zap, path: '/tools/one-card' },
    { name: 'UP TO REELS', icon: Video, path: '/tools/up-to-reels' },
    { name: 'Auto Create Pages', icon: FilePlus, path: '/tools/auto-create-page' },
    { name: 'Page Posts Remover', icon: Trash2, path: '/tools/post-remover' },
    { name: 'Page Deep Clone', icon: CopyPlus, path: '/tools/deep-clone' },
    { name: 'Page Story & Link', icon: Smartphone, path: '/tools/page-story' },
  ];

  const groupNavLinks = [
    { name: 'Group Auto Post', icon: Send, path: '/tools/group-auto-post' },
    { name: 'Group Posts Remover', icon: Trash2, path: '/tools/group-cleaner' },
  ];

  const billingLink = { name: 'แพ็กเกจ/เติมเงิน', icon: CreditCard, path: '/billing' };
  const supportLink = { name: 'ติดต่อทีมงาน', icon: HelpCircle, path: '/support' };
  const adminLink = { name: 'จัดการผู้ใช้', icon: ShieldCheck, path: '/admin/users' };
  const adminPromosLink = { name: 'จัดการโปรโมชั่น', icon: Ticket, path: '/admin/promos' };
  const adminBillingLink = { name: 'รายการสั่งซื้อ/สลิป', icon: CreditCard, path: '/admin/billing' };
  const adminAnalyticsLink = { name: 'สถิติการใช้งาน', icon: Activity, path: '/admin/analytics' };
  const adminAnnouncementsLink = { name: 'จัดการประกาศ', icon: Megaphone, path: '/admin/announcements' };
  const adminTicketsLink = { name: 'Support Tickets', icon: MessageSquare, path: '/admin/tickets' };
  const adminSettingsLink = { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings' };

  const homeLink = { name: 'หน้าหลัก', icon: LayoutDashboard, path: '/home' };
  const extensionLink = { name: 'ดาวน์โหลด Extension', icon: DownloadCloud, path: '/extension' };

  const allLinks = isAdmin ? [homeLink, extensionLink, ...navLinks, ...groupNavLinks, supportLink, billingLink, adminLink, adminPromosLink, adminBillingLink, adminAnalyticsLink, adminAnnouncementsLink, adminTicketsLink, adminSettingsLink] : [homeLink, extensionLink, ...navLinks, ...groupNavLinks, supportLink, billingLink];

  if (userData?.user_metadata?.is_banned) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col pt-12 items-center px-4 pb-20 overflow-y-auto">
        <div className="w-full max-w-5xl mb-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-top-4 shadow-2xl shadow-red-500/10 relative">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">บัญชีถูกระงับการใช้งาน</h2>
          <p className="text-dark-300 text-sm leading-relaxed mb-8 max-w-2xl mx-auto">
            สิทธิ์การเข้าใช้งานของท่านถูกระงับชั่วคราว<br />
            หากท่านต้องการตรวจสอบสาเหตุ ร้องขอให้ปลดแบน หรือชี้แจงปัญหา<br />
            <strong className="text-white">กรุณาสร้าง Ticket ด้านล่างนี้เพื่อพูดคุยกับทีมงานโดยตรงได้ทันที</strong>
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-dark-800 hover:bg-dark-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4 inline-block mr-2" />
            ออกจากระบบ
          </button>
        </div>
        <div className="w-full max-w-5xl">
          <SupportPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex h-screen overflow-hidden relative">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-50 w-64 bg-dark-900 border-r border-dark-800 flex flex-col flex-shrink-0 shadow-2xl select-none cursor-default lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-dark-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-dark-950 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden border border-dark-800/50">
              <img src="/logo/upfeed_logo.png" alt="UPFEEDTH Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">UPFEEDTH</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-4 px-2">
            เมนูบริการ
          </div>

          {/* Home Link */}
          <Link
            href="/home"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${pathname === '/home' || pathname === '/'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
              : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
              }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${pathname === '/home' || pathname === '/' ? 'text-orange-400' : 'text-dark-400'}`} />
            <span className="font-medium">หน้าหลัก</span>
          </Link>

          {/* Extension Link */}
          <Link
            href="/extension"
            className={`flex items-center gap-3 px-3 py-3 mt-1 rounded-xl transition-all duration-300 ${pathname.includes('/extension')
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
              }`}
          >
            <DownloadCloud className={`w-5 h-5 ${pathname.includes('/extension') ? 'text-blue-400' : 'text-dark-400'}`} />
            <span className="font-medium">ดาวน์โหลด Extension</span>
            {!extConnected && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          </Link>

          {/* Facebook Tools Hover Menu Group */}
          <div className="relative group mt-1">
            <div
              onClick={() => toggleGroup('fbPage')}
              className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${navLinks.some(l => pathname.includes(l.path))
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm'
                : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Facebook className={`w-5 h-5 ${navLinks.some(l => pathname.includes(l.path)) ? 'text-blue-400' : 'text-dark-400'}`} />
                <span className="font-medium">FB Page Tools</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform lg:group-hover:opacity-100 lg:opacity-50 ${openGroups['fbPage'] ? 'rotate-90' : ''}`} />
            </div>

            {/* Flyout/Accordion Sub-menu */}
            <div 
              className={`
                lg:fixed lg:left-64 lg:z-[9999] lg:w-64 lg:pt-2 lg:pb-2 lg:opacity-0 lg:invisible lg:group-hover:opacity-100 lg:group-hover:visible lg:transition-all lg:duration-200 lg:transform lg:-translate-x-2 lg:group-hover:translate-x-0 lg:-mt-[52px]
                max-lg:overflow-hidden max-lg:transition-all max-lg:duration-300 max-lg:pl-3
                ${openGroups['fbPage'] ? 'max-lg:max-h-[500px] max-lg:opacity-100 max-lg:mt-1' : 'max-lg:max-h-0 max-lg:opacity-0 max-lg:mt-0'}
              `}
            >
              <div className="bg-dark-900 border border-dark-700/80 rounded-xl shadow-[0_4px_40px_rgba(0,0,0,0.6)] ml-2 overflow-hidden relative">
                {/* Invisible bridge to prevent hover gap */}
                <div className="absolute -left-4 top-0 w-4 h-full bg-transparent"></div>

                {/* <div className="px-4 py-2 border-b border-dark-800/50 mb-1 bg-dark-950/50">
                  <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">เครื่องมือทั้งหมด</span>
                </div> */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.includes(link.path);
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isActive
                        ? 'bg-orange-500/10 text-orange-400 font-bold'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/80 font-medium'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-dark-500'}`} />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Facebook Group Tools Hover Menu Group */}
          <div className="relative group mt-1">
            <div
              onClick={() => toggleGroup('fbGroup')}
              className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${groupNavLinks.some(l => pathname.includes(l.path))
                ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm'
                : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${groupNavLinks.some(l => pathname.includes(l.path)) ? 'text-green-400' : 'text-dark-400'}`} />
                <span className="font-medium">FB Group Tools</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform lg:group-hover:opacity-100 lg:opacity-50 ${openGroups['fbGroup'] ? 'rotate-90' : ''}`} />
            </div>

            {/* Flyout/Accordion Sub-menu */}
            <div 
              className={`
                lg:fixed lg:left-64 lg:z-[9999] lg:w-64 lg:pt-2 lg:pb-2 lg:opacity-0 lg:invisible lg:group-hover:opacity-100 lg:group-hover:visible lg:transition-all lg:duration-200 lg:transform lg:-translate-x-2 lg:group-hover:translate-x-0 lg:-mt-[52px]
                max-lg:overflow-hidden max-lg:transition-all max-lg:duration-300 max-lg:pl-3
                ${openGroups['fbGroup'] ? 'max-lg:max-h-[500px] max-lg:opacity-100 max-lg:mt-1' : 'max-lg:max-h-0 max-lg:opacity-0 max-lg:mt-0'}
              `}
            >
              <div className="bg-dark-900 border border-dark-700/80 rounded-xl shadow-[0_4px_40px_rgba(0,0,0,0.6)] ml-2 overflow-hidden relative">
                <div className="absolute -left-4 top-0 w-4 h-full bg-transparent"></div>

                {groupNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.includes(link.path);
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isActive
                        ? 'bg-green-500/10 text-green-400 font-bold'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/80 font-medium'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-dark-500'}`} />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>



          {isAdmin && (() => {
            const adminLinksGroup = [adminLink, adminPromosLink, adminBillingLink, adminAnalyticsLink, adminAnnouncementsLink, adminTicketsLink, adminSettingsLink];
            const isAnyAdminActive = adminLinksGroup.some(l => pathname.includes(l.path));

            return (
              <div className="relative group mt-6">
                <div
                  onClick={() => toggleGroup('admin')}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${isAnyAdminActive
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${isAnyAdminActive ? 'text-orange-400' : 'text-dark-400'}`} />
                    <span className="font-medium">System Admin</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform lg:group-hover:opacity-100 lg:opacity-50 ${openGroups['admin'] ? 'rotate-90' : ''}`} />
                </div>

                {/* Flyout/Accordion Sub-menu */}
                <div 
                  className={`
                    lg:fixed lg:left-64 lg:z-[9999] lg:w-64 lg:pt-2 lg:pb-2 lg:opacity-0 lg:invisible lg:group-hover:opacity-100 lg:group-hover:visible lg:transition-all lg:duration-200 lg:transform lg:-translate-x-2 lg:group-hover:translate-x-0 lg:-mt-[52px]
                    max-lg:overflow-hidden max-lg:transition-all max-lg:duration-300 max-lg:pl-3
                    ${openGroups['admin'] ? 'max-lg:max-h-[500px] max-lg:opacity-100 max-lg:mt-1' : 'max-lg:max-h-0 max-lg:opacity-0 max-lg:mt-0'}
                  `}
                >
                  <div className="bg-dark-900 border border-dark-700/80 rounded-xl shadow-[0_4px_40px_rgba(0,0,0,0.6)] ml-2 overflow-hidden relative">
                    {/* Invisible bridge to prevent hover gap */}
                    <div className="absolute -left-4 top-0 w-4 h-full bg-transparent"></div>

                    <div className="px-4 py-2 border-b border-dark-800/50 mb-1 bg-dark-950/50">
                      <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">เมนูผู้ดูแลระบบ</span>
                    </div>
                    {adminLinksGroup.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname.includes(link.path);
                      return (
                        <Link
                          key={link.path}
                          href={link.path}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isActive
                            ? 'bg-orange-500/10 text-orange-400 font-bold'
                            : 'text-dark-300 hover:text-white hover:bg-dark-800/80 font-medium'
                            }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-dark-500'}`} />
                          <span className="text-sm">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </nav>

        <div className="p-4 border-t border-dark-800/60 shrink-0 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href={supportLink.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${pathname.includes(supportLink.path)
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
                : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
                }`}
            >
              <supportLink.icon className={`w-5 h-5 ${pathname.includes(supportLink.path) ? 'text-orange-400' : 'text-dark-400'}`} />
              <span className="font-medium flex-1">{supportLink.name}</span>
              {unreadTicketCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-orange-500/40 animate-pulse">
                  {unreadTicketCount}
                </span>
              )}
            </Link>

            <Link
              href={billingLink.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${pathname.includes(billingLink.path)
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
                : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800/50'
                }`}
            >
              <billingLink.icon className={`w-5 h-5 ${pathname.includes(billingLink.path) ? 'text-orange-400' : 'text-dark-400'}`} />
              <span className="font-medium">{billingLink.name}</span>
            </Link>
          </div>

          {userData && (
            <div className="bg-dark-950/40 rounded-xl p-3 border border-dark-800/80 shadow-inner flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center border border-dark-700 shrink-0">
                  <User className="w-4 h-4 text-dark-400" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate" title={userData.user_metadata?.username || 'User'}>
                    {userData.user_metadata?.username || 'User'}
                  </div>
                  <div className="text-[10px] text-dark-400 truncate" title={userData.email}>
                    {userData.email}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs mt-1 border-t border-dark-800/50 pt-2">
                <span className="text-dark-400">กระเป๋าเงิน:</span>
                <span className="font-bold text-green-400">
                  {parseFloat(userData.user_metadata?.wallet_balance || '0').toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              </div>

              <div className="flex justify-between items-center text-xs mt-0.5 pt-1">
                <span className="text-dark-400">แพ็กเกจ:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${userData.user_metadata?.package === 'Premium' ? 'text-purple-400 bg-purple-500/10' :
                  userData.user_metadata?.package === 'Pro' ? 'bg-orange-500/10 text-orange-400' : 'text-dark-300 bg-dark-800'
                  }`}>
                  {userData.user_metadata?.package || 'Free'}
                </span>
              </div>

              {userData.user_metadata?.package_expire && (
                <div className="flex justify-between items-center text-xs mt-0.5">
                  <span className="text-dark-400">วันหมดอายุ:</span>
                  <span className="text-dark-200">{new Date(userData.user_metadata.package_expire).toLocaleDateString('th-TH')}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-2 pt-2 border-t border-dark-800/40">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${extConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
              <span className="text-xs text-dark-300">{extConnected ? 'เชื่อมต่อกับ Extension แล้ว' : 'ยังไม่ได้เชื่อมต่อกับ Extension'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-dark-400 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-800"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <AnnouncementSystem />
        <header className="h-20 shrink-0 flex items-center justify-between border-b border-dark-800/60 px-4 lg:px-8 z-10 bg-dark-950/80 backdrop-blur-md relative">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-orange-300 to-orange-500 truncate">
              {allLinks.find(l => pathname.includes(l.path))?.name || 'Dashboard'}
            </h2>
            {showUpdateBanner && (
              <div className="ml-4 animate-pulse flex items-center bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-1.5 shadow-sm shadow-orange-500/10 shadow-inner">
                <DownloadCloud className="w-4 h-4 text-orange-400 mr-2" />
                <span className="text-sm text-orange-300 font-medium">มีอัปเดต Extension เวอร์ชั่น {latestExtVersion} ! </span>
                <a href={extDownloadUrl || '#'} target="_blank" className="ml-3 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-md shadow-md transition-colors font-bold">ดาวน์โหลด</a>
              </div>
            )}
          </div>


        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

          <div className="animate-fade-in-up h-full w-full max-w-6xl mx-auto pb-10">
            {children}
          </div>
        </div>
      </main>

      {/* Extension Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <DownloadCloud className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white">กรุณาติดตั้งส่วนเสริม (Extension)</h3>
              </div>
              <button onClick={() => setDismissedModal(true)} className="text-dark-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-dark-300">
                ระบบตรวจพบว่าคุณยังไม่ได้ติดตั้ง <strong className="text-orange-400">UPFEEDTH Extension</strong> บนบราวเซอร์นี้ ซึ่งเครื่องมือนี้จำเป็นมากสำหรับการใช้งานระบบ
              </p>

              <div className="bg-dark-950/50 rounded-xl p-4 border border-dark-800 mt-4">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>ขั้นตอนการติดตั้ง</span>
                </h4>
                <ol className="space-y-4 text-sm text-dark-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-orange-400">1</span>
                    <span className="pt-0.5">คลิกปุ่มดาวน์โหลดด้านล่าง แล้วนำไฟล์ที่ได้ไปแตกไฟล์ (Extract ZIP) ลงในเครื่องของคุณ</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-orange-400">2</span>
                    <span className="pt-0.5">เปิดบราวเซอร์ Google Chrome หรือ Microsoft Edge ไปที่หน้าส่วนขยาย <code className="bg-dark-800 px-1.5 py-0.5 rounded text-orange-300 border border-dark-700 ml-1">ตั้งค่าบราวเซอร์ - ส่วนขยาย - จัดการส่วนขยาย</code></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-orange-400">3</span>
                    <span className="pt-0.5">เปิดใช้งาน <strong>"โหมดนักพัฒนาซอฟต์แวร์" (Developer mode)</strong> ซึ่งสวิตช์จะอยู่ที่มุมขวาบนของหน้าจอ</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-orange-400">4</span>
                    <span className="pt-0.5">คลิกปุ่ม <strong>"โหลดส่วนขยายที่ยังไม่ได้แพ็ก" (Load unpacked)</strong> แล้วหาเพื่อเลือกโฟลเดอร์ <code className="bg-dark-800 px-1.5 py-0.5 rounded text-orange-300 border border-dark-700 mx-1">UPFEEDTHExtension Vx.x</code> ที่เพิ่งแตกไฟล์มา</span>
                  </li>
                </ol>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 mt-2">
              <a href="https://drive.google.com/file/d/1w-M6h-OHdSY5lTgnNULO1OPwWNjAY1kf/view?usp=sharing" target="_blank" className="flex-1 bg-linear-to-tr from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5">
                <DownloadCloud className="w-5 h-5" />
                ดาวน์โหลดไฟล์ Extension (.ZIP)
              </a>
              <button onClick={() => setDismissedModal(true)} className="px-6 py-3 rounded-xl border border-dark-800 text-dark-300 hover:text-white hover:bg-dark-800/50 transition-all font-medium hover:-translate-y-0.5">
                ปิดไว้ก่อน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}