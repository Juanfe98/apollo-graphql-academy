import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTERS_PAGINATED } from '../../graphql/queries/characters'
import type { CharactersResult } from '../../types/rickandmorty'
import { useState } from 'react'

const SNIPPET_TABS = [
  {
    label: 'keyFields',
    code: `
// keyFields determines the cache key for a type.
// Default: { id } → cache key = "Character:1"
// Custom:  keyFields: ['name', 'species'] → "Character:{'name':'Rick','species':'Human'}"
// None:    keyFields: false → embedded, not normalized (no deduplication)

typePolicies: {
  Character: { keyFields: ['id'] },  // explicit default
  Info:       { keyFields: false },   // embedded — Info has no unique id
}`,
  },
  {
    label: 'merge fn',
    code: `
// merge(existing, incoming, options) is called when Apollo writes to cache.
// Without it, incoming REPLACES existing (arrays are clobbered).
// With it, you control how data accumulates.

characters: {
  keyArgs: ['filter'],  // Only filter changes the cache key, not page
  merge(existing, incoming) {
    return {
      ...incoming,
      results: [
        ...(existing?.results ?? []),
        ...incoming.results,
      ]
    }
  }
}`,
  },
  {
    label: 'read fn',
    code: `
// read(existing, options) is called when Apollo reads from cache.
// Use it to compute derived values, apply local overrides, etc.

name: {
  read(existing, { readField }) {
    const id = readField('id')
    const override = localOverridesVar()[id]
    return override?.name ?? existing
    // All queries get the overridden name without any re-fetch
  }
}`,
  },
  {
    label: 'Full config',
    code: `
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        characters: {
          keyArgs: ['filter'],
          merge(existing, incoming) { ... }
        },
        favoriteCharacters: {
          read() { return favoritedCharacterIdsVar() }
        }
      }
    },
    Character: {
      keyFields: ['id'],
      fields: {
        isFavorited: { read(_, { readField }) { ... } },
        localNote:   { read(_, { readField }) { ... } },
        name:        { read(existing, { readField }) { ... } },
      }
    },
    Info: { keyFields: false }
  }
})`,
  },
]

export default function TypePolicies() {
  const [page, setPage] = useState(1)

  const { data, fetchMore, loading } = useQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS_PAGINATED,
    { variables: { page: 1, filter: {} } }
  )

  async function loadPage(p: number) {
    if (p > page) {
      await fetchMore({ variables: { page: p, filter: {} } })
    }
    setPage(p)
  }

  const results = data?.characters.results ?? []
  const info = data?.characters.info

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="11"
        title="Type Policies & Field Policies"
        level="Advanced"
        description="Type policies are the brain of Apollo's InMemoryCache. keyFields controls normalization. merge controls how incoming data combines with existing data (critical for pagination). read creates computed/derived fields that can read reactive vars, transform data, or apply local overrides."
        docsUrl="https://www.apollographql.com/docs/react/caching/cache-configuration/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs font-semibold text-indigo-400 mb-1">keyFields</p>
          <p className="text-xs text-gray-500">
            Character:1 is the cache key for <code>{'{ id: "1", ... }'}</code>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Info has <code>keyFields: false</code> — embedded, not normalized separately
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-yellow-400 mb-1">merge fn</p>
          <p className="text-xs text-gray-500">
            Load pages below. Each fetchMore call triggers the merge fn.
            The cache accumulates all pages under one key.
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-green-400 mb-1">read fn</p>
          <p className="text-xs text-gray-500">
            Star characters on page 10 → visit Basic Query.
            The <code>isFavorited</code> read fn intercepts every cache read.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">
            {results.length} / {info?.count ?? '?'} characters loaded — all in ONE cache entry
          </p>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`btn text-xs ${p <= page ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => loadPage(p)}
                disabled={loading}
              >
                Page {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {results.map((c: CharactersResult['results'][number]) => (
            <div key={c.id} className="card p-2 text-center">
              <img src={c.image} alt="" className="w-10 h-10 rounded mx-auto mb-1" />
              <p className="text-xs text-gray-400 truncate">{c.name}</p>
              {c.isFavorited && <span className="text-yellow-400 text-xs">★</span>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          Snapshot cache and look at <span className="text-indigo-400">ROOT_QUERY.characters</span>.
          It holds a single merged results array despite being loaded across multiple pages.
        </p>
        <CacheInspector />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Advanced type policy utilities</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-purple-900">
            <p className="text-purple-400 font-semibold mb-1">toReference()</p>
            <p className="text-gray-400 mb-2">Converts an object into a cache Reference. Use inside <code className="text-white">merge</code> or <code className="text-white">read</code> functions when you need to store a pointer instead of the full object.</p>
            <pre className="code-block text-xs">{`merge(existing, incoming, { toReference }) {
  return {
    ...incoming,
    results: incoming.results.map(
      (item) => toReference(item) // store as Reference
    )
  }
}`}</pre>
          </div>
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-1">storeFieldName</p>
            <p className="text-gray-400 mb-2">
              The full cache key for a field including its arguments — e.g. <code className="text-white">{'characters({"filter":{"status":"Alive"}})'}</code>. Available in <code className="text-white">read</code> and <code className="text-white">merge</code> via the options object. Useful for debugging or deriving keys.
            </p>
            <pre className="code-block text-xs">{`read(existing, { storeFieldName, args }) {
  // storeFieldName: full key with args serialized
  // args: the parsed argument object
  console.log(storeFieldName)
  // "characters({"filter":{"status":"Alive"}})"
  return existing
}`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
