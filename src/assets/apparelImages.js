/**
 * apparelImages.js
 * Curated high-resolution editorial fashion and apparel manufacturing photography (Unsplash).
 * High quality fashion images specifically mapped to our apparel categories:
 * - Shirt: Tailored Oxford Cotton Shirt
 * - Pant: Slim-Fit Stretch Chino Trouser
 * - Jersey: Pro-Performance Breathable Jersey
 * - Shorts: French Terry Relaxed Fit Shorts
 * - Dress: Atelier Silk Midi Dress
 * - Jacket: Structured Double-Breasted Blazer
 * - Knitwear: Fine Cashmere Crewneck
 */

// Hero Editorial Showcase
export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85';

// Curated Category & Product Image Map
export const CATEGORY_IMAGES = {
  shirt:
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85',
  pant:
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85',
  shorts:
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=85',
  jersey:
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85',
  dress:
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85',
  jacket:
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85',
  knitwear:
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=85',
  manufacturing:
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85',
};

// Preset Gallery for Admin Product Management
export const PRESET_APPAREL_IMAGES = [
  { label: 'Oxford Shirt', url: CATEGORY_IMAGES.shirt },
  { label: 'Chino Pant', url: CATEGORY_IMAGES.pant },
  { label: 'Athletic Shorts', url: CATEGORY_IMAGES.shorts },
  { label: 'Pro Jersey', url: CATEGORY_IMAGES.jersey },
  { label: 'Silk Dress', url: CATEGORY_IMAGES.dress },
  { label: 'Tailored Blazer', url: CATEGORY_IMAGES.jacket },
  { label: 'Cashmere Knit', url: CATEGORY_IMAGES.knitwear },
];

/**
 * Returns a high-quality fashion image based on the product.
 * Prioritizes stored image_url / imageUrl from database.
 */
export const getProductImage = (product) => {
  if (product?.image_url) return product.image_url;
  if (product?.imageUrl) return product.imageUrl;

  const categorySlug = (product?.category?.slug || product?.category?.name || '').toLowerCase();
  const name = (product?.name || '').toLowerCase();

  if (categorySlug.includes('shirt') || name.includes('shirt')) {
    return CATEGORY_IMAGES.shirt;
  }
  if (categorySlug.includes('pant') || name.includes('pant') || name.includes('trouser') || name.includes('chino')) {
    return CATEGORY_IMAGES.pant;
  }
  if (categorySlug.includes('jersey') || name.includes('jersey')) {
    return CATEGORY_IMAGES.jersey;
  }
  if (categorySlug.includes('short') || name.includes('short')) {
    return CATEGORY_IMAGES.shorts;
  }
  if (categorySlug.includes('dress') || name.includes('dress') || name.includes('gown')) {
    return CATEGORY_IMAGES.dress;
  }
  if (categorySlug.includes('jacket') || name.includes('blazer') || name.includes('coat')) {
    return CATEGORY_IMAGES.jacket;
  }

  return CATEGORY_IMAGES.shirt;
};
