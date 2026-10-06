import React, { useState } from 'react';
import { Order, PaymentMethod } from '../types';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  Filter,
} from 'lucide-react';

interface SalesReportsViewProps {
  orders: Order[];
  onViewReceipt: (order: Order) => void;
}

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  orders,
  onViewReceipt,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((ord) => {
    const matchesMethod = selectedMethod === 'All' || ord.paymentMethod === selectedMethod;
    const sTerm = String(searchQuery || '').toLowerCase();
    const matchesSearch =
      String(ord.orderNumber || '').includes(searchQuery) ||
      String(ord.customerName || '').toLowerCase().includes(sTerm) ||
      String(ord.cashierName || '').toLowerCase().includes(sTerm);
    return matchesMethod && matchesSearch;
  });

  const totalGrossSales = filteredOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? totalGrossSales / totalOrders : 0;
  const totalVAT = filteredOrders.reduce((sum, ord) => sum + ord.vatAmount, 0);
  const totalDiscounts = filteredOrders.reduce((sum, ord) => sum + ord.discountAmount, 0);

  // Method breakdown
  const methodStats: Record<string, number> = {};
  filteredOrders.forEach((o) => {
    methodStats[o.paymentMethod] = (methodStats[o.paymentMethod] || 0) + o.totalAmount;
  });

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'VAT', 'Total', 'Payment Method', 'Cashier'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      `"${o.customerName}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.product.name}`).join('; ')}"`,
      o.subtotal.toFixed(2),
      o.discountAmount.toFixed(2),
      o.vatAmount.toFixed(2),
      o.totalAmount.toFixed(2),
      o.paymentMethod,
      `"${o.cashierName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KENNY_Brew_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-2xl font-bold text-[#2A1810] tracking-tight">
            Sales & Financial Reports
          </h1>
          <p className="text-xs text-[#7A6452] mt-0.5">
            Automated transaction reconciliation, payment auditing, and tax reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#EFE7DE] text-[#4A2E20] border border-[#E8DFC8] text-xs font-semibold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white text-xs font-semibold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <span className="text-xs text-[#7A6452] font-medium">Gross Revenue</span>
          <div className="text-2xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1">
            ₱{totalGrossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#4E7D59] font-medium">Across {totalOrders} transactions</span>
        </div>

        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <span className="text-xs text-[#7A6452] font-medium">Average Order Ticket</span>
          <div className="text-2xl font-extrabold text-[#8A4A28] font-mono tabular-nums mt-1">
            ₱{avgTicket.toFixed(2)}
          </div>
          <span className="text-[11px] text-[#7A6452]">Per completed order</span>
        </div>

        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <span className="text-xs text-[#7A6452] font-medium">12% Value Added Tax</span>
          <div className="text-2xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1">
            ₱{totalVAT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6452]">Philippine BIR tax compliant</span>
        </div>

        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <span className="text-xs text-[#7A6452] font-medium">Discounts Granted</span>
          <div className="text-2xl font-extrabold text-[#C2410C] font-mono tabular-nums mt-1">
            ₱{totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6452]">Senior / PWD & promotions</span>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="bg-white rounded-lg border border-[#E8DFD4] p-4 shadow-xs">
        <h3 className="text-xs font-bold text-[#2A1810] uppercase tracking-wider mb-3">
          Revenue by Payment Channel
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Cash', 'GCash', 'Maya', 'Card'].map((method) => {
            const amount = methodStats[method] || 0;
            const pct = totalGrossSales > 0 ? (amount / totalGrossSales) * 100 : 0;
            return (
              <div key={method} className="bg-[#FAF7F2] p-3 rounded border border-[#E8DFC8]">
                <span className="text-xs font-semibold text-[#6D5847]">{method}</span>
                <div className="text-lg font-bold font-mono text-[#2A1810] mt-1">
                  ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[#8A4A28] font-mono mt-0.5">
                  {pct.toFixed(1)}% of sales
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Transaction Ledger */}
      <div className="bg-white rounded-lg border border-[#E8DFD4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C7355] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer, cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6D5847]">Method:</span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded px-2.5 py-1 text-[#2A1810] focus:outline-none"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F4EE] text-[#6D5847] border-b border-[#E8DFD4]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Order #</th>
                <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">Items</th>
                <th className="py-2.5 px-4 font-semibold">Method</th>
                <th className="py-2.5 px-4 font-semibold text-right">Subtotal</th>
                <th className="py-2.5 px-4 font-semibold text-right">Discount</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Paid</th>
                <th className="py-2.5 px-4 font-semibold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE4]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2A1810]">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#7A6452]">
                      {new Date(ord.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#2A1810]">
                      {ord.customerName}
                    </td>
                    <td className="py-3 px-4 text-[#6D5847] max-w-xs truncate">
                      {ord.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#EFE9DF] text-[#4A3828] rounded text-[11px] font-semibold">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#6D5847]">
                      ₱{ord.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#C2410C]">
                      {ord.discountAmount > 0 ? `-₱${ord.discountAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2A1810]">
                      ₱{ord.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewReceipt(ord)}
                        className="p-1.5 hover:bg-[#EFE9DF] rounded text-[#8A4A28] cursor-pointer"
                        title="View & Print Digital Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#7A6452] bg-[#FAF8F5]">
                    <FileText className="w-8 h-8 text-[#A05C33] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs text-[#2A1810]">No Sales Records Found</p>
                    <p className="text-[11px] mt-0.5">Transactions processed through the POS will appear here for audit and export.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
