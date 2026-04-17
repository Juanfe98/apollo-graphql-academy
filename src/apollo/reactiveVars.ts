import { makeVar } from '@apollo/client'

// ── Favorites ─────────────────────────────────────────────────────────────────
// Stores the set of character IDs the user has starred.
// Because the isFavorited field policy reads this var, any cached Character
// whose id is in this set will reactively re-render wherever it is rendered.
export const favoritedCharacterIdsVar = makeVar<Set<number>>(new Set())

// ── Character Notes ───────────────────────────────────────────────────────────
// Local-only notes keyed by character id.
// The localNote @client field policy reads from this var.
export const characterNotesVar = makeVar<Record<number, string>>({})

// ── Local Name Overrides (Optimistic UI demo) ─────────────────────────────────
// Simulates the "optimistic response" pattern: stores locally overridden fields
// so the UI updates before a (simulated) network round-trip completes.
export const localCharacterOverridesVar = makeVar<
  Record<number, { name?: string; status?: string; _pending?: boolean }>
>({})

// ── Active Fetch Policy (FetchPolicies demo) ─────────────────────────────────
export const activeFetchPolicyVar = makeVar<string>('cache-first')
