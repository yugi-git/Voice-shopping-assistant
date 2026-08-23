export default function SearchResults({ query, priceRange, results, onAdd, onClose }) {
  return (
    <div className="search-results" role="dialog" aria-label="Search results">
      <div className="search-results__header">
        <h4>
          Results for "{query}"
          {priceRange?.max != null && ` under $${priceRange.max.toFixed(2)}`}
          {priceRange?.min != null && priceRange.max == null && ` over $${priceRange.min.toFixed(2)}`}
        </h4>
        <button type="button" className="search-results__close" onClick={onClose} aria-label="Close search results">
          ✕
        </button>
      </div>
      {results.length === 0 ? (
        <p className="search-results__empty">No matches. Try a different item or price range.</p>
      ) : (
        <ul className="search-results__list">
          {results.map((r) => (
            <li key={r.name} className="search-results__item">
              <span>{r.name}</span>
              <span className="search-results__price">${r.price.toFixed(2)}</span>
              <button type="button" className="chip" onClick={() => onAdd(r.name)}>
                + Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
