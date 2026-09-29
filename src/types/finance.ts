export type RecordType = 'income' | 'expense' | 'receivable' | 'payable';

export type RecordStatus = 'completed' | 'pending' | 'overdue';

export interface FinancialRecord {
  id: string;
  type: RecordType;
  title: string;
  category: string;
  counterparty: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: RecordStatus;
  isDirectCost?: boolean;
  notes?: string;
}

export interface AccountInfo {
  holderName: string;
  accountType: string;
  cardNumberPrefix: string;
  lastFour: string;
  baseBalance: number;
}

export type SidebarSubItem =
  | 'Web Analytics'
  | 'Sales Monitoring'
  | 'Ad Campaign'
  | 'Event Management'
  | 'Helpdesk Management'
  | 'Finance Monitoring'
  | 'Cryptocurrency'
  | 'Executive / SaaS'
  | 'Campaign Monitoring'
  | 'Product Management';

export type SidebarRailId =
  | 'dashboard'
  | 'calendar'
  | 'reports'
  | 'records'
  | 'analytics'
  | 'accounts'
  | 'categories'
  | 'archive';

export type DateFilterRange =
  | 'all'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export type ManagerTab =
  | 'all'
  | 'income'
  | 'expense'
  | 'receivable'
  | 'payable'
  | 'account'
  | 'ratios';
