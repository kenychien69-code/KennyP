import React, { useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  BellRing,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Search,
  Sparkles,
  PackageCheck,
  ShieldAlert,
} from 'lucide-react';
import { Ingredient } from '../types';

interface LowStockAlertsViewProps {
  ingredients: Ingredient[];
  onRestockIngredient: (id: string, addQty: number) => void;
  onNavigateToForecast: () => void;
}

export const LowStockAlertsView: React.FC<LowStockAlertsViewProps> = ({
  ingredients,
  onRestockIngredient,
  onNavigateToForecast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [restockModalItem, setRestockModalItem] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState(500);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Group and compute status for each ingredient
  const processedIngredients = ingredients.map((ing) => {
    const ratio = ing.currentStock / (ing.reorderLevel || 1);
    let status: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (ing.currentStock <= ing.reorderLevel * 0.5) {
      status = 'critical';
    } else if (ing.currentStock <= ing.reorderLevel) {
      status = 'warning';
    }

    // Rough depletion days estimate based on typical beverage business volume
    let estimatedDays = Math.max(1, Math.round(ratio * 7));
    if (ing.currentStock <= 0) estimatedDays = 0;

    // Recommended order amount (bring up to 3x reorder level)
    const recommendedOrder = Math.max(
      ing.reorderLevel * 2,
      Math.ceil((ing.reorderLevel * 2.5 - ing.currentStock) / 100) * 100
    );

    return {
      ...ing,
      status,
      ratio,
      estimatedDays,
      recommendedOrder,
    };
  });

  const criticalItems = processedIngredients.filter((i) => i.status === 'critical');
  const warningItems = processedIngredients.filter((i) => i.status === 'warning');
  const alertCount = criticalItems.length + warningItems.length;

  const filteredItems = processedIngredients.filter((item) => {
    const sTerm = String(searchTerm || '').toLowerCase();
    const matchesSearch =
      String(item?.name || '').toLowerCase().includes(sTerm) ||
      String(item?.category || '').toLowerCase().includes(sTerm);
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'critical' && item.status === 'critical') ||
      (statusFilter === 'warning' && item.status === 'warning') ||
      (statusFilter === 'healthy' && item.status === 'healthy');
    return matchesSearch && matchesFilter;
  });

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || restockQty <= 0) return;

    onRestockIngredient(restockModalItem.id, restockQty);
    setSuccessToast(`Restocked ${restockQty} ${restockModalItem.unit} of ${restockModalItem.name}!`);
    setTimeout(() => setSuccessToast(null), 3500);
    setRestockModalItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#E8DFC8] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A1810] tracking-tight flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-[#C2410C]" />
            Low Stock Alerts & Monitoring
          </h1>
          <p className="text-xs text-[#6B5745] mt-1">
            Real-time replenishment radar, critical shortage warnings, and recipe burn-rate depletion alerts.
          </p>
        </div>

        <button
          onClick={onNavigateToForecast}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4E342E] border border-[#D8C7B6] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#8A4A28]" />
          <span>Cross-Check AI Forecast</span>
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-[#FAF5EE] border border-[#E8DFC8] text-[#4A2E20] rounded-lg text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#8A4A28]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8C7355] uppercase tracking-wider block">
              Active Alerts
            </span>
            <span className="text-2xl font-extrabold text-[#2A1810] tabular-nums mt-0.5 block">
              {alertCount} <span className="text-xs font-normal text-[#7A6452]">items need attention</span>
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              alertCount > 0 ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FAF5EE] text-[#8A4A28]'
            }`}
          >
            {alertCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <PackageCheck className="w-5 h-5" />}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#B91C1C] uppercase tracking-wider block">
              Critical Low (&le; 50% Reorder)
            </span>
            <span className="text-2xl font-extrabold text-[#B91C1C] tabular-nums mt-0.5 block">
              {criticalItems.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider block">
              Reorder Warning (&le; Threshold)
            </span>
            <span className="text-2xl font-extrabold text-[#C2410C] tabular-nums mt-0.5 block">
              {warningItems.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Urgent Warning Banner if critical items exist */}
      {criticalItems.length > 0 && (
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#991B1B]">
                Immediate Restock Recommended for {criticalItems.length} Ingredients
              </h3>
              <p className="text-xs text-[#7F1D1D] mt-0.5">
                The following raw materials are near depletion:{' '}
                <strong>{criticalItems.map((i) => i.name).join(', ')}</strong>. Drinks using these ingredients may be auto-disabled at POS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7355]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search raw material or category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#4E342E] text-white'
                : 'bg-[#FAF7F2] text-[#6B5745] hover:bg-[#F2ECE4]'
            }`}
          >
            All Items ({ingredients.length})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'critical'
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#FAF7F2] text-[#DC2626] hover:bg-[#FEE2E2]'
            }`}
          >
            Critical ({criticalItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'warning'
                ? 'bg-[#EA580C] text-white'
                : 'bg-[#FAF7F2] text-[#EA580C] hover:bg-[#FFEDD5]'
            }`}
          >
            Warning ({warningItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'healthy'
                ? 'bg-[#16A34A] text-white'
                : 'bg-[#FAF7F2] text-[#16A34A] hover:bg-[#DCFCE7]'
            }`}
          >
            Healthy
          </button>
        </div>
      </div>

      {/* Low-Stock Monitor Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isCritical = item.status === 'critical';
          const isWarning = item.status === 'warning';
          const progressPct = Math.min(100, Math.round((item.currentStock / (item.reorderLevel * 2 || 1)) * 100));

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                isCritical
                  ? 'border-[#FCA5A5] ring-1 ring-[#F87171] bg-[#FFFBFB]'
                  : isWarning
                  ? 'border-[#FED7AA] bg-[#FFFAF5]'
                  : 'border-[#E8DFC8]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#8C7355] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#2A1810] mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  {isCritical ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      CRITICAL
                    </span>
                  ) : isWarning ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      LOW STOCK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ADEQUATE
                    </span>
                  )}
                </div>

                {/* Current Stock vs Reorder Level */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#6B5745] font-medium">Current On-Hand:</span>
                    <span className="font-bold text-[#2A1810] tabular-nums text-sm">
                      {item.currentStock.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#8C7355]">Alert Threshold:</span>
                    <span className="text-[#7A6452] tabular-nums font-medium">
                      {item.reorderLevel.toLocaleString()} {item.unit}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#EFEAE2] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCritical ? 'bg-[#DC2626]' : isWarning ? 'bg-[#EA580C]' : 'bg-[#16A34A]'
                      }`}
                      style={{ width: `${Math.max(5, progressPct)}%` }}
                    />
                  </div>
                </div>

                {/* Burn Rate & Reorder Advice */}
                <div className="mt-3 pt-3 border-t border-[#F2ECE4] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#8C7355] block">Est. Depletion:</span>
                    <span className={`font-bold tabular-nums ${isCritical ? 'text-[#DC2626]' : 'text-[#2A1810]'}`}>
                      {item.estimatedDays === 0 ? 'Depleted (0 Days)' : `~${item.estimatedDays} Days`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C7355] block">Suggested Order:</span>
                    <span className="font-bold text-[#8A4A28] tabular-nums">
                      +{item.recommendedOrder.toLocaleString()} {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Restock Trigger Button */}
              <div className="mt-4 pt-3 border-t border-[#F2ECE4]">
                <button
                  onClick={() => {
                    setRestockModalItem(item);
                    setRestockQty(item.recommendedOrder);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isCritical
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                      : isWarning
                      ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white'
                      : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4E342E] border border-[#E0D4C5]'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restock {item.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFC8] w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">
                  Restock Ingredient: {restockModalItem.name}
                </h3>
                <p className="text-xs text-[#7A6452]">Receive raw materials and replenish current shelf stock</p>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8C7355]">Current Stock:</span>
                  <span className="font-bold text-[#2A1810]">
                    {restockModalItem.currentStock.toLocaleString()} {restockModalItem.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C7355]">Reorder Threshold:</span>
                  <span className="font-medium text-[#7A6452]">
                    {restockModalItem.reorderLevel.toLocaleString()} {restockModalItem.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">
                  Add Stock Quantity ({restockModalItem.unit})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-bold text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              {/* Quick Add Presets */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8C7355]">Quick Add:</span>
                {[100, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRestockQty(amt)}
                    className="px-2 py-1 text-[11px] bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E0D4C5] rounded font-semibold text-[#542F1E] cursor-pointer"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
