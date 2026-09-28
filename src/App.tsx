import React, { useState, useEffect } from 'react';
import {
  CartItem,
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
  INITIAL_ORDERS,
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
import { LoginView, SHARED_PASSWORD } from './components/LoginView';
import { supabaseSync } from './services/supabaseSyncService';
import { ReceiptModal } from './components/ReceiptModal';
import { getProductImageUrl } from './utils/productImages';

const STORAGE_KEY_PRODUCTS = 'kenny_brew_products_v3';
const STORAGE_KEY_INGREDIENTS = 'kenny_brew_ingredients_v3';
const STORAGE_KEY_ORDERS = 'kenny_brew_orders_v3';
const STORAGE_KEY_HISTORICAL = 'kenny_brew_historical_v3';
const STORAGE_KEY_USER = 'kenny_brew_current_user_v3';
const STORAGE_KEY_USERS_LIST = 'kenny_brew_users_list_v3';

// Initial staff accounts for store roles (Owner acts as Administrator)
const INITIAL_STAFF_USERS: User[] = [
  {
    id: 'usr-owner',
    username: 'owner',
    role: 'owner',
    fullName: 'Kenny Chien',
    roleTitle: 'Shop Owner & Administrator',
    status: 'Active',
    lastLogin: 'Today, 09:15 AM',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-manager',
    username: 'manager',
    role: 'manager',
    fullName: 'Store Operations Manager',
    roleTitle: 'Store Manager',
    status: 'Active',
    lastLogin: 'Today, 08:00 AM',
    createdAt: '2026-01-05',
  },
  {
    id: 'usr-cashier',
    username: 'cashier',
    role: 'cashier',
    fullName: 'Alexander Rivera',
    roleTitle: 'Cashier / Barista',
    status: 'Active',
    lastLogin: 'Today, 07:45 AM',
    createdAt: '2026-01-10',
  },
];

export default function App() {
  // Authentication State with session persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (parsed.username === 'cashier' && parsed.fullName === 'Cashier Staff') {
          parsed.fullName = 'Alexander Rivera';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Current View
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Product categories state
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  // Business Data State (zero fake orders and historical sales)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    const list: Product[] = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    return list.map((p) => ({
      ...p,
      image: getProductImageUrl(p.name, p.categoryId, p.image),
    }));
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INGREDIENTS);
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [historicalSales, setHistoricalSales] = useState<DailySalesRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORICAL);
    return saved ? JSON.parse(saved) : INITIAL_HISTORICAL_SALES;
  });

  // Staff accounts state for "Manage user accounts"
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS_LIST);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map((u) =>
          u.username === 'cashier' && u.fullName === 'Cashier Staff'
            ? { ...u, fullName: 'Alexander Rivera', roleTitle: 'Cashier / Barista' }
            : u
        );
      }
      return INITIAL_STAFF_USERS;
    } catch {
      return INITIAL_STAFF_USERS;
    }
  });

  // Dedicated receipt modal order for viewing anytime
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  // Forecast state
  const [forecast, setForecast] = useState<ForecastResult>(() => {
    return generateSalesForecast(INITIAL_HISTORICAL_SALES, INITIAL_PRODUCTS, INITIAL_INGREDIENTS);
  });
  const [isForecasting, setIsForecasting] = useState(false);

  // Automatic background Supabase persistence on initial boot
  useEffect(() => {
    supabaseSync.checkConnection().then(async (status) => {
      if (status.connected) {
        // Automatically push all products, users, ingredients, and categories to Supabase
        await supabaseSync.pushAll({
          categories: categories.length ? categories : INITIAL_CATEGORIES,
          products: products.length ? products : INITIAL_PRODUCTS,
          users: usersList.length ? usersList : INITIAL_STAFF_USERS,
          ingredients: ingredients.length ? ingredients : INITIAL_INGREDIENTS,
          orders: orders.length ? orders : [],
        });

        // Pull back synced data
        const remote = await supabaseSync.pullData();
        if (remote) {
          if (remote.categories && remote.categories.length > 0) {
            setCategories(remote.categories);
          }
          if (remote.products && remote.products.length > 0) {
            const sanitized = remote.products.map((p) => ({
              ...p,
              image: getProductImageUrl(p.name, p.categoryId, p.image),
            }));
            setProducts(sanitized);
          }
          if (remote.ingredients && remote.ingredients.length > 0) {
            setIngredients(remote.ingredients);
          }
          if (remote.orders && remote.orders.length > 0) {
            setOrders(remote.orders);
          }
          if (remote.users && remote.users.length > 0) {
            setUsersList(remote.users);
          }
          if (remote.historicalSales && remote.historicalSales.length > 0) {
            setHistoricalSales(remote.historicalSales);
          }
        }

        // Also automatically pull or push sales forecast
        const remoteForecast = await supabaseSync.pullForecast();
        if (remoteForecast) {
          setForecast(normalizeForecastResult(remoteForecast));
        } else if (forecast) {
          supabaseSync.syncForecast(forecast);
        }
      }
    });
  }, []);

  // Local storage persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(historicalSales));
  }, [historicalSales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(usersList));
  }, [usersList]);

  // Adjust active tab when role changes to ensure valid view
  const adjustTabForRole = (role: UserRole) => {
    const managerTabs: NavTab[] = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast'];
    const ownerTabs: NavTab[] = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast', 'users'];
    const cashierTabs: NavTab[] = ['pos'];

    const allowed =
      role === 'cashier'
        ? cashierTabs
        : role === 'manager'
        ? managerTabs
        : ownerTabs;

    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  };

  // Completely wipe state and reset to clean empty state
  const handleClearAllData = () => {
    if (
      !confirm(
        'Are you sure you want to completely clear all transaction history, sales records, and reset inventory stock? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.removeItem(STORAGE_KEY_HISTORICAL);
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem(STORAGE_KEY_INGREDIENTS);

      setOrders([]);
      setHistoricalSales([]);
      setProducts(INITIAL_PRODUCTS);
      setIngredients(INITIAL_INGREDIENTS);
      setForecast(generateSalesForecast([], INITIAL_PRODUCTS, INITIAL_INGREDIENTS));

      alert('All sales data has been cleared. System is now completely fresh.');
    } catch (err) {
      console.error('Failed to clear local storage:', err);
    }
  };

  // Recipe-based ingredient depletion upon POS sale completion + Auto Supabase Sync
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
      ordersCount: 1,
    };

    setHistoricalSales((prev) => {
      const existingTodayIndex = prev.findIndex((r) => r.date === todayStr);
      if (existingTodayIndex >= 0) {
        const updated = [...prev];
        todaySalesRecord = {
          ...updated[existingTodayIndex],
          total: updated[existingTodayIndex].total + completedOrder.totalAmount,
          ordersCount: updated[existingTodayIndex].ordersCount + 1,
        };
        updated[existingTodayIndex] = todaySalesRecord;
        return updated;
      } else {
        return [...prev, todaySalesRecord];
      }
    });

    // Automatically store order, line items, and updated stock in Supabase!
    supabaseSync.syncOrder(completedOrder, updatedIngredients, todaySalesRecord);
  };

  // Inventory restocking + Auto Supabase Sync
  const handleRestockIngredient = (id: string, addedAmount: number) => {
    setIngredients((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            currentStock: item.currentStock + addedAmount,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
          // Automatically save updated ingredient in Supabase
          supabaseSync.syncIngredientUpsert(updated);
          return updated;
        }
        return item;
      });
      return next;
    });
  };

  // Inventory additions + Auto Supabase Sync
  const handleAddIngredient = (newIngredient: Ingredient) => {
    setIngredients((prev) => [...prev, newIngredient]);
    // Automatically save new ingredient in Supabase
    supabaseSync.syncIngredientUpsert(newIngredient);
  };

  // Inventory deletion + Auto Supabase Sync
  const handleDeleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
    // Automatically delete ingredient from Supabase
    supabaseSync.syncIngredientDelete(id);
  };

  // Product catalog management + Auto Supabase Sync
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    // Automatically save new product in Supabase
    supabaseSync.syncProductUpsert(newProduct);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, ...updates } : p));
      const target = next.find((p) => p.id === productId);
      if (target) {
        // Automatically save updated product in Supabase
        supabaseSync.syncProductUpsert(target);
      }
      return next;
    });
  };

  const handleToggleProductAvailability = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
      );
      const target = next.find((p) => p.id === productId);
      if (target) {
        // Automatically save availability state in Supabase
        supabaseSync.syncProductUpsert(target);
      }
      return next;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    // Automatically delete product from Supabase
    supabaseSync.syncProductDelete(productId);
  };

  // Staff Accounts Management + Auto Supabase Sync
  const handleAddUser = (newUser: User) => {
    setUsersList((prev) => [...prev, newUser]);
    // Automatically save user in Supabase
    supabaseSync.syncUserUpsert(newUser);
  };

  const handleUpdateUser = (username: string, updates: Partial<User>) => {
    setUsersList((prev) => {
      const next = prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase() ? { ...u, ...updates } : u
      );
      const target = next.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (target) {
        // Automatically save updated user in Supabase
        supabaseSync.syncUserUpsert(target);
      }
      return next;
    });

    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      const updatedCurrent = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrent);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedCurrent));
    }
  };

  const handleDeleteUser = (username: string) => {
    setUsersList((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));
    // Automatically delete user from Supabase
    supabaseSync.syncUserDelete(username);
  };

  const handleResetPassword = (username: string) => {
    alert(`Password for @${username} has been reset to default: ${SHARED_PASSWORD}`);
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
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const raw = await response.json();
      const safe = normalizeForecastResult(raw, fallback);
      setForecast(safe);
      // Automatically store forecast in Supabase database table `sales_forecasts`
      supabaseSync.syncForecast(safe);
    } catch (err) {
      console.warn('Backend ML engine unreachable, running client forecasting model:', err);
      setForecast(fallback);
      // Automatically store fallback forecast in Supabase database table
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
        fullName:
          role === 'owner'
            ? 'Shop Owner & Administrator'
            : role === 'manager'
            ? 'Store Operations Manager'
            : 'Alexander Rivera',
      };
    }
    setCurrentUser(matchedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matchedUser));
    adjustTabForRole(role);
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    adjustTabForRole(user.role);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  };

  // Calculate low stock items count
  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.reorderLevel).length;

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
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
              onAddIngredient={handleAddIngredient}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onToggleProductAvailability={handleToggleProductAvailability}
              onDeleteProduct={handleDeleteProduct}
              onDeleteIngredient={handleDeleteIngredient}
            />
          )}

          {/* Staff Accounts & Permissions */}
          {activeTab === 'users' && (
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
