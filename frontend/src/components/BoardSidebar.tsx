"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, memo, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Plus,
  ChevronDown,
  Settings,
  Check,
  Search,
  LogOut,
  User,
  Shield,
  Database,
  CreditCard,
  Building2,
} from "lucide-react";
import { useApplicants } from "@/lib/contexts/ApplicantContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSharedUserProfile } from "@/lib/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { useAshbyAccess } from "@/lib/ashby/config";

const ANIMATION_DURATION = {
  SIDEBAR: 500,
  TEXT: 300,
  COLOR_TRANSITION: 200,
} as const;

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel?: string;
}

interface BoardSidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

const useAnimationStyles = (isCollapsed: boolean) => {
  const getTextContainerStyle = useCallback(
    (): React.CSSProperties => ({
      width: isCollapsed ? "0px" : "150px",
      overflow: "hidden",
      transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    }),
    [isCollapsed]
  );

  const getUniformTextStyle = useCallback(
    (): React.CSSProperties => ({
      willChange: "opacity",
      opacity: isCollapsed ? 0 : 1,
      transition: `opacity 300ms ease ${isCollapsed ? "0ms" : "200ms"}`,
      whiteSpace: "nowrap" as const,
    }),
    [isCollapsed]
  );

  const sidebarContainerStyle: React.CSSProperties = useMemo(
    () => ({
      willChange: "width",
      transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    }),
    []
  );

  return { getTextContainerStyle, getUniformTextStyle, sidebarContainerStyle };
};

// Style constants — light glassmorphism palette
const navItemBase =
  "group flex items-center rounded-xl text-[14px] px-[12px] py-[9px] relative focus:outline-none transition-all duration-200 ease-out";
const navItemActive =
  "bg-white/70 text-slate-800 shadow-sm border border-white/80";
const navItemInactive =
  "text-slate-600 hover:text-slate-900 hover:bg-white/40";

const BoardSidebarComponent = ({
  isCollapsed,
  onToggle,
}: BoardSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applicants } = useApplicants();
  const { signOut } = useAuth();
  const { displayName, displayInitial } = useSharedUserProfile();
  const [applicantsDropdownOpen, setApplicantsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const selectedApplicantId = searchParams.get("id");
  const { hasAccess: showATSTab } = useAshbyAccess();

  const { getTextContainerStyle, getUniformTextStyle, sidebarContainerStyle } =
    useAnimationStyles(isCollapsed);

  const navigation = useMemo<NavigationItem[]>(() => {
    const navItems: NavigationItem[] = [
      {
        name: "Dashboard",
        href: "/board/dashboard",
        icon: LayoutDashboard,
        ariaLabel: "Dashboard overview",
      },
      {
        name: "Personalize",
        href: "/board/personalize",
        icon: Settings,
        ariaLabel: "Configure analysis settings",
      },
    ];
    if (showATSTab) {
      navItems.push({
        name: "ATS",
        href: "/board/ats",
        icon: Building2,
        ariaLabel: "Applicant Tracking System",
      });
    }
    return navItems;
  }, [showATSTab]);

  const settingsNavigation = useMemo<NavigationItem[]>(
    () => [
      { name: "Personal Profile", href: "/board/settings", icon: User },
      { name: "Security & access", href: "/board/settings?tab=security", icon: Shield },
      { name: "Data & privacy", href: "/board/settings?tab=privacy", icon: Database },
      { name: "Billing", href: "/board/settings?tab=billing", icon: CreditCard },
    ],
    []
  );

  const navigateToApplicant = useCallback(
    (id: string) => router.push(`/board?id=${id}`),
    [router]
  );

  const navigateToNew = useCallback(() => router.push("/board"), [router]);

  const filteredApplicants = useMemo(() => {
    if (!searchQuery.trim()) return applicants;
    return applicants.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.cv_data?.jobTitle && a.cv_data.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.li_data?.headline && a.li_data.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [applicants, searchQuery]);

  useEffect(() => {
    if (
      pathname.startsWith("/board") &&
      pathname !== "/board/dashboard" &&
      pathname !== "/board/personalize" &&
      pathname !== "/board/ats" &&
      applicants.length > 0
    ) {
      setApplicantsDropdownOpen(true);
    }
  }, [pathname, applicants.length]);

  const toggleSidebar = useCallback(() => onToggle(!isCollapsed), [isCollapsed, onToggle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, action?: () => void) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action?.();
      }
    },
    []
  );

  const renderNavigationItem = useCallback(
    (item: NavigationItem) => {
      const isItemActive = pathname === item.href;
      return (
        <li key={item.name}>
          <Link
            href={item.href}
            className={`${navItemBase} ${isItemActive ? navItemActive : navItemInactive}`}
            title={isCollapsed ? item.name : undefined}
            aria-label={item.ariaLabel || item.name}
          >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <item.icon
                className={`h-[17px] w-[17px] transition-colors ${isItemActive ? "text-slate-800" : "text-slate-500"
                  }`}
                aria-hidden="true"
              />
            </div>
            <div className="ml-[10px] overflow-hidden" style={getTextContainerStyle()}>
              <span className="block text-left font-medium" style={getUniformTextStyle()}>
                {item.name}
              </span>
            </div>
          </Link>
        </li>
      );
    },
    [pathname, isCollapsed, getUniformTextStyle, getTextContainerStyle]
  );

  return (
    <aside
      className={`flex h-full flex-col py-3 px-2 relative border-r
        bg-white/25 backdrop-blur-2xl border-white/50
        shadow-[inset_0_1px_0_rgba(255,255,255,0.7),4px_0_32px_rgba(0,0,0,0.06)]
        ${isCollapsed ? "w-[64px]" : "w-[220px]"}`}
      style={sidebarContainerStyle}
      role="navigation"
      aria-label="board navigation"
    >
      {/* Header / Logo */}
      <header className="group relative h-7 flex shrink-0 items-center justify-between mb-5 px-1">
        {isCollapsed ? (
          <div className="flex items-center w-full">
            <Image
              src="/logo-2.svg"
              alt="HireSense"
              width={24}
              height={24}
              className="mx-auto h-6 w-6 opacity-80"
            />
            <button
              onClick={toggleSidebar}
              onKeyDown={(e) => handleKeyDown(e, toggleSidebar)}
              className="absolute inset-0 flex items-center justify-center text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none"
              aria-label="Open sidebar"
            >
              <ChevronDown className="h-4 w-4 transform rotate-90" />
            </button>
          </div>
        ) : (
          <>
            <Image
              src="/logo-2.png"
              alt="HireSense"
              width={110}
              height={28}
              className="h-7 w-auto"
            />
            <button
              onClick={toggleSidebar}
              onKeyDown={(e) => handleKeyDown(e, toggleSidebar)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/50 h-7 w-7 transition-colors focus:outline-none flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <ChevronDown className="h-4 w-4 transform -rotate-90" />
            </button>
          </>
        )}
      </header>

      <nav className="flex flex-1 flex-col" role="navigation" aria-label="Main menu">
        <ul role="list" className="flex flex-1 flex-col">
          {/* Primary nav */}
          <li>
            <ul role="list" className="space-y-0.5">
              {navigation.map(renderNavigationItem)}
            </ul>
          </li>

          {/* Search bar */}
          {!isCollapsed && (
            <li className="mt-5">
              <div
                className={`relative rounded-xl transition-all duration-200 ${searchFocused
                    ? "bg-white/70 border border-violet-200 shadow-[0_0_0_3px_rgba(167,139,250,0.15)]"
                    : "bg-white/30 border border-white/50"
                  }`}
              >
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${searchFocused ? "text-violet-500" : "text-slate-400"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-700 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-base leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          )}

          {/* Applicants section */}
          <li className="mt-5">
            <div className="space-y-0.5">
              {/* Section label */}
              {!isCollapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1.5">
                  Applicants
                </p>
              )}
              <button
                onClick={() => setApplicantsDropdownOpen(!applicantsDropdownOpen)}
                className={`${navItemBase} w-full ${pathname.startsWith("/board") &&
                    pathname !== "/board/dashboard" &&
                    pathname !== "/board/personalize" &&
                    pathname !== "/board/ats"
                    ? navItemActive
                    : navItemInactive
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <div className="shrink-0 flex items-center justify-center w-5 h-5">
                  <Users className="h-[17px] w-[17px] text-slate-500" />
                </div>
                <div className="ml-[10px] overflow-hidden flex-1" style={getTextContainerStyle()}>
                  <span className="block text-left font-medium" style={getUniformTextStyle()}>
                    Applicants ({searchQuery ? filteredApplicants.length : applicants.length}
                    {searchQuery ? `/${applicants.length}` : ""})
                  </span>
                </div>
                <div className="shrink-0" style={getTextContainerStyle()}>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${applicantsDropdownOpen ? "rotate-180" : ""}`}
                    style={getUniformTextStyle()}
                  />
                </div>
              </button>

              {/* Dropdown */}
              {applicantsDropdownOpen && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200/60 pl-3">
                  <button
                    onClick={navigateToNew}
                    className={`${navItemBase} text-[13px] w-full ${!selectedApplicantId ? navItemActive : navItemInactive
                      }`}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    <span>Add New Applicant</span>
                  </button>

                  {filteredApplicants.map((applicant) => (
                    <button
                      key={applicant.id}
                      onClick={() => navigateToApplicant(applicant.id)}
                      className={`${navItemBase} text-[13px] w-full ${selectedApplicantId === applicant.id ? navItemActive : navItemInactive
                        }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-white">
                          {applicant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="flex-1 text-left truncate">{applicant.name}</span>
                      <div className="ml-1.5 flex-shrink-0">
                        {applicant.status === "completed" && (
                          <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          </div>
                        )}
                        {(applicant.status === "processing" ||
                          applicant.status === "analyzing" ||
                          applicant.status === "uploading") && (
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                          )}
                        {applicant.status === "failed" && (
                          <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                        )}
                      </div>
                    </button>
                  ))}

                  {applicants.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400">No applicants yet</div>
                  )}
                  {applicants.length > 0 && filteredApplicants.length === 0 && searchQuery && (
                    <div className="px-3 py-2 text-xs text-slate-400">
                      No results for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>

          {/* Settings section */}
          <li className="mt-5">
            {!isCollapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1.5">
                Settings
              </p>
            )}
            <ul role="list" className="space-y-0.5">
              {settingsNavigation.map((item) => {
                const isItemActive = (() => {
                  if (item.href === "/board/settings") {
                    return pathname === "/board/settings" && !searchParams.get("tab");
                  }
                  const tabName = item.href.split("tab=")[1];
                  return pathname === "/board/settings" && searchParams.get("tab") === tabName;
                })();
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`${navItemBase} ${isItemActive ? navItemActive : navItemInactive} ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <div className="shrink-0 flex items-center justify-center w-5 h-5">
                        <item.icon
                          className={`h-[17px] w-[17px] ${isItemActive ? "text-slate-800" : "text-slate-500"}`}
                        />
                      </div>
                      <div className="ml-[10px] overflow-hidden flex-1" style={getTextContainerStyle()}>
                        <span className="block text-left font-medium" style={getUniformTextStyle()}>
                          {item.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>

        {/* User footer */}
        <div className="mt-auto pt-4">
          <div className="h-px bg-slate-200/60 mb-3" />
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm font-semibold">{displayInitial}</span>
              </div>
              <div className="ml-2.5 overflow-hidden" style={getTextContainerStyle()}>
                <span className="block text-sm text-slate-800 truncate font-semibold" style={getUniformTextStyle()}>
                  {displayName}
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex-shrink-0 h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
};

const BoardSidebar = memo(BoardSidebarComponent);
BoardSidebar.displayName = "BoardSidebar";

export default BoardSidebar;
