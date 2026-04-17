import { InMemoryCache } from '@apollo/client'
import type { Reference } from '@apollo/client'
import {
  favoritedCharacterIdsVar,
  characterNotesVar,
  localCharacterOverridesVar,
} from './reactiveVars'

export const cache = new InMemoryCache({
  typePolicies: {
    // ── Root Query ──────────────────────────────────────────────────────────
    Query: {
      fields: {
        // CONCEPT 5 + 11: Paginated characters list
        // keyArgs: ['filter'] means different filters = different cache entries,
        // but different pages of the same filter share ONE cache entry.
        // The merge fn concatenates incoming pages onto existing results.
        characters: {
          keyArgs: ['filter'],
          merge(existing, incoming) {
            const existingResults: Reference[] = existing?.results ?? []
            const incomingResults: Reference[] = incoming?.results ?? []
            // Deduplicate by reference identity so re-fetching page 1 doesn't duplicate
            const seen = new Set(existingResults.map((r) => r.__ref))
            const deduped = incomingResults.filter((r) => !seen.has(r.__ref))
            return {
              ...incoming,
              results: [...existingResults, ...deduped],
            }
          },
        },

        // CONCEPT 10: Local-only root field — resolved entirely from reactive var
        favoriteCharacters: {
          read() {
            return Array.from(favoritedCharacterIdsVar())
          },
        },
      },
    },

    // ── Character ───────────────────────────────────────────────────────────
    Character: {
      keyFields: ['id'], // explicit for teaching — this is the default

      fields: {
        // CONCEPT 10: Computed local field — true if this char is favorited
        isFavorited: {
          read(_, { readField }) {
            const id = readField<number>('id')
            return favoritedCharacterIdsVar().has(id!)
          },
        },

        // CONCEPT 10: Local annotation stored in reactive var
        localNote: {
          read(_, { readField }) {
            const id = readField<number>('id')
            return characterNotesVar()[id!] ?? ''
          },
        },

        // CONCEPT 9 + 11: Intercept name reads to apply optimistic overrides
        name: {
          read(existing, { readField }) {
            const id = readField<number>('id')
            const override = localCharacterOverridesVar()[id!]
            return override?.name ?? existing
          },
        },

        // CONCEPT 11: episode array — always replace with latest from server
        episode: {
          merge(_, incoming) {
            return incoming
          },
        },
      },
    },

    // ── Episode ─────────────────────────────────────────────────────────────
    Episode: {
      keyFields: ['id'],
      fields: {
        characters: {
          merge(_, incoming) {
            return incoming
          },
        },
      },
    },

    // ── Location ────────────────────────────────────────────────────────────
    Location: {
      keyFields: ['id'],
      fields: {
        residents: {
          merge(_, incoming) {
            return incoming
          },
        },
      },
    },

    // ── Info (pagination metadata) ───────────────────────────────────────────
    // Info has no id — mark as non-normalized (embedded object).
    // Without this, Apollo warns about missing keyFields.
    Info: {
      keyFields: false,
    },
  },
})
