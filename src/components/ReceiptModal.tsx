import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Copy, Check, X } from 'lucide-react';
import { Order } from '../types';
import { LatteArtLogo } from './LatteArtLogo';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// Thermal receipt barcode generator matching authentic receipt printouts
const ThermalBarcode: React.FC<{ seed?: number; height?: number }> = ({ seed = 1, height = 34 }) => {
  const pattern = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 4, 1,
    2, 1, 3, 1, 2, 4, 1, 3, 1, 1, 2, 3, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1,
    3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2
  ];

  let currentX = 10;
  const bars: { x: number; width: number }[] = [];
  pattern.forEach((w, idx) => {
    const barWidth = ((w + (idx % seed === 0 ? 1 : 0)) % 4) + 1.2;
    if (idx % 2 === 0) {
      bars.push({ x: currentX, width: barWidth });
    }
    currentX += barWidth + 1.5;
  });

  return (
    <div className="w-full flex justify-center py-0.5">
      <svg
        className="w-56 h-8 overflow-hidden"
        viewBox="0 0 200 34"
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y="0"
            width={bar.width}
            height={height}
            fill="#2A1810"
          />
        ))}
      </svg>
    </div>
  );
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  // Standard Philippine VAT breakdown computation
  const vatableSales = order.totalAmount / 1.12;
  const vat12 = order.totalAmount - vatableSales;

  const cashierName =
    order.cashierName && order.cashierName !== 'Cashier Staff'
      ? order.cashierName
      : 'Store Cashier';

  const orderDate = new Date(order.createdAt);
  const dateFormatted = `${String(orderDate.getMonth() + 1).padStart(2, '0')}/${String(
    orderDate.getDate()
  ).padStart(2, '0')}/${orderDate.getFullYear()}`;
  const timeFormatted = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReceipt = () => {
    const textLines = [
      '================================================',
      '           KENNY BREW INTELLIGENCE',
      '             Poblacion  5, Mid Cot',
      '          Tel: (064) 421-8988 / 0917-123-4567',
      '               TIN: 432-876-109-000',
      '           BIR Permit: FP-10-2026-00459',
      '================================================',
      `Order #: ${order.orderNumber}          Type: ${order.orderType || 'Dine In'}`,
      `Date: ${dateFormatted}        Time: ${timeFormatted}`,
      `Cashier: ${cashierName}`,
      order.customerName ? `Customer: ${order.customerName}` : '',
      '------------------------------------------------',
      'ITEMS / PARTICULARS                       AMOUNT',
      '------------------------------------------------',
      ...order.items.flatMap((it) => [
        `${it.quantity}x ${it.size ? `${it.size} ` : ''}${it.product.name}`.padEnd(35) +
          `₱${it.lineTotal.toFixed(2)}`,
        ...(it.sweetness || it.ice
          ? [`   · ${[it.sweetness, it.ice].filter(Boolean).join(' · ')}`]
          : []),
        ...it.addons.map((add) => `   + ${add} (₱20.00)`),
      ]),
      '------------------------------------------------',
      `SUBTOTAL                                ₱${order.subtotal.toFixed(2)}`,
      order.discountAmount > 0
        ? `DISCOUNT (${order.discountType})             -₱${order.discountAmount.toFixed(2)}`
        : '',
      `VATABLE SALES (Net)                     ₱${vatableSales.toFixed(2)}`,
      `VAT (12%)                               ₱${vat12.toFixed(2)}`,
      '================================================',
      `TOTAL AMOUNT DUE                        ₱${order.totalAmount.toFixed(2)}`,
      '================================================',
      `PAYMENT METHOD: ${order.paymentMethod || 'Cash'}`,
      `AMOUNT TENDERED:                        ₱${(order.amountPaid || order.totalAmount).toFixed(2)}`,
      `CHANGE:                                 ₱${(order.changeAmount || 0).toFixed(2)}`,
      '------------------------------------------------',
      '               ||||| |||||| | |||| |||',
      `               REF: KB-${order.orderNumber}-${Date.now().toString().slice(-4)}`,
      '------------------------------------------------',
      '      Thank you for visiting Kenny Brew!',
      '             Poblacion  5, Mid Cot',
      '        Free Wi-Fi: KennyBrew_Guest (pass: kenny123)',
      '   THIS SERVES AS YOUR OFFICIAL SALES INVOICE',
    ].filter(Boolean);

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Thermal Print Specific Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-receipt,
          #printable-thermal-receipt * {
            visibility: visible !important;
          }
          #printable-thermal-receipt {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 8px 12px !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            color: #2A1810 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="relative w-full max-w-[395px] my-auto flex flex-col items-center">
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print w-full flex items-center justify-between mb-3 text-white px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373] animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide uppercase text-[#F3E7DC] font-mono">
              Official Thermal Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#EFEBE4] hover:text-white transition-colors cursor-pointer"
            title="Close Receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Authentic Thermal Receipt paper slip */}
        <div
          id="printable-thermal-receipt"
          className="w-full bg-[#FAF7F2] text-[#2A1810] shadow-2xl border border-[#D8C7B5] rounded-sm py-6 px-6 select-text font-mono relative leading-relaxed text-xs"
          style={{
            fontFamily: '"Courier New", Courier, monospace, monospace',
            letterSpacing: '-0.01em',
          }}
        >
          {/* Subtle thermal paper texture header accent */}
          <div className="space-y-3.5">
            {/* 1. STORE LOGO & EMBLEM (Dark Brown matching system theme) */}
            <div className="flex flex-col items-center justify-center pt-1 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#2A1810] flex items-center justify-center p-1.5 mb-1.5 shadow-2xs">
                <LatteArtLogo className="w-9 h-9" />
              </div>
              <h2 className="text-base font-extrabold tracking-wider text-[#2A1810] uppercase leading-none">
                KENNY BREW
              </h2>
              <span className="text-[10px] font-bold tracking-widest text-[#4A2E20] uppercase mt-0.5">
                INTELLIGENCE
              </span>
              <span className="text-[9.5px] text-[#5C3A28] italic mt-0.5">
                Specialty Coffee & POS Intelligence
              </span>
            </div>

            {/* 2. STORE LOCATION & TAX INFORMATION */}
            <div className="text-center space-y-0.5 text-[11.5px] leading-tight font-medium text-[#2A1810]">
              <div className="font-extrabold text-[12.5px] text-[#2A1810] tracking-tight">
                Poblacion  5, Mid Cot
              </div>
              <div className="text-[11px] text-[#4A2E20]">
                Contact: +63 917 123 4567 · (064) 421-8988
              </div>
              <div className="text-[10.5px] text-[#5C3A28] tracking-wider pt-0.5">
                TIN: 432-876-109-000 VAT Reg.
              </div>
              <div className="text-[10.5px] text-[#5C3A28]">
                BIR Permit: FP-10-2026-00459
              </div>
            </div>

            {/* SOLID DIVIDER */}
            <div className="border-b border-[#2A1810]/40 my-1" />

            {/* 3. TRANSACTION METADATA */}
            <div className="text-[12px] text-[#2A1810] space-y-1">
              <div className="flex justify-between items-baseline font-bold">
                <span>ORDER #: {order.orderNumber}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded border border-[#2A1810]/30 uppercase">
                  {order.orderType || 'Dine In'}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-[#4A2E20]">
                <span>DATE: {dateFormatted}</span>
                <span>TIME: {timeFormatted}</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-[#4A2E20]">
                <span>CASHIER: {cashierName}</span>
                {order.customerName && (
                  <span className="truncate max-w-[140px]">
                    CUST: {order.customerName}
                  </span>
                )}
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#2A1810]/40 my-1" />

            {/* 4. ITEM LIST HEADER */}
            <div className="flex justify-between text-[11px] font-bold text-[#2A1810] uppercase tracking-wider pb-0.5">
              <span>ITEMS / PARTICULARS</span>
              <span>AMOUNT</span>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#2A1810]/40 -mt-1 mb-1" />

            {/* 5. ITEMIZED CART BREAKDOWN */}
            <div className="space-y-2 text-[12.5px] pt-0.5">
              {order.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline text-[#2A1810]">
                    <span className="font-bold pr-2 leading-snug">
                      {it.quantity}x {it.size ? `${it.size} ` : ''}
                      {it.product.name}
                    </span>
                    <span className="font-bold tabular-nums text-right whitespace-nowrap">
                      ₱{it.lineTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Modifiers: Sweetness & Ice */}
                  {(it.sweetness || it.ice) && (
                    <div className="text-[11px] text-[#5C3A28] pl-3.5 italic">
                      {[it.sweetness, it.ice].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  {/* Add-ons list */}
                  {it.addons &&
                    it.addons.map((add, aIdx) => (
                      <div
                        key={aIdx}
                        className="flex justify-between items-baseline text-[11px] text-[#5C3A28] pl-3.5"
                      >
                        <span>+ {add}</span>
                        <span className="tabular-nums">₱20.00</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#2A1810]/40 my-1.5" />

            {/* 6. FINANCIAL TOTALS & TAX BREAKDOWN */}
            <div className="space-y-1 text-[12px] text-[#2A1810]">
              <div className="flex justify-between items-baseline">
                <span className="font-medium">SUBTOTAL</span>
                <span className="tabular-nums font-medium">₱{order.subtotal.toFixed(2)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between items-baseline text-[#7A3E26] font-medium">
                  <span>DISCOUNT ({order.discountType})</span>
                  <span className="tabular-nums">-₱{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline text-[11px] text-[#5C3A28]">
                <span>VATABLE SALES (Net)</span>
                <span className="tabular-nums">₱{vatableSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline text-[11px] text-[#5C3A28]">
                <span>VAT (12%)</span>
                <span className="tabular-nums">₱{vat12.toFixed(2)}</span>
              </div>
            </div>

            {/* DOUBLE SOLID DIVIDER BEFORE GRAND TOTAL */}
            <div className="border-t-2 border-b border-[#2A1810] my-2 py-0.5" />

            {/* 7. GRAND TOTAL DUE */}
            <div className="flex justify-between items-baseline text-[16px] font-extrabold text-[#2A1810]">
              <span className="tracking-wide">TOTAL AMOUNT</span>
              <span className="tabular-nums text-[17px]">
                ₱{order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* DOUBLE SOLID DIVIDER AFTER GRAND TOTAL */}
            <div className="border-t border-b-2 border-[#2A1810] my-2 py-0.5" />

            {/* 8. PAYMENT & TENDER INFORMATION */}
            <div className="space-y-1 text-[11.5px] text-[#2A1810]">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">PAYMENT METHOD:</span>
                <span className="font-bold uppercase">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span>AMOUNT TENDERED:</span>
                <span className="tabular-nums font-semibold">
                  ₱{(order.amountPaid || order.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-bold text-[12px]">
                <span>CHANGE DUE:</span>
                <span className="tabular-nums">
                  ₱{(order.changeAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#2A1810]/40 my-2" />

            {/* 9. AUTHENTIC THERMAL BARCODES */}
            <div className="py-1 space-y-1.5 flex flex-col items-center">
              <ThermalBarcode seed={1} height={34} />
              <div className="text-[10px] text-[#4A2E20] font-mono tracking-widest text-center">
                *KB-{order.orderNumber}-{dateFormatted.replace(/\//g, '')}*
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#2A1810]/40 my-2" />

            {/* 10. PROFESSIONAL COFFEE SHOP FOOTER */}
            <div className="text-center pt-1 pb-1 space-y-1 text-[#2A1810]">
              <div className="text-[12.5px] font-extrabold tracking-tight">
                Thank you for visiting Kenny Brew!
              </div>
              <div className="text-[11px] font-medium text-[#4A2E20]">
                Poblacion  5, Mid Cot
              </div>
              <div className="text-[10px] text-[#5C3A28] pt-0.5">
                Free Wi-Fi: <span className="font-bold">KennyBrew_Guest</span> (pass: kenny123)
              </div>
              <div className="text-[9px] text-[#6E4933] uppercase tracking-wider pt-1 font-bold">
                THIS SERVES AS YOUR OFFICIAL SALES INVOICE
              </div>
            </div>

            {/* BOTTOM SERRATED CUT LINE */}
            <div className="border-b border-[#2A1810]/40 pt-1" />
          </div>
        </div>

        {/* Action Buttons (Non-printable) */}
        <div className="no-print w-full flex items-center gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#2C211B] hover:bg-[#3D2F27] text-[#FAF6F2] text-xs font-bold rounded-xl border border-[#4D382B] transition-colors cursor-pointer shadow-md"
          >
            Close
          </button>

          <button
            onClick={handleCopyTextReceipt}
            className="py-2.5 px-3 bg-[#2C211B] hover:bg-[#3D2F27] text-[#FAF6F2] text-xs font-medium rounded-xl border border-[#4D382B] transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Copy formatted receipt text"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#D4A373]" />
                <span className="text-[#D4A373] font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#C4A48A]" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-[#8A4A28] hover:bg-[#733C1E] active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
