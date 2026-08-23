// There's no live product catalog in this project (out of scope for the time
// budget), so voice price-range filtering ("find toothpaste under $5") is
// demoed against a deterministic placeholder price per item name. Swap
// `estimatedPrice` for a real catalog/pricing API call in production.
export function estimatedPrice(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000
  }
  const price = 1 + (hash % 1400) / 100 // roughly $1.00 - $15.00
  return Math.round(price * 100) / 100
}
