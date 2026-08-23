# ChalkList — Voice Command Shopping Assistant

A voice-first shopping list. Speak naturally ("add milk", "I need three apples",
"remove bread", "find toothpaste under $5") and the app parses the intent,
categorizes the item, and keeps the list in sync.

**Live app:** https://voice-shopping-assistant-cyan.vercel.app

**Repo:** https://github.com/yugi-git/Voice-shopping-assistant.git



## Features

- **Voice input** via the browser's Web Speech API, with a typed-command
  fallback for unsupported browsers (e.g. Firefox) or denied mic permission.
- **Flexible phrasing**, handled by a small rule-based NLP parser
  (`src/lib/nlp.js`) — "add X", "I need X", "I want to buy X", "buy N of X"
  all resolve to the same intent.
- **Multilingual recognition and parsing** — switch the language dropdown to
  change what the Web Speech API listens for (English, Hindi, Tamil, Spanish,
  French), and the NLP parser (`src/lib/nlp.js`) understands common add/
  remove/search phrasings in all five, including quantities and price
  filters. Hindi and Tamil are verb-final ("दूध जोड़ो" / "பால் சேர்" both mean
  "milk add"), so the parser matches the intent word as a *suffix* for those
  two and as a *prefix* for the SVO languages (English/Spanish/French) — see
  Limitations for what this rule-based coverage does and doesn't handle.
- **Smart suggestions**: "running low" nudges from purchase history, seasonal
  picks, and substitute suggestions for items already on your list.
- **List management**: add/remove/adjust quantity by voice, auto-categorized
  into aisles (dairy, produce, bakery, etc).
- **Voice search** with price-range filtering ("find toothpaste under $5").
- **Visual feedback**: live transcript, a running command log, toasts for
  every recognized action.
- Works fully offline-first via `localStorage`; optional real-time Firestore
  sync across devices if you provide Firebase credentials (see below).

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge** (best Web Speech API
support) and allow microphone access when prompted.

## Build & deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel or Netlify (drag-and-drop `dist/`, or
connect the repo and set build command `npm run build`, output directory
`dist`).

## Optional: Firestore sync

The app works with zero setup. If you want the list to sync in real time
across devices:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   and enable **Firestore Database** (start in test mode, or lock it down —
   see note below).
2. In your Firebase project settings, add a **Web app** and copy the config
   values it gives you.
3. Copy `.env.example` to `.env.local` and fill in the six `VITE_FIREBASE_*`
   values.
4. Restart `npm run dev` (or redeploy). The app detects the config
   automatically (`src/firebase.js`) — no code changes needed.

Once configured, a small status badge appears next to the language picker
("Connecting…" → "Synced"). Every add/remove/quantity change is written to a
single shared Firestore document (`shoppingLists/default`) and mirrored to
every other tab/device with the same config in real time via `onSnapshot` —
open the app in two browser tabs (or two devices) with the same `.env.local`
to see it. There's no auth/multi-user separation in this build (matches the
brief's single-user scope), and the sync is last-write-wins (no
field-level merge) if two devices edit at the same instant.

**Security note:** Firestore's default "test mode" rules allow open
read/write for 30 days, which is fine for trying this out but not for a
real deployment. For anything beyond a demo, lock the doc down, e.g.:
```
match /shoppingLists/{doc} {
  allow read, write: if request.auth != null; // requires adding Firebase Auth
}
```
This build doesn't include auth, so treat Firestore sync here as a
demo-scope feature per the brief, not production-hardened.

## Project structure

```
src/
  components/   UI pieces (mic button, list, suggestions, search results, log)
  hooks/        useSpeechRecognition (Web Speech API), useShoppingList (state)
  lib/          nlp.js (intent parser), data.js (categories/seasonal/subs), pricing.js
  firebase.js   optional Firestore sync, disabled unless configured
```

## Limitations 

- NLP parsing is rule-based (regex/keyword per language), not a trained
  model or translation layer — it covers the phrasings in the brief well
  across all five languages but won't generalize to arbitrary sentences,
  and each language's verb/phrase list is a representative set rather than
  exhaustive coverage of every conjugation or dialect.
- Item names are kept in whatever language they were spoken in (not
  translated to a canonical form), so "दूध" and "milk" are tracked as two
  different list entries. Categorization (`src/lib/data.js`) recognizes the
  common items in each supported language so both still land in the right
  aisle; "running low" history and substitute/seasonal suggestion text
  remain keyed to English item names.
- Product prices are deterministically generated placeholders (no live
  catalog/pricing API), used only to demonstrate price-range search.
- "Seasonal" and "substitute" suggestions come from a small static reference
  table rather than a live product/inventory feed.

## Approach 

I built ChalkList as a React SPA using the browser's native Web Speech API —
no paid speech service, works instantly in Chromium browsers. Transcripts
pass through a small rule-based NLP module that strips filler phrases ("I
need", "I want to buy") and extracts an intent (add/remove/search), a
quantity, and, for search, a price range. The same parser handles Spanish,
French, Hindi, and Tamil; Hindi/Tamil are verb-final, so their intent word
is matched as a suffix instead of a prefix.

State lives in a `useShoppingList` hook backed by `localStorage`, so the app
works with zero backend setup; an optional Firestore sync layer activates
automatically if Firebase credentials are supplied via env vars, with no
hard dependency for graders who just want to run it.

Items are auto-categorized via a keyword map (dairy, produce, bakery, etc.)
and shown as a categorized list. A history counter powers "running low on
X" suggestions, paired with a static seasonal/substitute table. Every
command gives immediate visual feedback (live transcript + a scrolling
log), and a typed-command box is an accessible fallback when voice isn't
available. The app builds to a static bundle, deployable to Vercel,
Netlify, or Firebase Hosting.
