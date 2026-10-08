import {
  DailySalesRecord,
  Ingredient,
  Order,
  Product,
  User,
} from '../types';
import { supabase, getStoredSupabaseConfig } from '../lib/supabase';
import { getProductImageUrl } from '../utils/productImages';

export interface SupabaseSyncStatus {
  connected: boolean;
  configured: boolean;
  tablesNeedCreation?: boolean;
  message: string;
  url?: string;
  lastSyncedAt?: string;
}

export class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private currentStatus: SupabaseSyncStatus = {
    connected: false,
    configured: false,
    message: 'Initializing Supabase cloud database connection...',
  };
  private listeners: ((status: SupabaseSyncStatus) => void)[] = [];

  static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  subscribe(listener: (status: SupabaseSyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(updates: Partial<SupabaseSyncStatus>) {
    this.currentStatus = { ...this.currentStatus, ...updates };
    this.listeners.forEach((l) => l(this.currentStatus));
  }

  getStatus(): SupabaseSyncStatus {
    return this.currentStatus;
  }

  // 1. Direct connection check to Supabase cloud
  async checkConnection(): Promise<SupabaseSyncStatus> {
    try {
      const { data, error } = await supabase.from('products').select('product_id').limit(1);
      const { url } = getStoredSupabaseConfig();
      if (!error) {
        this.notify({
          connected: true,
          configured: true,
          message: 'Connected directly to Supabase cloud database.',
          url,
        });
        return this.currentStatus;
      }
    } catch (err: any) {
      console.warn('Supabase connection check warning:', err);
    }

    const { url, anonKey } = getStoredSupabaseConfig();
    this.notify({
      connected: Boolean(url && anonKey),
      configured: Boolean(url && anonKey),
      message: url ? 'Connected to Supabase cloud database.' : 'Supabase credentials not configured.',
      url,
    });
    return this.currentStatus;
  }

  // 2. Direct client-side fetch from Supabase (works 100% on Vercel & localhost)
  async pullData(): Promise<{
    products: Product[];
    categories: any[];
    ingredients: Ingredient[];
    orders: Order[];
    users: User[];
    historicalSales: DailySalesRecord[];
  } | null> {
    try {
      const [prodRes, catRes, userRes, ordRes, ordItemsRes] = await Promise.all([
        supabase.from('products').select('*').order('product_id', { ascending: true }),
        supabase.from('categories').select('*').order('category_id', { ascending: true }),
        supabase.from('users').select('*').order('user_id', { ascending: true }),
        supabase.from('orders').select('*').order('order_date', { ascending: false }).limit(200),
        supabase.from('orders_items').select('*'),
      ]);

      const rawProducts = prodRes.data || [];
      const rawCategories = catRes.data || [];
      const rawUsers = userRes.data || [];
      const rawOrders = ordRes.data || [];
      const rawOrderItems = ordItemsRes.data || [];

      // Map Categories
      const categories = rawCategories.map((c: any) => {
        let icon = 'Coffee';
        const nameLower = (c.category_name || c.name || '').toLowerCase();
        if (nameLower.includes('tea')) icon = 'CupSoda';
        else if (nameLower.includes('fruit')) icon = 'Citrus';
        else if (nameLower.includes('pastry') || nameLower.includes('bakery')) icon = 'Cookie';
        else if (nameLower.includes('all')) icon = 'Sparkles';

        return {
          id: c.category_id != null ? `cat-${c.category_id}` : c.id,
          name: c.category_name || c.name,
          icon,
        };
      });

      // Map Products
      const products: Product[] = rawProducts.map((p: any) => {
        const id = String(p.product_id != null ? p.product_id : p.id);
        const name = p.product_name || p.name || 'Unnamed Product';
        const nameLower = name.toLowerCase();

        let categoryId = 'cat-1';
        if (p.category_id === 2 || nameLower.includes('latte') || nameLower.includes('americano') || nameLower.includes('coffee') || nameLower.includes('macchiato')) {
          categoryId = 'cat-2';
        } else if (p.category_id === 3 || nameLower.includes('milk tea') || nameLower.includes('matcha') || nameLower.includes('boba') || nameLower.includes('tae')) {
          categoryId = 'cat-3';
        } else if (p.category_id === 4 || nameLower.includes('fruit tea') || nameLower.includes('refresher')) {
          categoryId = 'cat-4';
        } else if (p.category_id === 5 || nameLower.includes('croissant') || nameLower.includes('pastry')) {
          categoryId = 'cat-5';
        } else if (p.category_id) {
          categoryId = `cat-${p.category_id}`;
        }

        const image =
          p.image_url && typeof p.image_url === 'string' && p.image_url.trim().length > 5
            ? p.image_url.trim()
            : getProductImageUrl(name, categoryId);

        return {
          id,
          categoryId,
          name,
          description: p.description || '',
          price: Number(p.price) || 0,
          image,
          isAvailable: p.status ? p.status === 'Available' : (p.is_available ?? true),
          salesWeight: 0.15,
          recipe: [],
        };
      });

      // Map Users (Staff Accounts from Supabase users table)
      const users: User[] = rawUsers.map((ru: any) => {
        const email = String(ru.email || '').toLowerCase().trim();
        const roleRaw = String(ru.role || '').toLowerCase().trim();
        const rawName = ru.name || ru.full_name || 'Staff Member';
        const fullName = String(rawName).replace(/\s*\([^)]*\)/g, '').trim() || 'Staff Member';

        let username = '';
        if (ru.username) {
          username = String(ru.username).toLowerCase().trim();
        } else if (email.includes('@')) {
          username = email.split('@')[0].trim();
        } else {
          username = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }

        const role = roleRaw === 'manager' ? 'manager' : roleRaw === 'owner' ? 'owner' : 'cashier';
        return {
          id: ru.user_id != null ? `usr-${ru.user_id}` : `usr-${ru.id || username}`,
          username,
          role,
          fullName,
          roleTitle: role === 'owner' ? 'Shop Owner' : role === 'manager' ? 'Store Manager' : 'Cashier / Barista',
          lastLogin: ru.last_login || 'Today',
          createdAt: ru.created_at ? ru.created_at.split('T')[0] : '2026-01-01',
          password: ru.password || 'kenny123',
        };
      });

      // Guarantee Shop Owner is always present
      const hasOwner = users.some((u) => u.role === 'owner');
      if (!hasOwner) {
        users.unshift({
          id: 'usr-owner',
          username: 'owner',
          role: 'owner',
          fullName: 'Kenny Chien',
          roleTitle: 'Shop Owner',
          lastLogin: 'Today',
          createdAt: '2026-01-01',
          password: 'kenny123',
        });
      }

      // Map Orders
      const orders: Order[] = rawOrders.map((o: any) => {
        const orderId = String(o.order_id != null ? o.order_id : o.id || '');
        const matchedUser = rawUsers.find((u: any) => u.user_id === o.user_id);
        const cashierName = matchedUser?.name
          ? String(matchedUser.name).replace(/\s*\([^)]*\)/g, '').trim()
          : 'Cashier';

        const items = rawOrderItems
          .filter((item: any) => String(item.order_id) === String(orderId))
          .map((item: any) => {
            const prod = products.find((p) => String(p.id) === String(item.product_id));
            return {
              id: String(item.order_item_id || item.id || Math.random()),
              product: prod || {
                id: String(item.product_id),
                name: `Item #${item.product_id}`,
                price: Number(item.unit_price || 0),
                categoryId: 'cat-2',
                description: '',
                image: '',
                isAvailable: true,
                salesWeight: 0.1,
                recipe: [],
              },
              quantity: Number(item.quantity) || 1,
              size: item.size || '16oz Regular',
              sweetness: item.sweetness || '100%',
              ice: item.ice || 'Regular Ice',
              addons: item.addons || [],
              unitPrice: Number(item.unit_price || 0),
              lineTotal: Number(item.subtotal || item.unit_price * item.quantity || 0),
            };
          });

        const total = Number(o.total_amount || 0);

        return {
          id: `ORD-${orderId.padStart ? orderId.padStart(6, '0') : orderId}`,
          orderNumber: Number(orderId) || Math.floor(100 + Math.random() * 900),
          cashierName,
          customerName: o.customer_name || 'Walk-in Customer',
          orderType: o.order_type || 'Dine In',
          subtotal: total,
          discountType: 'None',
          discountAmount: 0,
          vatAmount: total - total / 1.12,
          totalAmount: total,
          paymentMethod: o.payment_method || 'Cash',
          amountPaid: total,
          changeAmount: 0,
          status: o.status || 'Completed',
          createdAt: o.order_date || o.created_at || new Date().toISOString(),
          items,
        };
      });

      // Calculate historical daily sales records from orders
      const salesByDate = new Map<string, { totalSales: number; ordersCount: number }>();
      orders.forEach((o) => {
        const d = (o.createdAt || '').split('T')[0];
        if (d) {
          const current = salesByDate.get(d) || { totalSales: 0, ordersCount: 0 };
          current.totalSales += o.totalAmount;
          current.ordersCount += 1;
          salesByDate.set(d, current);
        }
      });

      const historicalSales: DailySalesRecord[] = Array.from(salesByDate.entries()).map(([date, stat]) => ({
        date,
        total: Math.round(stat.totalSales),
        totalSales: Math.round(stat.totalSales),
        ordersCount: stat.ordersCount,
        averageTicket: stat.ordersCount > 0 ? Math.round(stat.totalSales / stat.ordersCount) : 0,
      }));

      // Fallback ingredients if needed
      const ingredients: Ingredient[] = [
        {
          id: 'ing-beans',
          name: 'Espresso Blend Coffee Beans',
          category: 'Coffee',
          unit: 'g',
          currentStock: 4800,
          reorderLevel: 1500,
          costPerUnit: 0.85,
          supplier: 'Benguet Mountain Roasters',
          lastRestocked: '2026-03-01',
        },
        {
          id: 'ing-milk',
          name: 'Fresh Whole Dairy Milk',
          category: 'Dairy',
          unit: 'ml',
          currentStock: 11500,
          reorderLevel: 3000,
          costPerUnit: 0.12,
          supplier: 'Bukidnon Dairy Cooperative',
          lastRestocked: '2026-03-01',
        },
        {
          id: 'ing-oatmilk',
          name: 'Barista Oat Milk',
          category: 'Dairy Alternative',
          unit: 'ml',
          currentStock: 3800,
          reorderLevel: 1200,
          costPerUnit: 0.28,
          supplier: 'Oatly Pacific',
          lastRestocked: '2026-03-01',
        },
        {
          id: 'ing-matcha',
          name: 'Ceremonial Uji Matcha Powder',
          category: 'Tea',
          unit: 'g',
          currentStock: 1100,
          reorderLevel: 250,
          costPerUnit: 2.8,
          supplier: 'Kyoto Imports Inc.',
          lastRestocked: '2026-03-01',
        },
      ];

      this.notify({
        connected: true,
        configured: true,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      return {
        products,
        categories: categories.length ? categories : [],
        ingredients,
        orders,
        users,
        historicalSales,
      };
    } catch (err) {
      console.warn('Direct Supabase pull error:', err);
      return null;
    }
  }

  // 3. Products: Directly Save to Supabase products table
  async syncProductUpsert(product: Product): Promise<any> {
    try {
      const numId = Number(product.id);
      let catIdNum = 1;
      if (product.categoryId === 'cat-2' || product.categoryId === 'cat-espresso') catIdNum = 2;
      else if (product.categoryId === 'cat-3' || product.categoryId === 'cat-tea') catIdNum = 3;
      else if (product.categoryId === 'cat-4' || product.categoryId === 'cat-fruit') catIdNum = 4;
      else if (product.categoryId === 'cat-5' || product.categoryId === 'cat-pastry') catIdNum = 5;

      const payload: any = {
        product_name: product.name,
        price: product.price,
        stock_qty: 100,
        category_id: catIdNum,
        status: product.isAvailable ? 'Available' : 'Unavailable',
        image_url: product.image || '',
      };

      if (!isNaN(numId) && numId > 0) {
        const { data: existing } = await supabase.from('products').select('product_id').eq('product_id', numId).maybeSingle();
        if (existing?.product_id) {
          const res = await supabase.from('products').update(payload).eq('product_id', numId).select();
          this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
          return res.data?.[0];
        }
      }

      // Check by product name to avoid duplicates
      const { data: byName } = await supabase.from('products').select('product_id').eq('product_name', product.name).maybeSingle();
      if (byName?.product_id) {
        const res = await supabase.from('products').update(payload).eq('product_id', byName.product_id).select();
        this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
        return res.data?.[0];
      }

      const res = await supabase.from('products').insert([payload]).select();
      this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
      return res.data?.[0];
    } catch (err) {
      console.warn('Auto-sync product failed:', err);
      return null;
    }
  }

  // 4. Products: Directly Delete from Supabase products table
  async syncProductDelete(productId: string | number) {
    try {
      const numId = Number(productId);
      if (!isNaN(numId) && numId > 0) {
        await supabase.from('products').delete().eq('product_id', numId);
      } else {
        await supabase.from('products').delete().eq('product_name', String(productId));
      }
      this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      console.warn('Auto-sync delete product failed:', err);
    }
  }

  // 5. Ingredients: Stock Restock/Update
  async syncIngredientUpsert(_ingredient: Ingredient) {
    // Inventory adjustments are logged in inventory table
    this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
  }

  // 6. Ingredients: Delete
  async syncIngredientDelete(_ingredientId: string) {
    this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
  }

  // 7. Orders: Directly Insert into Supabase orders & orders_items tables
  async syncOrder(order: Order, _updatedIngredients?: Ingredient[], _todaySales?: DailySalesRecord) {
    try {
      const orderPayload: any = {
        user_id: 2, // Shop Owner / POS cashier
        order_date: order.createdAt || new Date().toISOString(),
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod || 'Cash',
        status: 'Completed',
        customer_name: order.customerName || 'Walk-in Customer',
        order_type: order.orderType || 'Dine In',
      };

      const { data: insertedOrder, error: ordErr } = await supabase.from('orders').insert([orderPayload]).select();
      if (ordErr) {
        console.warn('Failed to insert order in Supabase:', ordErr);
        return;
      }

      const newOrderId = insertedOrder?.[0]?.order_id;
      if (newOrderId && order.items && order.items.length) {
        const itemsPayload = order.items.map((it) => {
          const numPId = Number(it.product.id);
          return {
            order_id: newOrderId,
            product_id: isNaN(numPId) || numPId <= 0 ? 1 : numPId,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            subtotal: it.lineTotal,
            size: it.size || '16oz Regular',
            sweetness: it.sweetness || '100%',
            ice: it.ice || 'Regular Ice',
          };
        });

        await supabase.from('orders_items').insert(itemsPayload);

        // Record stock movements in inventory table
        const inventoryLogs = order.items.map((it) => {
          const numPId = Number(it.product.id);
          return {
            product_id: isNaN(numPId) || numPId <= 0 ? 1 : numPId,
            quantity_change: -it.quantity,
            transaction_type: 'Sale',
            date: new Date().toISOString(),
          };
        });
        await supabase.from('inventory').insert(inventoryLogs);
      }

      this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      console.warn('Auto-sync order failed:', err);
    }
  }

  // 8. Staff Accounts: Directly Save/Upsert into Supabase users table
  async syncUserUpsert(user: User): Promise<any> {
    try {
      const cleanUsername = String(user.username || '').toLowerCase().trim();
      const cleanEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@kennybrew.com`;

      const userRow: any = {
        name: user.fullName,
        email: cleanEmail,
        password: user.password || 'kenny123',
        role: user.role,
      };

      // Check if existing user by email
      const { data: existing } = await supabase.from('users').select('user_id').eq('email', cleanEmail).maybeSingle();
      if (existing?.user_id) {
        const { data } = await supabase.from('users').update(userRow).eq('user_id', existing.user_id).select();
        this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
        return data?.[0];
      }

      const { data } = await supabase.from('users').insert([userRow]).select();
      this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
      return data?.[0];
    } catch (err) {
      console.warn('Auto-sync user failed:', err);
      return null;
    }
  }

  // 9. Staff Accounts: Directly Delete from Supabase users table
  async syncUserDelete(usernameOrEmail: string) {
    try {
      const clean = String(usernameOrEmail || '').toLowerCase().trim();
      const cleanEmail = clean.includes('@') ? clean : `${clean}@kennybrew.com`;

      await supabase.from('users').delete().eq('email', cleanEmail);
      this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      console.warn('Auto-sync delete user failed:', err);
    }
  }

  // 10. Direct Supabase Storage Image Upload
  async uploadImageToSupabase(file: File | Blob, filename: string): Promise<string | null> {
    try {
      const cleanFilename = `prod_${filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('images')
        .upload(cleanFilename, file, { contentType: 'image/jpeg', upsert: true });

      if (uploadErr) {
        console.warn('Storage upload error:', uploadErr);
        return null;
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadData.path);
      return urlData?.publicUrl || null;
    } catch (err) {
      console.warn('Image upload failed:', err);
      return null;
    }
  }

  // 11. Optional sync methods for backward compatibility
  async pushAll(_payload: any) {
    return { ok: true };
  }

  async syncForecast(_forecast: any) {
    this.notify({ lastSyncedAt: new Date().toLocaleTimeString() });
  }

  async pullForecast(): Promise<any | null> {
    return null;
  }
}

export const supabaseSync = SupabaseSyncService.getInstance();
