import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Ingredient, Product } from '../types';
import { getProductImageUrl } from '../utils/productImages';
import { StorageSetupModal } from './StorageSetupModal';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  PackagePlus,
  Clock,
  Coffee,
  DollarSign,
  Tag,
  Check,
  Ban,
  Layers,
  Trash2,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  XCircle,
  Edit2,
  CloudUpload,
} from 'lucide-react';

const PRESET_PRODUCT_IMAGES = [
  { name: 'Espresso Latte', label: 'Latte', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400' },
  { name: 'Iced Americano', label: 'Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Vanilla Cold Brew', label: 'Cold Brew', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=400' },
  { name: 'Brown Sugar Boba', label: 'Boba Milk Tea', url: '/product-boba-tea.jpg' },
  { name: 'Matcha Green Tea', label: 'Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Strawberry Fruit Tea', label: 'Fruit Tea', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=400' },
  { name: 'Butter Croissant', label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Blueberry Muffin', label: 'Muffin', url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=400' },
];

interface InventoryViewProps {
  products: Product[];
  ingredients: Ingredient[];
  onRestockIngredient: (id: string, addedAmount: number) => void;
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
  onAddIngredient: (ingredient: Ingredient) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (productId: string, updates: Partial<Product>) => void;
  onToggleProductAvailability?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteIngredient?: (ingredientId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  ingredients,
  onRestockIngredient,
  onUpdateIngredient,
  onAddIngredient,
  onAddProduct,
  onUpdateProduct,
  onToggleProductAvailability,
  onDeleteProduct,
  onDeleteIngredient,
}) => {
  // Main sub-tab: 'products' vs 'inventory'
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'ingredients'>('products');

  // Search & Filters for Ingredients
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [restockingItem, setRestockingItem] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);

  // New Ingredient form
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<Ingredient['category']>('Coffee');
  const [newIngUnit, setNewIngUnit] = useState<Ingredient['unit']>('g');
  const [newIngStock, setNewIngStock] = useState<number>(1000);
  const [newIngReorder, setNewIngReorder] = useState<number>(300);
  const [newIngCost, setNewIngCost] = useState<number>(1.2);
  const [newIngSupplier, setNewIngSupplier] = useState('');

  // Products Tab states
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState<string>('');
  const [editProdCat, setEditProdCat] = useState<string>('cat_coffee');
  const [editProdDesc, setEditProdDesc] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editImage, setEditImage] = useState<string>('');
  const [editProdIsAvailable, setEditProdIsAvailable] = useState<boolean>(true);

  // Ingredient Edit state
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editIngName, setEditIngName] = useState('');
  const [editIngCategory, setEditIngCategory] = useState<Ingredient['category']>('Coffee');
  const [editIngUnit, setEditIngUnit] = useState<Ingredient['unit']>('g');
  const [editIngStock, setEditIngStock] = useState<number>(0);
  const [editIngReorder, setEditIngReorder] = useState<number>(0);
  const [editIngCost, setEditIngCost] = useState<number>(0);
  const [editIngSupplier, setEditIngSupplier] = useState('');

  // In-app Delete Confirmation state (no window.confirm in iframes)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'product' | 'ingredient';
    id: string;
    name: string;
  } | null>(null);

  // New Product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('cat_coffee');
  const [newProdPrice, setNewProdPrice] = useState<number>(120);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState<string>('');
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageError, setImageError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showStorageModal, setShowStorageModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (file: File, isEdit = false) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setImageError('Image file is too large (max 12MB).');
      return;
    }
    setImageError('');

    try {
      // 1. Client-side canvas compression: convert heavy camera/phone photo to crisp ~60KB JPEG
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => resolve(e.target?.result as string);
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Set preview immediately so user sees their photo right away
      if (isEdit) {
        setEditImage(compressedDataUrl);
      } else {
        setNewProdImage(compressedDataUrl);
      }

      // 3. Persist permanently to backend filesystem
      const targetName = isEdit ? editProdName || 'product' : newProdName || 'product';
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl, name: targetName }),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          if (isEdit) {
            setEditImage(uploadData.url);
          } else {
            setNewProdImage(uploadData.url);
          }
        }
        if (uploadData.storage === 'supabase') {
          showToast('Image uploaded permanently to Supabase Storage CDN!');
        } else if (uploadData.warning) {
          showToast('Image uploaded locally. Click "Cloud Image Storage" to enable permanent cloud hosting.');
        }
      }
    } catch (err: any) {
      console.warn('Image processing notice:', err);
    }
  };

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const ingredientCategories = ['All', 'Coffee', 'Tea', 'Dairy', 'Dairy Alternative', 'Syrup', 'Topping', 'Packaging'];

  const filteredIngredients = ingredients.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = String(item?.name || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
    return matchesCat && matchesSearch;
  });

  const lowStockItems = ingredients.filter((item) => item.currentStock <= item.reorderLevel);

  const filteredProducts = products.filter((p) => {
    const matchesCat = productCatFilter === 'All' || p.categoryId === productCatFilter;
    const matchesSearch = String(p?.name || '').toLowerCase().includes(String(productSearch || '').toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenRestock = (item: Ingredient) => {
    setRestockingItem(item);
    const suggested = Math.max(item.reorderLevel * 2 - item.currentStock, 20);
    setRestockQty(suggested);
  };

  const handleConfirmRestock = () => {
    if (!restockingItem || restockQty <= 0) return;
    onRestockIngredient(restockingItem.id, restockQty);
    showToast(`Restocked ${restockQty} ${restockingItem.unit} of ${restockingItem.name}`);
    setRestockingItem(null);
  };

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      category: newIngCategory,
      unit: newIngUnit,
      currentStock: Number(newIngStock),
      reorderLevel: Number(newIngReorder),
      costPerUnit: Number(newIngCost),
      supplier: newIngSupplier.trim() || 'Direct Food Wholesale',
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    onAddIngredient(newIng);
    setShowAddIngredientModal(false);
    setNewIngName('');
    showToast(`Added ingredient "${newIng.name}" to inventory.`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !onAddProduct) return;

    const finalImage =
      newProdImage.trim() ||
      getProductImageUrl(newProdName.trim(), newProdCat);

    const newP: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      categoryId: newProdCat,
      price: Number(newProdPrice),
      description: newProdDesc.trim() || 'Fresh handcrafted specialty drink.',
      image: finalImage,
      isAvailable: true,
      salesWeight: 0.15,
      recipe: [
        { ingredientId: 'ing_beans_espresso', amount: 18 },
        { ingredientId: 'ing_fresh_milk', amount: 180 },
        { ingredientId: 'ing_cup_16oz', amount: 1 },
      ],
    };

    onAddProduct(newP);
    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdPrice(120);
    setNewProdDesc('');
    setNewProdImage('');
    setImageError('');
    showToast(`Added product "${newP.name}" (₱${newP.price.toFixed(2)}) to menu catalog.`);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCat(p.categoryId);
    setEditProdDesc(p.description || '');
    setEditPrice(p.price);
    setEditImage(p.image || '');
    setEditProdIsAvailable(p.isAvailable);
    setImageError('');
  };

  const handleSaveProductEdit = (productId: string) => {
    if (onUpdateProduct) {
      onUpdateProduct(productId, {
        name: editProdName.trim(),
        categoryId: editProdCat,
        description: editProdDesc.trim(),
        price: editPrice,
        isAvailable: editProdIsAvailable,
        ...(editImage ? { image: editImage } : {}),
      });
      showToast(`Updated beverage product "${editProdName.trim()}".`);
    }
    setEditingProduct(null);
    setEditImage('');
  };

  const handleOpenEditIngredient = (item: Ingredient) => {
    setEditingIngredient(item);
    setEditIngName(item.name);
    setEditIngCategory(item.category);
    setEditIngUnit(item.unit);
    setEditIngStock(item.currentStock);
    setEditIngReorder(item.reorderLevel);
    setEditIngCost(item.costPerUnit);
    setEditIngSupplier(item.supplier || '');
  };

  const handleSaveIngredientEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient || !editIngName.trim()) return;
    if (onUpdateIngredient) {
      onUpdateIngredient(editingIngredient.id, {
        name: editIngName.trim(),
        category: editIngCategory,
        unit: editIngUnit,
        currentStock: Number(editIngStock),
        reorderLevel: Number(editIngReorder),
        costPerUnit: Number(editIngCost),
        supplier: editIngSupplier.trim(),
      });
      showToast(`Updated ingredient "${editIngName.trim()}".`);
    }
    setEditingIngredient(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-[#E8DFC8] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A1810] tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-[#8A4A28]" />
            Products & Inventory Management
          </h1>
          <p className="text-xs text-[#6B5745] mt-1">
            Maintain POS drink menu pricing and availability alongside raw material stock and replenishment thresholds.
          </p>
        </div>

        {/* Tab Switcher & Quick Add Buttons */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'products' ? (
            <>
              <button
                type="button"
                onClick={() => setShowStorageModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#D5C2B1] text-[#3D291C] rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Configure permanent Supabase Cloud Image Storage"
              >
                <CloudUpload className="w-3.5 h-3.5 text-[#8A4A28]" />
                <span>Cloud Image Storage</span>
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAddIngredientModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8A4A28] hover:bg-[#733C1E] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Ingredient</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-[#FAF5EE] border border-[#E8DFC8] text-[#4A2E20] rounded-lg text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#8A4A28]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sub-Navigation Switcher */}
      <div className="flex border-b border-[#E8DFC8] space-x-1">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'products'
              ? 'border-[#8A4A28] text-[#8A4A28] bg-white rounded-t-lg'
              : 'border-transparent text-[#7A6452] hover:text-[#2A1810]'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Beverage Products & Menu ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ingredients')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'ingredients'
              ? 'border-[#8A4A28] text-[#8A4A28] bg-white rounded-t-lg'
              : 'border-transparent text-[#7A6452] hover:text-[#2A1810]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Raw Materials & Inventory ({ingredients.length})</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#FEE2E2] text-[#DC2626] rounded-full text-[10px] font-bold">
              {lowStockItems.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: PRODUCTS ===================== */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Products Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7355]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search beverage by name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#7A6452] font-semibold whitespace-nowrap">Category:</span>
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="cat_coffee">Coffee & Espresso</option>
                <option value="cat_milktea">Milk Tea</option>
                <option value="cat_fruit">Fruit Teas</option>
                <option value="cat_bakery">Pastries & Bakery</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#E8DFC8] p-4 shadow-xs flex flex-col justify-between hover:border-[#D5C2AF] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={getProductImageUrl(p.name, p.categoryId, p.image)}
                        alt={p.name}
                        className="w-14 h-14 rounded-lg object-cover border border-[#E8DFC8] shrink-0 bg-[#FAF7F2] shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#8C7355] uppercase tracking-wider">
                          {p.categoryId.replace('cat_', '')}
                        </span>
                        <h3 className="font-extrabold text-sm text-[#2A1810] mt-0.5 leading-snug truncate">{p.name}</h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleProductAvailability && onToggleProductAvailability(p.id)}
                      className={`text-[10px] font-extrabold tracking-wider uppercase transition-opacity cursor-pointer shrink-0 bg-transparent border-0 p-0 hover:opacity-75 flex items-center gap-1.5 ${
                        p.isAvailable
                          ? 'text-[#8A4A28]'
                          : 'text-[#A89078] line-through'
                      }`}
                      title="Click to toggle in-stock / sold out at POS"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.isAvailable ? 'bg-[#8A4A28]' : 'bg-[#A89078]'
                        }`}
                      />
                      <span>{p.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#7A6452] mt-2 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Price & Recipe info */}
                  <div className="mt-3 pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8C7355] block">Retail Price:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#2A1810] tabular-nums">
                          ₱{p.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-2 py-0.5 bg-[#FAF7F2] hover:bg-[#8A4A28] hover:text-white text-[#8A4A28] border border-[#E8DFC8] rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                          title="Edit beverage product"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ type: 'product', id: p.id, name: p.name })}
                            className="px-2 py-0.5 bg-[#FFF5F5] hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Delete beverage product"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8C7355] block">Recipe Ingredients:</span>
                      <span className="text-[11px] font-semibold text-[#542F1E]">
                        {p.recipe.length} tracked items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipe Breakdown Chip list */}
                <div className="mt-3 pt-2 border-t border-[#F2ECE4]">
                  <div className="flex flex-wrap gap-1">
                    {p.recipe.map((r) => {
                      const ing = ingredients.find((i) => i.id === r.ingredientId);
                      return (
                        <span
                          key={r.ingredientId}
                          className="px-1.5 py-0.5 text-[9px] bg-[#FAF7F2] text-[#6D5847] border border-[#E8DFC8] rounded"
                        >
                          {ing?.name || r.ingredientId}: {r.amount} {ing?.unit || ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: INGREDIENTS ===================== */}
      {activeSubTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Low Stock Alert Banner */}
          {lowStockItems.length > 0 && (
            <div className="bg-[#FFF8F6] border border-[#F5C2C2] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#991B1B]">
                    {lowStockItems.length} Raw Material(s) At or Below Reorder Threshold
                  </h4>
                  <p className="text-xs text-[#7F1D1D] mt-0.5">
                    {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit} left)`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenRestock(lowStockItems[0])}
                className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
              >
                Quick Restock
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8C7355] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ingredient or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
                />
              </div>

              <div className="text-xs text-[#7A6452] font-medium">
                Total Ingredients: <strong className="text-[#2A1810]">{ingredients.length}</strong> items
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {ingredientCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#4E342E] text-white font-semibold'
                      : 'bg-[#FAF7F2] text-[#6D5847] hover:bg-[#F2ECE4] border border-[#E8DFC8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#E8DFC8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F4EE] text-[#6D5847] border-b border-[#E8DFC8] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Raw Material / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Reorder Threshold</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Cost / Unit</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE4]">
                  {filteredIngredients.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    const isCritical = item.currentStock < item.reorderLevel * 0.5;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF6F0] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#2A1810]">{item.name}</div>
                          <div className="text-[10px] text-[#8C7355] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Restocked: {item.lastRestocked || 'Recent'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#6D5847]">{item.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#2A1810]">
                          {item.currentStock.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#7A6452]">
                          {item.reorderLevel.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-transparent border-0 p-0 ${
                              isCritical
                                ? 'text-[#B91C1C]'
                                : isLow
                                ? 'text-[#B45309]'
                                : 'text-[#8A4A28]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCritical
                                  ? 'bg-[#B91C1C]'
                                  : isLow
                                  ? 'bg-[#B45309]'
                                  : 'bg-[#8A4A28]'
                              }`}
                            />
                            {isCritical ? 'Critical Low' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#2A1810]">
                          ₱{item.costPerUnit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[#6D5847]">{item.supplier || 'Direct'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditIngredient(item)}
                              className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#4E342E] hover:text-white text-[#4E342E] border border-[#E8DFC8] text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit ingredient details"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenRestock(item)}
                              className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#8A4A28] hover:text-white text-[#8A4A28] border border-[#E8DFC8] text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Restock ingredient"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restock</span>
                            </button>
                            {onDeleteIngredient && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ type: 'ingredient', id: item.id, name: item.name })}
                                className="p-1.5 hover:bg-[#FEE2E2] text-[#8C7355] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                                title="Delete ingredient"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Add New Beverage Product</h3>
                <p className="text-xs text-[#7A6452]">Specify beverage details, upload photo and set price</p>
              </div>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProdImage('');
                  setImageError('');
                }}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Beverage Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Vanilla Cold Foam Cold Brew"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Category</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                  >
                    <option value="cat-1">Coffee & Espresso (CAT-1)</option>
                    <option value="cat_coffee">Coffee & Espresso</option>
                    <option value="cat-2">Milk Tea (CAT-2)</option>
                    <option value="cat_milktea">Milk Tea</option>
                    <option value="cat-3">Fruit Teas (CAT-3)</option>
                    <option value="cat_fruit">Fruit Teas</option>
                    <option value="cat-4">Pastries & Bakery (CAT-4)</option>
                    <option value="cat_bakery">Pastries & Bakery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Retail Price</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={0.5}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-bold text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                  />
                </div>
              </div>

              {/* PRODUCT IMAGE UPLOAD SECTION */}
              <div className="space-y-2 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#3D291C] flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8A4A28]" />
                    <span>Product Image</span>
                  </label>
                  {/* Selector pills */}
                  <div className="flex items-center gap-1 bg-[#ECE4D8] p-0.5 rounded-lg text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setImageUploadMethod('upload')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                        imageUploadMethod === 'upload'
                          ? 'bg-white text-[#2A1810] shadow-xs'
                          : 'text-[#6B5745] hover:text-[#2A1810]'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMethod('url')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                        imageUploadMethod === 'url'
                          ? 'bg-white text-[#2A1810] shadow-xs'
                          : 'text-[#6B5745] hover:text-[#2A1810]'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 inline mr-1" />
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMethod('presets')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                        imageUploadMethod === 'presets'
                          ? 'bg-white text-[#2A1810] shadow-xs'
                          : 'text-[#6B5745] hover:text-[#2A1810]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1 text-[#8A4A28]" />
                      Presets
                    </button>
                  </div>
                </div>

                {/* Upload File Mode */}
                {imageUploadMethod === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileChange(file);
                      }}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageFileChange(file);
                      }}
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-[#8A4A28] bg-[#F5EDE4]'
                          : 'border-[#DECDBB] hover:border-[#8A4A28] bg-white'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-[#F5ECE2] flex items-center justify-center text-[#8A4A28]">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-[#2A1810]">
                          Click to browse device or drag & drop photo
                        </span>
                        <span className="text-[10px] text-[#7A6452]">
                          Supports PNG, JPG, WebP, GIF (Max 5MB)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image URL Mode */}
                {imageUploadMethod === 'url' && (
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="Paste image web link (e.g. https://...)"
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                    />
                  </div>
                )}

                {/* Quick Presets Mode */}
                {imageUploadMethod === 'presets' && (
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-[#E8DFC8]">
                    {PRESET_PRODUCT_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setNewProdImage(preset.url)}
                        className={`flex flex-col items-center p-1 rounded border text-center transition-all cursor-pointer ${
                          newProdImage === preset.url
                            ? 'border-[#8A4A28] bg-[#F5ECE2] ring-1 ring-[#8A4A28]'
                            : 'border-transparent hover:border-[#DECDBB] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <span className="text-[9.5px] font-medium text-[#3D291C] mt-0.5 truncate w-full">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Error message */}
                {imageError && (
                  <div className="text-[10.5px] text-red-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Live Preview Box */}
                {newProdImage ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E8DFC8]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={newProdImage}
                        alt="Preview"
                        className="w-12 h-12 rounded-md object-cover border border-[#DECDBB] shrink-0"
                        onError={() => setImageError('Could not load image from this source')}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          Photo Loaded
                        </span>
                        <p className="text-[10px] text-[#7A6452] truncate mt-0.5 max-w-[220px]">
                          {newProdImage.startsWith('data:') ? 'Custom file uploaded from device' : newProdImage}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewProdImage('');
                        setImageError('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-2 py-1 text-[10.5px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors font-semibold cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#8C7355] italic">
                    If no photo is selected, a matching signature beverage photo will be automatically assigned.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Describe tasting notes, brew method, or syrup profile..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setNewProdImage('');
                    setImageError('');
                  }}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Edit Beverage Product</h3>
                <p className="text-xs text-[#7A6452]">Update name, category, pricing, and beverage photo</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProductEdit(editingProduct.id);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Beverage Name</label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] font-medium focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Category</label>
                  <select
                    value={editProdCat}
                    onChange={(e) => setEditProdCat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                  >
                    <option value="cat-1">Coffee & Espresso (CAT-1)</option>
                    <option value="cat_coffee">Coffee & Espresso</option>
                    <option value="cat-espresso">Espresso</option>
                    <option value="cat-2">Milk Tea (CAT-2)</option>
                    <option value="cat_milktea">Milk Tea</option>
                    <option value="cat-tea">Tea & Specialty</option>
                    <option value="cat-3">Fruit Teas (CAT-3)</option>
                    <option value="cat_fruit">Fruit Teas</option>
                    <option value="cat-4">Pastries & Bakery (CAT-4)</option>
                    <option value="cat_bakery">Pastries & Bakery</option>
                    <option value="cat-pastry">Pastries</option>
                    {!['cat-1','cat_coffee','cat-espresso','cat-2','cat_milktea','cat-tea','cat-3','cat_fruit','cat-4','cat_bakery','cat-pastry'].includes(editProdCat) && (
                      <option value={editProdCat}>{editProdCat}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Retail Price (₱)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={0.5}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-bold text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Description</label>
                <textarea
                  rows={2}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                <input
                  type="checkbox"
                  id="editIsAvailable"
                  checked={editProdIsAvailable}
                  onChange={(e) => setEditProdIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-[#8A4A28] rounded cursor-pointer"
                />
                <label htmlFor="editIsAvailable" className="font-semibold text-[#3D291C] text-xs cursor-pointer select-none">
                  Available for ordering at POS register
                </label>
              </div>

              {/* Photo section */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8]">
                <label className="font-bold text-[#3D291C] flex items-center gap-1.5 text-xs">
                  <ImageIcon className="w-3.5 h-3.5 text-[#8A4A28]" />
                  <span>Update Photo</span>
                </label>

                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file, true);
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <img
                    src={editImage || getProductImageUrl(editProdName, editProdCat, editingProduct.image)}
                    alt="Current"
                    className="w-14 h-14 rounded-lg object-cover border border-[#DECDBB] shrink-0 bg-white"
                  />
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload New Photo</span>
                    </button>
                    <span className="text-[10px] text-[#7A6452] block">
                      PNG, JPG, WebP up to 5MB
                    </span>
                    {editImage && editImage.includes('supabase.co/storage') ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold inline-flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hosted on Supabase Storage
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowStorageModal(true)}
                        className="text-[10px] text-[#8A4A28] hover:underline flex items-center gap-1 font-semibold cursor-pointer mt-1"
                      >
                        <CloudUpload className="w-3 h-3" /> Setup permanent cloud storage
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT INGREDIENT MODAL */}
      {editingIngredient && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Edit Raw Material / Item</h3>
                <p className="text-xs text-[#7A6452]">Update ingredient properties, stock, thresholds, and supplier</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingIngredient(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIngredientEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Ingredient / Raw Material Name</label>
                <input
                  type="text"
                  required
                  value={editIngName}
                  onChange={(e) => setEditIngName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Category</label>
                  <select
                    value={editIngCategory}
                    onChange={(e) => setEditIngCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] cursor-pointer"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Tea">Tea</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Dairy Alternative">Dairy Alternative</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Topping">Topping</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Unit of Measure</label>
                  <select
                    value={editIngUnit}
                    onChange={(e) => setEditIngUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] cursor-pointer"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Current Stock ({editIngUnit})</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editIngStock}
                    onChange={(e) => setEditIngStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-bold text-[#2A1810]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Reorder Alert Level ({editIngUnit})</label>
                  <input
                    type="number"
                    min={1}
                    value={editIngReorder}
                    onChange={(e) => setEditIngReorder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Cost Per Unit (₱)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    value={editIngCost}
                    onChange={(e) => setEditIngCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Supplier</label>
                  <input
                    type="text"
                    value={editIngSupplier}
                    onChange={(e) => setEditIngSupplier(e.target.value)}
                    placeholder="e.g. EcoPackaging Metro"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RESTOCK MODAL */}
      {restockingItem && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E8DFC8] shadow-2xl p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#2A1810]">Restock Raw Ingredient</h3>
                <span className="text-xs text-[#7A6452]">{restockingItem.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setRestockingItem(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8C7355]">Current Stock:</span>
                <span className="font-bold text-[#2A1810]">
                  {restockingItem.currentStock.toLocaleString()} {restockingItem.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7355]">Reorder Threshold:</span>
                <span className="text-[#7A6452]">
                  {restockingItem.reorderLevel.toLocaleString()} {restockingItem.unit}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-[#3D291C] block">
                Add Stock Amount ({restockingItem.unit})
              </label>
              <input
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-bold text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFC8]">
              <button
                type="button"
                onClick={() => setRestockingItem(null)}
                className="px-3 py-1.5 border border-[#E8DFC8] rounded text-xs text-[#6D5847] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-1.5 bg-[#8A4A28] hover:bg-[#733C1E] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD INGREDIENT MODAL */}
      {showAddIngredientModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Add New Raw Material</h3>
                <p className="text-xs text-[#7A6452]">Set ingredient reorder threshold and inventory unit</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIngredientModal(false)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="e.g. Oat Milk Barista Edition"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Category</label>
                  <select
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] cursor-pointer"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Tea">Tea</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Dairy Alternative">Dairy Alternative</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Topping">Topping</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Unit of Measure</label>
                  <select
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-xs text-[#2A1810] cursor-pointer"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Opening Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Reorder Alert Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newIngReorder}
                    onChange={(e) => setNewIngReorder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Cost Per Unit (₱)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    value={newIngCost}
                    onChange={(e) => setNewIngCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3D291C] block">Supplier</label>
                  <input
                    type="text"
                    value={newIngSupplier}
                    onChange={(e) => setNewIngSupplier(e.target.value)}
                    placeholder="e.g. San Miguel Foods"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">
                  Delete {deleteConfirm.type === 'product' ? 'Product' : 'Ingredient'}
                </h3>
                <p className="text-xs text-[#7A6452]">This will remove it from the menu catalog and database.</p>
              </div>
            </div>

            <p className="text-xs text-[#3D291C] bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFC8]">
              Are you sure you want to permanently delete <strong className="text-[#2A1810]">"{deleteConfirm.name}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFC8]">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-[#E8DFC8] rounded-lg text-xs font-semibold text-[#5C4533] hover:bg-[#F8F4EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'product') {
                    if (onDeleteProduct) onDeleteProduct(deleteConfirm.id);
                    showToast(`Deleted product "${deleteConfirm.name}".`);
                  } else {
                    if (onDeleteIngredient) onDeleteIngredient(deleteConfirm.id);
                    showToast(`Deleted ingredient "${deleteConfirm.name}".`);
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Permanent Cloud Image Storage Modal */}
      <StorageSetupModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
      />
    </div>
  );
};
