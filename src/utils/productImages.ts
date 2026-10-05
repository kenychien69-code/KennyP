// Curated high-resolution imagery for KENNY Brew Intelligence products
// Combines local generated assets with reliable photography for coffee, teas, and bakery items

const LOCAL_ASSETS = {
  latte: '/src/assets/images/product_iced_latte_1790251970538.jpg',
  matcha: '/src/assets/images/product_matcha_tea_1790252121876.jpg',
  fruitTea: '/src/assets/images/product_fruit_tea_1790252133464.jpg',
  cafe: '/src/assets/images/login_hero_cafe_1790252144418.jpg',
  boba: '/product-boba-tea.jpg',
};

// High-fidelity coffee & beverage photography
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Spanish Latte
  'spanish latte': LOCAL_ASSETS.latte,
  'spanish latte (16oz)': LOCAL_ASSETS.latte,

  // Caramel Macchiato
  'caramel macchiato':
    'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
  'caramel macchiato (16oz)':
    'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',

  // Americano
  'americano':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'americano (16oz)':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'classic americano':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',

  // Vanilla Cold Brew
  'vanilla cold brew':
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  'vanilla cold brew (16oz)':
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  'cold brew':
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',

  // Brown Sugar Boba Milk Tea & Okinawa Milk Tea
  'brown sugar boba milk tea': LOCAL_ASSETS.boba,
  'boba milk tea': LOCAL_ASSETS.boba,
  'okinawa milk tea with boba': LOCAL_ASSETS.boba,
  'okinawa milk tea': LOCAL_ASSETS.boba,
  'milk tea': LOCAL_ASSETS.boba,

  // Matcha Latte
  'matcha green tea latte': LOCAL_ASSETS.matcha,
  'matcha latte': LOCAL_ASSETS.matcha,
  'matcha': LOCAL_ASSETS.matcha,

  // Butter Croissant
  'butter croissant':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
  'artisan butter croissant':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
  'croissant':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',

  // Blueberry Cream Muffin
  'blueberry cream muffin':
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80',
  'blueberry muffin':
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80',
  'muffin':
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80',

  // Fruit Tea
  'strawberry peach fruit tea': LOCAL_ASSETS.fruitTea,
  'fruit tea': LOCAL_ASSETS.fruitTea,

  // Iced Latte
  'iced latte': LOCAL_ASSETS.latte,
  'latte': LOCAL_ASSETS.latte,
};

// Fallback images by category ID or name
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'cat-1':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', // Espresso
  'cat-espresso':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'cat-2': LOCAL_ASSETS.latte, // Iced Coffee
  'cat-3': LOCAL_ASSETS.boba, // Milk Tea
  'cat-tea': LOCAL_ASSETS.boba,
  'cat-fruit': LOCAL_ASSETS.fruitTea,
  'cat-4':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', // Pastry
  'cat-pastry':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
};

/**
 * Returns a high-definition, verified image URL for a given product.
 * Checks existing valid image first, then matches by exact/fuzzy product name,
 * and finally falls back to category imagery.
 */
export function getProductImageUrl(
  name?: string,
  categoryId?: string,
  currentImage?: string
): string {
  // If current image is a valid non-empty string, not broken Unsplash URL, and not placeholder
  if (
    currentImage &&
    currentImage.trim().length > 5 &&
    !currentImage.includes('photo-1558857563-b37cf5a9c086') &&
    !currentImage.includes('[object')
  ) {
    return currentImage.trim();
  }

  const cleanName = (name || '').trim().toLowerCase();

  // Direct exact match
  if (PRODUCT_IMAGE_MAP[cleanName]) {
    return PRODUCT_IMAGE_MAP[cleanName];
  }

  // Keyword-based search
  if (cleanName.includes('spanish')) return PRODUCT_IMAGE_MAP['spanish latte'];
  if (cleanName.includes('caramel') || cleanName.includes('macchiato'))
    return PRODUCT_IMAGE_MAP['caramel macchiato'];
  if (cleanName.includes('americano')) return PRODUCT_IMAGE_MAP['americano'];
  if (cleanName.includes('cold brew')) return PRODUCT_IMAGE_MAP['vanilla cold brew'];
  if (cleanName.includes('boba') || cleanName.includes('brown sugar') || cleanName.includes('milk tea'))
    return PRODUCT_IMAGE_MAP['brown sugar boba milk tea'];
  if (cleanName.includes('matcha')) return PRODUCT_IMAGE_MAP['matcha green tea latte'];
  if (cleanName.includes('croissant')) return PRODUCT_IMAGE_MAP['butter croissant'];
  if (cleanName.includes('muffin')) return PRODUCT_IMAGE_MAP['blueberry cream muffin'];
  if (cleanName.includes('fruit') || cleanName.includes('peach') || cleanName.includes('strawberry'))
    return PRODUCT_IMAGE_MAP['strawberry peach fruit tea'];
  if (cleanName.includes('latte') || cleanName.includes('cappuccino'))
    return LOCAL_ASSETS.latte;

  // Category based match
  if (categoryId && CATEGORY_FALLBACK_IMAGES[categoryId]) {
    return CATEGORY_FALLBACK_IMAGES[categoryId];
  }

  // Universal Default
  return LOCAL_ASSETS.latte;
}
