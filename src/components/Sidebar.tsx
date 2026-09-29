import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  ArrowLeftToLine,
  ArrowRightFromLine,
  User,
  LogOut,
} from 'lucide-react';
import { SidebarRailId, SidebarSubItem } from '../types/finance';
import { AuthUser } from '../types/auth';
import { SIDEBAR_SUB_ITEMS, USER_AVATAR_URL } from '../data/initialFinanceData';

interface SidebarProps {
  activeSubItem: SidebarSubItem;
  onSelectSubItem: (item: SidebarSubItem) => void;
  activeRail: SidebarRailId;
  onSelectRail: (rail: SidebarRailId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenHelp: () => void;
  onOpenProfile: () => void;
  user: AuthUser;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSubItem,
  onSelectSubItem,
  activeRail,
  onSelectRail,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenHelp,
  onOpenProfile,
  user,
  onLogout,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden no-print"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex select-none bg-[#edeff5] border-r border-[#dce1ec] transition-all duration-200 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Leftmost Icon Rail (62px wide, matching reference image) */}
        <div className="w-[62px] flex flex-col items-center justify-between py-[18px] shrink-0">
          {/* Top Section: Azia Logo Mark + 8 Rail Icons */}
          <div className="flex flex-col items-center w-full">
            {/* Azia Purple Bar Chart Logo Icon */}
            <button
              onClick={() => {
                onSelectRail('dashboard');
                onSelectSubItem('Finance Monitoring');
              }}
              title="Azia Finance Home"
              className="w-[32px] h-[32px] flex items-center justify-center mb-[30px] focus:outline-none group"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="3"
                  width="22"
                  height="18"
                  rx="2.5"
                  stroke="#3b336a"
                  strokeWidth="2.2"
                  fill="#ffffff"
                />
                <rect x="6.5" y="11" width="2.6" height="6.5" rx="0.8" fill="#5b47fb" />
                <rect x="11.7" y="7.5" width="2.6" height="10" rx="0.8" fill="#5b47fb" />
                <rect x="16.9" y="9.5" width="2.6" height="8" rx="0.8" fill="#5b47fb" />
                <line
                  x1="2"
                  y1="24"
                  x2="24"
                  y2="24"
                  stroke="#3b336a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* 8 Vertical Navigation Icons matching exact reference shapes */}
            <nav className="flex flex-col items-center gap-[22px] w-full">
              {/* 1. Laptop / Dashboard Icon (Purple active in reference) */}
              <button
                onClick={() => onSelectRail('dashboard')}
                title="Dashboard Layouts"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'dashboard'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="22" height="20" viewBox="0 0 24 22" fill="none">
                  <rect
                    x="3"
                    y="2"
                    width="18"
                    height="12"
                    rx="1.5"
                    fill={activeRail === 'dashboard' ? '#dcd7fe' : 'none'}
                    stroke={activeRail === 'dashboard' ? '#5b47fb' : '#1c273c'}
                    strokeWidth="1.8"
                  />
                  <path
                    d="M1.5 14.5H22.5L23 18.5C23 19.3284 22.3284 20 21.5 20H2.5C1.67157 20 1 19.3284 1 18.5L1.5 14.5Z"
                    stroke={activeRail === 'dashboard' ? '#5b47fb' : '#1c273c'}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* 2. Calendar Icon (Date Filtering & Schedule) */}
              <button
                onClick={() => onSelectRail('calendar')}
                title="Date Filter & Financial Calendar"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'calendar'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect
                    x="2.5"
                    y="4"
                    width="17"
                    height="15.5"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path d="M2.5 9H19.5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M7 2V5.5M15 2V5.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 3. Stacked Document / Reports Icon (Print & Export Reports) */}
              <button
                onClick={() => onSelectRail('reports')}
                title="Financial Reports — Print & Download CSV"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'reports'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect
                    x="5"
                    y="2.5"
                    width="13.5"
                    height="15.5"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M2.5 6.5V18.5C2.5 19.3284 3.17157 20 4 20H15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 4. Folder Plus Icon (Add & Manage Income, Expense, Receivable, Payable) */}
              <button
                onClick={() => onSelectRail('records')}
                title="Manage Income, Expenses, Receivables & Payables"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'records'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="21" height="20" viewBox="0 0 22 20" fill="none">
                  <path
                    d="M2 4.5C2 3.67157 2.67157 3 3.5 3H8.2C8.68 3 9.13 3.23 9.41 3.62L10.6 5.25H18.5C19.3284 5.25 20 5.92157 20 6.75V16.5C20 17.3284 19.3284 18 18.5 18H3.5C2.67157 18 2 17.3284 2 16.5V4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M11 9.25V14.25M8.5 11.75H13.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 5. Line Chart on Baseline Icon (Ratios & Profit Margins) */}
              <button
                onClick={() => onSelectRail('analytics')}
                title="Profit Margins & Financial Ratio Analysis"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'analytics'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="21" height="20" viewBox="0 0 22 20" fill="none">
                  <path
                    d="M2.5 13.5L8 7.5L13 11.5L19 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="7.5" r="1.8" fill="currentColor" />
                  <circle cx="13" cy="11.5" r="1.8" fill="currentColor" />
                  <circle cx="19" cy="4.5" r="1.8" fill="currentColor" />
                  <line
                    x1="2"
                    y1="17.5"
                    x2="20"
                    y2="17.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 6. Folded Map Icon (Account & Card Settings) */}
              <button
                onClick={() => onSelectRail('accounts')}
                title="Account & Visa Card Details"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'accounts'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path
                    d="M2.5 5.5L8 3L14 5.5L19.5 3V16.5L14 19L8 16.5L2.5 19V5.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M8 3V16.5M14 5.5V19" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>

              {/* 7. 2x2 Grid Icon (All Transactions Ledger) */}
              <button
                onClick={() => onSelectRail('categories')}
                title="All Transactions Ledger"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'categories'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="3" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="12.5" y="3" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="3" y="12.5" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="12.5" y="12.5" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>

              {/* 8. Archive Box Icon */}
              <button
                onClick={() => onSelectRail('archive')}
                title="Audit Log & Data Reset"
                className={`p-1.5 rounded transition-colors ${
                  activeRail === 'archive'
                    ? 'text-[#5b47fb]'
                    : 'text-[#1c273c] hover:text-[#5b47fb]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="2.5" y="3.5" width="17" height="4" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M4 7.5V18H18V7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="8.5"
                    y1="11.5"
                    x2="13.5"
                    y2="11.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </nav>
          </div>

          {/* Bottom Section: Help Circle Icon + User Avatar with Green Online Status Dot & Profile/Logout Popover */}
          <div className="flex flex-col items-center gap-[22px] mt-8 relative" ref={profileRef}>
            <button
              onClick={onOpenHelp}
              title="Dashboard Guide & Help"
              className="text-[#8592a6] hover:text-[#5b47fb] transition-colors"
            >
              <HelpCircle className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>

            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={`${user.fullName} (${user.email})`}
              className="relative w-[36px] h-[36px] rounded-full focus:outline-none group"
            >
              <img
                src={USER_AVATAR_URL}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-[36px] h-[36px] rounded-full object-cover border border-white/80 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full bg-[#2eb82e] ring-2 ring-[#edeff5]" />
            </button>

            {/* Sidebar User Profile & Logout Popover */}
            {profileMenuOpen && (
              <div className="absolute left-[56px] bottom-0 w-[235px] bg-white border border-[#dce1ec] shadow-xl rounded-[3px] py-2 z-50">
                <div className="px-3.5 py-2 border-b border-[#eef1f7]">
                  <div className="text-[13px] font-bold text-[#1c273c] truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] text-[#5b47fb] truncate">{user.email}</div>
                </div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[12.5px] text-[#1c273c] hover:bg-[#f8f9fc] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-[#5b47fb]" /> Profile & Security
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[12.5px] text-[#dc3545] hover:bg-[#fef2f2] font-medium flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Second Column: Azia Submenu Panel (226px wide on desktop unless collapsed) */}
        {!collapsed ? (
          <div className="w-[226px] flex flex-col pt-[17px] pb-6 pr-5 pl-2">
            {/* Brand Header Row: "azia" + Collapse Arrow */}
            <div className="flex items-center justify-between mb-[30px] pl-1">
              <span
                onClick={() => onSelectSubItem('Finance Monitoring')}
                className="font-display text-[23px] font-bold tracking-[-0.03em] text-[#5b47fb] cursor-pointer leading-none"
              >
                azia
              </span>
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="text-[#596882] hover:text-[#1c273c] transition-colors p-1"
              >
                <ArrowLeftToLine className="w-[17px] h-[17px]" strokeWidth={1.7} />
              </button>
            </div>

            {/* Dashboard Heading & Description */}
            <div className="pl-1 mb-[22px]">
              <h2 className="font-display text-[18.5px] font-bold text-[#1c273c] tracking-[-0.01em] mb-1.5">
                Dashboard
              </h2>
              <p className="text-[12px] leading-[1.45] text-[#7987a1]">
                Choose between layouts to experience different look and feel for your projects.
              </p>
            </div>

            {/* Submenu List with Left Border Line & Horizontal Hairline Dividers */}
            <div className="border-l border-[#cfd6e6] pl-[18px] flex flex-col">
              {SIDEBAR_SUB_ITEMS.map((item) => {
                const isActive = activeSubItem === item;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      onSelectSubItem(item);
                      onCloseMobile();
                    }}
                    className={`w-full text-left py-[10.5px] text-[13px] border-b border-[#e1e6f0] transition-colors whitespace-nowrap truncate ${
                      isActive
                        ? 'text-[#5b47fb] font-medium'
                        : 'text-[#1c273c] font-normal hover:text-[#5b47fb]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-[20px] pr-2">
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="text-[#596882] hover:text-[#1c273c] transition-colors p-1"
            >
              <ArrowRightFromLine className="w-[17px] h-[17px]" strokeWidth={1.7} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
