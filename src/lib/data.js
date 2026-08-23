// Static reference data used for categorization, seasonal picks, and substitutes.
// This is intentionally simple/rule-based so the app runs entirely client-side
// with zero API cost, per the "free tier / technical freedom" brief.

// Keyword lists include English plus Spanish, French, Hindi, and Tamil terms
// for the most common items, so voice commands spoken in those languages
// still land in the right aisle. This covers the common-item set rather than
// full translation coverage — see README limitations.
export const CATEGORY_MAP = {
  dairy: [
    'milk', 'cheese', 'butter', 'yogurt', 'yoghurt', 'cream', 'paneer', 'ghee',
    'leche', 'queso', 'mantequilla', 'lait', 'fromage', 'beurre',
    'दूध', 'पनीर', 'मक्खन', 'दही', 'பால்', 'சீஸ்', 'வெண்ணெய்',
  ],
  produce: [
    'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'tomato', 'tomatoes',
    'onion', 'onions', 'potato', 'potatoes', 'lettuce', 'spinach', 'carrot', 'carrots',
    'grape', 'grapes', 'mango', 'mangoes', 'garlic', 'ginger', 'lemon', 'lemons',
    'cucumber', 'pepper', 'peppers', 'broccoli',
    'manzana', 'plátano', 'platano', 'naranja', 'tomate', 'cebolla', 'patata',
    'pomme', 'banane', 'orange', 'tomate', 'oignon', 'pomme de terre',
    'सेब', 'केला', 'संतरा', 'टमाटर', 'प्याज', 'आलू',
    'ஆப்பிள்', 'வாழைப்பழம்', 'ஆரஞ்சு', 'தக்காளி', 'வெங்காயம்', 'உருளைக்கிழங்கு',
  ],
  bakery: [
    'bread', 'bun', 'buns', 'bagel', 'bagels', 'croissant', 'croissants', 'cake',
    'pan', 'pain', 'ब्रेड', 'रोटी', 'ரொட்டி',
  ],
  snacks: ['chips', 'cookies', 'biscuits', 'crackers', 'popcorn', 'chocolate', 'nuts'],
  beverages: [
    'water', 'juice', 'soda', 'coffee', 'tea', 'coke', 'cola',
    'agua', 'café', 'cafe', 'té', 'eau', 'thé',
    'पानी', 'कॉफी', 'चाय', 'தண்ணீர்', 'காபி', 'தேநீர்',
  ],
  pantry: [
    'rice', 'flour', 'sugar', 'salt', 'oil', 'pasta', 'noodles', 'cereal', 'honey',
    'jam', 'sauce', 'ketchup', 'vinegar', 'spice', 'spices',
    'arroz', 'azúcar', 'azucar', 'sal', 'aceite', 'riz', 'sucre', 'sel', 'huile',
    'चावल', 'चीनी', 'नमक', 'तेल', 'அரிசி', 'சர்க்கரை', 'உப்பு', 'எண்ணெய்',
  ],
  household: [
    'toothpaste', 'soap', 'shampoo', 'detergent', 'tissue', 'tissues', 'paper towels',
    'pasta de dientes', 'jabón', 'jabon', 'dentifrice', 'savon',
    'टूथपेस्ट', 'साबुन', 'பல் பசை', 'சோப்பு',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'fish', 'egg', 'eggs', 'shrimp', 'mutton',
    'pollo', 'huevo', 'huevos', 'poulet', 'œuf', 'oeuf',
    'चिकन', 'अंडा', 'கோழி', 'முட்டை',
  ],
}

export function categorize(itemName) {
  const name = itemName.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => name.includes(kw))) return category
  }
  return 'other'
}

export const CATEGORY_LABELS = {
  dairy: 'Dairy',
  produce: 'Produce',
  bakery: 'Bakery',
  snacks: 'Snacks',
  beverages: 'Beverages',
  pantry: 'Pantry',
  household: 'Household',
  meat: 'Meat & Eggs',
  other: 'Other',
}

// Substitute suggestions offered when an item is unavailable or as a proactive nudge.
export const SUBSTITUTES = {
  milk: ['almond milk', 'oat milk', 'soy milk'],
  butter: ['margarine', 'ghee'],
  sugar: ['honey', 'jaggery', 'stevia'],
  rice: ['quinoa', 'couscous'],
  bread: ['tortillas', 'pita bread'],
  chicken: ['tofu', 'paneer'],
  pasta: ['zucchini noodles', 'rice noodles'],
  coffee: ['green tea', 'chicory coffee'],
}

// A small rotating "in season" list, keyed loosely by month-of-year buckets.
// In a production build this would come from a live catalog/pricing API.
const SEASONAL_BY_SEASON = {
  winter: ['oranges', 'carrots', 'spinach', 'sweet potatoes'],
  spring: ['strawberries', 'peas', 'asparagus', 'lettuce'],
  summer: ['mangoes', 'watermelon', 'cucumber', 'corn'],
  autumn: ['apples', 'pumpkin', 'grapes', 'broccoli'],
}

export function getSeasonalPicks(date = new Date()) {
  const month = date.getMonth() // 0-11
  let season = 'winter'
  if (month >= 2 && month <= 4) season = 'spring'
  else if (month >= 5 && month <= 7) season = 'summer'
  else if (month >= 8 && month <= 10) season = 'autumn'
  return SEASONAL_BY_SEASON[season]
}

// Languages exposed in the UI language picker. `speech` is the BCP-47 tag passed
// to the Web Speech API; parsing itself currently understands English phrasing.
export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
]
