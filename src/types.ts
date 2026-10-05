export type UserRole = 'owner' | 'cashier';

export interface User {
  id?: string;
  username: string;
  role: UserRole;
  fullName: string;
  roleTitle?: string;
  status?: 'Active' | 'Inactive';
  lastLogin?: string;
  createdAt?: string;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface RecipeRequirement {
  ingredientId: string;
  amount: number; // in unit (e.g. 18g espresso, 200ml milk, 1 cup)
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
  salesWeight: number; // probability weight for forecasting
  recipe: RecipeRequirement[];
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'Coffee' | 'Tea' | 'Dairy' | 'Dairy Alternative' | 'Syrup' | 'Topping' | 'Packaging';
  unit: 'g' | 'ml' | 'pcs';
  currentStock: number;
  reorderLevel: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
}

export interface CartItem {
  id: string; // unique item uuid in cart
  product: Product;
  quantity: number;
  size: '16oz Regular' | '22oz Large';
  sweetness: '0%' | '25%' | '50%' | '75%' | '100%';
  ice: 'No Ice' | 'Less Ice' | 'Regular Ice' | 'Extra Ice';
  addons: string[];
  unitPrice: number;
  lineTotal: number;
}

export type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Card';

export interface Order {
  id: string;
  orderNumber: number;
  cashierName: string;
  customerName: string;
  orderType: 'Dine In' | 'Take Out' | 'Delivery';
  items: CartItem[];
  subtotal: number;
  discountType: 'None' | 'Senior/PWD (20%)' | 'Student (10%)' | 'Promo (15%)';
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  createdAt: string;
  status: 'Completed' | 'Pending' | 'Void';
}

export interface DailySalesRecord {
  date: string; // YYYY-MM-DD
  total: number;
  ordersCount: number;
}

export interface ForecastDay {
  dayOffset: number;
  date: string;
  dayName: string;
  projectedSales: number;
  confidenceLower: number;
  confidenceUpper: number;
  expectedOrders: number;
}

export interface ProductDemandForecast {
  id: string;
  name: string;
  category: string;
  price: number;
  expectedWeeklyUnits: number;
  demandLevel: 'HIGH' | 'MEDIUM' | 'NORMAL';
  stockStatus: 'OK' | 'RESTOCK_RECOMMENDED';
}

export interface IngredientReorderRecommendation {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  status: 'CRITICAL_LOW' | 'LOW_STOCK' | 'ADEQUATE';
  recommendedOrderQty: number;
  estimatedDepletionDays: number;
}

export interface StaffingShiftRecommendation {
  shift: string;
  expectedCustomersHr: number;
  recommendedBaristas: number;
  recommendedCashiers: number;
  priority: string;
}

export interface SalesAnomaly {
  date: string;
  total: number;
  type: 'SPIKE' | 'DROP';
  note: string;
}

export interface ForecastResult {
  engine: string;
  generatedAt: string;
  summary: {
    averageRecentDaily: number;
    next7DayExpectedAvg: number;
    total7DayForecast: number;
    topExpectedProduct: string;
    trendSignalPct: number;
    demandLevel: 'HIGH' | 'STABLE' | 'MODERATE';
    planningSuggestion: string;
  };
  next7Days: ForecastDay[];
  productForecasts: ProductDemandForecast[];
  ingredientReorders: IngredientReorderRecommendation[];
  staffingSchedule: StaffingShiftRecommendation[];
  anomalies: SalesAnomaly[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
