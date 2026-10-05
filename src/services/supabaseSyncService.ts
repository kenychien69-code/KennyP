import {
  CartItem,
  DailySalesRecord,
  Ingredient,
  Order,
  Product,
  User,
} from '../types';
import { getSupabaseClient, getStoredSupabaseConfig } from '../lib/supabase';

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
    message: 'Initializing Supabase sync engine...',
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

  // 1. Check connection status
  async checkConnection(): Promise<SupabaseSyncStatus> {
    try {
      const res = await fetch('/api/supabase/status');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      this.notify({
        connected: data.connected,
        configured: data.configured,
        tablesNeedCreation: data.tablesNeedCreation,
        message: data.message,
        url: data.url,
      });
      return this.currentStatus;
    } catch (err: any) {
      this.notify({
        connected: false,
        configured: false,
        message: 'Could not connect to backend server. Running in local mode.',
      });
      return this.currentStatus;
    }
  }

  // 2. Pull all remote data from Supabase
  async pullData(): Promise<{
    products: Product[];
    categories: any[];
    ingredients: Ingredient[];
    orders: Order[];
    users: User[];
    historicalSales: DailySalesRecord[];
  } | null> {
    try {
      const res = await fetch('/api/supabase/pull');
      if (!res.ok) return null;
      const data = await res.json();

      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      return data;
    } catch (err) {
      console.warn('Supabase pull skipped:', err);
      return null;
    }
  }

  // 3. Push complete initial catalog/state to Supabase
  async pushAll(payload: {
    categories?: any[];
    products?: Product[];
    ingredients?: Ingredient[];
    users?: User[];
    orders?: Order[];
    historicalSales?: DailySalesRecord[];
  }) {
    try {
      const res = await fetch('/api/supabase/push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        this.notify({
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }
      return await res.json();
    } catch (err) {
      console.warn('Failed to push all data to Supabase:', err);
      return null;
    }
  }

  // 4. Products: Automatic Upsert
  async syncProductUpsert(product: Product) {
    try {
      const res = await fetch('/api/supabase/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Auto-sync product failed:', err);
    }
  }

  // 5. Products: Automatic Delete
  async syncProductDelete(productId: string) {
    try {
      await fetch(`/api/supabase/product/${productId}`, {
        method: 'DELETE',
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync delete product failed:', err);
    }
  }

  // 6. Ingredients: Automatic Upsert (restock or edit)
  async syncIngredientUpsert(ingredient: Ingredient) {
    try {
      await fetch('/api/supabase/ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredient),
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync ingredient failed:', err);
    }
  }

  // 7. Ingredients: Automatic Delete
  async syncIngredientDelete(ingredientId: string) {
    try {
      await fetch(`/api/supabase/ingredient/${ingredientId}`, {
        method: 'DELETE',
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync delete ingredient failed:', err);
    }
  }

  // 8. Orders: Automatic Insert with items and depleted inventory
  async syncOrder(order: Order, updatedIngredients?: Ingredient[], todaySales?: DailySalesRecord) {
    try {
      await fetch('/api/supabase/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          updatedIngredients,
          todaySales,
        }),
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync order failed:', err);
    }
  }

  // 8.5 Inventory: Automatic Stock Movement & Adjustment Log
  async syncStockAdjustment(productId: number | string, quantityChange: number, transactionType: 'Restock' | 'Adjustment' | 'Waste' | 'Sale' = 'Restock') {
    try {
      await fetch('/api/supabase/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantityChange,
          transactionType,
        }),
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync inventory movement failed:', err);
    }
  }

  // 9. Users: Automatic Upsert
  async syncUserUpsert(user: User) {
    try {
      // 1. Send to Express backend API
      await fetch('/api/supabase/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});

      // 2. Direct client-side write to Supabase 'users' table (for Vercel serverless / static hosting)
      const directClient = getSupabaseClient();
      if (directClient) {
        const cleanUsername = (user.username || '').toLowerCase().trim();
        const cleanEmail = `${cleanUsername}@kennybrew.com`;
        const payload: any = {
          name: user.fullName,
          email: cleanEmail,
          role: user.role,
          password: user.password || 'kenny123',
        };
        await directClient.from('users').upsert(payload);
      }

      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync user failed:', err);
    }
  }

  // 10. Users: Automatic Delete
  async syncUserDelete(username: string) {
    try {
      // 1. Send to Express backend API
      await fetch(`/api/supabase/user/${username}`, {
        method: 'DELETE',
      }).catch(() => {});

      // 2. Direct client-side delete from Supabase 'users' table
      const { url, anonKey } = getStoredSupabaseConfig();
      if (url && anonKey) {
        const cleanUsername = username.toLowerCase().trim();
        const cleanEmail = `${cleanUsername}@kennybrew.com`;
        const baseUrl = url.replace(/\/$/, '');
        await fetch(`${baseUrl}/rest/v1/users?email=eq.${cleanEmail}`, {
          method: 'DELETE',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        }).catch(() => {});
      }

      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync delete user failed:', err);
    }
  }

  // 11. Sales Forecast: Automatic Storage
  async syncForecast(forecast: any) {
    try {
      await fetch('/api/supabase/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forecast),
      });
      this.notify({
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err) {
      console.warn('Auto-sync forecast failed:', err);
    }
  }

  async pullForecast(): Promise<any | null> {
    try {
      const res = await fetch('/api/supabase/forecast');
      if (!res.ok) return null;
      const data = await res.json();
      return data?.null ? null : data;
    } catch {
      return null;
    }
  }
}

export const supabaseSync = SupabaseSyncService.getInstance();
