  "use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  Search,
  Sliders,
  Menu,
  User,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Shield,
  Database,
  CreditCard,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSharedUserProfile } from "@/lib/contexts/UserProfileContext";
import { usePathname } from "next/navigation";
import { useAshbyAccess } from "@/lib/ashby/config";
import SearchOverlay from "./SearchOverlay";

// Base navigation items
const baseNavigation = [
  { name: "Dashboard", href: "/board/dashboard", icon: LayoutDashboard },
  { name: "Personalize", href: "/board/personalize", icon: Sliders },
  { name: "Applicants", href: "/board/applicants", icon: Users },
  { name: "My Activity", href: "/board/activity", icon: Activity },
  { name: "Search", href: "/board/search", icon: Search },
  {
    name: "Settings",
    href: "/board/settings",
    icon: Settings,
    subItems: [
      { name: "Personal Profile", href: "/board/settings", icon: User },
      {
        name: "Security & access",
        href: "/board/settings?tab=security",
        icon: Shield,
      },
      {
        name: "Data & privacy",
        href: "/board/settings?tab=privacy",
        icon: Database,
      },
      {
        name: "Billing",
        href: "/board/settings?tab=billing",
        icon: CreditCard,
      },
    ],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Sidebar nav link style helpers
const navLinkBase =
  "flex w-full items-center gap-2 px-3 py-2 mb-0.5 rounded-xl text-left text-sm font-medium transition-all duration-200";
const navLinkActive =
  "bg-white/70 text-slate-800 shadow-sm border border-white/80";
const navLinkInactive =
  "text-slate-600 hover:text-slate-900 hover:bg-white/40";

const iconActive = "stroke-slate-800 text-slate-800";
const iconInactive = "stroke-slate-500 text-slate-500";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { displayName, displayInitial } = useSharedUserProfile();

  const { hasAccess: hasATSAccess } = useAshbyAccess();

  const navigation = useMemo(() => {
    const nav = [...baseNavigation];
    if (hasATSAccess) {
      nav.splice(2, 0, { name: "ATS", href: "/board/ats", icon: Building2 });
    }
    return nav;
  }, [hasATSAccess]);

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchOpen(true);
  };

  const isActive = (href: string) => {
    if (href === "/board/dashboard") return pathname === "/board/dashboard";
    return pathname.startsWith(href);
  };

  const isSettingsActive = pathname.startsWith("/board/settings");
  const shouldShowSettingsMenu = isSettingsActive || settingsExpanded;

  const renderSidebarNav = (isMobile = false) =>
    navigation.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      const hasSubItems = "subItems" in item && item.subItems;

      if (item.name === "Search") {
        return (
          <span key={item.name}>
              <button
                onClick={handleSearchClick}
                className={`${navLinkBase} ${navLinkInactive} ${sidebarCollapsed && !isMobile ? "justify-center px-0" : ""
                  }`}
                title={sidebarCollapsed && !isMobile ? item.name : undefined}
                suppressHydrationWarning
              >
              <Icon className={`h-4 w-4 shrink-0 ${iconInactive}`} />
              {(!sidebarCollapsed || isMobile) && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </button>
          </span>
        );
      }

      if (hasSubItems && item.name === "Settings") {
        return (
          <div key={item.name}>
            <button
              onClick={() => {
                if (sidebarCollapsed && !isMobile) setSidebarCollapsed(false);
                setSettingsExpanded(!settingsExpanded);
              }}
              className={`${navLinkBase} ${active ? navLinkActive : navLinkInactive} ${sidebarCollapsed && !isMobile ? "justify-center px-0" : ""
                }`}
              title={sidebarCollapsed && !isMobile ? item.name : undefined}
              suppressHydrationWarning
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? iconActive : iconInactive}`} />
              {(!sidebarCollapsed || isMobile) && (
                <>
                  <span className="whitespace-nowrap flex-1">{item.name}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${shouldShowSettingsMenu ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>
            {shouldShowSettingsMenu && (!sidebarCollapsed || isMobile) && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200/60 pl-3">
                {item.subItems.map((sub) => {
                  const subActive = pathname === sub.href;
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={`${navLinkBase} text-sm ${subActive ? navLinkActive : navLinkInactive}`}
                    >
                      <SubIcon className={`h-3.5 w-3.5 shrink-0 ${subActive ? iconActive : iconInactive}`} />
                      <span className="whitespace-nowrap">{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <span key={item.name}>
          <Link
            href={item.href}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`${navLinkBase} ${active ? navLinkActive : navLinkInactive} ${sidebarCollapsed && !isMobile ? "justify-center px-0" : ""
              }`}
            title={sidebarCollapsed && !isMobile ? item.name : undefined}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? iconActive : iconInactive}`} />
            {(!sidebarCollapsed || isMobile) && (
              <span className="whitespace-nowrap">{item.name}</span>
            )}
          </Link>
        </span>
      );
    });

  const userFooter = (showFull: boolean) => (
    <div className="mt-auto">
      <div className="h-px bg-slate-200/60 mb-3" />
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-sm font-semibold">{displayInitial}</span>
          </div>
          {showFull && (
            <div className="ml-2.5 overflow-hidden">
              <span className="block text-sm text-slate-800 truncate font-semibold">{displayName}</span>
              {user?.email && (
                <span className="block text-xs text-slate-500 truncate">{user.email}</span>
              )}
            </div>
          )}
        </div>
        {showFull && (
          <button
            onClick={signOut}
            className="flex-shrink-0 h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-colors flex items-center justify-center"
            title="Sign out"
            suppressHydrationWarning
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const glassPanel =
    "bg-white/30 backdrop-blur-2xl border-r border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_32px_rgba(0,0,0,0.08)]";

  return (
    <div
      data-is-root-theme="true"
      data-accent-color="violet"
      data-gray-color="slate"
      data-has-background="false"
      data-panel-background="translucent"
      data-radius="medium"
      data-scaling="100%"
      style={{ minHeight: 0 }}
      className="radix-themes woswidgets-root"
    >
      {/* ── Animated background ─────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-sky-50 to-rose-50" />

        {/* Animated orbs */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-40 animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.6) 0%, rgba(167,139,250,0) 70%)",
            animationDuration: "6s",
          }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[450px] h-[450px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,143,0.7) 0%, rgba(251,191,143,0) 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(125,211,252,0.6) 0%, rgba(125,211,252,0) 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 w-[300px] h-[300px] rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, rgba(249,168,212,0.7) 0%, rgba(249,168,212,0) 70%)",
            animation: "float 12s ease-in-out infinite",
          }}
        />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Float keyframes injected inline */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>

      <div className="relative isolate flex min-h-svh w-full max-lg:flex-col">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-800/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Mobile Sidebar ─────────────────────── */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 overflow-y-auto lg:hidden ${glassPanel} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <nav className="select-none flex h-full min-h-0 flex-col p-4">
            <div className="flex items-center mb-6">
              <Image src="/logo-2.png" alt="HireSense" width={120} height={32} className="h-8 w-auto" />
            </div>
            <div className="flex-1 space-y-0.5">{renderSidebarNav(true)}</div>
            {userFooter(true)}
          </nav>
        </div>

        {/* ── Desktop Sidebar ────────────────────── */}
        <div
          data-expanded={!sidebarCollapsed}
          className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 overflow-y-auto max-lg:hidden ${glassPanel} ${sidebarCollapsed ? "w-[68px]" : "w-56"
            }`}
        >
          <nav className="select-none flex h-full min-h-0 flex-col p-3">
            {/* Logo + collapse button */}
            <div className="flex items-center justify-between mb-5 px-1">
              {!sidebarCollapsed ? (
                <Image src="/logo-2.png" alt="HireSense" width={110} height={28} className="h-7 w-auto" />
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="mx-auto p-1 rounded-lg hover:bg-white/50 transition-colors"
                  title="Expand"
                >
                  <Image src="/logo-2.png" alt="HireSense" width={28} height={28} className="h-7 w-7 object-contain" />
                </button>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/50 transition-colors"
                  title="Collapse sidebar"
                  suppressHydrationWarning
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Nav items */}
            <div className="flex-1 space-y-0.5">{renderSidebarNav(false)}</div>

            {/* User footer */}
            {userFooter(!sidebarCollapsed)}
          </nav>
        </div>

        {/* ── Content area ───────────────────────── */}
        <div className="flex flex-1 flex-col w-full">
          {/* Mobile header */}
          <header className="flex items-center px-4 py-2 lg:hidden bg-white/30 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1 flex justify-center">
              <Image src="/logo-2.png" alt="HireSense" width={100} height={26} className="h-6 w-auto" />
            </div>
          </header>

          {/* Main content */}
          <main
            className={`flex flex-1 flex-col lg:min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-56"
              }`}
          >
            <div className="w-full h-full">{children}</div>
          </main>
        </div>

        {/* Search Overlay */}
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
