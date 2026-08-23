import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categorize } from '../lib/data'
import { isFirebaseConfigured, subscribeToList, pushList } from '../firebase'

const LIST_KEY = 'vcsa:list'
const HISTORY_KEY = 'vcsa:history'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (e.g. private mode) — app still works in-memory.
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useShoppingList() {
  const [items, setItems] = useState(() => load(LIST_KEY, []))
  // history: { [normalizedName]: { count, name, lastAddedAt } } — powers
  // "you're running low on X" style recommendations. Stays local-only; not
  // synced to Firestore.
  const [history, setHistory] = useState(() => load(HISTORY_KEY, {}))

  // 'disabled' (no Firebase config) | 'connecting' | 'syncing' | 'synced' | 'error'
  const [syncStatus, setSyncStatus] = useState(isFirebaseConfigured ? 'connecting' : 'disabled')

  // Tracks the latest `items` without forcing the subscribe effect to
  // re-run on every keystroke/edit (it only needs the *current* value at
  // the moment the initial remote snapshot arrives, to seed a brand-new doc).
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Guards against the write-effect re-pushing data that just arrived FROM
  // Firestore (which would otherwise bounce back and forth forever).
  const applyingRemoteRef = useRef(false)
  // Timestamp of the last write this tab pushed, so an echoed/confirmed
  // snapshot for that same write doesn't get treated as a "new" remote change.
  const lastPushedAtRef = useRef(0)
  // Don't push local state until we've heard from Firestore at least once —
  // otherwise a stale local list (e.g. from another earlier session) could
  // clobber genuinely newer remote data the instant the app loads.
  const hydratedRef = useRef(!isFirebaseConfigured)

  useEffect(() => save(LIST_KEY, items), [items])
  useEffect(() => save(HISTORY_KEY, history), [history])

  // Real-time subscription: reflects changes made on any other device
  // sharing this Firebase config.
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let cancelled = false
    let unsubscribe = () => {}

    subscribeToList((snapshot) => {
      if (cancelled) return

      if (snapshot.error) {
        setSyncStatus('error')
        return
      }

      if (snapshot.fromLocalWrite) {
        // Optimistic echo of our own pending write — not a remote change.
        setSyncStatus('syncing')
        return
      }

      if (!hydratedRef.current) {
        hydratedRef.current = true
        if (!snapshot.exists && itemsRef.current.length > 0) {
          // Brand-new Firestore doc, but this device already has a local
          // list — seed the remote doc so other devices pick it up.
          const now = Date.now()
          lastPushedAtRef.current = now
          pushList(itemsRef.current, now).catch(() => setSyncStatus('error'))
          setSyncStatus('syncing')
          return
        }
      }

      // Ignore the confirmed echo of a write we already applied locally.
      if (snapshot.updatedAt && snapshot.updatedAt <= lastPushedAtRef.current) {
        setSyncStatus('synced')
        return
      }

      if (snapshot.items) {
        applyingRemoteRef.current = true
        setItems(snapshot.items)
      }
      setSyncStatus('synced')
    }).then((unsub) => {
      if (cancelled) unsub()
      else unsubscribe = unsub
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // Push local edits up to Firestore, skipping pushes triggered by an
  // incoming remote update.
  useEffect(() => {
    if (!isFirebaseConfigured) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    if (!hydratedRef.current) return

    const now = Date.now()
    lastPushedAtRef.current = now
    setSyncStatus('syncing')
    pushList(items, now)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'))
  }, [items])

  const addItem = useCallback((rawName, quantity = 1) => {
    const name = rawName.trim()
    if (!name) return
    const normalized = name.toLowerCase()

    setItems((prev) => {
      const existing = prev.find((i) => i.name.toLowerCase() === normalized)
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [
        ...prev,
        {
          id: makeId(),
          name,
          category: categorize(name),
          quantity,
          addedAt: Date.now(),
        },
      ]
    })

    setHistory((prev) => {
      const entry = prev[normalized] || { count: 0, name, lastAddedAt: 0 }
      return {
        ...prev,
        [normalized]: { count: entry.count + 1, name, lastAddedAt: Date.now() },
      }
    })
  }, [])

  const removeItem = useCallback(
    (rawName, quantity = null) => {
      const normalized = rawName.trim().toLowerCase()
      if (!normalized) return { removed: false }

      const match = items.find(
        (i) =>
          i.name.toLowerCase().includes(normalized) || normalized.includes(i.name.toLowerCase())
      )
      if (!match) return { removed: false }

      if (quantity && match.quantity > quantity) {
        setItems((prev) =>
          prev.map((i) => (i.id === match.id ? { ...i, quantity: i.quantity - quantity } : i))
        )
      } else {
        setItems((prev) => prev.filter((i) => i.id !== match.id))
      }
      return { removed: true, name: match.name }
    },
    [items]
  )

  const removeById = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i))
    )
  }, [])

  const clearAll = useCallback(() => setItems([]), [])

  // Items bought often historically but not currently on the list —
  // "It looks like you're running low on bread."
  const runningLowSuggestions = useMemo(() => {
    const currentNames = new Set(items.map((i) => i.name.toLowerCase()))
    return Object.values(history)
      .filter((h) => h.count >= 2 && !currentNames.has(h.name.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((h) => h.name)
  }, [items, history])

  return {
    items,
    addItem,
    removeItem,
    removeById,
    updateQuantity,
    clearAll,
    runningLowSuggestions,
    isFirebaseConfigured,
    syncStatus,
  }
}
