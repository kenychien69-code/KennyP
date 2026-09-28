import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getProductImageUrl } from '../utils/productImages';

// Read credentials from standard, Next.js, or Vite environment variables
function getSupabaseCredentials() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  return { url: url.trim(), key: key.trim() };
}

let cachedClient: SupabaseClient | null = null;
let lastKnownConfig = { url: '', key: '' };

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastKnownConfig.url === url && lastKnownConfig.key === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    lastKnownConfig = { url, key };
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseStatus() {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase secrets are not set. Operating in local storage mode.',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      configured: true,
      message: 'Failed to initialize Supabase client with provided URL & Key.',
    };
  }

  try {
    // Ping live database by checking categories table
    const { data, error } = await client.from('categories').select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: true,
          configured: true,
          tablesNeedCreation: true,
          message: 'Connected to Supabase! Tables need to be created. Please run the SQL schema.',
          url: url.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co',
        };
      }
      return {
        connected: false,
        configured: true,
        message: `Supabase error: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      connected: true,
      configured: true,
      tablesNeedCreation: false,
      message: 'Connected to Supabase PostgreSQL database! Live automatic syncing is active.',
      url: url.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co',
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Connection check failed: ${err.message || String(err)}`,
    };
  }
}

// ----------------------------------------------------------------------------
// Database Operations (Products, Categories, Users, Orders, Orders Items)
// ----------------------------------------------------------------------------

export async function pullAllFromSupabase() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const [
    productsRes,
    categoriesRes,
    ordersRes,
    orderItemsRes,
    usersRes,
    ingredientsRes,
  ] = await Promise.allSettled([
    client.from('products').select('*').order('product_id', { ascending: true }),
    client.from('categories').select('*').order('category_id', { ascending: true }),
    client.from('orders').select('*').order('order_date', { ascending: false }),
    client.from('orders_items').select('*'),
    client.from('users').select('*').order('user_id', { ascending: true }),
    client.from('ingredients').select('*'),
  ]);

  const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value.data || [] : [];
  const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data || [] : [];
  const rawOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.data || [] : [];
  const rawOrderItems = orderItemsRes.status === 'fulfilled' ? orderItemsRes.value.data || [] : [];
  const rawUsers = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : [];
  const rawIngredients = ingredientsRes.status === 'fulfilled' ? ingredientsRes.value.data || [] : [];

  // Map Categories to frontend
  const categories = rawCategories.map((c: any) => ({
    id: c.category_id ? `cat-${c.category_id}` : c.id,
    name: c.category_name || c.name,
    icon: 'Coffee',
  }));

  // Map Products to frontend
  const products = rawProducts.map((p: any) => {
    const id = p.product_id != null ? String(p.product_id) : p.id;
    const catId = p.category_id != null ? `cat-${p.category_id}` : p.categoryId;
    const name = p.product_name || p.name;
    const image = getProductImageUrl(name, catId, p.image_url || p.image);
    return {
      id,
      categoryId: catId,
      name,
      description: p.description || '',
      price: Number(p.price),
      image,
      isAvailable: p.status ? p.status === 'Available' : (p.is_available ?? true),
      salesWeight: 0.15,
      recipe: Array.isArray(p.recipe) ? p.recipe : [],
    };
  });

  // Map Users to frontend
  const users = rawUsers.map((u: any) => {
    const id = u.user_id != null ? `usr-${u.user_id}` : (u.id || `usr-${u.username}`);
    const username = u.role || (u.email ? u.email.split('@')[0] : `user${u.user_id}`);
    const role = (u.role || 'cashier').toLowerCase();
    const roleTitle =
      role === 'admin'
        ? 'Administrator'
        : role === 'owner'
        ? 'Shop Owner'
        : role === 'manager'
        ? 'Manager'
        : 'Cashier / Barista';

    return {
      id,
      username,
      role,
      fullName: u.name || u.full_name || 'Staff Member',
      roleTitle,
      status: 'Active',
      lastLogin: 'Today',
      createdAt: '2026-01-01',
    };
  });

  // Map Orders to frontend
  const orders = rawOrders.map((o: any) => {
    const orderId = o.order_id != null ? String(o.order_id) : o.id;
    const matchedUser = rawUsers.find((u: any) => u.user_id === o.user_id);
    const cashierName = matchedUser?.name || 'Alexander Rivera';

    const items = rawOrderItems
      .filter((item: any) => String(item.order_id) === String(orderId))
      .map((item: any) => {
        const prod = products.find((p: any) => String(p.id) === String(item.product_id));
        return {
          id: String(item.order_item_id || item.id || Math.random()),
          product: prod || {
            id: String(item.product_id),
            name: `Item #${item.product_id}`,
            price: Number(item.unit_price || 0),
            categoryId: 'cat-1',
            description: '',
            image: '',
            isAvailable: true,
            salesWeight: 0.1,
            recipe: [],
          },
          quantity: item.quantity,
          size: item.size || '16oz Regular',
          sweetness: item.sweetness || '100%',
          ice: item.ice || 'Regular Ice',
          addons: item.addons || [],
          unitPrice: Number(item.unit_price || 0),
          lineTotal: Number(item.subtotal || item.line_total || (item.unit_price * item.quantity)),
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
      vatAmount: total - (total / 1.12),
      totalAmount: total,
      paymentMethod: o.payment_method || 'Cash',
      amountPaid: total,
      changeAmount: 0,
      status: o.status || 'Completed',
      createdAt: o.order_date || o.created_at || new Date().toISOString(),
      items,
    };
  });

  // Calculate historical sales from orders
  const salesMap: Record<string, { total: number; count: number }> = {};
  orders.forEach((ord: any) => {
    const d = ord.createdAt.split('T')[0];
    if (!salesMap[d]) {
      salesMap[d] = { total: 0, count: 0 };
    }
    salesMap[d].total += ord.totalAmount;
    salesMap[d].count += 1;
  });

  const historicalSales = Object.keys(salesMap).map((date) => ({
    date,
    total: salesMap[date].total,
    ordersCount: salesMap[date].count,
  }));

  // Ingredients (if custom table exists)
  const ingredients = rawIngredients.map((i: any) => ({
    id: i.id || String(i.ingredient_id),
    name: i.name,
    category: i.category,
    unit: i.unit,
    currentStock: Number(i.current_stock),
    reorderLevel: Number(i.reorder_level),
    costPerUnit: Number(i.cost_per_unit),
    supplier: i.supplier || '',
    lastRestocked: i.last_restocked_at || undefined,
  }));

  return {
    products,
    categories,
    ingredients,
    orders,
    users,
    historicalSales,
  };
}

// Push all default data to Supabase
export async function pushAllToSupabase(payload: {
  categories?: any[];
  products?: any[];
  users?: any[];
  ingredients?: any[];
  orders?: any[];
  forecast?: any;
}) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const results: Record<string, any> = {};

  if (payload.categories?.length) {
    const formatted = payload.categories.map((c, idx) => {
      const numId = parseInt(String(c.id).replace(/\D/g, '')) || (idx + 1);
      return {
        category_id: numId,
        category_name: c.name,
      };
    });
    results.categories = await client.from('categories').upsert(formatted);
  }

  if (payload.products?.length) {
    const formatted = payload.products.map((p, idx) => {
      const numId = parseInt(String(p.id).replace(/\D/g, '')) || (idx + 1);
      const catId = parseInt(String(p.categoryId).replace(/\D/g, '')) || 1;
      return {
        product_id: numId,
        product_name: p.name,
        price: p.price,
        stock_qty: 100,
        category_id: catId,
        status: p.isAvailable ? 'Available' : 'Sold Out',
      };
    });
    results.products = await client.from('products').upsert(formatted);
  }

  if (payload.users?.length) {
    const formatted = payload.users.map((u, idx) => {
      const numId = parseInt(String(u.id).replace(/\D/g, '')) || (idx + 1);
      return {
        user_id: numId,
        name: u.fullName,
        email: `${u.username}@kennybrew.com`,
        password: 'kenny123',
        role: u.role,
      };
    });
    results.users = await client.from('users').upsert(formatted);
  }

  if (payload.ingredients?.length) {
    try {
      const formatted = payload.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        current_stock: ing.currentStock,
        reorder_level: ing.reorderLevel,
        cost_per_unit: ing.costPerUnit,
        supplier: ing.supplier || null,
        last_restocked_at: ing.lastRestocked || null,
      }));
      results.ingredients = await client.from('ingredients').upsert(formatted);
    } catch (e) {
      console.warn('Ingredients table auto-sync notice:', e);
    }
  }

  if (payload.orders?.length) {
    try {
      for (const ord of payload.orders) {
        await insertSupabaseOrder({ order: ord });
      }
      results.orders = { syncedCount: payload.orders.length };
    } catch (e) {
      console.warn('Orders auto-push notice:', e);
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// Real-time Single Record Sync Handlers
// ----------------------------------------------------------------------------

export async function upsertSupabaseProduct(product: any) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  const numId = parseInt(String(product.id).replace(/\D/g, ''));
  const catId = parseInt(String(product.categoryId).replace(/\D/g, '')) || 1;

  const payload: any = {
    product_name: product.name,
    price: product.price,
    stock_qty: 100,
    category_id: catId,
    status: product.isAvailable ? 'Available' : 'Sold Out',
  };

  if (!isNaN(numId) && numId > 0) {
    payload.product_id = numId;
  }

  return client.from('products').upsert(payload).select();
}

export async function deleteSupabaseProduct(id: string) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  const numId = parseInt(String(id).replace(/\D/g, ''));
  if (isNaN(numId)) {
    return client.from('products').delete().eq('product_name', id);
  }
  return client.from('products').delete().eq('product_id', numId);
}

export async function upsertSupabaseIngredient(ingredient: any) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  try {
    return await client.from('ingredients').upsert({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      current_stock: ingredient.currentStock,
      reorder_level: ingredient.reorderLevel,
      cost_per_unit: ingredient.costPerUnit,
      supplier: ingredient.supplier || null,
      last_restocked_at: ingredient.lastRestocked || null,
    });
  } catch {
    return { ok: true };
  }
}

export async function deleteSupabaseIngredient(id: string) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  try {
    return await client.from('ingredients').delete().eq('id', id);
  } catch {
    return { ok: true };
  }
}

export async function upsertSupabaseUser(user: any) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  const numId = parseInt(String(user.id).replace(/\D/g, ''));
  const payload: any = {
    name: user.fullName,
    email: `${user.username}@kennybrew.com`,
    password: 'kenny123',
    role: user.role,
  };

  if (!isNaN(numId) && numId > 0) {
    payload.user_id = numId;
  }

  return client.from('users').upsert(payload).select();
}

export async function deleteSupabaseUser(username: string) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  return client.from('users').delete().eq('role', username);
}

export async function insertSupabaseOrder(payload: {
  order: any;
  updatedIngredients?: any[];
  todaySales?: any;
}) {
  const client = getSupabase();
  if (!client) return { error: 'Supabase not configured' };

  const { order } = payload;

  try {
    // 1. Resolve cashier user_id from users table
    let cashierUserId = 4; // Default to cashier
    const { data: users } = await client.from('users').select('*');
    if (users && users.length > 0) {
      const matched =
        users.find(
          (u: any) =>
            u.name.toLowerCase() === (order.cashierName || '').toLowerCase() ||
            u.role.toLowerCase() === (order.cashierName || '').toLowerCase()
        ) || users.find((u: any) => u.role === 'cashier') || users[0];
      if (matched && matched.user_id) {
        cashierUserId = matched.user_id;
      }
    }

    // 2. Insert into `orders`
    const { data: createdOrder, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: cashierUserId,
        order_date: order.createdAt || new Date().toISOString(),
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod || 'Cash',
        status: 'Completed',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting into orders table:', orderError);
      return { error: orderError.message };
    }

    const orderId = createdOrder.order_id;

    // 3. Insert items into `orders_items`
    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((it: any) => {
        const prodId = parseInt(String(it.product.id).replace(/\D/g, '')) || 1;
        return {
          order_id: orderId,
          product_id: prodId,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          subtotal: it.lineTotal,
        };
      });

      const { error: itemsError } = await client
        .from('orders_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error inserting into orders_items table:', itemsError);
      }
    }

    return { success: true, orderId };
  } catch (err: any) {
    console.error('Failed to insert order to Supabase:', err);
    return { error: err.message || String(err) };
  }
}

// ----------------------------------------------------------------------------
// 6. Sales Forecast Persistence in Supabase Table (`sales_forecasts`)
// ----------------------------------------------------------------------------

export async function saveForecastToSupabase(forecast: any) {
  const client = getSupabase();
  if (!client) {
    return { success: false, reason: 'Supabase credentials not configured' };
  }

  if (!forecast || !forecast.summary) {
    return { success: false, reason: 'Invalid forecast payload' };
  }

  const record = {
    id: 'latest',
    generated_at: forecast.generatedAt || forecast.generated_at || new Date().toISOString(),
    engine: forecast.engine || 'KENNY-ARIMA-HoltWinters-Hybrid v2.6',
    average_recent_daily: Number(forecast.summary.averageRecentDaily ?? forecast.summary.average_recent_daily ?? 0),
    next_7_day_expected_avg: Number(forecast.summary.next7DayExpectedAvg ?? forecast.summary.next_7_day_expected_avg ?? 0),
    total_7_day_forecast: Number(forecast.summary.total7DayForecast ?? forecast.summary.total_7_day_forecast ?? 0),
    top_expected_product: String(forecast.summary.topExpectedProduct ?? forecast.summary.top_expected_product ?? 'Espresso Latte'),
    trend_signal_pct: Number(forecast.summary.trendSignalPct ?? forecast.summary.trend_signal_pct ?? 0),
    demand_level: String(forecast.summary.demandLevel ?? forecast.summary.demand_level ?? 'STABLE'),
    planning_suggestion: String(forecast.summary.planningSuggestion ?? forecast.summary.planning_suggestion ?? ''),
    next_7_days: forecast.next7Days || forecast.next_7_days || [],
    product_forecasts: forecast.productForecasts || forecast.product_forecasts || [],
    ingredient_reorders: forecast.ingredientReorders || forecast.ingredient_reorders || [],
    staffing_schedule: forecast.staffingSchedule || forecast.staffing_schedule || [],
    anomalies: forecast.anomalies || [],
  };

  try {
    // Upsert into `sales_forecasts` table
    const { data, error } = await client
      .from('sales_forecasts')
      .upsert(record, { onConflict: 'id' })
      .select();

    if (error) {
      // If table has not been created yet in user's Supabase instance
      if (error.code === '42P01') {
        console.warn('Notice: `sales_forecasts` table does not exist yet in Supabase. Run supabase-schema.sql to create it.');
        return {
          success: false,
          needsTableCreation: true,
          table: 'sales_forecasts',
          error: error.message,
        };
      }
      console.error('Error saving forecast to sales_forecasts table:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Exception writing forecast to Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function getLatestForecastFromSupabase() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('sales_forecasts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Convert stored row into camelCase ForecastResult
    return {
      engine: data.engine,
      generatedAt: data.generated_at,
      summary: {
        averageRecentDaily: Number(data.average_recent_daily || 0),
        next7DayExpectedAvg: Number(data.next_7_day_expected_avg || 0),
        total7DayForecast: Number(data.total_7_day_forecast || 0),
        topExpectedProduct: data.top_expected_product || 'Coffee',
        trendSignalPct: Number(data.trend_signal_pct || 0),
        demandLevel: data.demand_level || 'STABLE',
        planningSuggestion: data.planning_suggestion || '',
      },
      next7Days: data.next_7_days || [],
      productForecasts: data.product_forecasts || [],
      ingredientReorders: data.ingredient_reorders || [],
      staffingSchedule: data.staffing_schedule || [],
      anomalies: data.anomalies || [],
    };
  } catch {
    return null;
  }
}
