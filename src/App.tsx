import React, { useState, useEffect } from 'react';
import {
  DailySalesRecord,
  ForecastResult,
  Ingredient,
  Order,
  Product,
  User,
  UserRole,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_HISTORICAL_SALES,
  INITIAL_INGREDIENTS,
  INITIAL_PRODUCTS,
} from './data/initialData';
import { generateSalesForecast, normalizeForecastResult } from './utils/forecastEngine';
import { TopBar } from './components/TopBar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AIForecastView } from './components/AIForecastView';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { SalesReportsView } from './components/SalesReportsView';
import { UserAccountsView } from './components/UserAccountsView';
import { LowStockAlertsView } from './components/LowStockAlertsView';
import { LoginView } from './components/LoginView';
import { supabaseSync } from './services/supabaseSyncService';
import { ReceiptModal } from './components/ReceiptModal';
import { LatteArtLogo } from './components/LatteArtLogo';

const SESSION_KEY_USER = 'kenny_brew_session_user';

// Initial staff accounts fallback
const INITIAL_STAFF_USERS: User[] = [
  {
    id: 'usr-owner',
    username: 'owner',
    role: 'owner',
    fullName: 'Kenny Chien',
    roleTitle: 'Shop Owner',
    lastLogin: 'Today',
    createdAt: '2026-01-01',
    password: 'kenny123',
  },
];

export default function App() {
  // Clear any obsolete localStorage keys once on boot to prevent browser data conflicts
  useEffect(() => {
    try {
      [
        'kenny_brew_products_v4',
        'kenny_brew_ingredients_v4',
        'kenny_brew_orders_v4',
        'kenny_brew_historical_v4',
        'kenny_brew_users_list_v4',
        'kenny_brew_deleted_users_v4',
        'kenny_brew_deleted_products_v4',
        'kenny_brew_deleted_ingredients_v4',
        'kenny_brew_current_user_v4',
        'kenny_brew_supabase_url',
        'kenny_brew_supabase_anon',
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  // Authentication State with browser session persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY_USER);
      if (saved) {
        const parsed: any = JSON.parse(saved);
        if (parsed.fullName) {
          parsed.fullName = String(parsed.fullName).replace(/\s*\([^)]*\)/g, '').trim();
        }
        if (parsed.role === 'owner') {
          parsed.fullName = 'Kenny Chien';
        }
        return parsed as User;
      }
    } catch {}
    return null;
  });

  // Current View
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Business Data State (strictly from Supabase cloud database)
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [historicalSales, setHistoricalSales] = useState<DailySalesRecord[]>(INITIAL_HISTORICAL_SALES);
  const [usersList, setUsersList] = useState<User[]>(INITIAL_STAFF_USERS);

  // Initial loading state while connecting to Supabase
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Dedicated receipt modal order for viewing anytime
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  // Forecast state
  const [forecast, setForecast] = useState<ForecastResult>(() => {
    return generateSalesForecast(INITIAL_HISTORICAL_SALES, INITIAL_PRODUCTS, INITIAL_INGREDIENTS);
  });
  const [isForecasting, setIsForecasting] = useState(false);

  // Load live data directly from Supabase Cloud on boot
  useEffect(() => {
    let isMounted = true;

    async function loadFromSupabase() {
      setIsLoadingData(true);
      const timer = setTimeout(() => {
        if (isMounted) setIsLoadingData(false);
      }, 800);

      try {
        await supabaseSync.checkConnection();
        const remote = await supabaseSync.pullData();

        if (isMounted && remote) {
          if (remote.categories && remote.categories.length > 0) {
            setCategories(remote.categories);
          }
          if (remote.products && remote.products.length > 0) {
            setProducts(remote.products);
          }
          if (remote.ingredients && remote.ingredients.length > 0) {
            setIngredients(remote.ingredients);
          }
          if (remote.orders && remote.orders.length > 0) {
            setOrders(remote.orders);
          }
          if (remote.users && remote.users.length > 0) {
            setUsersList(remote.users);
            setCurrentUser((prev) => {
              if (!prev) return null;
              const matched = remote.users.find(
                (u) => (u.username || '').toLowerCase() === (prev.username || '').toLowerCase()
              );
              if (matched) {
                const cleanName = String(matched.fullName).replace(/\s*\([^)]*\)/g, '').trim();
                return { ...prev, ...matched, fullName: cleanName };
              }
              return { ...prev, fullName: String(prev.fullName).replace(/\s*\([^)]*\)/g, '').trim() };
            });
          }
          if (remote.historicalSales && remote.historicalSales.length > 0) {
            setHistoricalSales(remote.historicalSales);
          }

          // Calculate forecast with live Supabase data
          const liveForecast = generateSalesForecast(
            remote.historicalSales || [],
            remote.products || INITIAL_PRODUCTS,
            remote.ingredients || INITIAL_INGREDIENTS
          );
          setForecast(liveForecast);
        }
      } catch (err) {
        console.warn('Failed to load live data from Supabase:', err);
      } finally {
        clearTimeout(timer);
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Adjust active tab when role changes to ensure valid view
  const adjustTabForRole = (role: UserRole) => {
    const ownerTabs: NavTab[] = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast', 'users'];
    const managerTabs: NavTab[] = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast'];
    const cashierTabs: NavTab[] = ['pos'];

    const allowed = role === 'cashier' ? cashierTabs : role === 'manager' ? managerTabs : ownerTabs;

    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  };

  // Reset in-memory preview data without touching external storage
  const handleClearAllData = () => {
    setOrders([]);
    setHistoricalSales([]);
    setProducts(INITIAL_PRODUCTS);
    setIngredients(INITIAL_INGREDIENTS);
    setForecast(generateSalesForecast([], INITIAL_PRODUCTS, INITIAL_INGREDIENTS));
  };

  // Recipe-based ingredient depletion upon POS sale completion + Direct Supabase Insert
  const handleCompleteOrder = (completedOrder: Order) => {
    setOrders((prev) => [completedOrder, ...prev]);

    const updatedIngredients = [...ingredients];
    completedOrder.items.forEach((item) => {
      item.product.recipe.forEach((req) => {
        const ingIndex = updatedIngredients.findIndex((i) => i.id === req.ingredientId);
        if (ingIndex !== -1) {
          const totalDeduction = req.amount * item.quantity;
          const currentStock = updatedIngredients[ingIndex].currentStock;
          updatedIngredients[ingIndex] = {
            ...updatedIngredients[ingIndex],
            currentStock: Math.max(0, currentStock - totalDeduction),
          };
        }
      });
    });
    setIngredients(updatedIngredients);

    // Update today's sales aggregate record
    const todayStr = completedOrder.createdAt.split('T')[0];
    let todaySalesRecord: DailySalesRecord = {
      date: todayStr,
      total: completedOrder.totalAmount,
      totalSales: completedOrder.totalAmount,
      ordersCount: 1,
      averageTicket: completedOrder.totalAmount,
    };

    setHistoricalSales((prev) => {
      const existingTodayIndex = prev.findIndex((r) => r.date === todayStr);
      if (existingTodayIndex >= 0) {
        const updated = [...prev];
        const prevTotal = updated[existingTodayIndex].total || updated[existingTodayIndex].totalSales || 0;
        const newTotal = prevTotal + completedOrder.totalAmount;
        const newCount = updated[existingTodayIndex].ordersCount + 1;
        todaySalesRecord = {
          ...updated[existingTodayIndex],
          total: newTotal,
          totalSales: newTotal,
          ordersCount: newCount,
          averageTicket: Math.round(newTotal / newCount),
        };
        updated[existingTodayIndex] = todaySalesRecord;
        return updated;
      } else {
        return [...prev, todaySalesRecord];
      }
    });

    // Automatically store order, line items, and stock movement in Supabase
    supabaseSync.syncOrder(completedOrder, updatedIngredients, todaySalesRecord);
  };

  // Inventory restocking
  const handleRestockIngredient = (id: string, addedAmount: number) => {
    setIngredients((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            currentStock: item.currentStock + addedAmount,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
          supabaseSync.syncIngredientUpsert(updated);
          return updated;
        }
        return item;
      });
      return next;
    });
  };

  // Inventory update
  const handleUpdateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) => {
      const next = prev.map((item) => {
        if (String(item.id) === String(id)) {
          const updated = {
            ...item,
            ...updates,
          };
          supabaseSync.syncIngredientUpsert(updated);
          return updated;
        }
        return item;
      });
      return next;
    });
  };

  // Inventory additions
  const handleAddIngredient = (newIngredient: Ingredient) => {
    setIngredients((prev) => [...prev, newIngredient]);
    supabaseSync.syncIngredientUpsert(newIngredient);
  };

  // Inventory deletion
  const handleDeleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => String(item.id) !== String(id)));
    supabaseSync.syncIngredientDelete(id);
  };

  // Product catalog management with direct Supabase mutations
  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    const saved = await supabaseSync.syncProductUpsert(newProduct);
    if (saved && saved.product_id) {
      const realId = String(saved.product_id);
      setProducts((prev) =>
        prev.map((p) => (p.name === newProduct.name ? { ...p, id: realId } : p))
      );
    }
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (String(p.id) === String(productId) ? { ...p, ...updates } : p));
      const target = next.find((p) => String(p.id) === String(productId));
      if (target) {
        supabaseSync.syncProductUpsert(target);
      }
      return next;
    });
  };

  const handleToggleProductAvailability = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        String(p.id) === String(productId) ? { ...p, isAvailable: !p.isAvailable } : p
      );
      const target = next.find((p) => String(p.id) === String(productId));
      if (target) {
        supabaseSync.syncProductUpsert(target);
      }
      return next;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    supabaseSync.syncProductDelete(productId);
  };

  // Staff Accounts Management with direct Supabase mutations
  const handleAddUser = async (newUser: User) => {
    setUsersList((prev) => {
      const next = prev.filter(
        (u) => (u?.username || '').toLowerCase() !== (newUser?.username || '').toLowerCase()
      );
      return [...next, newUser];
    });
    const saved = await supabaseSync.syncUserUpsert(newUser);
    if (saved && saved.user_id) {
      setUsersList((prev) =>
        prev.map((u) =>
          (u?.username || '').toLowerCase() === (newUser?.username || '').toLowerCase()
            ? { ...u, id: `usr-${saved.user_id}` }
            : u
        )
      );
    }
  };

  const handleUpdateUser = (username: string, updates: Partial<User>) => {
    const targetUn = (username || '').toLowerCase().trim();
    setUsersList((prev) => {
      const next = prev.map((u) =>
        (u?.username || '').toLowerCase().trim() === targetUn ? { ...u, ...updates } : u
      );
      const target = next.find((u) => (u?.username || '').toLowerCase().trim() === targetUn);
      if (target) {
        supabaseSync.syncUserUpsert(target);
      }
      return next;
    });

    if (currentUser && (currentUser?.username || '').toLowerCase().trim() === targetUn) {
      const updatedCurrent = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrent);
      try {
        sessionStorage.setItem(SESSION_KEY_USER, JSON.stringify(updatedCurrent));
      } catch {}
    }
  };

  const handleDeleteUser = (username: string) => {
    const targetUn = (username || '').toLowerCase().trim();
    setUsersList((prev) => prev.filter((u) => (u?.username || '').toLowerCase().trim() !== targetUn));
    supabaseSync.syncUserDelete(username);
  };

  const handleResetPassword = (_username: string) => {
    // Password reset is handled in Supabase
  };

  // AI Forecasting Trigger
  const handleRunForecast = async () => {
    setIsForecasting(true);
    const fallback = generateSalesForecast(historicalSales, products, ingredients);

    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historical_sales: historicalSales,
          products: products,
          ingredients: ingredients,
        }),
      }).catch(() => null);

      if (response && response.ok) {
        const raw = await response.json();
        const safe = normalizeForecastResult(raw, fallback);
        setForecast(safe);
        supabaseSync.syncForecast(safe);
      } else {
        setForecast(fallback);
        supabaseSync.syncForecast(fallback);
      }
    } catch {
      setForecast(fallback);
      supabaseSync.syncForecast(fallback);
    } finally {
      setIsForecasting(false);
    }
  };

  // Role switching
  const handleRoleChange = (role: UserRole) => {
    let matchedUser = usersList.find((u) => u.role === role);
    if (!matchedUser) {
      matchedUser = {
        id: `usr-${role}`,
        username: role,
        role: role,
        fullName: role === 'owner' ? 'Keny Chien' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
        roleTitle: role === 'owner' ? 'Shop Owner' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
      };
    }
    setCurrentUser(matchedUser);
    try {
      sessionStorage.setItem(SESSION_KEY_USER, JSON.stringify(matchedUser));
    } catch {}
    adjustTabForRole(role);
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem(SESSION_KEY_USER, JSON.stringify(user));
    } catch {}
    adjustTabForRole(user.role);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY_USER);
    } catch {}
    setCurrentUser(null);
  };

  // Calculate low stock items count
  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.reorderLevel).length;

  // Branded initial loading screen while fetching live data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#2A1810] flex flex-col items-center justify-center p-6 text-[#F5EDE6] select-none">
        <div className="relative mb-6">
          <LatteArtLogo className="w-16 h-16 animate-pulse" />
          <div className="absolute -inset-2 bg-amber-500/10 blur-xl rounded-full" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#FAF6F2]">
          KENNY Brew Intelligence
        </h1>
        <div className="w-36 h-1 bg-[#3E2417] rounded-full overflow-hidden mt-5">
          <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} usersList={usersList} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans antialiased text-[#2A1810]">
      {/* Top Header */}
      <TopBar
        currentUser={currentUser}
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
        onClearAllData={handleClearAllData}
      />

      {/* Main Layout: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          lowStockCount={lowStockCount}
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto bg-[#FCFAF8] p-4 lg:p-6">
          {/* Executive Overview Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              historicalSales={historicalSales}
              orders={orders}
              products={products}
              ingredients={ingredients}
              onNavigateToForecast={() => setActiveTab('forecast')}
              onNavigateToPOS={() => setActiveTab('pos')}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {/* AI Sales & Demand Forecasting */}
          {activeTab === 'forecast' && (
            <AIForecastView
              forecast={forecast}
              historicalSales={historicalSales}
              products={products}
              ingredients={ingredients}
              onRunForecast={handleRunForecast}
              isForecasting={isForecasting}
            />
          )}

          {/* POS Cashier Register */}
          {activeTab === 'pos' && (
            <POSView
              products={products}
              categories={categories}
              ingredients={ingredients}
              currentUser={currentUser}
              onCompleteOrder={handleCompleteOrder}
            />
          )}

          {/* Products Catalog & Raw Inventory */}
          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              ingredients={ingredients}
              onRestockIngredient={handleRestockIngredient}
              onUpdateIngredient={handleUpdateIngredient}
              onAddIngredient={handleAddIngredient}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onToggleProductAvailability={handleToggleProductAvailability}
              onDeleteProduct={handleDeleteProduct}
              onDeleteIngredient={handleDeleteIngredient}
            />
          )}

          {/* Staff Accounts & Permissions - Shop Owner Only */}
          {activeTab === 'users' && currentUser?.role === 'owner' && (
            <UserAccountsView
              currentUser={currentUser}
              users={usersList}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
            />
          )}

          {/* Financial Sales Reports */}
          {activeTab === 'reports' && (
            <SalesReportsView
              orders={orders}
              onViewReceipt={(ord) => {
                setViewingReceiptOrder(ord);
              }}
            />
          )}

          {/* Real-Time Low Stock Alerts */}
          {activeTab === 'alerts' && (
            <LowStockAlertsView
              ingredients={ingredients}
              onRestockIngredient={handleRestockIngredient}
              onNavigateToForecast={() => setActiveTab('forecast')}
            />
          )}
        </main>
      </div>

      {/* Historical Sales Report Digital Receipt Modal */}
      <ReceiptModal
        order={viewingReceiptOrder}
        isOpen={Boolean(viewingReceiptOrder)}
        onClose={() => setViewingReceiptOrder(null)}
      />
    </div>
  );
}
