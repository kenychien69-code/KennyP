import React, { useState, useEffect } from 'react';
import {
  CartItem,
  Category,
  Ingredient,
  Order,
  PaymentMethod,
  Product,
  User,
} from '../types';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Coffee,
  X,
  Printer,
  ChevronRight,
  Sparkles,
  UserCheck,
  Edit2,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { getProductImageUrl } from '../utils/productImages';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  ingredients: Ingredient[];
  currentUser: User;
  onCompleteOrder: (order: Order) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  ingredients,
  currentUser,
  onCompleteOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Out' | 'Delivery'>('Dine In');
  const [discountType, setDiscountType] = useState<'None' | 'Senior/PWD (20%)' | 'Student (10%)' | 'Promo (15%)'>('None');

  // Customization modal state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState<'16oz Regular' | '22oz Large'>('16oz Regular');
  const [customSweetness, setCustomSweetness] = useState<'0%' | '25%' | '50%' | '75%' | '100%'>('100%');
  const [customIce, setCustomIce] = useState<'No Ice' | 'Less Ice' | 'Regular Ice' | 'Extra Ice'>('Regular Ice');
  const [customAddons, setCustomAddons] = useState<string[]>([]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [completedOrderForReceipt, setCompletedOrderForReceipt] = useState<Order | null>(null);

  // Specific Cashier on duty (defaults to logged-in user full name or Alexander Rivera)
  const [cashierOnDuty, setCashierOnDuty] = useState<string>(() => {
    if (currentUser.fullName && currentUser.fullName !== 'Cashier Staff') {
      return currentUser.fullName;
    }
    return 'Alexander Rivera';
  });
  const [isEditingCashierOnDuty, setIsEditingCashierOnDuty] = useState(false);

  useEffect(() => {
    if (currentUser.fullName && currentUser.fullName !== 'Cashier Staff') {
      setCashierOnDuty(currentUser.fullName);
    }
  }, [currentUser]);

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'cat-all' || prod.categoryId === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  let discountRate = 0;
  if (discountType === 'Senior/PWD (20%)') discountRate = 0.20;
  else if (discountType === 'Student (10%)') discountRate = 0.10;
  else if (discountType === 'Promo (15%)') discountRate = 0.15;

  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // In PH, 12% VAT is standard (vat = net * 0.12 or taxable / 1.12 * 0.12)
  const vatAmount = Math.round((taxableAmount / 1.12) * 0.12 * 100) / 100;
  const totalAmount = taxableAmount;

  const handleOpenCustomize = (product: Product) => {
    setCustomizingProduct(product);
    setCustomSize('16oz Regular');
    setCustomSweetness('100%');
    setCustomIce('Regular Ice');
    setCustomAddons([]);
  };

  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const sizeSurcharge = customSize === '22oz Large' ? 25 : 0;
    const addonsSurcharge = customAddons.length * 20;
    const unitPrice = customizingProduct.price + sizeSurcharge + addonsSurcharge;

    const newItem: CartItem = {
      id: `${customizingProduct.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product: customizingProduct,
      quantity: 1,
      size: customSize,
      sweetness: customSweetness,
      ice: customIce,
      addons: customAddons,
      unitPrice,
      lineTotal: unitPrice,
    };

    setCart((prev) => [...prev, newItem]);
    setCustomizingProduct(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const toggleAddon = (addon: string) => {
    setCustomAddons((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountTendered(totalAmount);
    setShowPaymentModal(true);
  };

  const handleFinalizePayment = () => {
    const finalPaid = paymentMethod === 'Cash' ? Math.max(amountTendered, totalAmount) : totalAmount;
    const change = Math.max(0, finalPaid - totalAmount);

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      orderNumber: Math.floor(100 + Math.random() * 900),
      cashierName: cashierOnDuty.trim() || currentUser.fullName || 'Alexander Rivera',
      customerName: customerName.trim() || 'Walk-in Customer',
      orderType,
      items: [...cart],
      subtotal,
      discountType,
      discountAmount,
      vatAmount,
      totalAmount,
      paymentMethod,
      amountPaid: finalPaid,
      changeAmount: change,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };

    onCompleteOrder(newOrder);
    setCompletedOrderForReceipt(newOrder);
    setShowPaymentModal(false);
    setCart([]);
    setCustomerName('Walk-in Customer');
    setDiscountType('None');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#FBF9F6]">
      {/* LEFT: Product Catalog & Menu Selection */}
      <div className="flex-1 flex flex-col border-r border-[#E8DFD4] overflow-hidden">
        {/* Top Controls: Search & Categories */}
        <div className="p-4 bg-white border-b border-[#E8DFD4] space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C7355] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coffee, tea, pastries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-md focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7355] hover:text-[#2A1810]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#8A4A28] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#6D5847] hover:bg-[#F2ECE4] border border-[#E8DFC8]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleOpenCustomize(prod)}
                className="bg-white rounded-lg border border-[#E8DFD4] hover:border-[#8A4A28] shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer group"
              >
                {/* Product Image */}
                <div className="h-32 w-full bg-[#FAF5EE] relative overflow-hidden flex items-center justify-center">
                  {/* Underlay Warm Coffee Art Icon */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#FBF8F3] to-[#F5ECE2] text-[#8C7355]/35 select-none pointer-events-none">
                    <Coffee className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[9.5px] font-semibold tracking-wider uppercase mt-1">KENNY Brew</span>
                  </div>

                  <img
                    src={getProductImageUrl(prod.name, prod.categoryId, prod.image)}
                    alt={prod.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-1"
                    onError={(e) => {
                      // Gracefully hide broken image element so warm underlay shows
                      (e.target as HTMLElement).style.opacity = '0';
                    }}
                  />
                  <div className="absolute top-2 right-2 z-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#2A1810] shadow-xs">
                    ₱{prod.price.toFixed(2)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#2A1810] group-hover:text-[#8A4A28] transition-colors line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-[#7A6452] line-clamp-2 mt-0.5 leading-tight">
                      {prod.description}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#F4EFEA] flex items-center justify-between text-[11px]">
                    <span className="text-[#8C7355] font-medium">Tap to order</span>
                    <span className="w-5 h-5 rounded-full bg-[#FAF5EE] group-hover:bg-[#8A4A28] group-hover:text-white flex items-center justify-center text-[#8A4A28] transition-colors">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Order Summary & Cart */}
      <div className="w-full lg:w-96 bg-white flex flex-col border-l border-[#E8DFD4] shrink-0 h-full justify-between">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#E8DFD4] bg-[#FAF7F2] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2A1810]">Current Order</h3>
            <span className="text-xs font-mono font-semibold text-[#8A4A28] bg-white px-2 py-0.5 rounded border border-[#E8DFC8]">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {/* Specific Cashier on Duty Bar */}
          <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-md border border-[#E8DFC8] shadow-xs">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-[#8C7355] font-semibold text-[10.5px]">Cashier:</span>
              {isEditingCashierOnDuty ? (
                <input
                  type="text"
                  value={cashierOnDuty}
                  onChange={(e) => setCashierOnDuty(e.target.value)}
                  onBlur={() => setIsEditingCashierOnDuty(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingCashierOnDuty(false)}
                  placeholder="Cashier name..."
                  className="px-1.5 py-0.5 text-xs bg-[#FAF7F2] border border-[#8A4A28] rounded font-bold text-[#2A1810] focus:outline-none w-32"
                  autoFocus
                />
              ) : (
                <span className="font-bold text-[#2A1810] truncate max-w-[155px]">
                  {cashierOnDuty}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditingCashierOnDuty(!isEditingCashierOnDuty)}
              className="text-[10px] text-[#8A4A28] hover:text-[#5C2B14] font-semibold cursor-pointer shrink-0 ml-1.5 underline hover:no-underline"
              title="Click to edit or switch cashier name"
            >
              {isEditingCashierOnDuty ? 'Done' : 'Change'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-[#EFE9DF] rounded-md text-xs font-semibold">
            {(['Dine In', 'Take Out', 'Delivery'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  orderType === type
                    ? 'bg-white text-[#2A1810] shadow-xs'
                    : 'text-[#6D5847] hover:text-[#2A1810]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name / Table #"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DFC8] rounded focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#F4EFEA]">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[#8C7355]">
              <Coffee className="w-8 h-8 stroke-1 mb-2 text-[#C4A48A]" />
              <p className="text-xs font-medium text-[#2A1810]">Cart is empty</p>
              <p className="text-[11px] text-[#7A6452] mt-0.5">
                Select beverage or food items from the menu to start.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-[#2A1810]">{item.product.name}</h5>
                    <div className="text-[11px] text-[#7A6452] leading-tight mt-0.5">
                      {item.size} · {item.sweetness} Sugar · {item.ice}
                      {item.addons.length > 0 && ` · +${item.addons.join(', ')}`}
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#8A4A28] mt-1 block">
                      ₱{item.lineTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded px-1 py-0.5 ml-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-[#6D5847] hover:text-[#2A1810] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-bold text-[#2A1810]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-[#6D5847] hover:text-[#2A1810] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Action */}
        <div className="p-4 border-t border-[#E8DFD4] bg-[#FAF7F2] space-y-2.5 shrink-0">
          {/* Discount Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6D5847] flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#8A4A28]" />
              <span>Discount:</span>
            </span>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="text-xs bg-white border border-[#E8DFC8] rounded px-2 py-1 text-[#2A1810] focus:outline-none cursor-pointer"
            >
              <option value="None">None (0%)</option>
              <option value="Senior/PWD (20%)">Senior / PWD (20%)</option>
              <option value="Student (10%)">Student (10%)</option>
              <option value="Promo (15%)">Special Promo (15%)</option>
            </select>
          </div>

          <div className="space-y-1 text-xs text-[#6D5847] pt-1 border-t border-[#E8DFC8]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-[#2A1810]">₱{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#1E7036]">
                <span>Discount ({discountType}):</span>
                <span className="font-mono">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span>12% VAT (included):</span>
              <span className="font-mono text-[#7A6452]">₱{vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[#2A1810] pt-1.5 border-t border-[#E8DFC8]">
              <span>Total Payable:</span>
              <span className="font-mono text-[#8A4A28]">₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-[#8A4A28] hover:bg-[#733C1E] active:scale-98 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CUSTOMIZE MODAL */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full border border-[#E8DFD4] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#FAF5EE] border border-[#E8DFC8] overflow-hidden shrink-0 flex items-center justify-center relative">
                  <Coffee className="w-5 h-5 text-[#8C7355]/40 absolute" />
                  <img
                    src={getProductImageUrl(customizingProduct.name, customizingProduct.categoryId, customizingProduct.image)}
                    alt={customizingProduct.name}
                    className="w-full h-full object-cover relative z-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = '0';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2A1810]">
                    Customize {customizingProduct.name}
                  </h3>
                  <span className="text-xs font-mono text-[#8A4A28] font-bold">
                    Base ₱{customizingProduct.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Size Variant */}
              <div>
                <label className="font-bold text-[#2A1810] block mb-1.5">Cup Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomSize('16oz Regular')}
                    className={`py-2 px-3 rounded border text-center font-medium transition-all ${
                      customSize === '16oz Regular'
                        ? 'bg-[#8A4A28] text-white border-[#8A4A28]'
                        : 'bg-[#FAF7F2] text-[#6D5847] border-[#E8DFC8]'
                    }`}
                  >
                    16oz Regular (Standard)
                  </button>
                  <button
                    onClick={() => setCustomSize('22oz Large')}
                    className={`py-2 px-3 rounded border text-center font-medium transition-all ${
                      customSize === '22oz Large'
                        ? 'bg-[#8A4A28] text-white border-[#8A4A28]'
                        : 'bg-[#FAF7F2] text-[#6D5847] border-[#E8DFC8]'
                    }`}
                  >
                    22oz Large (+₱25.00)
                  </button>
                </div>
              </div>

              {/* Sweetness */}
              <div>
                <label className="font-bold text-[#2A1810] block mb-1.5">Sugar Level</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['0%', '25%', '50%', '75%', '100%'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCustomSweetness(lvl)}
                      className={`py-1.5 rounded border text-center font-medium text-[11px] transition-all ${
                        customSweetness === lvl
                          ? 'bg-[#4A2E20] text-white border-[#4A2E20]'
                          : 'bg-[#FAF7F2] text-[#6D5847] border-[#E8DFC8]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="font-bold text-[#2A1810] block mb-1.5">Ice Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'] as const).map((ice) => (
                    <button
                      key={ice}
                      onClick={() => setCustomIce(ice)}
                      className={`py-1.5 rounded border text-center font-medium text-[11px] transition-all ${
                        customIce === ice
                          ? 'bg-[#4A2E20] text-white border-[#4A2E20]'
                          : 'bg-[#FAF7F2] text-[#6D5847] border-[#E8DFC8]'
                      }`}
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Addons */}
              <div>
                <label className="font-bold text-[#2A1810] block mb-1.5">Add-ons (+₱20 each)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tapioca Boba Pearls', 'Coffee Jelly', 'Cream Cheese Cloud', 'Extra Espresso Shot'].map((addon) => {
                    const isSelected = customAddons.includes(addon);
                    return (
                      <button
                        key={addon}
                        onClick={() => toggleAddon(addon)}
                        className={`py-2 px-2.5 rounded border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#F2ECE4] border-[#8A4A28] text-[#2A1810] font-bold'
                            : 'bg-[#FAF7F2] border-[#E8DFC8] text-[#6D5847]'
                        }`}
                      >
                        <span className="text-[11px]">{addon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#8A4A28]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD4] flex items-center justify-between">
              <span className="text-xs text-[#7A6452]">Ready to prepare</span>
              <button
                onClick={handleAddToCart}
                className="px-5 py-2.5 bg-[#8A4A28] hover:bg-[#733C1E] text-white text-xs font-bold rounded-md cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT & CHECKOUT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full border border-[#E8DFD4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD4] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2A1810]">Process Order Payment</h3>
                <span className="text-xs text-[#7A6452]">KENNY Brew Terminal #01</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Total Due Banner */}
              <div className="p-4 bg-[#FAF5EE] rounded-lg border border-[#EBDCCF] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A6452] uppercase font-bold">Total Amount Due</span>
                  <div className="text-2xl font-mono font-extrabold text-[#8A4A28]">
                    ₱{totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#7A6452]">
                  <div>Order Type: <strong className="text-[#2A1810]">{orderType}</strong></div>
                  <div>Customer: <strong className="text-[#2A1810]">{customerName}</strong></div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="font-bold text-[#2A1810] block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'GCash', 'Maya', 'Card'] as PaymentMethod[]).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A4A28] text-white border-[#8A4A28] font-bold shadow-xs'
                            : 'bg-[#FAF7F2] text-[#6D5847] border-[#E8DFC8] hover:bg-[#F2ECE4]'
                        }`}
                      >
                        {method === 'Cash' && <Banknote className="w-4 h-4" />}
                        {method === 'GCash' && <QrCode className="w-4 h-4" />}
                        {method === 'Maya' && <QrCode className="w-4 h-4" />}
                        {method === 'Card' && <CreditCard className="w-4 h-4" />}
                        <span className="text-[11px]">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method Specific Fields */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-3 bg-[#FAF7F2] p-3.5 rounded border border-[#E8DFC8]">
                  <label className="font-bold text-[#2A1810] block">Cash Tendered (₱)</label>
                  <input
                    type="number"
                    value={amountTendered || ''}
                    onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                    placeholder="Enter bill received"
                    className="w-full px-3 py-2 text-base font-mono font-bold bg-white border border-[#E8DFC8] rounded text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                  />

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-2">
                    {[100, 200, 500, 1000].map((bill) => (
                      <button
                        key={bill}
                        onClick={() => setAmountTendered(bill)}
                        className="flex-1 py-1 bg-white border border-[#E8DFC8] hover:border-[#8A4A28] rounded text-[11px] font-mono font-semibold text-[#2A1810] cursor-pointer"
                      >
                        ₱{bill}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmountTendered(totalAmount)}
                      className="py-1 px-2.5 bg-[#EFE9DF] border border-[#D8CCBD] hover:bg-[#E5DDD2] rounded text-[11px] font-semibold text-[#4A3828] cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>

                  {/* Change Calculation */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8DFC8]">
                    <span className="text-xs text-[#6D5847] font-medium">Change to Return:</span>
                    <span className="text-lg font-mono font-bold text-[#1E7036]">
                      ₱{Math.max(0, amountTendered - totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {(paymentMethod === 'GCash' || paymentMethod === 'Maya') && (
                <div className="p-4 bg-[#FAF7F2] rounded border border-[#E8DFC8] flex items-center gap-4">
                  <div className="w-20 h-20 bg-white p-1 rounded border border-[#E8DFC8] flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#2A1810]" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-[#2A1810]">
                      Scan to Pay with {paymentMethod}
                    </span>
                    <p className="text-[11px] text-[#7A6452]">
                      Merchant: <strong>KENNY Brew Intelligence Inc.</strong>
                    </p>
                    <p className="text-[11px] text-[#7A6452] font-mono">
                      Acct: 0917-882-9901
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="p-3.5 bg-[#FAF7F2] rounded border border-[#E8DFC8] space-y-1">
                  <span className="font-bold text-xs text-[#2A1810]">Credit / Debit Card Reader</span>
                  <p className="text-[11px] text-[#7A6452]">
                    Insert or tap chip card on the wireless terminal.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD4] flex items-center justify-between">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-white border border-[#E8DFC8] text-[#6D5847] text-xs font-semibold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizePayment}
                disabled={paymentMethod === 'Cash' && amountTendered < totalAmount}
                className="px-6 py-2.5 bg-[#8A4A28] hover:bg-[#733C1E] active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded cursor-pointer uppercase tracking-wider"
              >
                Confirm & Complete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL DIGITAL THERMAL RECEIPT MODAL */}
      <ReceiptModal
        order={completedOrderForReceipt}
        isOpen={Boolean(completedOrderForReceipt)}
        onClose={() => setCompletedOrderForReceipt(null)}
      />
    </div>
  );
};
