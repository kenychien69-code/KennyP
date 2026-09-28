import React, { useState } from 'react';
import { LatteArtLogo } from './LatteArtLogo';
import {
  Printer,
  Copy,
  Check,
  X,
  Coffee,
  User,
  QrCode,
  ShieldCheck,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Order } from '../types';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  // Compute standard 12% VAT breakdown if not stored or for validation
  const vatableSales = order.totalAmount / 1.12;
  const vat12 = order.totalAmount - vatableSales;
  const totalItemUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const cashierName =
    order.cashierName && order.cashierName !== 'Cashier Staff'
      ? order.cashierName
      : 'Alexander Rivera';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReceipt = () => {
    const divider = '==========================================';
    const subDivider = '------------------------------------------';
    const textLines = [
      '           KENNY BREW INTELLIGENCE        ',
      '      Specialty Coffee & Artisanal Tea Bar',
      '     SM City Baguio / Upper Session Road  ',
      '         VAT Reg. TIN: 482-901-384-000    ',
      divider,
      `OFFICIAL RECEIPT: OR #${String(order.orderNumber).padStart(6, '0')}`,
      `DATE: ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}`,
      `ORDER TYPE: ${order.orderType.toUpperCase()}`,
      `CASHIER: ${cashierName}`,
      `CUSTOMER: ${order.customerName}`,
      divider,
      'QTY  ITEM & SPECIFICATION           TOTAL ',
      subDivider,
      ...order.items.map(
        (it) =>
          `${it.quantity}x  ${it.product.name.slice(0, 24).padEnd(24, ' ')} ₱${it.lineTotal.toFixed(2).padStart(8, ' ')}\n    [${it.size}] ${it.addons.length ? `+${it.addons.join(', ')}` : ''}`
      ),
      subDivider,
      `SUBTOTAL:                          ₱${order.subtotal.toFixed(2).padStart(8, ' ')}`,
      ...(order.discountAmount > 0
        ? [`DISCOUNT (${order.discountType}):        -₱${order.discountAmount.toFixed(2).padStart(8, ' ')}`]
        : []),
      `VATABLE SALES (Net of VAT):        ₱${vatableSales.toFixed(2).padStart(8, ' ')}`,
      `12% VAT:                           ₱${vat12.toFixed(2).padStart(8, ' ')}`,
      divider,
      `TOTAL AMOUNT DUE:                  ₱${order.totalAmount.toFixed(2).padStart(8, ' ')}`,
      divider,
      `PAYMENT METHOD:                    ${order.paymentMethod.toUpperCase()}`,
      `AMOUNT TENDERED:                   ₱${order.amountPaid.toFixed(2).padStart(8, ' ')}`,
      `CHANGE DUE:                        ₱${order.changeAmount.toFixed(2).padStart(8, ' ')}`,
      subDivider,
      `REF: ${order.id}`,
      'THANK YOU FOR VISITING KENNY BREW!',
      'Wi-Fi: KennyBrew_Guest | Pass: freshlybrewed',
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Print Specific CSS Stylesheet */}
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
            padding: 10px !important;
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
      <div className="relative w-full max-w-md my-auto flex flex-col items-center">
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print w-full flex items-center justify-between mb-3 text-white px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide uppercase text-amber-200">
              Official POS Digital Receipt
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

        {/* The Authentic Thermal Receipt */}
        <div
          id="printable-thermal-receipt"
          className="w-full bg-[#FAF9F5] text-[#1E1915] rounded-xl shadow-2xl border border-[#D9D0C3] overflow-hidden select-text font-mono relative"
        >
          {/* Decorative Zigzag Perforated Paper Top Edge */}
          <div className="w-full h-3 bg-[#FAF9F5] flex items-center justify-center overflow-hidden border-b border-[#E8DFC8]">
            <div
              className="w-full h-full opacity-35"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #8C7355 1.5px, transparent 1.5px)',
                backgroundSize: '8px 8px',
              }}
            />
          </div>

          <div className="p-6 space-y-4">
            {/* Header Brand Seal */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-1">
                <LatteArtLogo className="w-14 h-14" />
              </div>
              <div className="font-extrabold text-base tracking-wider uppercase text-[#2A1810]">
                KENNY BREW INTELLIGENCE
              </div>
              <div className="text-[11px] font-semibold text-[#8A4A28] tracking-widest uppercase">
                Specialty Coffee & Artisanal Tea Bar
              </div>
              <div className="text-[10px] text-[#6E6359] leading-tight pt-1">
                SM City Baguio Ground Atrium, Luneta Hill
                <br />
                Upper Session Road, Baguio City, Philippines
              </div>
              <div className="text-[9.5px] text-[#7A6E64] font-mono">
                VAT Reg. TIN: 482-901-384-000 | Tel: (074) 619-2026
              </div>
              <div className="text-[9.5px] text-[#8C8075] font-mono">
                BIR Permit No: 048-FP-2026-09012 · POS Terminal #01
              </div>
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-[#B8A898]" />

            {/* Transaction Metadata & Cashier Section */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2A1810] bg-[#ECE5D8] px-2 py-0.5 rounded text-[11px]">
                  OR #{String(order.orderNumber).padStart(6, '0')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2A1810] text-[#F5EDE6]">
                  {order.orderType}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#6E6359] text-[10.5px] pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8A4A28]" />
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  ·{' '}
                  {new Date(order.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-[#8C8075] text-[10px]">Ref: {order.id.slice(-8)}</span>
              </div>

              {/* Clean, Simple Cashier & Customer Info */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8A4A28] shrink-0" />
                  <span className="text-[#6E6359]">Cashier:</span>
                  <span className="font-bold text-[#2A1810]">{cashierName}</span>
                </div>
                <div className="text-[10.5px]">
                  <span className="text-[#6E6359]">Customer:</span>{' '}
                  <span className="font-semibold text-[#2A1810]">{order.customerName || 'Walk-in Customer'}</span>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-[#B8A898]" />

            {/* Itemized Table Header */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-extrabold text-[#7A6E64] uppercase border-b border-[#D8CEBF] pb-1">
                <span className="w-8">QTY</span>
                <span className="flex-1 text-left">ITEM & CUSTOMIZATION</span>
                <span className="w-16 text-right">TOTAL</span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                {order.items.map((it, idx) => (
                  <div key={idx} className="text-[11px] leading-tight">
                    <div className="flex items-start justify-between">
                      <span className="w-8 font-extrabold text-[#2A1810]">
                        {it.quantity}x
                      </span>
                      <div className="flex-1 pr-2">
                        <span className="font-bold text-[#2A1810]">{it.product.name}</span>
                        <div className="text-[10px] text-[#6E6359] space-y-0.5 mt-0.5">
                          <div>
                            Size: <span className="font-medium text-[#2A1810]">{it.size}</span>
                            {it.sweetness && ` · Sweetness: ${it.sweetness}`}
                            {it.ice && ` · ${it.ice}`}
                          </div>
                          {it.addons && it.addons.length > 0 && (
                            <div className="text-[#8A4A28] font-medium">
                              +{it.addons.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="w-16 text-right font-bold text-[#2A1810] tabular-nums">
                        ₱{it.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-[#B8A898]" />

            {/* Financial Totals & Tax Compliance (BIR Form) */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#6E6359]">
                <span>Total Items:</span>
                <span className="font-semibold text-[#2A1810]">{totalItemUnits} unit(s)</span>
              </div>

              <div className="flex justify-between text-[#6E6359]">
                <span>Subtotal:</span>
                <span className="font-bold text-[#2A1810] tabular-nums">₱{order.subtotal.toFixed(2)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  <span>Discount ({order.discountType}):</span>
                  <span className="font-bold tabular-nums">-₱{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Formal VAT Accounting */}
              <div className="pt-1 border-t border-dotted border-[#D8CEBF] space-y-1 text-[10px] text-[#6E6359]">
                <div className="flex justify-between">
                  <span>VATable Sales (Net):</span>
                  <span className="tabular-nums">₱{vatableSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>12% Value Added Tax (VAT):</span>
                  <span className="tabular-nums">₱{vat12.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT-Exempt / Zero Rated:</span>
                  <span className="tabular-nums">₱0.00</span>
                </div>
              </div>

              {/* TOTAL DUE BOX */}
              <div className="mt-2 p-2.5 bg-[#2A1810] text-[#FAF6F2] rounded-lg flex items-center justify-between border border-[#44261B] shadow-inner">
                <div>
                  <div className="text-[9.5px] uppercase tracking-widest text-[#E5A869] font-bold">
                    Total Amount Due
                  </div>
                  <div className="text-[10px] text-[#C4A48A]">
                    {order.paymentMethod} Payment
                  </div>
                </div>
                <div className="text-lg font-black tracking-tight text-[#FAF6F2] tabular-nums">
                  ₱{order.totalAmount.toFixed(2)}
                </div>
              </div>

              {/* Payment Tendered & Change */}
              <div className="pt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between text-[#6E6359]">
                  <span>Payment Tendered ({order.paymentMethod}):</span>
                  <span className="font-bold text-[#2A1810] tabular-nums">
                    ₱{order.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#1E7036] font-bold bg-[#EBF7EE] px-2 py-1 rounded border border-[#CDEBD3]">
                  <span>Change Due:</span>
                  <span className="text-sm font-black tabular-nums">
                    ₱{order.changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barcode & Security Verification */}
            <div className="border-b border-dashed border-[#B8A898]" />

            <div className="text-center space-y-2 pt-1">
              {/* Authentic Vector Barcode */}
              <div className="flex flex-col items-center justify-center">
                <svg
                  className="w-48 h-10 overflow-hidden"
                  viewBox="0 0 190 40"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Realistic Code 128 barcode simulation */}
                  <rect x="0" y="0" width="3" height="35" />
                  <rect x="5" y="0" width="2" height="35" />
                  <rect x="9" y="0" width="4" height="35" />
                  <rect x="15" y="0" width="1" height="35" />
                  <rect x="18" y="0" width="3" height="35" />
                  <rect x="23" y="0" width="5" height="35" />
                  <rect x="30" y="0" width="2" height="35" />
                  <rect x="34" y="0" width="4" height="35" />
                  <rect x="40" y="0" width="1" height="35" />
                  <rect x="43" y="0" width="3" height="35" />
                  <rect x="48" y="0" width="2" height="35" />
                  <rect x="52" y="0" width="5" height="35" />
                  <rect x="59" y="0" width="3" height="35" />
                  <rect x="64" y="0" width="1" height="35" />
                  <rect x="67" y="0" width="4" height="35" />
                  <rect x="73" y="0" width="2" height="35" />
                  <rect x="77" y="0" width="4" height="35" />
                  <rect x="83" y="0" width="3" height="35" />
                  <rect x="88" y="0" width="2" height="35" />
                  <rect x="92" y="0" width="5" height="35" />
                  <rect x="99" y="0" width="2" height="35" />
                  <rect x="103" y="0" width="3" height="35" />
                  <rect x="108" y="0" width="4" height="35" />
                  <rect x="114" y="0" width="1" height="35" />
                  <rect x="117" y="0" width="5" height="35" />
                  <rect x="124" y="0" width="2" height="35" />
                  <rect x="128" y="0" width="3" height="35" />
                  <rect x="133" y="0" width="4" height="35" />
                  <rect x="139" y="0" width="2" height="35" />
                  <rect x="143" y="0" width="5" height="35" />
                  <rect x="150" y="0" width="2" height="35" />
                  <rect x="154" y="0" width="4" height="35" />
                  <rect x="160" y="0" width="1" height="35" />
                  <rect x="163" y="0" width="3" height="35" />
                  <rect x="168" y="0" width="5" height="35" />
                  <rect x="175" y="0" width="2" height="35" />
                  <rect x="179" y="0" width="4" height="35" />
                  <rect x="185" y="0" width="3" height="35" />
                </svg>
                <span className="text-[9.5px] font-mono tracking-widest text-[#7A6E64] mt-0.5">
                  *ORD-{order.orderNumber}-{new Date(order.createdAt).getTime().toString().slice(-6)}*
                </span>
              </div>

              {/* QR Verification Info */}
              <div className="inline-flex items-center gap-2 bg-[#F2EDE4] px-3 py-1.5 rounded-lg border border-[#DDD3C2] text-[10px] text-[#5A4E44]">
                <QrCode className="w-4 h-4 text-[#8A4A28] shrink-0" />
                <span>Scan for E-Receipt & Loyalty Brew Points</span>
              </div>

              {/* Official Store Sign-off */}
              <div className="text-[10px] text-[#6E6359] leading-relaxed pt-1">
                <div className="font-bold text-[#2A1810]">
                  Thank you for visiting KENNY Brew!
                </div>
                <div>We hope you enjoyed your handcrafted beverage.</div>
                <div className="text-[9px] text-[#8C8075] pt-1">
                  Wi-Fi: <span className="font-bold">KennyBrew_Guest</span> | Pass: <span className="font-bold">freshlybrewed</span>
                </div>
                <div className="text-[8.5px] text-[#A3978B] uppercase tracking-wider pt-1">
                  THIS SERVES AS AN OFFICIAL INVOICE / RECEIPT
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Scalloped Perforation Edge */}
          <div className="w-full h-3 bg-[#FAF9F5] flex items-center justify-center overflow-hidden border-t border-[#E8DFC8]">
            <div
              className="w-full h-full opacity-35"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #8C7355 1.5px, transparent 1.5px)',
                backgroundSize: '8px 8px',
              }}
            />
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
    </div>
  );
};
