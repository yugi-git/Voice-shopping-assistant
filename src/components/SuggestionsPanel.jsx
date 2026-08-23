import { getSeasonalPicks, SUBSTITUTES } from '../lib/data'

export default function SuggestionsPanel({ runningLow, currentItemNames, onAdd }) {
  const seasonal = getSeasonalPicks().filter((s) => !currentItemNames.has(s))

  const substituteEntries = Object.entries(SUBSTITUTES).filter(([base]) =>
    currentItemNames.has(base)
  )

  const hasAnything = runningLow.length > 0 || seasonal.length > 0 || substituteEntries.length > 0

  if (!hasAnything) {
    return (
      <div className="suggestions suggestions--empty">
        <p>Suggestions will appear here as you build your list.</p>
      </div>
    )
  }

  return (
    <div className="suggestions">
      {runningLow.length > 0 && (
        <div className="suggestion-block">
          <h4>Running low?</h4>
          <p className="suggestion-block__hint">
            You've bought these before but they're not on your list.
          </p>
          <div className="chip-row">
            {runningLow.map((name) => (
              <button key={name} className="chip" onClick={() => onAdd(name)}>
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {seasonal.length > 0 && (
        <div className="suggestion-block">
          <h4>In season now</h4>
          <div className="chip-row">
            {seasonal.map((name) => (
              <button key={name} className="chip chip--seasonal" onClick={() => onAdd(name)}>
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {substituteEntries.length > 0 && (
        <div className="suggestion-block">
          <h4>Try a substitute</h4>
          {substituteEntries.map(([base, subs]) => (
            <div key={base} className="substitute-row">
              <span className="substitute-row__base">{base} →</span>
              <div className="chip-row">
                {subs.map((name) => (
                  <button key={name} className="chip chip--sub" onClick={() => onAdd(name)}>
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
