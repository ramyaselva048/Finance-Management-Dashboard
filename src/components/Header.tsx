import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Menu,
  Plus,
  Printer,
  Download,
  Calendar,
  FileText,
  RotateCcw,
  Check,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { DateFilterRange, FinancialRecord, ManagerTab } from '../types/finance';
import { AuthUser } from '../types/auth';
import { USER_AVATAR_URL } from '../data/initialFinanceData';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateFilter: DateFilterRange;
  onDateFilterChange: (range: DateFilterRange) => void;
  records: FinancialRecord[];
  onOpenManager: (tab: ManagerTab, recordToEdit?: FinancialRecord) => void;
  onPrintReport: () => void;
  onDownloadCSV: () => void;
  onResetData: () => void;
  onOpenMobileMenu: () => void;
  accountHolder: string;
  user: AuthUser;
  onOpenUserProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  records,
  onOpenManager,
  onPrintReport,
  onDownloadCSV,
  onResetData,
  onOpenMobileMenu,
  accountHolder,
  user,
  onOpenUserProfile,
  onLogout,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'messages' | 'notifications' | 'profile' | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingRecords = searchQuery.trim()
    ? records.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const dateFilterLabels: Record<DateFilterRange, string> = {
    all: 'All Time (Default Reference)',
    this_month: 'This Month (Sep 2026)',
    last_month: 'Mid-to-Late Sep 2026',
    this_quarter: 'Q3 2026',
    this_year: 'FY 2026',
    custom: 'Recent 15 Days',
  };

  return (
    <header className="h-[64px] bg-white border-b border-[#dce1ec] px-4 lg:px-8 flex items-center justify-between shrink-0 relative z-30 no-print">
      {/* Left / Center Search Bar matching exact reference dimensions and colors */}
      <div className="flex items-center gap-3 flex-1 max-w-[685px]" ref={searchContainerRef}>
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#1c273c] hover:bg-slate-100 rounded"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search for anything..."
            className="w-full h-[40px] bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] pl-4 pr-10 text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7987a1] hover:text-[#1c273c]"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search
              className="w-[16px] h-[16px] text-[#7987a1] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={2.2}
            />
          )}

          {/* Interactive Search & Quick Finance Command Dropdown */}
          {searchFocused && (
            <div className="absolute left-0 right-0 top-[46px] bg-white border border-[#dce1ec] shadow-lg rounded-[3px] p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eef1f7]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7987a1]">
                  Quick Finance Management & Actions
                </span>
                <span className="text-[11px] text-[#5b47fb]">
                  Period: {dateFilterLabels[dateFilter]}
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => {
                    setSearchFocused(false);
                    onOpenManager('income');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f3ff] text-[#5b47fb] hover:bg-[#ede9fe] rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Income
                </button>
                <button
                  onClick={() => {
                    setSearchFocused(false);
                    onOpenManager('expense');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium bg-[#eff6ff] text-[#007bff] hover:bg-[#dbeafe] rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Expense
                </button>
                <button
                  onClick={() => {
                    setSearchFocused(false);
                    onOpenManager('receivable');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1] rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Receivable
                </button>
                <button
                  onClick={() => {
                    setSearchFocused(false);
                    onOpenManager('payable');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium bg-[#fdf2f8] text-[#db2777] hover:bg-[#fce7f3] rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Payable
                </button>
              </div>

              {/* Date Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2.5 mb-2.5 border-b border-[#eef1f7]">
                <span className="text-[11px] text-[#7987a1] mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date Filter:
                </span>
                {(['all', 'this_month', 'last_month', 'custom'] as DateFilterRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => onDateFilterChange(range)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      dateFilter === range
                        ? 'bg-[#5b47fb] text-white font-medium'
                        : 'bg-[#f1f3f9] text-[#596882] hover:bg-[#e2e7f1]'
                    }`}
                  >
                    {dateFilterLabels[range]}
                  </button>
                ))}
              </div>

              {/* Matching Records */}
              {searchQuery.trim() ? (
                <div className="max-h-[200px] overflow-y-auto divide-y divide-[#eef1f7]">
                  {matchingRecords.length > 0 ? (
                    matchingRecords.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setSearchFocused(false);
                          onOpenManager(rec.type, rec);
                        }}
                        className="w-full text-left py-2 px-2 hover:bg-[#f8f9fc] flex items-center justify-between text-[12.5px]"
                      >
                        <div>
                          <div className="font-medium text-[#1c273c]">{rec.title}</div>
                          <div className="text-[11px] text-[#7987a1]">
                            {rec.counterparty} · {rec.category} · {rec.date}
                          </div>
                        </div>
                        <span className="font-bold tabular-nums text-[#1c273c]">
                          ${rec.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-3 text-center text-[12px] text-[#7987a1]">
                      No financial records match &quot;{searchQuery}&quot;. Click to open Full Ledger.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 text-[12px]">
                  <button
                    onClick={() => {
                      setSearchFocused(false);
                      onOpenManager('all');
                    }}
                    className="text-[#5b47fb] font-medium hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Open Full Transactions Manager ({records.length} records)
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        onPrintReport();
                      }}
                      className="text-[#596882] hover:text-[#1c273c] flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        onDownloadCSV();
                      }}
                      className="text-[#596882] hover:text-[#1c273c] flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Icons: Messages, Notification Bell with Red Dot, User Profile Avatar */}
      <div className="flex items-center gap-[22px] ml-4" ref={dropdownContainerRef}>
        {/* 1. Overlapping Chat Bubbles Icon (Exact match to reference) */}
        <div className="relative">
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === 'messages' ? null : 'messages')
            }
            title="Finance Team Messages"
            className="text-[#1c273c] hover:text-[#5b47fb] transition-colors flex items-center justify-center"
          >
            <svg width="22" height="20" viewBox="0 0 24 22" fill="none">
              <path
                d="M3 4.5C3 3.67157 3.67157 3 4.5 3H15.5C16.3284 3 17 3.67157 17 4.5V11.5C17 12.3284 16.3284 13 15.5 13H8L4 16V13H4.5C3.67157 13 3 12.3284 3 11.5V4.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9 13V15.5C9 16.3284 9.67157 17 10.5 17H16L20 19.5V17H19.5C20.3284 17 21 16.3284 21 15.5V8.5C21 7.67157 20.3284 7 19.5 7H17"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {activeDropdown === 'messages' && (
            <div className="absolute right-0 top-[42px] w-[300px] bg-white border border-[#dce1ec] shadow-lg rounded-[3px] p-3.5 z-50">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#eef1f7]">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[#1c273c]">
                  Finance Desk Messages
                </span>
                <span className="text-[11px] text-[#5b47fb] font-medium">3 Active</span>
              </div>
              <div className="space-y-2.5 text-[12.5px]">
                <div
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('receivable');
                  }}
                  className="p-2 rounded hover:bg-[#f8f9fc] cursor-pointer"
                >
                  <div className="flex justify-between font-medium text-[#1c273c]">
                    <span>Marcus Vance (Controller)</span>
                    <span className="text-[11px] text-[#7987a1]">10m ago</span>
                  </div>
                  <p className="text-[11.5px] text-[#596882] mt-0.5">
                    Northstar Healthcare invoice #INV-2094 ($4,250) is confirmed for settlement.
                  </p>
                </div>
                <div
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('income');
                  }}
                  className="p-2 rounded hover:bg-[#f8f9fc] cursor-pointer"
                >
                  <div className="flex justify-between font-medium text-[#1c273c]">
                    <span>Elena Rostova (VP Finance)</span>
                    <span className="text-[11px] text-[#7987a1]">1h ago</span>
                  </div>
                  <p className="text-[11.5px] text-[#596882] mt-0.5">
                    Gross profit margin reached 75% target this month (+18.2% income growth).
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  onOpenManager('all');
                }}
                className="w-full mt-3 pt-2 border-t border-[#eef1f7] text-center text-[12px] font-medium text-[#5b47fb] hover:underline"
              >
                Manage All Financial Records →
              </button>
            </div>
          )}
        </div>

        {/* 2. Notification Bell Icon with Red Dot at top-right */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveDropdown(
                activeDropdown === 'notifications' ? null : 'notifications'
              );
              setUnreadNotifications(false);
            }}
            title="Financial Notifications & Alerts"
            className="relative text-[#1c273c] hover:text-[#5b47fb] transition-colors flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path
                d="M16.5 8.5C16.5 5.46243 14.0376 3 11 3C7.96243 3 5.5 5.46243 5.5 8.5C5.5 14 3.5 15.5 3.5 15.5H18.5C18.5 15.5 16.5 14 16.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.2 18.5C9.55 19.1 10.22 19.5 11 19.5C11.78 19.5 12.45 19.1 12.8 18.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
            {unreadNotifications && (
              <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-[#dc3545]" />
            )}
          </button>

          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 top-[42px] w-[310px] bg-white border border-[#dce1ec] shadow-lg rounded-[3px] p-3.5 z-50">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#eef1f7]">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[#1c273c]">
                  Financial Alerts
                </span>
                <span className="text-[11px] text-[#2eb82e] flex items-center gap-1">
                  <Check className="w-3 h-3" /> All synced
                </span>
              </div>
              <div className="space-y-2.5 text-[12px]">
                <div
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('ratios');
                  }}
                  className="p-2 rounded bg-[#fffbeb] border border-[#fde68a] cursor-pointer"
                >
                  <div className="font-semibold text-[#92400e]">Quick Ratio Alert (0.9:8)</div>
                  <p className="text-[11.5px] text-[#78350f] mt-0.5">
                    Quick Ratio is slightly below the 1.0 goal. Click to inspect liquidity & receivables.
                  </p>
                </div>
                <div
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('receivable');
                  }}
                  className="p-2 rounded hover:bg-[#f8f9fc] cursor-pointer"
                >
                  <div className="font-medium text-[#1c273c]">Overdue Receivable: $1,750.00</div>
                  <p className="text-[11.5px] text-[#596882] mt-0.5">
                    Invoice #INV-2076 from Kestrel Media Group is marked overdue.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. User Profile Avatar (Circular photo of Alicia Christensen / Logged-in User) */}
        <div className="relative">
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')
            }
            title={`${user.fullName} (${user.email}) — Profile & Logout`}
            className="w-[34px] h-[34px] rounded-full overflow-hidden focus:outline-none ring-1 ring-[#dce1ec] hover:ring-[#5b47fb] transition-all"
          >
            <img
              src={USER_AVATAR_URL}
              alt={accountHolder}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>

          {activeDropdown === 'profile' && (
            <div className="absolute right-0 top-[44px] w-[265px] bg-white border border-[#dce1ec] shadow-lg rounded-[3px] py-2 z-50">
              {/* Logged-in User Name & Email */}
              <div className="px-4 py-2.5 border-b border-[#eef1f7]">
                <div className="text-[13.5px] font-bold text-[#1c273c] truncate">
                  {user.fullName}
                </div>
                <div className="text-[11.5px] text-[#5b47fb] font-medium truncate">
                  {user.email}
                </div>
                <div className="text-[11px] text-[#7987a1] mt-0.5 truncate">
                  {user.role || 'Chief Financial Officer'}
                </div>
              </div>

              <div className="py-1 text-[12.5px]">
                {/* Profile Option */}
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenUserProfile();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#1c273c] font-medium flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-[#5b47fb]" /> Profile & Security
                </button>

                <div className="my-1 border-t border-[#eef1f7]" />

                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('all');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#1c273c] flex items-center gap-2.5"
                >
                  <Plus className="w-4 h-4 text-[#5b47fb]" /> Manage Financial Records
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onOpenManager('account');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#1c273c] flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-[#3366ff]" /> Edit Balance & Visa Card
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onPrintReport();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#1c273c] flex items-center gap-2.5"
                >
                  <Printer className="w-4 h-4 text-[#596882]" /> Print Dashboard Report
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onDownloadCSV();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#1c273c] flex items-center gap-2.5"
                >
                  <Download className="w-4 h-4 text-[#596882]" /> Download CSV Report
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onResetData();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8f9fc] text-[#596882] flex items-center gap-2.5"
                >
                  <RotateCcw className="w-4 h-4" /> Reset to Reference Data
                </button>

                <div className="my-1 border-t border-[#eef1f7]" />

                {/* Logout Option */}
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#fef2f2] text-[#dc3545] font-medium flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
