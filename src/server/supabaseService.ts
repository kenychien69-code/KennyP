import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getProductImageUrl } from '../utils/productImages';
import { UserRole } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CUSTOM_IMAGES_FILE = path.join(DATA_DIR, 'custom_product_images.json');
const DELETED_USERS_FILE = path.join(DATA_DIR, 'deleted_usernames.json');
const DELETED_PRODUCTS_FILE = path.join(DATA_DIR, 'deleted_products.json');
const DELETED_INGREDIENTS_FILE = path.join(DATA_DIR, 'deleted_ingredients.json');
const STAFF_USERS_FILE = path.join(DATA_DIR, 'staff_users.json');
const CUSTOM_PRODUCTS_FILE = path.join(DATA_DIR, 'custom_products.json');
const CUSTOM_INGREDIENTS_FILE = path.join(DATA_DIR, 'custom_ingredients.json');

function loadJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.warn(`Failed to read ${file}:`, e);
  }
  return fallback;
}

function saveJson(file: string, data: any) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`Failed to write ${file}:`, e);
  }
}

// Deleted usernames tracking
export function loadDeletedUsernames(): Set<string> {
  const list = loadJson<string[]>(DELETED_USERS_FILE, []);
  return new Set(list.map((u) => u.toLowerCase().trim()));
}

export function recordDeletedUsername(username: string) {
  const s = loadDeletedUsernames();
  s.add(username.toLowerCase().trim());
  saveJson(DELETED_USERS_FILE, Array.from(s));
}

export function loadStaffUsers(): any[] {
  const users = loadJson<any[]>(STAFF_USERS_FILE, []);
  return users.filter((u) => u.username?.toLowerCase() !== 'owner');
}

export function saveStaffUser(user: any) {
  const users = loadStaffUsers();
  const cleanUsername = (user.username || '').toLowerCase().trim();
  if (!cleanUsername || cleanUsername === 'owner') return;

  const idx = users.findIndex((u) => u.username?.toLowerCase().trim() === cleanUsername);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  saveJson(STAFF_USERS_FILE, users);

  const deleted = loadJson<string[]>(DELETED_USERS_FILE, []);
  const filtered = deleted.filter((u) => u.toLowerCase().trim() !== cleanUsername);
  saveJson(DELETED_USERS_FILE, filtered);
}

export function removeStaffUser(username: string) {
  const cleanUsername = username.toLowerCase().trim();
  recordDeletedUsername(cleanUsername);
  const users = loadStaffUsers();
  const filtered = users.filter((u) => u.username?.toLowerCase().trim() !== cleanUsername);
  saveJson(STAFF_USERS_FILE, filtered);
}

export function loadDeletedProducts(): Set<string> {
  const list = loadJson<string[]>(DELETED_PRODUCTS_FILE, []);
  return new Set(list.map((id) => String(id).toLowerCase().trim()));
}

export function recordDeletedProduct(id: string) {
  const s = loadDeletedProducts();
  s.add(String(id).toLowerCase().trim());
  saveJson(DELETED_PRODUCTS_FILE, Array.from(s));
}

export function loadCustomProducts(): any[] {
  return loadJson<any[]>(CUSTOM_PRODUCTS_FILE, []);
}

export function saveCustomProduct(product: any) {
  const prods = loadCustomProducts();
  const cleanName = product.name ? product.name.toLowerCase().trim() : '';
  const idx = prods.findIndex(
    (p) => String(p.id) === String(product.id) || (cleanName && p.name?.toLowerCase().trim() === cleanName)
  );
  if (idx >= 0) {
    prods[idx] = { ...prods[idx], ...product };
  } else {
    prods.push(product);
  }
  saveJson(CUSTOM_PRODUCTS_FILE, prods);

  const deleted = loadJson<string[]>(DELETED_PRODUCTS_FILE, []);
  const filtered = deleted.filter((id) => id !== String(product.id) && id !== cleanName);
  saveJson(DELETED_PRODUCTS_FILE, filtered);
}

export function removeCustomProduct(id: string) {
  recordDeletedProduct(id);
  const prods = loadCustomProducts();
  const filtered = prods.filter(
    (p) => String(p.id) !== String(id) && p.name?.toLowerCase().trim() !== String(id).toLowerCase().trim()
  );
  saveJson(CUSTOM_PRODUCTS_FILE, filtered);
}

export function loadDeletedIngredients(): Set<string> {
  const list = loadJson<string[]>(DELETED_INGREDIENTS_FILE, []);
  return new Set(list.map((id) => String(id).toLowerCase().trim()));
}

export function recordDeletedIngredient(id: string) {
  const s = loadDeletedIngredients();
  s.add(String(id).toLowerCase().trim());
  saveJson(DELETED_INGREDIENTS_FILE, Array.from(s));
}

export function loadCustomIngredients(): any[] {
  return loadJson<any[]>(CUSTOM_INGREDIENTS_FILE, []);
}

export function saveCustomIngredient(ingredient: any) {
  const ings = loadCustomIngredients();
  const cleanName = ingredient.name ? ingredient.name.toLowerCase().trim() : '';
  const idx = ings.findIndex(
    (i) => String(i.id) === String(ingredient.id) || (cleanName && i.name?.toLowerCase().trim() === cleanName)
  );
  if (idx >= 0) {
    ings[idx] = { ...ings[idx], ...ingredient };
  } else {
    ings.push(ingredient);
  }
  saveJson(CUSTOM_INGREDIENTS_FILE, ings);

  const deleted = loadJson<string[]>(DELETED_INGREDIENTS_FILE, []);
  const filtered = deleted.filter((id) => id !== String(ingredient.id) && id !== cleanName);
  saveJson(DELETED_INGREDIENTS_FILE, filtered);
}

export function removeCustomIngredient(id: string) {
  recordDeletedIngredient(id);
  const ings = loadCustomIngredients();
  const filtered = ings.filter(
    (i) => String(i.id) !== String(id) && i.name?.toLowerCase().trim() !== String(id).toLowerCase().trim()
  );
  saveJson(CUSTOM_INGREDIENTS_FILE, filtered);
}

function loadCustomProductImages(): Record<string, string> {
  try {
    if (fs.existsSync(CUSTOM_IMAGES_FILE)) {
      return JSON.parse(fs.readFileSync(CUSTOM_IMAGES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load custom product images:', e);
  }
  return {};
}

export function saveCustomProductImage(productName: string, imageUrl: string) {
  try {
    if (!productName || !imageUrl || imageUrl.includes('photo-1558857563-b37cf5a9c086')) return;
    const images = loadCustomProductImages();
    images[productName.trim().toLowerCase()] = imageUrl.trim();
    saveJson(CUSTOM_IMAGES_FILE, images);
  } catch (e) {
    console.warn('Failed to save custom product image:', e);
  }
}

let hasProductImageUrlColumnCached: boolean | null = null;
let lastColumnCheckTime = 0;

export async function checkHasProductImageUrlColumn(forceFresh = false): Promise<boolean> {
  const now = Date.now();
  if (!forceFresh && hasProductImageUrlColumnCached !== null && now - lastColumnCheckTime < 30000) {
    return hasProductImageUrlColumnCached;
  }

  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('products').select('image_url').limit(1);
    if (!error) {
      hasProductImageUrlColumnCached = true;
      lastColumnCheckTime = now;
      return true;
    }
    hasProductImageUrlColumnCached = false;
    lastColumnCheckTime = now;
    return false;
  } catch {
    hasProductImageUrlColumnCached = false;
    lastColumnCheckTime = now;
    return false;
  }
}

export async function uploadToSupabaseStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ url?: string; error?: string; status?: number }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Supabase client is not connected' };
  }

  try {
    const { error } = await client.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      return { error: error.message, status: (error as any).statusCode || (error as any).status || 400 };
    }

    const { data: publicUrlData } = client.storage
      .from('images')
      .getPublicUrl(filename);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { error: err.message || 'Upload exception' };
  }
}

export function getStorageSetupSql(): string {
  return `-- ============================================================
-- KENNY Brew Intelligence - Permanent Image Storage Setup
-- Run this in Supabase Dashboard -> SQL Editor (>_)
-- ============================================================

-- 1. Add image_url column to the products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Allow public uploads (INSERT) to the 'images' storage bucket
CREATE POLICY "Allow public uploads to images bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

-- 3. Allow public updates (UPDATE) to the 'images' storage bucket
CREATE POLICY "Allow public updates to images bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'images');

-- 4. Allow public reads (SELECT) from the 'images' storage bucket
CREATE POLICY "Allow public reads from images bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 5. Allow public insert, update, and delete on 'users' table for Staff Accounts
DROP POLICY IF EXISTS "Allow public all on users" ON public.users;
CREATE POLICY "Allow public all on users"
ON public.users FOR ALL
TO public
USING (true)
WITH CHECK (true);
`;
}

export async function checkSupabaseStorageStatus() {
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      bucketExists: false,
      canUpload: false,
      hasImageUrlColumn: false,
      canInsertUsers: false,
      message: 'Supabase client not connected',
      fixSql: getStorageSetupSql(),
    };
  }

  let bucketExists = false;
  let canUpload = false;
  let uploadError: string | null = null;
  let canInsertUsers = false;

  try {
    const { error: listErr } = await client.storage.from('images').list();
    if (!listErr) {
      bucketExists = true;
    }

    // Probe test upload permissions with a tiny file
    const probeFile = `.probe_${Date.now()}.tmp`;
    const { error: upErr } = await client.storage
      .from('images')
      .upload(probeFile, Buffer.from('ok'), { contentType: 'text/plain', upsert: true });

    if (!upErr) {
      canUpload = true;
      await client.storage.from('images').remove([probeFile]).catch(() => {});
    } else {
      uploadError = upErr.message;
    }

    // Probe test user table insert permission
    const probeEmail = `.probe_${Date.now()}@probe.test`;
    const { error: userInsertErr } = await client.from('users').insert([{
      name: 'Probe Test',
      email: probeEmail,
      role: 'cashier',
      password: 'probe',
    }]).select();

    if (!userInsertErr) {
      canInsertUsers = true;
      try {
        await client.from('users').delete().eq('email', probeEmail);
      } catch {}
    }
  } catch (err: any) {
    uploadError = err.message;
  }

  const hasImageUrlColumn = await checkHasProductImageUrlColumn(true);

  return {
    connected: true,
    bucketExists,
    bucketName: 'images',
    canUpload,
    uploadError,
    hasImageUrlColumn,
    canInsertUsers,
    isFullyConfigured: canUpload && hasImageUrlColumn && canInsertUsers,
    fixSql: getStorageSetupSql(),
  };
}

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
    inventoryRes,
  ] = await Promise.allSettled([
    client.from('products').select('*').order('product_id', { ascending: true }),
    client.from('categories').select('*').order('category_id', { ascending: true }),
    client.from('orders').select('*').order('order_date', { ascending: false }),
    client.from('orders_items').select('*'),
    client.from('users').select('*').order('user_id', { ascending: true }),
    client.from('ingredients').select('*'),
    client.from('inventory').select('*'),
  ]);

  const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value.data || [] : [];
  const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data || [] : [];
  const rawOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.data || [] : [];
  const rawOrderItems = orderItemsRes.status === 'fulfilled' ? orderItemsRes.value.data || [] : [];
  const rawUsers = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : [];
  let rawIngredients = ingredientsRes.status === 'fulfilled' ? ingredientsRes.value.data || [] : [];
  if (!rawIngredients.length && inventoryRes.status === 'fulfilled' && inventoryRes.value.data?.length) {
    rawIngredients = inventoryRes.value.data.map((inv: any) => ({
      id: inv.id || inv.item_id || `ing-${inv.name || inv.item_name}`,
      name: inv.name || inv.item_name,
      category: inv.category || 'Packaging',
      unit: inv.unit || 'pcs',
      current_stock: inv.current_stock ?? inv.quantity ?? inv.stock_qty ?? 0,
      reorder_level: inv.reorder_level ?? inv.reorder_threshold ?? 20,
      cost_per_unit: inv.cost_per_unit ?? inv.cost ?? 0,
      supplier: inv.supplier || '',
      last_restocked_at: inv.last_restocked_at || inv.updated_at,
    }));
  }

  // Map Categories to frontend
  const categories = rawCategories.map((c: any) => ({
    id: c.category_id ? `cat-${c.category_id}` : c.id,
    name: c.category_name || c.name,
    icon: 'Coffee',
  }));

  // Map Products to frontend
  const deletedProducts = loadDeletedProducts();
  const customProducts = loadCustomProducts();
  const customImages = loadCustomProductImages();

  const filteredRawProducts = rawProducts.filter((p: any) => {
    const idStr = String(p.product_id != null ? p.product_id : p.id).toLowerCase();
    const nameStr = (p.product_name || p.name || '').toLowerCase().trim();
    return !deletedProducts.has(idStr) && !deletedProducts.has(nameStr);
  });

  const productMap = new Map<string, any>();
  for (const p of filteredRawProducts) {
    const id = p.product_id != null ? String(p.product_id) : p.id;
    const catId = p.category_id != null ? `cat-${p.category_id}` : p.categoryId;
    const name = p.product_name || p.name;
    const customImg = name ? customImages[name.trim().toLowerCase()] : null;
    const dbImg = p.image_url || p.image;
    const image =
      dbImg && typeof dbImg === 'string' && dbImg.trim().length > 5 && !dbImg.includes('photo-1558857563-b37cf5a9c086')
        ? dbImg.trim()
        : customImg || getProductImageUrl(name, catId);
    productMap.set(name.trim().toLowerCase(), {
      id,
      categoryId: catId,
      name,
      description: p.description || '',
      price: Number(p.price),
      image,
      isAvailable: p.status ? p.status === 'Available' : (p.is_available ?? true),
      salesWeight: 0.15,
      recipe: Array.isArray(p.recipe) ? p.recipe : [],
    });
  }

  for (const cp of customProducts) {
    const cleanName = (cp.name || '').toLowerCase().trim();
    const idStr = String(cp.id || '').toLowerCase().trim();
    if (!deletedProducts.has(idStr) && !deletedProducts.has(cleanName)) {
      productMap.set(cleanName, cp);
    }
  }

  const products = Array.from(productMap.values());

  // Map Ingredients to frontend
  const deletedIngredients = loadDeletedIngredients();
  const customIngredients = loadCustomIngredients();

  const filteredRawIngredients = rawIngredients.filter((i: any) => {
    const idStr = String(i.id || '').toLowerCase().trim();
    const nameStr = (i.name || '').toLowerCase().trim();
    return !deletedIngredients.has(idStr) && !deletedIngredients.has(nameStr);
  });

  const ingredientMap = new Map<string, any>();
  for (const i of filteredRawIngredients) {
    const cleanName = (i.name || '').toLowerCase().trim();
    ingredientMap.set(cleanName, {
      id: i.id,
      name: i.name,
      category: i.category,
      unit: i.unit,
      currentStock: i.current_stock ?? i.currentStock ?? 0,
      reorderLevel: i.reorder_level ?? i.reorderLevel ?? 20,
      costPerUnit: i.cost_per_unit ?? i.costPerUnit ?? 0,
      supplier: i.supplier || '',
      lastRestocked: i.last_restocked_at || i.lastRestocked,
    });
  }

  for (const ci of customIngredients) {
    const cleanName = (ci.name || '').toLowerCase().trim();
    const idStr = String(ci.id || '').toLowerCase().trim();
    if (!deletedIngredients.has(idStr) && !deletedIngredients.has(cleanName)) {
      ingredientMap.set(cleanName, ci);
    }
  }

  const ingredients = Array.from(ingredientMap.values());

  // Map Users to frontend
  // ALWAYS exclude demo accounts (manager and cashier) and any deleted staff accounts
  const deletedUsers = loadDeletedUsernames();
  const customStaff = loadStaffUsers();

  const rawOwner = rawUsers.find(
    (u: any) =>
      (u.role || '').toLowerCase() === 'owner' ||
      (u.role || '').toLowerCase() === 'admin' ||
      (u.email || '').toLowerCase().startsWith('owner@')
  );

  const rawOwnerName = rawOwner?.name || 'Kenny Chien';
  const ownerName = rawOwnerName
    .replace(/\s*\([^)]*\)/g, '')
    .trim() || 'Kenny Chien';

  const shopOwnerUser = {
    id: rawOwner?.user_id != null ? `usr-${rawOwner.user_id}` : 'usr-owner',
    username: 'owner',
    role: 'owner' as UserRole,
    fullName: ownerName,
    roleTitle: 'Shop Owner',
    status: 'Active' as const,
    lastLogin: 'Today',
    createdAt: '2026-01-01',
  };

  const usersMap = new Map<string, any>();
  usersMap.set('owner', shopOwnerUser);

  // 1. Add staff users retrieved directly from Supabase 'users' table
  for (const ru of rawUsers) {
    const email = (ru.email || '').toLowerCase().trim();
    const roleRaw = (ru.role || '').toLowerCase().trim();
    const username = (ru.username || (email.includes('@') ? email.split('@')[0] : email) || `staff_${ru.user_id || ru.id}`).toLowerCase().trim();
    if (!username || deletedUsers.has(username) || username === 'owner') continue;

    const role: UserRole = roleRaw === 'manager' ? 'manager' : roleRaw === 'owner' ? 'owner' : 'cashier';
    usersMap.set(username, {
      id: ru.user_id != null ? `usr-${ru.user_id}` : (ru.id ? String(ru.id) : `usr-${username}`),
      username,
      role,
      fullName: ru.name || ru.full_name || username,
      roleTitle: role === 'manager' ? 'Store Manager' : role === 'owner' ? 'Shop Owner' : 'Cashier / Barista',
      lastLogin: ru.last_login || ru.lastLogin || 'Today',
      createdAt: ru.created_at ? ru.created_at.split('T')[0] : '2026-01-01',
      password: ru.password || 'kenny123',
    });
  }

  // 2. Overlay any locally cached custom staff
  for (const staff of customStaff) {
    const un = (staff.username || '').toLowerCase().trim();
    if (un && !deletedUsers.has(un) && un !== 'owner') {
      const role: UserRole = staff.role === 'manager' ? 'manager' : staff.role === 'owner' ? 'owner' : 'cashier';
      usersMap.set(un, {
        id: staff.id || `usr-${un}`,
        username: staff.username,
        role: role,
        fullName: staff.fullName || 'Staff Member',
        roleTitle:
          staff.roleTitle ||
          (role === 'manager' ? 'Store Manager' : role === 'owner' ? 'Shop Owner' : 'Cashier / Barista'),
        lastLogin: staff.lastLogin || 'Never',
        createdAt: staff.createdAt || new Date().toISOString().split('T')[0],
        password: staff.password || 'kenny123',
      });
    }
  }

  const users = Array.from(usersMap.values());

  // Map Orders to frontend
  const orders = rawOrders.map((o: any) => {
    const orderId = o.order_id != null ? String(o.order_id) : o.id;
    const matchedUser = rawUsers.find((u: any) => u.user_id === o.user_id);
    const cashierName = matchedUser?.name || 'Cashier';

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
    const hasImageUrlCol = await checkHasProductImageUrlColumn();
    const formatted = payload.products.map((p, idx) => {
      if (p.name && p.image) {
        saveCustomProductImage(p.name, p.image);
      }
      let numId = parseInt(String(p.id).replace(/\D/g, ''));
      if (isNaN(numId) || numId > 2147483647 || numId <= 0) {
        numId = idx + 1;
      }
      const catId = parseInt(String(p.categoryId).replace(/\D/g, '')) || 1;
      const row: any = {
        product_id: numId,
        product_name: p.name,
        price: p.price,
        stock_qty: 100,
        category_id: catId,
        status: p.isAvailable ? 'Available' : 'Sold Out',
      };
      if (hasImageUrlCol && p.image) {
        row.image_url = p.image;
      }
      return row;
    });
    results.products = await client.from('products').upsert(formatted);
  }

  if (payload.users?.length) {
    const validStaff = payload.users.filter(
      (u) =>
        u.username?.toLowerCase() !== 'cashier' &&
        u.username?.toLowerCase() !== 'owner'
    );
    for (const st of validStaff) {
      saveStaffUser(st);
      try {
        const cleanUsername = st.username.toLowerCase().trim();
        const cleanEmail = `${cleanUsername}@kennybrew.com`;
        const userRow: any = {
          name: st.fullName,
          email: cleanEmail,
          role: st.role,
          password: st.password || 'kenny123',
        };
        await client.from('users').upsert(userRow, { onConflict: 'email' });
      } catch (err) {
        console.warn('Staff user push to Supabase table notice:', err);
      }
    }
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
  saveCustomProduct(product);
  if (product.name && product.image) {
    saveCustomProductImage(product.name, product.image);
  }
  const client = getSupabase();
  if (!client) return { ok: true, product };

  let numId = parseInt(String(product.id).replace(/\D/g, ''));
  if (isNaN(numId) || numId > 2147483647 || numId <= 0) {
    numId = NaN;
  }
  const catId = parseInt(String(product.categoryId).replace(/\D/g, '')) || 1;

  const hasImageUrlCol = await checkHasProductImageUrlColumn();

  const payload: any = {
    product_name: product.name,
    price: product.price,
    stock_qty: 100,
    category_id: catId,
    status: product.isAvailable ? 'Available' : 'Sold Out',
  };

  if (hasImageUrlCol && product.image) {
    payload.image_url = product.image;
  }

  // If already has a valid database integer ID, update it
  if (!isNaN(numId)) {
    payload.product_id = numId;
    const res = await client.from('products').upsert(payload).select();
    if (!res.error && res.data && res.data.length > 0) return res;
  }

  // Check if a product with this exact name already exists in Supabase
  const { data: existing } = await client
    .from('products')
    .select('*')
    .eq('product_name', product.name)
    .limit(1);

  if (existing && existing.length > 0) {
    const updated = await client
      .from('products')
      .update(payload)
      .eq('product_id', existing[0].product_id)
      .select();
    return updated;
  }

  // Otherwise, insert as brand new product (without product_id so Supabase autoincrements it!)
  delete payload.product_id;
  const inserted = await client.from('products').insert([payload]).select();
  return inserted;
}

export async function deleteSupabaseProduct(id: string) {
  removeCustomProduct(id);
  const client = getSupabase();
  if (!client) return { ok: true, deleted: id };

  let numId = parseInt(String(id).replace(/\D/g, ''));
  if (isNaN(numId) || numId > 2147483647) {
    await client.from('products').delete().eq('product_name', id);
  } else {
    await client.from('products').delete().or(`product_id.eq.${numId},product_name.eq.${id}`);
  }
  return { ok: true, deleted: id };
}

export async function upsertSupabaseIngredient(ingredient: any) {
  saveCustomIngredient(ingredient);
  const client = getSupabase();
  if (!client) return { ok: true, ingredient };

  let error: any = null;
  // 1. Try 'ingredients' table
  try {
    const res = await client.from('ingredients').upsert({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      current_stock: ingredient.currentStock,
      reorder_level: ingredient.reorderLevel,
      cost_per_unit: ingredient.costPerUnit,
      supplier: ingredient.supplier || null,
      last_restocked_at: ingredient.lastRestocked || null,
    }).select();
    if (!res.error) return res;
    error = res.error;
  } catch (e) {
    error = e;
  }

  // 2. Also try 'inventory' table in case table name in Supabase is inventory
  try {
    const res = await client.from('inventory').upsert({
      id: ingredient.id,
      name: ingredient.name,
      item_name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      current_stock: ingredient.currentStock,
      quantity: ingredient.currentStock,
      stock_qty: ingredient.currentStock,
      reorder_level: ingredient.reorderLevel,
      cost_per_unit: ingredient.costPerUnit,
      supplier: ingredient.supplier || null,
    }).select();
    if (!res.error) return res;
  } catch {}

  return { ok: true, error };
}

export async function deleteSupabaseIngredient(id: string) {
  removeCustomIngredient(id);
  const client = getSupabase();
  if (!client) return { ok: true, deleted: id };

  try {
    await client.from('ingredients').delete().or(`id.eq.${id},name.eq.${id}`);
  } catch {}

  try {
    await client.from('inventory').delete().or(`id.eq.${id},item_name.eq.${id},name.eq.${id}`);
  } catch {}

  return { ok: true, deleted: id };
}

export async function recordSupabaseStockAdjustment(payload: {
  productId: number | string;
  quantityChange: number;
  transactionType?: 'Restock' | 'Adjustment' | 'Waste' | 'Sale';
}) {
  const client = getSupabase();
  if (!client) return { ok: true };

  const prodId = parseInt(String(payload.productId).replace(/\D/g, '')) || 1;
  const change = Number(payload.quantityChange) || 0;
  const transType = payload.transactionType || (change >= 0 ? 'Restock' : 'Adjustment');

  try {
    // 1. Insert transaction into `inventory` table
    const invRes = await client.from('inventory').insert([{
      product_id: prodId,
      quantity_change: change,
      transaction_type: transType,
      date: new Date().toISOString(),
    }]).select();

    // 2. Update `stock_qty` in `products` table
    const { data: prodData } = await client
      .from('products')
      .select('stock_qty')
      .eq('product_id', prodId)
      .limit(1);

    if (prodData && prodData[0]) {
      const currentStock = Number(prodData[0].stock_qty) || 0;
      const newStock = Math.max(0, currentStock + change);
      await client
        .from('products')
        .update({
          stock_qty: newStock,
          status: newStock > 0 ? 'Available' : 'Sold Out',
        })
        .eq('product_id', prodId);
    }

    return { ok: true, data: invRes.data };
  } catch (err: any) {
    console.warn('Stock adjustment notice:', err);
    return { ok: true, warning: err.message };
  }
}

export async function upsertSupabaseUser(user: any) {
  saveStaffUser(user);
  const client = getSupabase();
  if (!client) return { ok: true, user };

  const cleanUsername = (user.username || '').toLowerCase().trim();
  const cleanEmail = `${cleanUsername}@kennybrew.com`;
  const cleanFullName = user.fullName || user.name || cleanUsername;
  const role = user.role || 'cashier';
  const password = user.password || 'kenny123';

  try {
    // 1. Check if user already exists by email in Supabase
    let existingUser: any = null;
    try {
      const { data } = await client
        .from('users')
        .select('*')
        .or(`email.eq.${cleanEmail},email.eq.${cleanUsername}`)
        .limit(1);
      if (data && data.length > 0) {
        existingUser = data[0];
      }
    } catch {}

    if (existingUser) {
      const targetId = existingUser.user_id != null ? existingUser.user_id : existingUser.id;
      const updatePayload: any = {
        name: cleanFullName,
        role: role,
        password: password,
      };
      const keyColumn = existingUser.user_id != null ? 'user_id' : 'id';
      const updated = await client
        .from('users')
        .update(updatePayload)
        .eq(keyColumn, targetId)
        .select();
      return updated;
    }

    // 2. Otherwise insert new staff record into Supabase 'users' table
    const insertPayload: any = {
      name: cleanFullName,
      email: cleanEmail,
      role: role,
      password: password,
    };

    const insertRes = await client.from('users').insert([insertPayload]).select();
    if (insertRes.error) {
      console.warn('Supabase users insert error:', insertRes.error);
      return { ok: true, user, warning: insertRes.error.message };
    }
    return insertRes;
  } catch (err: any) {
    console.warn('upsertSupabaseUser notice:', err);
    return { ok: true, user };
  }
}

export async function deleteSupabaseUser(username: string) {
  removeStaffUser(username);
  const client = getSupabase();
  if (!client) return { ok: true, deleted: username };

  const cleanUsername = username.toLowerCase().trim();
  const cleanEmail = `${cleanUsername}@kennybrew.com`;

  try {
    await client
      .from('users')
      .delete()
      .or(`email.eq.${cleanEmail},email.eq.${cleanUsername}`);
  } catch {}
  return { ok: true, deleted: username };
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

    // 3. Insert items into `orders_items` table
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

      // 4. Record stock deductions into `inventory` table and update `products.stock_qty`
      for (const it of order.items) {
        const prodId = parseInt(String(it.product.id).replace(/\D/g, '')) || 1;
        const qty = Number(it.quantity) || 1;

        try {
          await client.from('inventory').insert([{
            product_id: prodId,
            quantity_change: -qty,
            transaction_type: 'Sale',
            date: order.createdAt || new Date().toISOString(),
          }]);
        } catch (invErr) {
          console.warn('Inventory log notice:', invErr);
        }

        try {
          const { data: prodData } = await client
            .from('products')
            .select('stock_qty')
            .eq('product_id', prodId)
            .limit(1);

          if (prodData && prodData[0]) {
            const currentStock = Number(prodData[0].stock_qty) || 100;
            const newStock = Math.max(0, currentStock - qty);
            await client
              .from('products')
              .update({
                stock_qty: newStock,
                status: newStock > 0 ? 'Available' : 'Sold Out',
              })
              .eq('product_id', prodId);
          }
        } catch (stockErr) {
          console.warn('Product stock update notice:', stockErr);
        }
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
