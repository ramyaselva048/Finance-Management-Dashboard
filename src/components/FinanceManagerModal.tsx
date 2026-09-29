import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Search,
  Calendar,
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  AccountInfo,
  DateFilterRange,
  FinancialRecord,
  ManagerTab,
  RecordStatus,
  RecordType,
} from '../types/finance';

interface FinanceManagerModalProps {
  isOpen: boolean;
  initialTab: ManagerTab;
  initialEditRecord?: FinancialRecord | null;
  onClose: () => void;
  records: FinancialRecord[];
  onAddRecord: (rec: Omit<FinancialRecord, 'id'>) => void;
  onUpdateRecord: (rec: FinancialRecord) => void;
  onDeleteRecord: (id: string) => void;
  accountInfo: AccountInfo;
  onUpdateAccount: (info: AccountInfo) => void;
  dateFilter: DateFilterRange;
  onDateFilterChange: (range: DateFilterRange) => void;
  onPrintReport: () => void;
  onPrintSingleRecord: (rec: FinancialRecord) => void;
  onDownloadCSV: () => void;
  onResetData: () => void;
  metrics: {
    totalIncome: number;
    totalExpense: number;
    totalReceivable: number;
    totalPayable: number;
    currentBalance: number;
    grossMargin: number;
    netMargin: number;
    quickRatioDisplay: string;
    currentRatioDisplay: string;
  };
}

export const FinanceManagerModal: React.FC<FinanceManagerModalProps> = ({
  isOpen,
  initialTab,
  initialEditRecord,
  onClose,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  accountInfo,
  onUpdateAccount,
  dateFilter,
  onDateFilterChange,
  onPrintReport,
  onPrintSingleRecord,
  onDownloadCSV,
  onResetData,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<ManagerTab>(initialTab);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RecordStatus>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Record Form State
  const [formType, setFormType] = useState<RecordType>('income');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCounterparty, setFormCounterparty] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('2026-09-28');
  const [formStatus, setFormStatus] = useState<RecordStatus>('completed');
  const [formDirectCost, setFormDirectCost] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Account Form State
  const [holderName, setHolderName] = useState(accountInfo.holderName);
  const [accountType, setAccountType] = useState(accountInfo.accountType);
  const [lastFour, setLastFour] = useState(accountInfo.lastFour);
  const [baseBalance, setBaseBalance] = useState(String(accountInfo.baseBalance));
  const [accountSavedMessage, setAccountSavedMessage] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    if (
      initialTab === 'income' ||
      initialTab === 'expense' ||
      initialTab === 'receivable' ||
      initialTab === 'payable'
    ) {
      setFormType(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setHolderName(accountInfo.holderName);
    setAccountType(accountInfo.accountType);
    setLastFour(accountInfo.lastFour);
    setBaseBalance(String(accountInfo.baseBalance));
  }, [accountInfo]);

  useEffect(() => {
    if (initialEditRecord) {
      startEdit(initialEditRecord);
    } else {
      setShowForm(false);
      setEditingId(null);
    }
  }, [initialEditRecord, isOpen]);

  if (!isOpen) return null;

  const startNewRecord = (defaultType?: RecordType) => {
    const targetType =
      defaultType ||
      (activeTab === 'income' ||
      activeTab === 'expense' ||
      activeTab === 'receivable' ||
      activeTab === 'payable'
        ? activeTab
        : 'income');
    setEditingId(null);
    setFormType(targetType);
    setFormTitle('');
    setFormCategory(
      targetType === 'income'
        ? 'Subscription Revenue'
        : targetType === 'expense'
        ? 'Cloud Infrastructure'
        : targetType === 'receivable'
        ? 'Accounts Receivable'
        : 'Accounts Payable'
    );
    setFormCounterparty('');
    setFormAmount('');
    setFormDate('2026-09-28');
    setFormStatus(
      targetType === 'receivable' || targetType === 'payable'
        ? 'pending'
        : 'completed'
    );
    setFormDirectCost(targetType === 'expense');
    setFormNotes('');
    setShowForm(true);
  };

  const startEdit = (rec: FinancialRecord) => {
    setEditingId(rec.id);
    setFormType(rec.type);
    setFormTitle(rec.title);
    setFormCategory(rec.category);
    setFormCounterparty(rec.counterparty);
    setFormAmount(String(rec.amount));
    setFormDate(rec.date);
    setFormStatus(rec.status);
    setFormDirectCost(Boolean(rec.isDirectCost));
    setFormNotes(rec.notes || '');
    setShowForm(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      type: formType,
      title: formTitle.trim(),
      category: formCategory.trim() || 'General',
      counterparty: formCounterparty.trim() || 'Counterparty',
      amount: Math.round(parsedAmount * 100) / 100,
      date: formDate || '2026-09-28',
      status: formStatus,
      isDirectCost: formType === 'expense' ? formDirectCost : false,
      notes: formNotes.trim(),
    };

    if (editingId) {
      onUpdateRecord({ id: editingId, ...payload });
    } else {
      onAddRecord(payload);
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBase = parseFloat(baseBalance);
    onUpdateAccount({
      holderName: holderName.trim() || 'Alicia Christensen',
      accountType: accountType.trim() || 'Savings',
      cardNumberPrefix: accountInfo.cardNumberPrefix,
      lastFour: (lastFour.trim() || '5637').slice(-4),
      baseBalance: isNaN(parsedBase) ? accountInfo.baseBalance : parsedBase,
    });
    setAccountSavedMessage(true);
    setTimeout(() => setAccountSavedMessage(false), 2500);
  };

  const filteredRecords = records.filter((rec) => {
    if (
      (activeTab === 'income' ||
        activeTab === 'expense' ||
        activeTab === 'receivable' ||
        activeTab === 'payable') &&
      rec.type !== activeTab
    ) {
      return false;
    }
    if (statusFilter !== 'all' && rec.status !== statusFilter) {
      return false;
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.counterparty.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const tabs: { id: ManagerTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All Transactions', count: records.length },
    {
      id: 'income',
      label: 'Income',
      count: records.filter((r) => r.type === 'income').length,
    },
    {
      id: 'expense',
      label: 'Expenses',
      count: records.filter((r) => r.type === 'expense').length,
    },
    {
      id: 'receivable',
      label: 'Receivables',
      count: records.filter((r) => r.type === 'receivable').length,
    },
    {
      id: 'payable',
      label: 'Payables',
      count: records.filter((r) => r.type === 'payable').length,
    },
    { id: 'ratios', label: 'Margins & Ratios' },
    { id: 'account', label: 'Balance & Visa Card' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white border border-[#dce1ec] rounded-[3px] shadow-2xl w-full max-w-[1040px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#f8f9fc] border-b border-[#dce1ec] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-[17px] font-bold text-[#1c273c]">
                Finance Management & Ledger Control
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-xs">
                <CheckCircle2 className="w-3 h-3 text-[#2eb82e]" /> Neon PostgreSQL (neondb)
              </span>
            </div>
            <p className="text-[12px] text-[#7987a1] mt-0.5">
              Add, edit, or delete financial records — synced with Neon PostgreSQL and updated on the dashboard in real time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrintReport}
              className="px-3.5 py-1.5 text-[12px] font-medium text-[#1c273c] bg-white border border-[#dce1ec] hover:bg-[#f1f3f9] rounded-[2px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#596882] shrink-0" /> Print
            </button>
            <button
              type="button"
              onClick={onDownloadCSV}
              className="px-3.5 py-1.5 text-[12px] font-medium text-[#1c273c] bg-white border border-[#dce1ec] hover:bg-[#f1f3f9] rounded-[2px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#596882] shrink-0" /> Export CSV
            </button>
            <button
              type="button"
              onClick={onResetData}
              title="Reset to initial reference screenshot values"
              className="px-3.5 py-1.5 text-[12px] font-medium text-[#dc3545] bg-white border border-[#dce1ec] hover:bg-[#fef2f2] rounded-[2px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 p-1.5 text-[#596882] hover:text-[#1c273c] hover:bg-[#e2e7f1] rounded transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#e2e7f1] bg-white border-b border-[#dce1ec] text-[12px]">
          <div className="px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-[#7987a1]">Balance</div>
            <div className="font-display text-[15px] font-bold text-[#1c273c] tabular-nums mt-0.5">
              ${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-[#6f42c1]">Total Income</div>
            <div className="font-display text-[15px] font-bold text-[#1c273c] tabular-nums mt-0.5">
              ${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-[#007bff]">Total Expenses</div>
            <div className="font-display text-[15px] font-bold text-[#1c273c] tabular-nums mt-0.5">
              ${metrics.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-[#17c6b8]">Receivable</div>
            <div className="font-display text-[15px] font-bold text-[#1c273c] tabular-nums mt-0.5">
              ${metrics.totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-[#e81e63]">Payable</div>
            <div className="font-display text-[15px] font-bold text-[#1c273c] tabular-nums mt-0.5">
              ${metrics.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-[#f8f9fc] border-b border-[#dce1ec] flex items-center gap-1 overflow-x-auto shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setShowForm(false);
              }}
              className={`px-3.5 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-[#5b47fb] text-[#5b47fb] bg-white'
                  : 'border-transparent text-[#596882] hover:text-[#1c273c]'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className="ml-1.5 text-[11px] text-[#7987a1] tabular-nums">
                  ({t.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'account' ? (
            <form onSubmit={handleSaveAccount} className="max-w-xl space-y-4">
              <h3 className="font-display text-[15px] font-bold text-[#1c273c]">
                Edit Balance & Visa Card Configuration
              </h3>
              <p className="text-[12.5px] text-[#596882]">
                Your displayed Balance (${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}) is automatically calculated as{' '}
                <strong>Base Balance + Total Income − Total Expenses</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-[#596882] mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="w-full h-[38px] px-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-[#596882] mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full h-[38px] px-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Checking">Checking</option>
                    <option value="Corporate Treasury">Corporate Treasury</option>
                    <option value="Money Market">Money Market</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-[#596882] mb-1">
                    Last 4 Digits of Card
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-[38px] px-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] tabular-nums focus:outline-none focus:border-[#5b47fb]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-[#596882] mb-1">
                    Base Reserve Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={baseBalance}
                    onChange={(e) => setBaseBalance(e.target.value)}
                    className="w-full h-[38px] px-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] tabular-nums focus:outline-none focus:border-[#5b47fb]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5b47fb] hover:bg-[#4a36e8] text-white text-[13px] font-medium rounded-[2px] transition-colors"
                >
                  Save Account Details
                </button>
                {accountSavedMessage && (
                  <span className="text-[12.5px] text-[#2eb82e] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Account details updated!
                  </span>
                )}
              </div>
            </form>
          ) : activeTab === 'ratios' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-[15px] font-bold text-[#1c273c]">
                  Real-Time Profit Margin & Liquidity Ratio Breakdown
                </h3>
                <p className="text-[12.5px] text-[#596882] mt-1">
                  These metrics are dynamically computed from your active Income, Expense, Receivable, and Payable records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#dce1ec] rounded-[2px] bg-[#f8f9fc]">
                  <div className="text-[11px] font-bold uppercase text-[#6f42c1]">
                    Gross Profit Margin
                  </div>
                  <div className="font-display text-[28px] font-bold text-[#1c273c] mt-1 tabular-nums">
                    {metrics.grossMargin}%
                  </div>
                  <p className="text-[12px] text-[#596882] mt-1">
                    Calculated as <code>(Total Income − Direct COGS Expenses) / Total Income</code>. Add more income or reduce direct costs to increase this percentage.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('income');
                      startNewRecord('income');
                    }}
                    className="mt-3 text-[12px] font-medium text-[#5b47fb] hover:underline"
                  >
                    + Add Income Record to Boost Margin →
                  </button>
                </div>

                <div className="p-4 border border-[#dce1ec] rounded-[2px] bg-[#f8f9fc]">
                  <div className="text-[11px] font-bold uppercase text-[#3366ff]">
                    Net Profit Margin
                  </div>
                  <div className="font-display text-[28px] font-bold text-[#1c273c] mt-1 tabular-nums">
                    {metrics.netMargin}%
                  </div>
                  <p className="text-[12px] text-[#596882] mt-1">
                    Measures overall profitability after operating expenses. Dynamically responds to all Income and Expense additions or deletions.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('expense');
                    }}
                    className="mt-3 text-[12px] font-medium text-[#3366ff] hover:underline"
                  >
                    Inspect Operating Expenses →
                  </button>
                </div>

                <div className="p-4 border border-[#dce1ec] rounded-[2px] bg-[#f8f9fc]">
                  <div className="text-[11px] font-bold uppercase text-[#d97706]">
                    Quick Ratio (Goal: 1.0 or higher)
                  </div>
                  <div className="font-display text-[28px] font-bold text-[#1c273c] mt-1 tabular-nums">
                    {metrics.quickRatioDisplay}
                  </div>
                  <p className="text-[12px] text-[#596882] mt-1">
                    Measures liquid current assets + accounts receivable (${metrics.totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}) relative to current liabilities (${metrics.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}).
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('receivable');
                      startNewRecord('receivable');
                    }}
                    className="mt-3 text-[12px] font-medium text-[#5b47fb] hover:underline"
                  >
                    + Add Accounts Receivable →
                  </button>
                </div>

                <div className="p-4 border border-[#dce1ec] rounded-[2px] bg-[#f8f9fc]">
                  <div className="text-[11px] font-bold uppercase text-[#2eb82e]">
                    Current Ratio (Goal: 2.0 or higher)
                  </div>
                  <div className="font-display text-[28px] font-bold text-[#1c273c] mt-1 tabular-nums">
                    {metrics.currentRatioDisplay}
                  </div>
                  <p className="text-[12px] text-[#596882] mt-1">
                    Measures total current assets relative to current liabilities. Adding income/receivables or paying off payables improves this ratio.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('payable');
                    }}
                    className="mt-3 text-[12px] font-medium text-[#2eb82e] hover:underline"
                  >
                    Manage Accounts Payable →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filter & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Search input */}
                  <div className="relative w-full sm:w-[240px]">
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Filter records..."
                      className="w-full h-[36px] pl-3 pr-8 border border-[#dce1ec] rounded-[2px] text-[12.5px] focus:outline-none focus:border-[#5b47fb]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#7987a1] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | RecordStatus)}
                    className="h-[36px] px-2.5 border border-[#dce1ec] rounded-[2px] text-[12.5px] text-[#1c273c] bg-white focus:outline-none focus:border-[#5b47fb]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#7987a1]" />
                    <select
                      value={dateFilter}
                      onChange={(e) => onDateFilterChange(e.target.value as DateFilterRange)}
                      className="h-[36px] px-2.5 border border-[#dce1ec] rounded-[2px] text-[12.5px] text-[#1c273c] bg-white focus:outline-none focus:border-[#5b47fb]"
                    >
                      <option value="all">All Dates (Reference Total)</option>
                      <option value="this_month">September 2026</option>
                      <option value="last_month">After Sep 15, 2026</option>
                      <option value="custom">Last 10 Days</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => startNewRecord()}
                  className="px-4 py-2 bg-[#5b47fb] hover:bg-[#4a36e8] text-white text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add{' '}
                  {activeTab === 'all'
                    ? 'Financial Record'
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </button>
              </div>

              {/* Add / Edit Record Form */}
              {showForm && (
                <form
                  onSubmit={handleSaveRecord}
                  className="mb-6 p-4 bg-[#f8f9fc] border border-[#cfd6e6] rounded-[2px] space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#e2e7f1] pb-2.5">
                    <h4 className="font-display text-[13.5px] font-bold text-[#1c273c]">
                      {editingId ? 'Edit Financial Record' : 'Add New Financial Record'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="text-[12px] text-[#7987a1] hover:text-[#1c273c]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Record Type
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as RecordType)}
                        className="w-full h-[36px] px-2.5 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px]"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="receivable">Accounts Receivable</option>
                        <option value="payable">Accounts Payable</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Description / Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g., Enterprise License Q4 Payment"
                        className="w-full h-[36px] px-3 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Amount (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="5000.00"
                        className="w-full h-[36px] px-3 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px] tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Counterparty / Client / Vendor
                      </label>
                      <input
                        type="text"
                        value={formCounterparty}
                        onChange={(e) => setFormCounterparty(e.target.value)}
                        placeholder="e.g., Acme Corp"
                        className="w-full h-[36px] px-3 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="e.g., Subscription Revenue"
                        className="w-full h-[36px] px-3 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full h-[36px] px-3 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px] tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                        Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as RecordStatus)}
                        className="w-full h-[36px] px-2.5 bg-white border border-[#dce1ec] rounded-[2px] text-[12.5px]"
                      >
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>

                    {formType === 'expense' && (
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-[12px] text-[#1c273c] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formDirectCost}
                            onChange={(e) => setFormDirectCost(e.target.checked)}
                            className="rounded border-[#dce1ec]"
                          />
                          Direct Cost of Sales (affects Gross Margin)
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="px-4 py-1.5 border border-[#dce1ec] bg-white text-[12.5px] text-[#596882] rounded-[2px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 bg-[#5b47fb] hover:bg-[#4a36e8] text-white text-[12.5px] font-medium rounded-[2px]"
                    >
                      {editingId ? 'Update Record' : 'Save Record'}
                    </button>
                  </div>
                </form>
              )}

              {/* Records Table */}
              <div className="border border-[#dce1ec] rounded-[2px] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fc] border-b border-[#dce1ec] text-[11px] font-bold uppercase tracking-wider text-[#7987a1]">
                      <th className="py-2.5 px-3.5">Title & Counterparty</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f7] text-[12.5px]">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#7987a1]">
                          No financial records found for this filter. Click{' '}
                          <button
                            onClick={() => startNewRecord()}
                            className="text-[#5b47fb] font-medium hover:underline"
                          >
                            + Add Record
                          </button>{' '}
                          to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#f8f9fc] transition-colors">
                          <td className="py-2.5 px-3.5">
                            <div className="font-medium text-[#1c273c]">{rec.title}</div>
                            <div className="text-[11px] text-[#7987a1]">
                              {rec.counterparty} · {rec.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-[12px] font-medium">
                            <span
                              style={{
                                color:
                                  rec.type === 'income'
                                    ? '#6f42c1'
                                    : rec.type === 'expense'
                                    ? '#007bff'
                                    : rec.type === 'receivable'
                                    ? '#0d9488'
                                    : '#e81e63',
                              }}
                            >
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[12px] text-[#596882] tabular-nums">
                            {rec.date}
                          </td>
                          <td className="py-2.5 px-3 text-[12px]">
                            <span className="inline-flex items-center gap-1 capitalize text-[#3b4863]">
                              {rec.status === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#2eb82e]" />
                              )}
                              {rec.status === 'pending' && (
                                <Clock className="w-3.5 h-3.5 text-[#f6b900]" />
                              )}
                              {rec.status === 'overdue' && (
                                <AlertCircle className="w-3.5 h-3.5 text-[#dc3545]" />
                              )}
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-display font-bold text-[#1c273c] tabular-nums">
                            ${rec.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onPrintSingleRecord(rec)}
                                title="Print Invoice / Voucher for this record"
                                className="p-1 text-[#596882] hover:text-[#3366ff] rounded cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(rec)}
                                title="Edit record"
                                className="p-1 text-[#596882] hover:text-[#5b47fb] rounded cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRecord(rec.id)}
                                title="Delete record"
                                className="p-1 text-[#596882] hover:text-[#dc3545] rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
