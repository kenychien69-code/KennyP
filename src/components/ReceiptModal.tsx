import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Copy, Check, X } from 'lucide-react';
import { Order } from '../types';
import receiptLogo from '../assets/images/receipt_logo_1791026944711.jpg';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// Thermal receipt barcode generator matching authentic receipt printouts
const ThermalBarcode: React.FC<{ seed?: number; height?: number }> = ({ seed = 1, height = 36 }) => {
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
        className="w-56 h-9 overflow-hidden"
        viewBox="0 0 200 36"
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y="0"
            width={bar.width}
            height={height}
            fill="#111111"
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

  // Standard VAT breakdown computation
  const vatableSales = order.totalAmount / 1.12;
  const vat12 = order.totalAmount - vatableSales;

  const cashierName =
    order.cashierName && order.cashierName !== 'Cashier Staff'
      ? order.cashierName
      : 'Store Cashier';
  const cashierFirstName = cashierName.split(' ')[0] || 'Cashier';

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
      '              Riverside Retail Park',
      '               Phone: 0161 250 6307',
      '                  STORE # 63225',
      '               VAT No: 273 5224 09',
      '',
      `1002 ${cashierFirstName}`,
      '------------------------------------------------',
      `Chk ${order.orderNumber}`,
      '------------------------------------------------',
      ...order.items.flatMap((it) => [
        `${(it.size ? `${it.size} ` : '') + it.product.name}   ₱${it.lineTotal.toFixed(2)}`,
        ...it.addons.map((add) => `  ${add}`),
      ]),
      '',
      `SUBTOTAL                                ₱${order.subtotal.toFixed(2)}`,
      `TAX (12%)                               ₱${vat12.toFixed(2)}`,
      '================================================',
      `TOTAL                                   ₱${order.totalAmount.toFixed(2)}`,
      '------------------------------------------------',
      `DATE: ${dateFormatted}   TIME: ${timeFormatted}`,
      '------------------------------------------------',
      '               ||||| |||||| | |||| |||',
      '               ||||| |||||| | |||| |||',
      '------------------------------------------------',
      '       Thank you for visiting Kenny Brew',
    ];

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
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="relative w-full max-w-[390px] my-auto flex flex-col items-center">
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print w-full flex items-center justify-between mb-3 text-white px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide uppercase text-amber-200 font-mono">
              Thermal Receipt
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
          className="w-full bg-[#FCFCF9] text-[#111111] shadow-2xl border border-[#DDD5C7] rounded-sm py-7 px-6 select-text font-mono relative leading-relaxed text-xs"
          style={{
            fontFamily: '"Courier New", Courier, monospace, monospace',
            letterSpacing: '-0.01em',
          }}
        >
          {/* Subtle thermal paper texture header accent */}
          <div className="space-y-4">
            {/* 1. TOP LOGO: Halftone Smiling Woman with Peace Sign */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-44 overflow-hidden flex items-center justify-center">
                <img
                  src={receiptLogo}
                  alt="Kenny Brew Logo"
                  className="w-40 h-auto object-contain filter contrast-125 grayscale"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/receipt-logo.jpg';
                  }}
                />
              </div>
            </div>

            {/* 2. STORE HEADER (Center aligned) */}
            <div className="text-center space-y-0.5 pt-1 text-[13px] leading-tight font-medium text-[#111111]">
              <div className="font-bold tracking-tight text-[13.5px]">Riverside Retail Park</div>
              <div className="text-[12.5px]">Phone: 0161 250 6307</div>
              <div className="text-[12.5px] tracking-wide">STORE # 63225</div>
              <div className="text-[12.5px]">VAT No: 273 5224 09</div>
            </div>

            {/* 3. CASHIER LINE (Left aligned) */}
            <div className="pt-2 text-[13.5px] font-medium text-[#111111]">
              1002 {cashierFirstName}
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#888888] my-1" />

            {/* 4. CHECK NUMBER */}
            <div className="text-[13.5px] font-medium text-[#111111]">
              Chk {order.orderNumber}
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#888888] my-1" />

            {/* 5. ITEM LIST */}
            <div className="space-y-2 text-[13px] pt-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-[#111111] pr-2">
                      {it.size ? `${it.size} ` : ''}
                      {it.product.name}
                      {it.quantity > 1 ? ` x${it.quantity}` : ''}
                    </span>
                    <span className="font-medium tabular-nums text-right whitespace-nowrap text-[#111111]">
                      ₱{it.lineTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Add-on rows indented */}
                  {it.addons &&
                    it.addons.map((add, aIdx) => (
                      <div
                        key={aIdx}
                        className="flex justify-between items-baseline text-[12px] text-[#333333] pl-3.5"
                      >
                        <span>{add}</span>
                        <span className="tabular-nums">₱20.00</span>
                      </div>
                    ))}

                  {/* Modifiers: Sweetness & Ice */}
                  {(it.sweetness || it.ice) && (
                    <div className="text-[11.5px] text-[#555555] pl-3.5 italic">
                      {[it.sweetness, it.ice].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 6. SUBTOTAL & TAX */}
            <div className="pt-3 space-y-1 text-[13px]">
              <div className="flex justify-between items-baseline text-[#111111]">
                <span className="font-medium">SUBTOTAL</span>
                <span className="tabular-nums font-medium">₱{order.subtotal.toFixed(2)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between items-baseline text-[#333333]">
                  <span>DISCOUNT ({order.discountType})</span>
                  <span className="tabular-nums">-₱{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline text-[#111111]">
                <span className="font-medium">TAX (12%)</span>
                <span className="tabular-nums font-medium">₱{vat12.toFixed(2)}</span>
              </div>
            </div>

            {/* SOLID DIVIDER BEFORE TOTAL */}
            <div className="border-b border-[#222222] my-1.5" />

            {/* 7. TOTAL DUE (Bold & prominent) */}
            <div className="flex justify-between items-baseline text-[15px] font-bold text-[#000000]">
              <span className="tracking-wide">TOTAL</span>
              <span className="tabular-nums font-extrabold text-[15.5px]">
                ₱{order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#888888] my-1.5" />

            {/* 8. DATE & TIME */}
            <div className="text-[12.5px] font-medium text-[#111111] flex justify-between tracking-tight">
              <span>DATE: {dateFormatted}</span>
              <span>TIME: {timeFormatted}</span>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#888888] my-2" />

            {/* 9. TWO AUTHENTIC STACKED BARCODES */}
            <div className="py-1 space-y-2 flex flex-col items-center">
              <ThermalBarcode seed={1} height={36} />
              <ThermalBarcode seed={2} height={36} />
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-b border-dashed border-[#888888] my-2" />

            {/* 10. FOOTER: Thank you for visiting Kenny Brew */}
            <div className="text-center pt-1 pb-1">
              <div className="text-[13px] font-medium text-[#111111] tracking-tight">
                Thank you for visiting Kenny Brew
              </div>
            </div>

            {/* SOLID BOTTOM CUT LINE */}
            <div className="border-b border-[#333333] pt-1" />
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
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
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
