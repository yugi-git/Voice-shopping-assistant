import { useCallback, useRef, useState } from 'react'
import MicButton from './components/MicButton'
import LanguageSelect from './components/LanguageSelect'
import CommandLog from './components/CommandLog'
import ShoppingListView from './components/ShoppingListView'
import SuggestionsPanel from './components/SuggestionsPanel'
import SearchResults from './components/SearchResults'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useShoppingList } from './hooks/useShoppingList'
import { parseCommand } from './lib/nlp'
import { CATEGORY_MAP } from './lib/data'
import { estimatedPrice } from './lib/pricing'
import SyncBadge from './components/SyncBadge'
import './App.css'

const ALL_KNOWN_ITEMS = Array.from(new Set(Object.values(CATEGORY_MAP).flat()))

function searchCatalog(query, priceRange) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return ALL_KNOWN_ITEMS.filter((name) => name.includes(q) || q.includes(name))
    .map((name) => ({ name, price: estimatedPrice(name) }))
    .filter((r) => {
      if (!priceRange) return true
      if (priceRange.min != null && r.price < priceRange.min) return false
      if (priceRange.max != null && r.price > priceRange.max) return false
      return true
    })
    .slice(0, 8)
}

export default function App() {
  const [lang, setLang] = useState('en-US')
  const [logEntries, setLogEntries] = useState([])
  const [manualInput, setManualInput] = useState('')
  const [search, setSearch] = useState(null) // { query, priceRange, results }
  const logIdRef = useRef(0)

  const {
    items,
    addItem,
    removeItem,
    removeById,
    updateQuantity,
    runningLowSuggestions,
    isFirebaseConfigured,
    syncStatus,
  } = useShoppingList()

  const pushLog = useCallback((message, status = 'ok') => {
    logIdRef.current += 1
    const entry = { id: logIdRef.current, message, status }
    setLogEntries((prev) => [entry, ...prev].slice(0, 6))
  }, [])

  const handleCommand = useCallback(
    (transcript) => {
      const intent = parseCommand(transcript, lang)

      if (intent.type === 'add' && intent.item) {
        addItem(intent.item, intent.quantity || 1)
        pushLog(`Added ${intent.quantity > 1 ? `${intent.quantity} ` : ''}${intent.item}`)
        setSearch(null)
        return
      }

      if (intent.type === 'remove' && intent.item) {
        const result = removeItem(intent.item, intent.quantity)
        if (result.removed) {
          pushLog(`Removed ${intent.quantity ? `${intent.quantity} ` : ''}${result.name}`)
        } else {
          pushLog(`Couldn't find "${intent.item}" on your list`, 'error')
        }
        setSearch(null)
        return
      }

      if (intent.type === 'search' && intent.item) {
        const results = searchCatalog(intent.item, intent.priceRange)
        setSearch({ query: intent.item, priceRange: intent.priceRange, results })
        pushLog(`Searched for "${intent.item}"`)
        return
      }

      pushLog(`Didn't catch that: "${transcript}"`, 'error')
    },
    [addItem, removeItem, pushLog, lang]
  )

  const { isSupported, isListening, interimTranscript, error, start, stop } =
    useSpeechRecognition({ lang, onResult: handleCommand })

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    handleCommand(manualInput)
    setManualInput('')
  }

  const currentItemNames = new Set(items.map((i) => i.name.toLowerCase()))

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="brand">ChalkList</h1>
          <p className="brand__tagline">Say it, and it's on the list.</p>
        </div>
        <div className="page__header-controls">
          {isFirebaseConfigured && <SyncBadge status={syncStatus} />}
          <LanguageSelect value={lang} onChange={setLang} />
        </div>
      </header>

      <main className="board">
        <div className="board__hook" aria-hidden="true" />

        <section className="voice-panel">
          <MicButton isListening={isListening} isSupported={isSupported} onClick={isListening ? stop : start} />

          {!isSupported && (
            <p className="voice-panel__warning">
              Voice recognition isn't supported in this browser. Try Chrome or Edge, or use the
              text box below.
            </p>
          )}
          {error && <p className="voice-panel__warning">Mic error: {error}. Try again.</p>}

          <CommandLog interimTranscript={interimTranscript} entries={logEntries} />

          <form className="manual-form" onSubmit={handleManualSubmit}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='Or type a command, e.g. "add 2 apples"'
              aria-label="Type a shopping command"
            />
            <button type="submit">Send</button>
          </form>
        </section>

        {search && (
          <SearchResults
            query={search.query}
            priceRange={search.priceRange}
            results={search.results}
            onAdd={(name) => {
              addItem(name, 1)
              pushLog(`Added ${name}`)
            }}
            onClose={() => setSearch(null)}
          />
        )}

        <div className="board__columns">
          <section className="list-panel">
            <h2 className="panel-title">Your list</h2>
            <ShoppingListView items={items} onRemove={removeById} onQuantityChange={updateQuantity} />
          </section>

          <section className="suggestions-panel">
            <h2 className="panel-title">Suggestions</h2>
            <SuggestionsPanel
              runningLow={runningLowSuggestions}
              currentItemNames={currentItemNames}
              onAdd={(name) => {
                addItem(name, 1)
                pushLog(`Added ${name}`)
              }}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
