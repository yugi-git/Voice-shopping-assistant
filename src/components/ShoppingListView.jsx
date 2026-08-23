import { CATEGORY_LABELS } from '../lib/data'

function groupByCategory(items) {
  const groups = {}
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
}

export default function ShoppingListView({ items, onRemove, onQuantityChange }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Your list is empty.</p>
        <p className="empty-state__hint">
          Try saying "add milk" or "I need three apples."
        </p>
      </div>
    )
  }

  const groups = groupByCategory(items)
  const orderedCategories = Object.keys(groups).sort((a, b) =>
    CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b])
  )

  return (
    <div className="list-groups">
      {orderedCategories.map((category) => (
        <section key={category} className="list-group">
          <h3 className="list-group__title">{CATEGORY_LABELS[category]}</h3>
          <ul className="list-group__items">
            {groups[category].map((item) => (
              <li key={item.id} className="list-item">
                <span className="list-item__name">{item.name}</span>
                <div className="list-item__controls">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="list-item__qty">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onRemove(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
