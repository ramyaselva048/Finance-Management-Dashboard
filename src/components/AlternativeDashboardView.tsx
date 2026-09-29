import React from 'react';
import { ArrowLeft, Plus, Printer, Download } from 'lucide-react';
import { FinancialRecord, ManagerTab, SidebarSubItem } from '../types/finance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AlternativeDashboardViewProps {
  subItem: SidebarSubItem;
  onReturnToFinance: () => void;
  records: FinancialRecord[];
  onOpenManager: (tab: ManagerTab) => void;
  onPrint: () => void;
  onDownloadCSV: () => void;
}

const SUB_ITEM_CONFIG: Record<
  SidebarSubItem,
  {
    subtitle: string;
    kpis: { label: string; value: string; delta: string; color: string }[];
  }
> = {
  'Web Analytics': {
    subtitle: 'Real-time web traffic, conversion funnels, and revenue attribution metrics.',
    kpis: [
      { label: 'TOTAL SESSIONS', value: '284,910', delta: '+14.2% vs last month', color: '#5b47fb' },
      { label: 'CONVERSION RATE', value: '4.82%', delta: '+0.6% vs last month', color: '#3366ff' },
      { label: 'REVENUE PER VISIT', value: '$18.40', delta: '+9.1% vs last month', color: '#17c6b8' },
      { label: 'BOUNCE RATE', value: '31.4%', delta: '-2.1% improvement', color: '#e81e63' },
    ],
  },
  'Sales Monitoring': {
    subtitle: 'Enterprise pipeline velocity, closed-won bookings, and quota attainment.',
    kpis: [
      { label: 'MONTHLY BOOKINGS', value: '$83,320.50', delta: '+18.2% vs previous month', color: '#6f42c1' },
      { label: 'PIPELINE COVERAGE', value: '3.6x', delta: '+0.4x target met', color: '#3366ff' },
      { label: 'AVG DEAL SIZE', value: '$20,830.12', delta: '+11.4% YoY', color: '#17c6b8' },
      { label: 'WIN RATE', value: '38.5%', delta: '+3.2% vs Q2', color: '#2eb82e' },
    ],
  },
  'Ad Campaign': {
    subtitle: 'Paid acquisition spend, return on ad spend (ROAS), and cost per qualified lead.',
    kpis: [
      { label: 'TOTAL AD SPEND', value: '$4,699.87', delta: '0.7% vs budget', color: '#007bff' },
      { label: 'BLENDED ROAS', value: '5.4x', delta: '+0.8x vs previous month', color: '#6f42c1' },
      { label: 'COST PER LEAD', value: '$42.10', delta: '-8.4% efficiency gain', color: '#17c6b8' },
      { label: 'ATTRIBUTED ARR', value: '$64,200.00', delta: '+22.0% vs last month', color: '#2eb82e' },
    ],
  },
  'Event Management': {
    subtitle: 'Executive summits, webinar registrations, sponsorship budgets, and ROI.',
    kpis: [
      { label: 'EVENT REGISTRATIONS', value: '4,120', delta: '+19.5% vs target', color: '#5b47fb' },
      { label: 'SPONSORSHIP REVENUE', value: '$34,500.00', delta: '+12.0% vs Q2', color: '#3366ff' },
      { label: 'EVENT PRODUCTION COST', value: '$6,840.00', delta: 'On budget', color: '#17c6b8' },
      { label: 'NET EVENT ROI', value: '404%', delta: '+45% vs previous event', color: '#2eb82e' },
    ],
  },
  'Helpdesk Management': {
    subtitle: 'Customer SLA adherence, ticket resolution velocity, and support cost allocation.',
    kpis: [
      { label: 'FIRST RESPONSE SLA', value: '99.2%', delta: '+0.4% vs target', color: '#5b47fb' },
      { label: 'MEDIAN RESOLUTION', value: '1h 18m', delta: '-14m faster', color: '#3366ff' },
      { label: 'CSAT SCORE', value: '96.8%', delta: '+1.2% vs last month', color: '#2eb82e' },
      { label: 'SUPPORT COST / TICKET', value: '$14.20', delta: '-4.5% vs last month', color: '#17c6b8' },
    ],
  },
  'Finance Monitoring': {
    subtitle: 'Your finance performance and monitoring dashboard template.',
    kpis: [],
  },
  Cryptocurrency: {
    subtitle: 'Digital treasury holdings, stablecoin yield reserves, and settlement liquidity.',
    kpis: [
      { label: 'USDC TREASURY RESERVE', value: '$145,000.00', delta: '4.9% APY yield', color: '#3366ff' },
      { label: 'BTC ALLOCATION', value: '$62,400.00', delta: '+6.8% 30d change', color: '#6f42c1' },
      { label: 'ON-CHAIN SETTLEMENTS', value: '$21,420.50', delta: 'Zero fee variance', color: '#17c6b8' },
      { label: 'TOTAL DIGITAL ASSETS', value: '$228,820.50', delta: '+5.1% vs last month', color: '#2eb82e' },
    ],
  },
  'Executive / SaaS': {
    subtitle: 'Board-level SaaS KPIs: ARR, Net Dollar Retention, Rule of 40, and Runway.',
    kpis: [
      { label: 'ANNUAL RECURRING REV', value: '$999,846.00', delta: '+18.2% MoM growth', color: '#5b47fb' },
      { label: 'NET DOLLAR RETENTION', value: '124%', delta: '+3% vs previous quarter', color: '#3366ff' },
      { label: 'GROSS MARGIN', value: '75.0%', delta: 'Top quartile SaaS', color: '#6f42c1' },
      { label: 'CASH RUNWAY', value: '28.4 Months', delta: '$780,560.00 cash balance', color: '#2eb82e' },
    ],
  },
  'Campaign Monitoring': {
    subtitle: 'Multi-channel enterprise outbound & inbound campaign attribution.',
    kpis: [
      { label: 'ACTIVE CAMPAIGNS', value: '14', delta: '4 enterprise launches', color: '#5b47fb' },
      { label: 'QUALIFIED PIPELINE', value: '$184,500.00', delta: '+16.4% vs last month', color: '#3366ff' },
      { label: 'CAMPAIGN ROI', value: '382%', delta: '+29% vs target', color: '#17c6b8' },
      { label: 'CONVERSION VELOCITY', value: '18 Days', delta: '-3 days faster', color: '#2eb82e' },
    ],
  },
  'Product Management': {
    subtitle: 'Feature adoption, engineering R&D allocation, and unit economics by module.',
    kpis: [
      { label: 'R&D COST ALLOCATION', value: '$20,830.13', delta: '25.0% of revenue', color: '#5b47fb' },
      { label: 'RELEASE FREQUENCY', value: '42 / mo', delta: '99.98% uptime SLA', color: '#3366ff' },
      { label: 'FEATURE ADOPTION', value: '84.6%', delta: '+7.2% active seats', color: '#17c6b8' },
      { label: 'NET PROMOTER SCORE', value: '71', delta: '+5 pts vs Q2', color: '#2eb82e' },
    ],
  },
};

export const AlternativeDashboardView: React.FC<AlternativeDashboardViewProps> = ({
  subItem,
  onReturnToFinance,
  records,
  onOpenManager,
  onPrint,
  onDownloadCSV,
}) => {
  const cfg = SUB_ITEM_CONFIG[subItem];

  const chartData = records.slice(0, 8).map((r) => ({
    name: r.counterparty.split(' ')[0],
    amount: r.amount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReturnToFinance}
              className="text-[12px] font-medium text-[#5b47fb] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Finance Monitoring
            </button>
          </div>
          <h1 className="font-display text-[22px] font-bold text-[#1c273c] mt-1">
            {subItem}
          </h1>
          <p className="text-[13.5px] text-[#596882] mt-0.5">{cfg.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenManager('all')}
            className="px-3.5 py-2 bg-[#5b47fb] text-white text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 hover:bg-[#4a36e8] transition-colors"
          >
            <Plus className="w-4 h-4" /> Manage Records
          </button>
          <button
            onClick={onPrint}
            className="px-3 py-2 bg-white border border-[#dce1ec] text-[#1c273c] text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={onDownloadCSV}
            className="px-3 py-2 bg-white border border-[#dce1ec] text-[#1c273c] text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cfg.kpis.map((k) => (
          <div
            key={k.label}
            onClick={() => onOpenManager('all')}
            className="bg-white border border-[#dce1ec] rounded-[2px] p-5 cursor-pointer hover:border-[#b8c2d8] transition-colors"
          >
            <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#1c273c]">
              {k.label}
            </div>
            <div
              className="font-display text-[26px] font-bold mt-2 tabular-nums"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="text-[12px] text-[#596882] mt-1">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Financial Activity Chart & Ledger Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-[#dce1ec] rounded-[2px] p-6">
          <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1c273c] mb-4">
            {subItem} — Financial Attribution by Counterparty
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#596882' }} />
                <YAxis tick={{ fontSize: 12, fill: '#596882' }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#5b47fb" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#dce1ec] rounded-[2px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1c273c] mb-3">
              Recent Linked Ledger Entries
            </h3>
            <div className="divide-y divide-[#eef1f7]">
              {records.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-[12.5px]">
                  <div>
                    <div className="font-medium text-[#1c273c]">{r.title}</div>
                    <div className="text-[11px] text-[#7987a1]">
                      {r.counterparty} · {r.date}
                    </div>
                  </div>
                  <span className="font-display font-bold tabular-nums text-[#1c273c]">
                    ${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onReturnToFinance}
            className="mt-4 w-full py-2 bg-[#f8f9fc] hover:bg-[#eef1f7] border border-[#dce1ec] text-[#5b47fb] text-[12.5px] font-medium rounded-[2px] transition-colors"
          >
            Return to Primary Finance Monitoring View
          </button>
        </div>
      </div>
    </div>
  );
};
