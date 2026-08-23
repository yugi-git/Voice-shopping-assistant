// Locale-aware, dependency-free intent parser. It normalizes varied phrasing
// ("I need apples" / "add apples" / "I want to buy bananas", and their
// equivalents in Spanish, French, Hindi, and Tamil) into a single intent
// shape the app can act on. This runs fully client-side (no API cost),
// which fits the "any free tier" constraint in the brief.
//
// English/Spanish/French are SVO — the verb ("add"/"añade"/"ajoute") comes
// BEFORE the item, so those locales match a leading prefix pattern and take
// everything after it as the item.
//
// Hindi and Tamil are SOV — the verb comes AFTER the item ("दूध जोड़ो" is
// literally "milk add", "பால் சேர்" is "milk add"). Those locales match a
// trailing suffix pattern instead and take everything before it as the item.
// Trying to reuse the English prefix patterns for these languages would
// silently fail to recognize almost anything, so word order is a first-class
// setting per locale rather than an afterthought.

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Boundary-safe phrase matcher that works for space-separated scripts
// generally (Latin, Devanagari, Tamil) without relying on \b, which is only
// reliable for ASCII word characters in JS regex.
function phraseRegex(phrase) {
  return new RegExp('(?:^|\\s)' + escapeRegExp(phrase) + '(?=\\s|$)')
}

const LOCALES = {
  en: {
    wordOrder: 'prefix',
    leadingFillers: [],
    addPatterns: [
      /^i (?:would like to |want to |need to |wanna |gotta )?(?:add|buy|get|pick up|grab)\b/,
      /^i need\b/,
      /^i want\b/,
      /^please add\b/,
      /^add\b/,
      /^buy\b/,
      /^get\b/,
      /^put\b/,
    ],
    removePatterns: [
      /^(?:please )?remove\b/,
      /^(?:please )?delete\b/,
      /^take .* off\b/,
      /^i don'?t need\b/,
    ],
    searchPatterns: [/^(?:find|search for|look for|show me)\b/],
    postSearchStrip: /^me\b/,
    addFallbackRegex: /\badd\b|\bbuy\b|\bneed\b|\bwant\b/,
    numberWords: {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      a: 1, an: 1, couple: 2, few: 3, dozen: 12,
    },
    unitOfRegex: /\b(?:bottles?|cans?|boxes?|bags?|packs?|packets?|jars?|loaves?|loaf|dozen)\s+of\b/gi,
    listRegexes: [/\bto (?:my|the) (?:shopping )?list\b/gi, /\bfrom (?:my|the) (?:shopping )?list\b/gi, /\bmy list\b/gi],
    priceUnder: /(?:under|below|less than)\s*\$?(\d+(?:\.\d+)?)/i,
    priceOver: /(?:over|above|more than)\s*\$?(\d+(?:\.\d+)?)/i,
    priceBetween: /between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)/i,
  },

  es: {
    wordOrder: 'prefix',
    leadingFillers: [/^yo\s+/, /^por favor\s+/],
    addPatterns: [
      /^(?:quiero comprar|necesito comprar)\b/,
      /^(?:quiero|necesito)\b/,
      /^a[nñ]ade\b/,
      /^agrega\b/,
      /^compra\b/,
      /^pon\b/,
    ],
    removePatterns: [/^quita\b/, /^elimina\b/, /^borra\b/, /^saca\b/, /^no necesito\b/],
    searchPatterns: [/^(?:busca|buscar|encuentra|mu[eé]strame)\b/],
    postSearchStrip: null,
    addFallbackRegex: /\ba[nñ]ade\b|\bagrega\b|\bcompra\b|\bnecesito\b|\bquiero\b/,
    numberWords: {
      un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
      nueve: 9, diez: 10, par: 2, docena: 12,
    },
    unitOfRegex: /(?:botellas?|latas?|cajas?|bolsas?|paquetes?|frascos?)\s+de\b/gi,
    listRegexes: [/\ba mi lista\b/g, /\ba la lista\b/g, /\bde mi lista\b/g, /\bde la lista\b/g, /\bmi lista\b/g],
    leadingArticles: /^(?:el|la|los|las|un|una|unos|unas)\s+/,
    priceUnder: /(?:por\s+menos de|menos de|por debajo de)\s*\$?(\d+(?:[.,]\d+)?)/i,
    priceOver: /(?:por\s+m[aá]s de|m[aá]s de|por encima de)\s*\$?(\d+(?:[.,]\d+)?)/i,
    priceBetween: /entre\s*\$?(\d+(?:[.,]\d+)?)\s*y\s*\$?(\d+(?:[.,]\d+)?)/i,
  },

  fr: {
    wordOrder: 'prefix',
    leadingFillers: [/^s'il te pla[iî]t\s+/, /^s'il vous pla[iî]t\s+/],
    addPatterns: [
      /^j'ai besoin d['e]\s*/,
      /^je veux acheter\b/,
      /^je veux\b/,
      /^ajoute\b/,
      /^ach[eè]te\b/,
      /^prends\b/,
      /^mets\b/,
    ],
    removePatterns: [/^enl[eè]ve\b/, /^supprime\b/, /^retire\b/, /^je n'ai pas besoin d['e]\s*/],
    searchPatterns: [/^(?:cherche|trouve|montre-moi)\b/],
    postSearchStrip: null,
    addFallbackRegex: /\bajoute\b|\bach[eè]te\b|\bbesoin\b|\bveux\b/,
    numberWords: {
      un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
      dix: 10, paire: 2, douzaine: 12,
    },
    unitOfRegex: /(?:bouteilles?|bo[iî]tes?|sacs?|paquets?|pots?)\s+de\b/gi,
    listRegexes: [/\b[aà] ma liste\b/g, /\b[aà] la liste\b/g, /\bde ma liste\b/g, /\bde la liste\b/g, /\bma liste\b/g],
    leadingArticles: /^(?:le|la|les|l'|du|de la|des|un|une)\s+/,
    priceUnder: /(?:moins de|en dessous de)\s*\$?(\d+(?:[.,]\d+)?)/i,
    priceOver: /(?:plus de|au-dessus de)\s*\$?(\d+(?:[.,]\d+)?)/i,
    priceBetween: /entre\s*\$?(\d+(?:[.,]\d+)?)\s*et\s*\$?(\d+(?:[.,]\d+)?)/i,
  },

  // Hindi — verb-final. "दूध जोड़ो" = "milk add"; the intent marker is a
  // suffix, so we match at the end of the string and keep everything before it.
  hi: {
    wordOrder: 'suffix',
    leadingFillers: [/^मुझे\s+/, /^कृपया\s+/],
    addPatterns: [/(?:जोड़ो|जोड़ें)$/, /चाहिए$/, /(?:डालो|डालें)$/, /(?:लाओ|लाना है)$/, /(?:खरीदना है|खरीदो)$/, /ऐड करो$/],
    removePatterns: [/(?:हटाओ|हटाएं)$/, /निकालो$/, /नहीं चाहिए$/],
    searchPatterns: [/(?:ढूंढो|ढूंढें)$/, /खोजो$/, /दिखाओ$/],
    postSearchStrip: null,
    addFallbackRegex: /जोड़|चाहिए|खरीद|लाओ/,
    numberWords: { एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10 },
    leadingUnitWords: ['बोतल', 'डिब्बा', 'पैकेट', 'बैग', 'थैली'],
    listRegexes: [/मेरी सूची में/g, /मेरी लिस्ट में/g, /सूची से/g, /लिस्ट से/g, /मेरी सूची/g, /मेरी लिस्ट/g],
    priceUnder: /(\d+(?:\.\d+)?)\s*(?:रुपये|रुपए|रु)?\s*से\s*कम/,
    priceOver: /(\d+(?:\.\d+)?)\s*(?:रुपये|रुपए|रु)?\s*से\s*(?:ज़्यादा|ज्यादा|अधिक)/,
    priceBetween: /(\d+(?:\.\d+)?)\s*(?:और|से)\s*(\d+(?:\.\d+)?)\s*(?:रुपये|रुपए)?\s*के\s*बीच/,
  },

  // Tamil — also verb-final. "பால் சேர்" = "milk add".
  ta: {
    wordOrder: 'suffix',
    leadingFillers: [/^எனக்கு\s+/],
    addPatterns: [/(?:சேர்|சேர்க்க)$/, /வேண்டும்$/, /(?:வாங்க வேண்டும்|வாங்கு)$/, /போடு$/],
    removePatterns: [/(?:நீக்கு|எடு)$/, /தேவையில்லை$/],
    searchPatterns: [/(?:தேடு|கண்டுபிடி|காட்டு)$/],
    postSearchStrip: null,
    addFallbackRegex: /சேர்|வேண்டும்|வாங்கு|போடு/,
    numberWords: { ஒன்று: 1, ஒரு: 1, இரண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5, ஆறு: 6, ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10 },
    leadingUnitWords: ['பாட்டில்', 'பெட்டி', 'பாக்கெட்', 'பை'],
    listRegexes: [/என் பட்டியலில்/g, /பட்டியலில் இருந்து/g, /என் பட்டியல்/g],
    priceUnder: /(\d+(?:\.\d+)?)\s*(?:ரூபாய்க்கு)?\s*கீழ்/,
    priceOver: /(\d+(?:\.\d+)?)\s*(?:ரூபாய்க்கு)?\s*மேல்/,
    priceBetween: /(\d+(?:\.\d+)?)\s*(?:மற்றும்|முதல்)\s*(\d+(?:\.\d+)?)\s*(?:க்கு)?\s*இடையில்/,
  },
}

function localeFor(langCode) {
  const key = (langCode || 'en').split('-')[0].toLowerCase()
  return LOCALES[key] || LOCALES.en
}

function stripLeadingFillers(text, locale) {
  let out = text
  for (const re of locale.leadingFillers || []) {
    out = out.replace(re, '')
  }
  return out.trim()
}

// Tries each pattern; for prefix locales, returns the text AFTER the match.
// For suffix locales, returns the text BEFORE the match. Returns null if
// nothing matched (i.e. this intent wasn't recognized).
function matchIntent(text, patterns, wordOrder) {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      return wordOrder === 'suffix' ? text.slice(0, m.index).trim() : text.slice(m.index + m[0].length).trim()
    }
  }
  return null
}

function extractQuantity(text, numberWords) {
  const digitMatch = text.match(/\d+/)
  if (digitMatch) {
    return { quantity: parseInt(digitMatch[0], 10), rest: text.replace(digitMatch[0], '').trim(), explicit: true }
  }
  for (const [word, value] of Object.entries(numberWords)) {
    const re = phraseRegex(word)
    if (re.test(text)) {
      return { quantity: value, rest: text.replace(re, ' ').replace(/\s{2,}/g, ' ').trim(), explicit: true }
    }
  }
  return { quantity: 1, rest: text, explicit: false }
}

function stripUnits(text, locale) {
  if (locale.unitOfRegex) {
    return text.replace(locale.unitOfRegex, '').replace(/\s{2,}/g, ' ').trim()
  }
  if (locale.leadingUnitWords) {
    const tokens = text.split(/\s+/).filter(Boolean)
    if (tokens.length > 1 && locale.leadingUnitWords.includes(tokens[0])) {
      return tokens.slice(1).join(' ')
    }
  }
  return text
}

function extractPriceRange(text, locale) {
  if (locale.priceBetween) {
    const m = text.match(locale.priceBetween)
    if (m) return { min: parseFloat(m[1].replace(',', '.')), max: parseFloat(m[2].replace(',', '.')) }
  }
  if (locale.priceUnder) {
    const m = text.match(locale.priceUnder)
    if (m) return { max: parseFloat(m[1].replace(',', '.')) }
  }
  if (locale.priceOver) {
    const m = text.match(locale.priceOver)
    if (m) return { min: parseFloat(m[1].replace(',', '.')) }
  }
  return null
}

function stripPricePhrase(text, locale) {
  let out = text
  if (locale.priceBetween) out = out.replace(locale.priceBetween, '')
  if (locale.priceUnder) out = out.replace(locale.priceUnder, '')
  if (locale.priceOver) out = out.replace(locale.priceOver, '')
  return out.replace(/\s{2,}/g, ' ').trim()
}

function cleanItemName(text, locale) {
  let out = text
  for (const re of locale.listRegexes || []) {
    out = out.replace(re, ' ')
  }
  out = out.replace(/\s{2,}/g, ' ').trim()
  if (locale.leadingArticles) {
    out = out.replace(locale.leadingArticles, '').trim()
  }
  return out
}

/**
 * Parse a raw transcript into a structured intent. `langCode` should match
 * the BCP-47 tag used for recognition (e.g. 'hi-IN', 'ta-IN', 'es-ES',
 * 'fr-FR'); unrecognized codes fall back to English parsing.
 * Returns: { type: 'add'|'remove'|'search'|'unknown', item, quantity, priceRange, raw }
 */
export function parseCommand(rawTranscript, langCode = 'en-US') {
  const locale = localeFor(langCode)
  const raw = rawTranscript.trim()
  let text = raw.toLowerCase().replace(/[.,!?।]+$/, '')
  text = stripLeadingFillers(text, locale)

  if (!text) return { type: 'unknown', item: '', quantity: null, priceRange: null, raw }

  // Remove intent
  let rest = matchIntent(text, locale.removePatterns, locale.wordOrder)
  if (rest !== null) {
    rest = cleanItemName(rest, locale)
    const { quantity, rest: afterQty, explicit } = extractQuantity(rest, locale.numberWords)
    const item = stripUnits(afterQty, locale)
    return { type: 'remove', item, quantity: explicit ? quantity : null, priceRange: null, raw }
  }

  // Search intent
  rest = matchIntent(text, locale.searchPatterns, locale.wordOrder)
  if (rest !== null) {
    if (locale.postSearchStrip) rest = rest.replace(locale.postSearchStrip, '').trim()
    const priceRange = extractPriceRange(rest, locale)
    rest = stripPricePhrase(rest, locale)
    rest = cleanItemName(rest, locale)
    return { type: 'search', item: rest, quantity: null, priceRange, raw }
  }

  // Add intent (default assumption for most phrasings, matches brief's examples)
  rest = matchIntent(text, locale.addPatterns, locale.wordOrder)
  if (rest !== null) {
    rest = cleanItemName(rest, locale)
    const { quantity, rest: afterQty } = extractQuantity(rest, locale.numberWords)
    const item = stripUnits(afterQty, locale)
    return { type: 'add', item, quantity, priceRange: null, raw }
  }

  // Unmatched phrasing that still contains an add-ish keyword somewhere
  if (locale.addFallbackRegex && locale.addFallbackRegex.test(text)) {
    let fallbackRest = cleanItemName(text, locale)
    const { quantity, rest: afterQty } = extractQuantity(fallbackRest, locale.numberWords)
    const item = stripUnits(afterQty, locale)
    return { type: 'add', item, quantity, priceRange: null, raw }
  }

  if (text.length > 0) {
    // Bare item name, e.g. just "milk" / "दूध" / "leche"
    return { type: 'add', item: cleanItemName(text, locale), quantity: 1, priceRange: null, raw }
  }

  return { type: 'unknown', item: '', quantity: null, priceRange: null, raw }
}
