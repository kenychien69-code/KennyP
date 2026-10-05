import React from 'react';
import { DailySalesRecord, Order, Product, Ingredient } from '../types';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface DashboardViewProps {
  historicalSales: DailySalesRecord[];
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  onNavigateToForecast: () => void;
  onNavigateToPOS: () => void;
  onNavigateToInventory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  historicalSales,
  orders,
  products,
  ingredients,
  onNavigateToForecast,
  onNavigateToPOS,
  onNavigateToInventory,
}) => {
  // Real calculations directly from actual orders and inventory
  const totalSales = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const transactionsCount = orders.length;
  const lowStockItems = ingredients.filter((ing) => ing.currentStock <= ing.reorderLevel);
  const lowStockCount = lowStockItems.length;

  // Real Product sales tally
  const productTally: Record<string, number> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      productTally[item.product.name] = (productTally[item.product.name] || 0) + item.quantity;
    });
  });

  const sortedProducts = Object.entries(productTally).sort((a, b) => b[1] - a[1]);
  const topProductName = sortedProducts.length > 0 ? sortedProducts[0][0] : 'None yet';
  const averageTransaction = transactionsCount > 0 ? totalSales / transactionsCount : 0;

  // Historical sales totals
  const totalHistoricalRevenue = historicalSales.reduce((sum, d) => sum + d.total, 0);
  const maxSale = Math.max(...historicalSales.map((d) => d.total), 1000);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E8DFC8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#2A1810] tracking-tight">
              Sales Dashboard
            </h1>
            <span className="text-[11px] font-semibold bg-[#EFE4D6] text-[#7A4B29] px-2 py-0.5 rounded border border-[#DECDBB]">
              KENNY Brew Intelligence
            </span>
          </div>
          <p className="text-xs text-[#7A6452] mt-0.5">
            Today: {todayFormatted} • Live Point-of-Sale & Business Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToPOS}
            className="px-3.5 py-2 bg-[#8A4A28] hover:bg-[#733C1E] text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Terminal</span>
          </button>
          <button
            onClick={onNavigateToForecast}
            className="px-3.5 py-2 bg-[#3A2216] hover:bg-[#4E3020] text-[#F3E3D5] text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5A869]" />
            <span>AI Sales Forecast</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs hover:border-[#D6C4B0] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#7A6452] font-medium">
            <span>Total Sales</span>
            <TrendingUp className="w-4 h-4 text-[#8A4A28]" />
          </div>
          <div className="text-2xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1.5">
            ₱{totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card 2: Transactions */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs hover:border-[#D6C4B0] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#7A6452] font-medium">
            <span>Transactions</span>
            <ShoppingCart className="w-4 h-4 text-[#8A4A28]" />
          </div>
          <div className="text-2xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1.5">
            {transactionsCount}
          </div>
        </div>

        {/* Card 3: Low-Stock items */}
        <div
          onClick={onNavigateToInventory}
          className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs hover:border-[#E57373] cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-[#7A6452] font-medium">
            <span>Low-Stock Items</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#7A6452]'}`} />
          </div>
          <div className={`text-2xl font-extrabold font-mono tabular-nums mt-1.5 ${lowStockCount > 0 ? 'text-[#B91C1C]' : 'text-[#2A1810]'}`}>
            {lowStockCount}
          </div>
        </div>

        {/* Card 4: Top Product */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs hover:border-[#D6C4B0] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#7A6452] font-medium">
            <span>Top Product</span>
            <Award className="w-4 h-4 text-[#E5A869]" />
          </div>
          <div className="text-2xl font-bold text-[#2A1810] truncate mt-1.5">
            {topProductName}
          </div>
        </div>
      </div>

      {/* Main Section: Recent Sales Trend + Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Card: Recent Sales Trend Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#2A1810]">
                  Recent Sales Trend
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-[#8A4A28] bg-[#F7EFE8] px-2.5 py-1 rounded">
                {historicalSales.length > 0 ? `${historicalSales.length}-Day History` : 'Live POS'}
              </span>
            </div>

            {/* Sales Chart or Empty State */}
            {historicalSales.length > 0 ? (
              <div className="h-56 pt-6 pb-2 flex items-end justify-between gap-3 border-b border-[#E8DFD4]">
                {historicalSales.map((item) => {
                  const heightPercent = Math.max(8, Math.round((item.total / maxSale) * 100));
                  const shortDate = item.date.length >= 10 ? item.date.slice(5) : item.date;
                  const isHighest = item.total === Math.max(...historicalSales.map((s) => s.total));

                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#2A1810] text-white text-[10px] font-mono py-1 px-2 rounded whitespace-nowrap z-10 shadow-md">
                        ₱{item.total.toLocaleString()} · {item.ordersCount} orders
                      </div>

                      <span className="text-[10px] font-mono text-[#7A6452] mb-1 font-medium group-hover:text-[#2A1810]">
                        ₱{Math.round(item.total).toLocaleString()}
                      </span>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[42px] rounded-t-sm transition-all duration-300 ${
                          isHighest ? 'bg-[#8A4A28] shadow-sm' : 'bg-[#B88460] hover:bg-[#9B623E]'
                        }`}
                      />

                      <span className="text-[11px] font-mono text-[#5C4A3A] mt-2 font-medium">
                        {shortDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center border-b border-[#E8DFD4] bg-[#FAF8F5] rounded-md p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[#EFE8DF] flex items-center justify-center text-[#8A4A28] mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#2A1810]">No Historical Sales Recorded Yet</h4>
                <p className="text-[11px] text-[#7A6452] max-w-sm mt-1">
                  Complete customer checkout orders via the POS Terminal to log real-time sales transactions and populate daily trends.
                </p>
                <button
                  onClick={onNavigateToPOS}
                  className="mt-3 px-3 py-1.5 bg-[#8A4A28] text-white text-xs font-semibold rounded hover:bg-[#733C1E] transition-colors cursor-pointer"
                >
                  Create First Order
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#7A6452] pt-3">
            <span>Historical sales from database</span>
            <span className="font-mono font-medium">
              Total historical revenue: ₱{totalHistoricalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Right Card: Operational Summary */}
        <div className="bg-white rounded-lg p-5 border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#E8DFD4] pb-3">
              <h3 className="text-base font-bold text-[#2A1810]">
                Operational Summary
              </h3>
              <p className="text-xs text-[#7A6452] mt-0.5">
                Key operational metrics & inventory health
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-[#3D291C]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Average transaction:</span>
                <span className="font-bold font-mono text-sm text-[#2A1810]">
                  ₱{averageTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Best-selling product:</span>
                <span className="font-bold text-[#2A1810]">{topProductName}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Current low-stock items:</span>
                <span className={`font-bold font-mono text-sm ${lowStockCount > 0 ? 'text-[#C2410C]' : 'text-[#22673D]'}`}>
                  {lowStockCount}
                </span>
              </div>
            </div>

            <div className="bg-[#FAF5EF] rounded-md p-3.5 border border-[#EBDCCF] text-xs text-[#6B4F3B] leading-relaxed">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#A05C33] shrink-0 mt-0.5" />
                <p>
                  AI forecasting module evaluates real transaction volume to forecast upcoming weekly sales and raw material replenishment points.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onNavigateToForecast}
              className="w-full py-2.5 bg-[#4A2E20] hover:bg-[#5C3928] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View AI Forecast Insights</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Completed Orders Section */}
      <div className="bg-white rounded-lg border border-[#E8DFD4] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#2A1810]">
              Completed Orders
            </h3>
            <p className="text-xs text-[#7A6452]">
              Showing {orders.length} real transactions recorded
            </p>
          </div>
          <button
            onClick={onNavigateToPOS}
            className="text-xs font-semibold text-[#8A4A28] hover:underline cursor-pointer"
          >
            + Create New Order
          </button>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F4EE] text-[#6D5847] border-y border-[#E8DFD4]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Order #</th>
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Customer</th>
                  <th className="py-2.5 px-3 font-semibold">Items</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {orders.slice(0, 10).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-[#2A1810]">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-[#7A6452] font-mono">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#2A1810]">
                      {ord.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B5A4B] max-w-xs truncate">
                      {ord.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-[#EFE9DF] text-[#4A3828] rounded text-[11px] font-medium">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2A1810]">
                      ₱{ord.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#22673D] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-[#22673D]" />
                        <span>{ord.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-[#FAF8F5] rounded-md border border-[#EFE8DF]">
            <div className="w-12 h-12 rounded-full bg-[#EFE8DF] flex items-center justify-center text-[#8A4A28] mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#2A1810]">No Orders Recorded Yet</h4>
            <p className="text-xs text-[#7A6452] max-w-sm mt-1 mb-4">
              All transactions start completely fresh. Open the Point-of-Sale terminal to punch orders, apply discounts, and process payments.
            </p>
            <button
              onClick={onNavigateToPOS}
              className="px-4 py-2 bg-[#8A4A28] hover:bg-[#733C1E] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              Open POS Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
