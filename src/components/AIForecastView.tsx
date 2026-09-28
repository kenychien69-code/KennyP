import React, { useState } from 'react';
import { DailySalesRecord, ForecastResult, Ingredient, Product } from '../types';
import {
  TrendingUp,
  Award,
  AlertCircle,
  Users,
  PackageCheck,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';

interface AIForecastViewProps {
  forecast: ForecastResult;
  historicalSales: DailySalesRecord[];
  products: Product[];
  ingredients: Ingredient[];
  onRunForecast: () => Promise<void>;
  isForecasting: boolean;
}

export const AIForecastView: React.FC<AIForecastViewProps> = ({
  forecast,
  historicalSales = [],
  products = [],
  ingredients = [],
  onRunForecast,
  isForecasting,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'ingredients' | 'staffing'>('overview');

  const safeSales = Array.isArray(historicalSales) ? historicalSales : [];
  const maxHistorical = Math.max(...safeSales.map((h) => h?.total || 0), 1000);
  const peakSalesRecord =
    safeSales.length > 0
      ? safeSales.reduce((max, curr) => ((curr?.total || 0) > (max?.total || 0) ? curr : max), safeSales[0])
      : null;

  // Safe numerical accessors to prevent any React render crash
  const next7Avg = Number(forecast?.summary?.next7DayExpectedAvg ?? 0) || 0;
  const total7Day = Number(forecast?.summary?.total7DayForecast ?? 0) || 0;
  const recentAvg = Number(forecast?.summary?.averageRecentDaily ?? 0) || 0;
  const trendPct = Number(forecast?.summary?.trendSignalPct ?? 0) || 0;
  const topProd = forecast?.summary?.topExpectedProduct || 'Iced Latte';
  const demandLvl = forecast?.summary?.demandLevel || 'STABLE';
  const suggestion = forecast?.summary?.planningSuggestion || 'Complete POS orders to build real predictive forecasting models.';

  const nextDays = Array.isArray(forecast?.next7Days) ? forecast.next7Days : [];
  const prodForecasts = Array.isArray(forecast?.productForecasts) ? forecast.productForecasts : [];
  const ingReorders = Array.isArray(forecast?.ingredientReorders) ? forecast.ingredientReorders : [];
  const staffing = Array.isArray(forecast?.staffingSchedule) ? forecast.staffingSchedule : [];
  const anomaliesList = Array.isArray(forecast?.anomalies) ? forecast.anomalies : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-2xl font-bold text-[#2A1810] tracking-tight">
            AI Sales Forecast
          </h1>
          <p className="text-xs text-[#7A6452] mt-0.5">
            Predictive time-series analytics and ingredient replenishment using historical transaction data
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRunForecast}
            disabled={isForecasting}
            className="px-5 py-2.5 bg-[#4E342E] hover:bg-[#3E2723] active:scale-98 text-[#FAF3EB] text-xs font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isForecasting ? 'animate-spin' : ''}`} />
            <span>{isForecasting ? 'COMPUTING FORECAST...' : 'RUN FORECAST'}</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Next 7-Day Expected Sales */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <div className="text-xs text-[#7A6452] font-medium">
            Next 7-Day Expected Sales
          </div>
          <div className="text-3xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1">
            ₱{next7Avg.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-[11px] text-[#7A6452] mt-1">
            {safeSales.length > 0 ? 'Estimated from real sales patterns' : 'Awaiting POS sales data'}
          </div>
        </div>

        {/* Card 2: Top Expected Product */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <div className="text-xs text-[#7A6452] font-medium">
            Top Expected Product
          </div>
          <div className="text-2xl font-bold text-[#2A1810] mt-1 flex items-center justify-between">
            <span className="truncate">{topProd}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                demandLvl === 'HIGH'
                  ? 'bg-[#EAF5EC] text-[#1E7036] border border-[#C5E5CB]'
                  : 'bg-[#F4EFEA] text-[#7A6452] border border-[#E8DFC8]'
              }`}
            >
              Demand: {demandLvl}
            </span>
            <span className="text-[11px] text-[#7A6452]">Highest predicted velocity</span>
          </div>
        </div>

        {/* Card 3: Trend Signal */}
        <div className="bg-white rounded-lg p-4 border border-[#E8DFD4] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7A6452] font-medium">
            <span>Trend Signal</span>
            <TrendingUp className="w-4 h-4 text-[#8A4A28]" />
          </div>
          <div className="text-3xl font-extrabold text-[#2A1810] font-mono tabular-nums mt-1">
            {trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}
          </div>
          {/* Progress / Trend Bar */}
          <div className="w-full bg-[#EADCCF] h-2 rounded-full mt-2 overflow-hidden">
            <div
              style={{
                width: `${Math.min(Math.max(Math.abs(trendPct) * 2.5, 5), 100)}%`,
              }}
              className={`h-full rounded-full transition-all duration-500 ${
                trendPct >= 0 ? 'bg-[#A05C33]' : 'bg-[#C2410C]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Row: Forecast Summary & Historical Sales Used */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Forecast Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg p-5 border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#E8DFD4] pb-2">
              <h3 className="text-base font-bold text-[#2A1810]">
                Forecast Summary
              </h3>
            </div>

            <div className="space-y-3 text-xs text-[#3D291C]">
              <div className="flex items-center justify-between py-1 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Average recent daily sales:</span>
                <span className="font-bold font-mono text-sm text-[#2A1810]">
                  ₱{recentAvg.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Total 7-day expected revenue:</span>
                <span className="font-bold font-mono text-sm text-[#8A4A28]">
                  ₱{total7Day.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F4EFEA]">
                <span className="text-[#6D5847]">Estimated demand level:</span>
                <span className="font-bold text-[#1E7036] bg-[#EAF5EC] px-2 py-0.5 rounded text-xs border border-[#C5E5CB]">
                  {demandLvl}
                </span>
              </div>

              <div className="py-1">
                <span className="text-[#6D5847] block mb-1">Planning suggestion:</span>
                <p className="text-xs font-medium text-[#2A1810] bg-[#FAF6F2] p-2.5 rounded border border-[#EFE5DB] leading-relaxed">
                  {suggestion}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[#FBF7EE] border border-[#E8DFC8] rounded p-3 text-[11px] text-[#7A6452] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#A05C33] shrink-0 mt-0.5" />
            <p>
              Decision support only: forecasts are statistical projections based on Holt-Winters smoothing and day-of-week seasonality.
            </p>
          </div>
        </div>

        {/* Right Card: Historical Sales Used (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg p-5 border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#2A1810]">
                Historical Sales Used
              </h3>
              <span className="text-[11px] font-mono text-[#7A6452]">
                {safeSales.length} Recorded Input Days
              </span>
            </div>

            {/* Custom Bar Chart or Clean Empty State */}
            {safeSales.length > 0 ? (
              <div className="h-56 pt-6 pb-2 flex items-end justify-between gap-3 border-b border-[#E8DFD4]">
                {safeSales.map((item) => {
                  const val = Number(item?.total || 0);
                  const heightPercent = Math.max(8, Math.round((val / maxHistorical) * 100));
                  const shortDate = item.date && item.date.length >= 10 ? item.date.slice(5) : (item.date || '');

                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#2A1810] text-white text-[10px] font-mono py-1 px-1.5 rounded whitespace-nowrap z-10">
                        ₱{val.toLocaleString()}
                      </div>

                      <span className="text-[10px] font-mono text-[#7A6452] mb-1 font-medium">
                        ₱{Math.round(val).toLocaleString()}
                      </span>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[38px] bg-[#A05C33] hover:bg-[#8A4A28] rounded-t-sm transition-all"
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
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#2A1810]">No Historical Input Data Yet</h4>
                <p className="text-[11px] text-[#7A6452] max-w-sm mt-1">
                  Once orders are recorded in the POS system across business days, daily transaction amounts are automatically fed into the ARIMA & Holt-Winters engine.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#7A6452] pt-3">
            <span>
              {safeSales.length > 0
                ? `Historical baseline: ${safeSales[0].date} to ${safeSales[safeSales.length - 1].date}`
                : 'Baseline window: Ready for real transactions'}
            </span>
            <span className="font-mono text-[#8A4A28] font-semibold">
              {peakSalesRecord
                ? `Peak: ₱${Number(peakSalesRecord.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${peakSalesRecord.date})`
                : 'Peak: None yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="bg-white rounded-lg border border-[#E8DFD4] p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#E8DFD4] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#4E342E] text-white'
                : 'text-[#6D5847] hover:bg-[#F5EDE6]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Next 7-Day Day-by-Day Forecast</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#4E342E] text-white'
                : 'text-[#6D5847] hover:bg-[#F5EDE6]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Product Demand & Units</span>
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ingredients'
                ? 'bg-[#4E342E] text-white'
                : 'text-[#6D5847] hover:bg-[#F5EDE6]'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Raw Materials Restock Recommendation</span>
          </button>
          <button
            onClick={() => setActiveTab('staffing')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'staffing'
                ? 'bg-[#4E342E] text-white'
                : 'text-[#6D5847] hover:bg-[#F5EDE6]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Optimal Staffing Schedule</span>
          </button>
        </div>

        {/* Tab 1: Next 7 Days Day-by-Day Forecast */}
        {activeTab === 'overview' && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#2A1810] uppercase tracking-wider">
                Predicted Daily Revenue & Expected Order Count
              </h4>
              <span className="text-xs text-[#7A6452]">Confidence Interval: ±10%</span>
            </div>

            {nextDays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {nextDays.map((d, idx) => (
                  <div
                    key={d.date || idx}
                    className="bg-[#FAF7F2] p-3 rounded-lg border border-[#EBDCCF] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#7A6452]">
                        <span className="font-bold text-[#2A1810]">{d.dayName}</span>
                        <span className="font-mono text-[11px]">{d.date && d.date.length >= 10 ? d.date.slice(5) : d.date}</span>
                      </div>
                      <div className="text-base font-extrabold text-[#8A4A28] font-mono mt-1.5">
                        ₱{Number(d.projectedSales || 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#7A6452] font-mono mt-0.5">
                        {d.expectedOrders || 0} orders
                      </div>
                    </div>
                    <div className="text-[10px] text-[#8C7355] font-mono border-t border-[#E8DFC8] pt-1.5 mt-2">
                      Range: ₱{Math.round(Number(d.confidenceLower || 0))} - ₱{Math.round(Number(d.confidenceUpper || 0))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 bg-[#FAF8F5] rounded-md border border-[#EFE8DF] text-center p-4">
                <p className="text-xs text-[#7A6452]">
                  No 7-day forecast generated yet. Process customer orders in POS to train the statistical model, then click <strong>RUN FORECAST</strong>.
                </p>
              </div>
            )}

            {/* Anomalies Detected Section */}
            {anomaliesList.length > 0 && (
              <div className="mt-4 p-3.5 bg-[#FFF9F2] border border-[#F0DDC5] rounded-md">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A4A28] mb-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Anomalies Flagged in Historical Data (Z-Score &gt; 1.5)</span>
                </div>
                <div className="space-y-1.5">
                  {anomaliesList.map((anom, i) => (
                    <div
                      key={i}
                      className="text-xs text-[#5C4A3A] flex items-center justify-between bg-white px-3 py-1.5 rounded border border-[#E8DFD4]"
                    >
                      <span className="font-mono font-medium text-[#2A1810]">
                        {anom.date} — {anom.type === 'SPIKE' ? '📈 Sales Spike' : '📉 Sales Dip'}: ₱{Number(anom.total || 0).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[#7A6452]">{anom.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Product Demand & Units */}
        {activeTab === 'products' && (
          <div className="pt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F4EE] text-[#6D5847] border-y border-[#E8DFD4]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Expected 7-Day Units</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Predicted Demand</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Stock Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {prodForecasts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF6F0]">
                    <td className="py-2.5 px-3 font-medium text-[#2A1810]">{prod.name}</td>
                    <td className="py-2.5 px-3 text-[#7A6452]">{prod.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">₱{Number(prod.price || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#8A4A28]">
                      {prod.expectedWeeklyUnits || 0} units
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                          prod.demandLevel === 'HIGH'
                            ? 'bg-[#EAF5EC] text-[#1E7036] border border-[#C5E5CB]'
                            : prod.demandLevel === 'MEDIUM'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-[#F2EFE9] text-[#7A6452]'
                        }`}
                      >
                        {prod.demandLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                          prod.stockStatus === 'RESTOCK_RECOMMENDED'
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : 'text-[#4A7856]'
                        }`}
                      >
                        {prod.stockStatus === 'RESTOCK_RECOMMENDED' ? 'Restock Soon' : 'Stock OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Raw Materials Restock Recommendation */}
        {activeTab === 'ingredients' && (
          <div className="pt-4 overflow-x-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7A6452]">
              <span>Calculated based on real inventory thresholds and product recipe linkages</span>
              <span className="text-[#C2410C] font-medium">Auto-calculated reorder points</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F4EE] text-[#6D5847] border-y border-[#E8DFD4]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Ingredient / Packaging</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Current Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Reorder Threshold</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Suggested Reorder Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Est. Depletion (Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {ingReorders.map((ing) => (
                  <tr key={ing.id} className="hover:bg-[#FAF6F0]">
                    <td className="py-2.5 px-3 font-medium text-[#2A1810]">{ing.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {ing.currentStock} {ing.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#7A6452]">
                      {ing.reorderLevel} {ing.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                          ing.status === 'CRITICAL_LOW'
                            ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                            : ing.status === 'LOW_STOCK'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-[#EAF5EC] text-[#1E7036] border border-[#C5E5CB]'
                        }`}
                      >
                        {ing.status === 'CRITICAL_LOW'
                          ? 'Critical Low'
                          : ing.status === 'LOW_STOCK'
                          ? 'Low Stock'
                          : 'Adequate'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#8A4A28]">
                      {ing.recommendedOrderQty > 0
                        ? `+${ing.recommendedOrderQty} ${ing.unit}`
                        : '0'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#7A6452]">
                      ~{ing.estimatedDepletionDays} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Optimal Staffing Schedule */}
        {activeTab === 'staffing' && (
          <div className="pt-4 space-y-4">
            <div className="text-xs text-[#7A6452]">
              Staff allocation algorithm adjusts required baristas and cashiers based on forecasted customer arrival rates per hour.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staffing.map((shift, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF7F2] p-4 rounded-lg border border-[#EBDCCF] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-2">
                    <span className="text-xs font-bold text-[#2A1810]">{shift.shift}</span>
                    <span className="text-[10px] font-mono bg-[#EFE4D6] text-[#7A4B29] px-2 py-0.5 rounded">
                      ~{shift.expectedCustomersHr} cust/hr
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#4A3828]">
                    <div className="flex items-center justify-between">
                      <span>Baristas Needed:</span>
                      <span className="font-bold font-mono text-sm text-[#8A4A28]">{shift.recommendedBaristas} baristas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cashiers Needed:</span>
                      <span className="font-bold font-mono text-sm text-[#8A4A28]">{shift.recommendedCashiers} cashier</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#7A6452] border-t border-[#E8DFC8] pt-2">
                    Priority: <span className="font-semibold text-[#2A1810]">{shift.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
