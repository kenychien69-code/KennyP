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

const STORAGE_KEY_PRODUCTS = 'kenny_brew_products_v4';
const STORAGE_KEY_INGREDIENTS = 'kenny_brew_ingredients_v4';
const STORAGE_KEY_ORDERS = 'kenny_brew_orders_v4';
const STORAGE_KEY_HISTORICAL = 'kenny_brew_historical_v4';
const STORAGE_KEY_USER = 'kenny_brew_current_user_v4';
const STORAGE_KEY_USERS_LIST = 'kenny_brew_users_list_v4';
const STORAGE_KEY_DELETED_USERS = 'kenny_brew_deleted_users_v4';
const STORAGE_KEY_DELETED_PRODUCTS = 'kenny_brew_deleted_products_v4';
const STORAGE_KEY_DELETED_INGREDIENTS = 'kenny_brew_deleted_ingredients_v4';

function getLocalDeleted(key: string, initial: string[] = []): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const parsed: string[] = raw ? JSON.parse(raw) : initial;
    return new Set(parsed.map((s) => String(s).toLowerCase().trim()));
  } catch {
    return new Set(initial.map((s) => String(s).toLowerCase().trim()));
  }
}

function addLocalDeleted(key: string, ...items: (string | undefined)[]) {
  try {
    const current = getLocalDeleted(key);
    for (const item of items) {
      if (item) current.add(String(item).toLowerCase().trim());
    }
    localStorage.setItem(key, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Failed to save deleted keys:', e);
  }
}

function removeLocalDeleted(key: string, ...items: (string | undefined)[]) {
  try {
    const current = getLocalDeleted(key);
    for (const item of items) {
      if (item) current.delete(String(item).toLowerCase().trim());
    }
    localStorage.setItem(key, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Failed to remove deleted keys:', e);
  }
}

// Initial staff accounts for store roles (Owner acts as Administrator)
const INITIAL_STAFF_USERS: User[] = [
  {
    id: 'usr-owner',
    username: 'owner',
    role: 'owner',
    fullName: 'Keny Chien',
    roleTitle: 'Shop Owner',
    lastLogin: 'Today',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-manager',
    username: 'manager',
    role: 'manager',
    fullName: 'Maria Santos (Store Manager)',
    roleTitle: 'Store Manager',
    lastLogin: 'Today',
    createdAt: '2026-01-02',
  },
];

export default function App() {
  // Authentication State with session persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed: any = JSON.parse(saved);
        if (parsed.username === 'cashier' && (parsed.fullName === 'Alexander Rivera' || parsed.fullName === 'Cashier Staff')) {
          localStorage.removeItem(STORAGE_KEY_USER);
          return null;
        }
        if (parsed.role === 'owner') {
          parsed.fullName = 'Keny Chien';
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        }
        return parsed as User;
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
        const parsed: any[] = JSON.parse(saved);
        const deletedSet = getLocalDeleted(STORAGE_KEY_DELETED_USERS);
        let cleaned: User[] = parsed
          .filter((u) => {
            if (!u) return false;
            const un = String(u.username || '').toLowerCase().trim();
            if (deletedSet.has(un)) return false;
            return true;
          })
          .map((u) => {
            const role: UserRole = u.role === 'owner' ? 'owner' : u.role === 'manager' ? 'manager' : 'cashier';
            return {
              ...u,
              username: u.username || `user_${u.id || Date.now()}`,
              role,
              roleTitle: role === 'owner' ? 'Shop Owner' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
            };
          });

        // Ensure Shop Owner is always present
        const hasOwner = cleaned.some((u) => u.role === 'owner');
        if (!hasOwner) {
          cleaned.unshift(INITIAL_STAFF_USERS[0]);
        } else {
          cleaned = cleaned.map((u) => (u.role === 'owner' ? { ...u, fullName: 'Keny Chien' } : u));
        }

        // If no staff members exist at all besides owner, include default Store Manager
        const hasStaff = cleaned.some((u) => u.role !== 'owner');
        if (!hasStaff && !deletedSet.has('manager')) {
          cleaned.push(INITIAL_STAFF_USERS[1]);
        }
        return cleaned;
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
          const deletedUsernames = getLocalDeleted(STORAGE_KEY_DELETED_USERS);
          const deletedProducts = getLocalDeleted(STORAGE_KEY_DELETED_PRODUCTS);
          const deletedIngredients = getLocalDeleted(STORAGE_KEY_DELETED_INGREDIENTS);

          if (remote.products && remote.products.length > 0) {
            setProducts((prev) => {
              const activeRemote = remote.products.filter((p) => {
                if (!p) return false;
                const idMatch = deletedProducts.has(String(p.id || '').toLowerCase().trim());
                const nameMatch = deletedProducts.has(String(p.name || '').toLowerCase().trim());
                return !idMatch && !nameMatch;
              });

              const remoteSanitized = activeRemote.map((p) => {
                // Check if this product already has a user-set custom image locally
                const existingLocal = prev.find(
                  (lp) =>
                    String(lp?.id || '') === String(p.id || '') ||
                    String(lp?.name || '').trim().toLowerCase() === String(p.name || '').trim().toLowerCase()
                );

                // If remote product already has a Supabase Storage CDN URL, use it!
                const isSupabaseCdnUrl =
                  p.image &&
                  (p.image.includes('supabase.co/storage') || p.image.includes('/storage/v1/object/public/images/'));

                // If local has a valid custom image (uploaded photo, /uploads/, or custom url), preserve it!
                const hasCustomLocalImage =
                  existingLocal?.image &&
                  !existingLocal.image.includes('photo-1558857563-b37cf5a9c086') &&
                  (existingLocal.image.startsWith('/uploads/') ||
                    existingLocal.image.startsWith('data:image/') ||
                    existingLocal.image.startsWith('/product-') ||
                    existingLocal.image.includes('supabase.co/storage'));

                const finalImage = isSupabaseCdnUrl
                  ? p.image
                  : hasCustomLocalImage
                  ? existingLocal.image
                  : getProductImageUrl(p.name, p.categoryId, p.image);

                return {
                  ...p,
                  image: finalImage,
                };
              });

              const remoteNames = new Set(
                remoteSanitized.map((p) => String(p?.name || '').toLowerCase().trim()).filter(Boolean)
              );
              const unsynced = prev.filter((p) => {
                if (!p || !p.name) return false;
                const pName = String(p.name).toLowerCase().trim();
                const pId = String(p.id || '').toLowerCase().trim();
                return (
                  !remoteNames.has(pName) &&
                  !deletedProducts.has(pId) &&
                  !deletedProducts.has(pName)
                );
              });
              unsynced.forEach((p) => supabaseSync.syncProductUpsert(p));
              return [...remoteSanitized, ...unsynced];
            });
          }
          if (remote.ingredients && remote.ingredients.length > 0) {
            setIngredients((prev) => {
              const activeRemote = remote.ingredients.filter((i) => {
                if (!i) return false;
                const idMatch = deletedIngredients.has(String(i.id || '').toLowerCase().trim());
                const nameMatch = deletedIngredients.has(String(i.name || '').toLowerCase().trim());
                return !idMatch && !nameMatch;
              });

              const remoteNames = new Set(
                activeRemote.map((i) => String(i?.name || '').toLowerCase().trim()).filter(Boolean)
              );
              const unsynced = prev.filter((i) => {
                if (!i || !i.name) return false;
                const iName = String(i.name).toLowerCase().trim();
                const iId = String(i.id || '').toLowerCase().trim();
                return (
                  !remoteNames.has(iName) &&
                  !deletedIngredients.has(iId) &&
                  !deletedIngredients.has(iName)
                );
              });
              unsynced.forEach((i) => supabaseSync.syncIngredientUpsert(i));
              return [...activeRemote, ...unsynced];
            });
          }
          if (remote.orders && remote.orders.length > 0) {
            setOrders(remote.orders);
          }
          if (remote.users && remote.users.length > 0) {
            setUsersList((prev) => {
              const activeRemote = remote.users.filter((u) => {
                if (!u) return false;
                const un = String(u.username || '').toLowerCase().trim();
                return Boolean(un) && !deletedUsernames.has(un);
              });

              const remoteUsernames = new Set(
                activeRemote.map((u) => String(u?.username || '').toLowerCase().trim()).filter(Boolean)
              );
              const unsyncedLocal = prev.filter((u) => {
                if (!u) return false;
                const un = String(u.username || '').toLowerCase().trim();
                return Boolean(un) && !remoteUsernames.has(un) && !deletedUsernames.has(un);
              });

              // Push any unsynced local staff accounts to Supabase
              unsyncedLocal.forEach((u) => {
                if (u.role !== 'owner') {
                  supabaseSync.syncUserUpsert(u);
                }
              });

              const combined = [...activeRemote, ...unsyncedLocal];
              const hasOwner = combined.some((u) => u?.role === 'owner');
              if (!hasOwner) {
                combined.unshift(INITIAL_STAFF_USERS[0]);
              }
              const hasStaff = combined.some((u) => u?.role !== 'owner');
              if (!hasStaff && !deletedUsernames.has('manager')) {
                combined.push(INITIAL_STAFF_USERS[1]);
              }
              localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(combined));
              return combined;
            });
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
    const ownerTabs: NavTab[] = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast', 'users'];
    const cashierTabs: NavTab[] = ['pos'];

    const allowed = role === 'cashier' ? cashierTabs : ownerTabs;

    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  };

  // Completely wipe state and reset to clean empty state
  const handleClearAllData = () => {
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

  // Inventory update + Auto Supabase Sync
  const handleUpdateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) => {
      const next = prev.map((item) => {
        if (String(item.id) === String(id)) {
          const updated = {
            ...item,
            ...updates,
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
    const target = ingredients.find((item) => String(item.id) === String(id));
    addLocalDeleted(STORAGE_KEY_DELETED_INGREDIENTS, id, target?.name);
    setIngredients((prev) => prev.filter((item) => String(item.id) !== String(id)));
    // Automatically delete ingredient from Supabase
    supabaseSync.syncIngredientDelete(id);
  };

  // Product catalog management + Auto Supabase Sync
  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    // Automatically save new product in Supabase
    const res = await supabaseSync.syncProductUpsert(newProduct);
    if (res && res.data && res.data[0]) {
      const realId = String(res.data[0].product_id);
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(newProduct.id) ? { ...p, id: realId } : p))
      );
    }
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (String(p.id) === String(productId) ? { ...p, ...updates } : p));
      const target = next.find((p) => String(p.id) === String(productId));
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
        String(p.id) === String(productId) ? { ...p, isAvailable: !p.isAvailable } : p
      );
      const target = next.find((p) => String(p.id) === String(productId));
      if (target) {
        // Automatically save availability state in Supabase
        supabaseSync.syncProductUpsert(target);
      }
      return next;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => String(p.id) === String(productId));
    addLocalDeleted(STORAGE_KEY_DELETED_PRODUCTS, productId, target?.name);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    // Automatically delete product from Supabase
    supabaseSync.syncProductDelete(productId);
  };

  // Staff Accounts Management + Auto Supabase Sync
  const handleAddUser = (newUser: User) => {
    removeLocalDeleted(STORAGE_KEY_DELETED_USERS, newUser.username);
    setUsersList((prev) => {
      const next = prev.filter(
        (u) => (u?.username || '').toLowerCase() !== (newUser?.username || '').toLowerCase()
      );
      const updated = [...next, newUser];
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(updated));
      return updated;
    });
    // Automatically save user in Supabase
    supabaseSync.syncUserUpsert(newUser);
  };

  const handleUpdateUser = (username: string, updates: Partial<User>) => {
    const targetUn = (username || '').toLowerCase().trim();
    setUsersList((prev) => {
      const next = prev.map((u) =>
        (u?.username || '').toLowerCase().trim() === targetUn ? { ...u, ...updates } : u
      );
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(next));
      const target = next.find((u) => (u?.username || '').toLowerCase().trim() === targetUn);
      if (target) {
        // Automatically save updated user in Supabase
        supabaseSync.syncUserUpsert(target);
      }
      return next;
    });

    if (currentUser && (currentUser?.username || '').toLowerCase().trim() === targetUn) {
      const updatedCurrent = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrent);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedCurrent));
    }
  };

  const handleDeleteUser = (username: string) => {
    const targetUn = (username || '').toLowerCase().trim();
    addLocalDeleted(STORAGE_KEY_DELETED_USERS, targetUn);
    setUsersList((prev) => {
      const updated = prev.filter((u) => (u?.username || '').toLowerCase().trim() !== targetUn);
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(updated));
      return updated;
    });
    // Automatically delete user from Supabase
    supabaseSync.syncUserDelete(username);
  };

  const handleResetPassword = (_username: string) => {
    // Password reset is handled with in-app notice
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
        fullName: role === 'owner' ? 'Keny Chien' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
        roleTitle: role === 'owner' ? 'Shop Owner' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
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
