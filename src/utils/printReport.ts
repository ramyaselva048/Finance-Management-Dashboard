import { AccountInfo, FinancialRecord, SidebarSubItem } from '../types/finance';
import { AuthUser } from '../types/auth';

export interface PrintableMetrics {
  totalIncome: number;
  totalExpense: number;
  totalReceivable: number;
  totalPayable: number;
  currentBalance: number;
  grossMargin: number;
  netMargin: number;
  quickRatioDisplay: string;
  quickRatioProgress: number;
  currentRatioDisplay: string;
  currentRatioProgress: number;
  incomeDelta: string;
  expenseDelta: string;
  receivableDelta: string;
  payableDelta: string;
}

export interface DirectPrintPayload {
  activeSubItem: SidebarSubItem;
  accountInfo: AccountInfo;
  user: AuthUser;
  metrics: PrintableMetrics;
  records: FinancialRecord[];
  dateFilterLabel?: string;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openPopupAndPrint(htmlDocument: string): void {
  // MUST be called synchronously inside user click handler so Chrome opens the window
  // and triggers the native OS Print dialog on about:blank (matching screenshot #2)
  const popup = window.open(
    '',
    '_blank',
    'width=960,height=760,left=120,top=60,scrollbars=yes,resizable=yes'
  );

  if (popup) {
    popup.document.open();
    popup.document.write(htmlDocument);
    popup.document.close();
    popup.focus();
    return;
  }

  // Fallback if browser popup blocker prevented window.open
  let printIframe = document.getElementById(
    'azia-fallback-print-frame'
  ) as HTMLIFrameElement | null;
  if (printIframe) {
    document.body.removeChild(printIframe);
  }
  printIframe = document.createElement('iframe');
  printIframe.id = 'azia-fallback-print-frame';
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (doc && printIframe.contentWindow) {
    doc.open();
    doc.write(htmlDocument);
    doc.close();
    setTimeout(() => {
      printIframe?.contentWindow?.focus();
      printIframe?.contentWindow?.print();
    }, 150);
  } else {
    window.print();
  }
}

export function triggerDirectComputerPrint(payload: DirectPrintPayload): void {
  const { activeSubItem, accountInfo, user, metrics, records, dateFilterLabel } =
    payload;

  const nowDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');
  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportNo = `RPT-2026-${String(records.length).padStart(5, '0')}`;

  const rowsHtml = records
    .map(
      (r, idx) => `
      <tr>
        <td style="padding:6px 6px;border-bottom:1px dashed #cbd5e1;color:#1c273c;font-weight:600;">
          ${idx + 1}. ${escapeHtml(r.title)}
          <div style="font-size:10px;color:#64748b;font-weight:400;">
            ${escapeHtml(r.counterparty)} · ${escapeHtml(r.category)} (${escapeHtml(r.date)})
          </div>
        </td>
        <td style="padding:6px 6px;border-bottom:1px dashed #cbd5e1;text-align:center;text-transform:uppercase;font-size:10.5px;font-weight:700;color:${
          r.type === 'income'
            ? '#6f42c1'
            : r.type === 'expense'
            ? '#007bff'
            : r.type === 'receivable'
            ? '#0d9488'
            : '#e81e63'
        };">
          ${escapeHtml(r.type)}
        </td>
        <td style="padding:6px 6px;border-bottom:1px dashed #cbd5e1;text-align:center;text-transform:uppercase;font-size:10px;font-weight:600;color:#334155;">
          ${escapeHtml(r.status)}
        </td>
        <td style="padding:6px 6px;border-bottom:1px dashed #cbd5e1;text-align:right;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">
          $${r.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report ${escapeHtml(reportNo)} - Azia Finance Monitoring</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Courier New', Courier, 'Roboto', monospace, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print-bar {
      width: 100%;
      max-width: 680px;
      background: #1c273c;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }
    .no-print-bar button {
      background: #5b47fb;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12.5px;
      margin-left: 8px;
    }
    .no-print-bar button.close-btn {
      background: #475569;
    }
    .sheet {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 22px 26px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
    }
    .top-pill {
      display: table;
      margin: 0 auto 8px auto;
      border: 1px solid #94a3b8;
      border-radius: 999px;
      padding: 2px 14px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #334155;
    }
    .company-title {
      text-align: center;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.02em;
      color: #0f172a;
      margin: 2px 0;
    }
    .company-sub {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 4px;
    }
    .company-meta {
      text-align: center;
      font-size: 10.5px;
      color: #475569;
      line-height: 1.4;
    }
    .dashed-hr {
      border: none;
      border-top: 1.5px dashed #64748b;
      margin: 10px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      line-height: 1.6;
    }
    .status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 1px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10.5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin: 10px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      margin-top: 4px;
    }
    th {
      border-top: 1.5px dashed #64748b;
      border-bottom: 1.5px dashed #64748b;
      padding: 6px 6px;
      font-size: 11px;
      text-transform: uppercase;
      color: #0f172a;
      text-align: left;
    }
    .totals-section {
      margin-top: 8px;
      font-size: 12px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      padding: 6px 0;
      border-top: 1.5px dashed #64748b;
      border-bottom: 1.5px dashed #64748b;
      margin-top: 4px;
    }
    .stamp-box {
      margin: 14px auto 8px auto;
      width: 190px;
      border: 1.5px solid #22c55e;
      background: #f0fdf4;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      color: #15803d;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .sheet {
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span><strong>Azia Finance Print Preview</strong> — Ready to print on your computer</span>
    <div>
      <button onclick="window.focus(); window.print();">🖨️ Print Now</button>
      <button class="close-btn" onclick="window.close();">Close</button>
    </div>
  </div>

  <div class="sheet">
    <div class="top-pill">FINANCIAL MONITORING STATEMENT</div>
    <div class="company-title">AZIA FINANCE</div>
    <div class="company-sub">${escapeHtml(activeSubItem.toUpperCase())} ENTERPRISE DASHBOARD</div>
    <div class="company-meta">
      Account Holder: ${escapeHtml(accountInfo.holderName)} | Account: VISA •••• ${escapeHtml(accountInfo.lastFour)} (${escapeHtml(accountInfo.accountType)})<br/>
      Operator: ${escapeHtml(user.fullName)} (${escapeHtml(user.email)}) | Period: ${escapeHtml(dateFilterLabel || 'All Dates')}
    </div>

    <hr class="dashed-hr" />

    <div class="meta-row">
      <div>
        <strong>Report No:</strong> <span style="color:#3366ff;font-weight:700;">${escapeHtml(reportNo)}</span><br/>
        <strong>Gross Margin:</strong> ${metrics.grossMargin}% | <strong>Net Margin:</strong> ${metrics.netMargin}%<br/>
        <strong>Time:</strong> ${escapeHtml(nowDate)} ${escapeHtml(nowTime)}
      </div>
      <div style="text-align:right;">
        <strong>Date:</strong> ${escapeHtml(nowDate)}<br/>
        <strong>Status:</strong> <span class="status-badge">VERIFIED</span><br/>
        <strong>Ratios:</strong> QR ${escapeHtml(metrics.quickRatioDisplay)} | CR ${escapeHtml(metrics.currentRatioDisplay)}
      </div>
    </div>

    <!-- Summary KPI Strip -->
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Income</div>
        <div class="kpi-val" style="color:#6f42c1;">$${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-val" style="color:#007bff;">$${metrics.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Receivable</div>
        <div class="kpi-val" style="color:#0d9488;">$${metrics.totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Payable</div>
        <div class="kpi-val" style="color:#e81e63;">$${metrics.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <!-- Itemized Financial Records Table -->
    <table>
      <thead>
        <tr>
          <th>ITEM / TRANSACTION</th>
          <th style="text-align:center;">TYPE</th>
          <th style="text-align:center;">STATUS</th>
          <th style="text-align:right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Summary Totals -->
    <div class="totals-section">
      <div class="totals-row">
        <span>Total Income (${records.filter((r) => r.type === 'income').length} items):</span>
        <strong>$${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div class="totals-row">
        <span>Total Expenses (${records.filter((r) => r.type === 'expense').length} items):</span>
        <strong>-$${metrics.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div class="totals-row">
        <span>Accounts Receivable / Payable Net:</span>
        <strong>$${(metrics.totalReceivable - metrics.totalPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div class="grand-total">
        <span>CURRENT TREASURY BALANCE :</span>
        <span>$${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="stamp-box">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.06em;">STATEMENT AUDITED</div>
      <div style="font-size:15px;font-weight:900;margin:1px 0;">VERIFIED</div>
      <div style="font-size:9px;">via Azia Finance</div>
    </div>

    <div style="text-align:center;font-size:10.5px;color:#475569;margin-top:6px;">
      <strong>Thank you for using Azia Finance Monitoring!</strong><br/>
      Computer Generated Official Financial Statement
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 200);
    });
  </script>
</body>
</html>`;

  openPopupAndPrint(html);
}

export function triggerSingleRecordInvoicePrint(
  record: FinancialRecord,
  accountInfo: AccountInfo,
  user: AuthUser
): void {
  const invoiceNo = `INV-2026-${record.id.replace(/\D/g, '').padStart(5, '0') || '00015'}`;
  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoiceNo)} - Azia Finance</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print-bar {
      width: 100%;
      max-width: 560px;
      background: #1c273c;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }
    .no-print-bar button {
      background: #5b47fb;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12.5px;
      margin-left: 8px;
    }
    .sheet {
      width: 100%;
      max-width: 560px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 26px 28px;
    }
    .top-pill {
      display: table;
      margin: 0 auto 8px auto;
      border: 1px solid #94a3b8;
      border-radius: 999px;
      padding: 2px 14px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .dashed-hr {
      border: none;
      border-top: 1.5px dashed #64748b;
      margin: 12px 0;
    }
    .stamp-box {
      margin: 18px auto 10px auto;
      width: 180px;
      border: 1.5px solid #22c55e;
      background: #f0fdf4;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      color: #15803d;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .sheet {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span><strong>Invoice ${escapeHtml(invoiceNo)}</strong> — Ready to print</span>
    <div>
      <button onclick="window.focus(); window.print();">🖨️ Print Now</button>
      <button style="background:#475569;" onclick="window.close();">Close</button>
    </div>
  </div>

  <div class="sheet">
    <div class="top-pill">OFFICIAL FINANCIAL VOUCHER</div>
    <div style="text-align:center;font-size:22px;font-weight:900;margin:2px 0;">AZIA FINANCE</div>
    <div style="text-align:center;font-size:12px;font-weight:700;margin-bottom:4px;">AZIA ENTERPRISE TREASURY &amp; LEDGER</div>
    <div style="text-align:center;font-size:10.5px;color:#475569;line-height:1.4;">
      Account Holder: ${escapeHtml(accountInfo.holderName)} | Card: VISA •••• ${escapeHtml(accountInfo.lastFour)}<br/>
      Prepared By: ${escapeHtml(user.fullName)} (${escapeHtml(user.email)})
    </div>

    <hr class="dashed-hr" />

    <div style="display:flex;justify-content:space-between;font-size:11.5px;line-height:1.6;">
      <div>
        <strong>Invoice No:</strong> <span style="color:#3366ff;font-weight:700;">${escapeHtml(invoiceNo)}</span><br/>
        <strong>Counterparty:</strong> ${escapeHtml(record.counterparty)}<br/>
        <strong>Time:</strong> ${escapeHtml(record.date)} ${escapeHtml(nowTime)}
      </div>
      <div style="text-align:right;">
        <strong>Date:</strong> ${escapeHtml(record.date)}<br/>
        <strong>Status:</strong> <span style="background:#dcfce7;color:#15803d;padding:1px 8px;border-radius:4px;font-weight:700;">${escapeHtml(record.status.toUpperCase())}</span>
      </div>
    </div>

    <hr class="dashed-hr" />

    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="border-bottom:1.5px dashed #64748b;">
          <th style="text-align:left;padding:6px 0;">ITEM / DESCRIPTION</th>
          <th style="text-align:center;padding:6px 0;">CATEGORY</th>
          <th style="text-align:right;padding:6px 0;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px 0;font-weight:700;">
            1. ${escapeHtml(record.title)}
            <div style="font-size:10.5px;color:#64748b;font-weight:400;margin-top:2px;">
              ${escapeHtml(record.notes || 'Verified financial ledger transaction')}
            </div>
          </td>
          <td style="padding:10px 0;text-align:center;">${escapeHtml(record.category)}</td>
          <td style="padding:10px 0;text-align:right;font-weight:700;">
            $${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      </tbody>
    </table>

    <hr class="dashed-hr" />

    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;">
      <span>Subtotal:</span>
      <strong>$${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;">
      <span>Processing Fee / Tax:</span>
      <strong>$0.00</strong>
    </div>

    <hr class="dashed-hr" />

    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;padding:4px 0;">
      <span>GRAND TOTAL:</span>
      <span>$${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>

    <hr class="dashed-hr" />

    <div class="stamp-box">
      <div style="font-size:9px;font-weight:700;">TRANSACTION ${escapeHtml(record.status.toUpperCase())}</div>
      <div style="font-size:16px;font-weight:900;margin:2px 0;">${record.type === 'income' ? 'RECEIVED' : 'VERIFIED'}</div>
      <div style="font-size:9px;">via Azia Finance</div>
    </div>

    <div style="text-align:center;font-size:10.5px;color:#475569;margin-top:10px;">
      <strong>Thank you for your business!</strong><br/>
      AZIA FINANCE · Computer Generated Financial Voucher
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 200);
    });
  </script>
</body>
</html>`;

  openPopupAndPrint(html);
}
