import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import type { CharactersResult } from '../../types/rickandmorty'

const SNIPPET = `
// useQuery fires immediately on mount.
// Apollo returns { loading, error, data } — the holy trinity.
const { loading, error, data } = useQuery<{ characters: CharactersResult }>(
  GET_CHARACTERS
)

// GET_CHARACTERS query:
// query GetCharacters {
//   characters {
//     info { count pages next prev }
//     results { id name status species gender image }
//   }
// }
`

const RAW_RESPONSE = `// What the server returns (nested JSON):
{
  "characters": {
    "results": [
      { "id": "1", "name": "Rick Sanchez", "status": "Alive", ... },
      { "id": "2", "name": "Morty Smith",  "status": "Alive", ... }
    ]
  }
}`

const NORMALIZED_CACHE = `// What Apollo actually stores in InMemoryCache:
{
  "ROOT_QUERY": {
    "characters": {
      "results": [
        { "__ref": "Character:1" },  // ← pointer, not data
        { "__ref": "Character:2" }   // ← pointer, not data
      ]
    }
  },

  "Character:1": { "id": "1", "name": "Rick Sanchez", "status": "Alive", ... },
  "Character:2": { "id": "2", "name": "Morty Smith",  "status": "Alive", ... }
}
// Each entity lives under its own key: "<TypeName>:<id>"
// ROOT_QUERY just holds references (__ref) pointing to them.`

const EXTRA_OPTIONS_SNIPPET = `
// ── skip: prevent the query from running ────────────────────────
// Essential when variables aren't ready yet (e.g. waiting for user input)
const { data } = useQuery(GET_CHARACTER, {
  variables: { id: selectedId },
  skip: !selectedId,  // query is dormant until selectedId is truthy
  // Automatically re-runs when skip flips from true → false
})

// ── refetch: manually re-run the query ───────────────────────────
const { data, refetch } = useQuery(GET_CHARACTERS)
refetch()             // re-run with the same variables
refetch({ page: 2 }) // re-run with new variables (merges with existing)

// ── onCompleted / onError: side-effect callbacks ─────────────────
const { data } = useQuery(GET_CHARACTERS, {
  onCompleted(data) {
    // Fires once after a successful response — good for toasts, analytics
    analytics.track('characters_loaded', { count: data.characters.results.length })
  },
  onError(error) {
    // Fires on every error, including background refetch failures
    toast.error(error.message)
  },
})
`

const ADVANTAGES_SNIPPET = `// ── Advantage 1: No duplicate data ─────────────────────────────
// Character:1 is stored ONCE no matter how many queries fetch Rick.
// Detail page + list page + search results all point to the same entry.
// Update it once → every component watching it re-renders automatically.

// ── Advantage 2: Instant navigation (cache-first) ────────────────
// Visit Basic Query → navigate to Variables page → filter by "Rick"
// → come back to Basic Query.
// Zero network requests on return. Data is already in cache.
// This is fetchPolicy: 'cache-first' in action (the default).

// ── Advantage 3: Mutations update the whole UI ───────────────────
// After renaming a character on the server, you write to Character:1:
client.writeFragment({
  id: 'Character:1',
  fragment: gql\`fragment F on Character { name }\`,
  data: { name: 'New Name' }
})
// Every component showing Rick Sanchez updates — the list, the detail
// view, search results — without a single extra network request.
// This is why Apollo mutations use "update" or "refetchQueries" instead
// of manually updating local state.`

export default function BasicQuery() {
  const { loading, error, data } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="01"
        title="Basic Queries with useQuery"
        level="Beginner"
        description="useQuery is the primary hook for fetching data. It fires automatically on mount and returns loading, error, and data. Apollo writes results to the normalized InMemoryCache — re-renders are driven by cache changes, not component state."
        docsUrl="https://www.apollographql.com/docs/react/data/queries/"
      />

      <CodeBlock code={SNIPPET} label="Pattern" />

      {/* ── Results ── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-white">Result</p>
          {loading && <span className="text-xs text-yellow-400 animate-pulse">Fetching...</span>}
          {data && (
            <span className="text-xs text-green-400">
              {data.characters.info.count} characters total
            </span>
          )}
        </div>

        {loading && <LoadingGrid />}
        {error && <ErrorBanner error={error} />}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.characters.results.map((char: CharactersResult['results'][number]) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </div>

      {/* ── What Apollo does with the response ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">What Apollo does with the response</h2>
          <p className="text-xs text-gray-400">
            When the network response arrives, Apollo doesn't store it as-is. It runs a process
            called <span className="text-indigo-400 font-semibold">normalization</span> — it splits
            the nested JSON into a flat lookup table of individual entities, each keyed by type + id.
          </p>
        </div>

        <CodeBlock
          tabs={[
            { label: '1. Raw server response', code: RAW_RESPONSE },
            { label: '2. After normalization', code: NORMALIZED_CACHE },
          ]}
        />

        <div className="card border-indigo-900 space-y-2">
          <p className="text-xs font-semibold text-indigo-400">The key insight</p>
          <p className="text-xs text-gray-400">
            <code className="text-white">ROOT_QUERY.characters.results</code> holds{' '}
            <span className="text-yellow-400">references</span>, not actual data.
            The real data lives in <code className="text-white">Character:1</code>,{' '}
            <code className="text-white">Character:2</code>, etc. — one entry per entity, regardless
            of how many queries fetched it. This flat structure is called the{' '}
            <span className="text-indigo-400 font-semibold">normalized cache</span>.
          </p>
        </div>
      </section>

      {/* ── Advantages ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Why this matters — 3 advantages</h2>
          <p className="text-xs text-gray-400">
            Normalization is what makes Apollo fundamentally different from a plain fetch + useState approach.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="card border-green-900">
            <p className="text-xs font-semibold text-green-400 mb-1">① No duplicate data</p>
            <p className="text-xs text-gray-400">
              Rick Sanchez is stored once as <code className="text-white">Character:1</code>. A list
              page, a detail page, and a search result all point to the same entry. Update it once —
              every component watching it re-renders automatically.
            </p>
          </div>

          <div className="card border-yellow-900">
            <p className="text-xs font-semibold text-yellow-400 mb-1">② Instant navigation</p>
            <p className="text-xs text-gray-400">
              Navigate to page 02 (Variables), filter some characters, then come back here. Zero
              network requests — the data is already in cache.{' '}
              <code className="text-white">fetchPolicy: 'cache-first'</code> (the default) reads
              from cache on subsequent visits. You'll see this become very visible in page 06.
            </p>
          </div>

          <div className="card border-blue-900">
            <p className="text-xs font-semibold text-blue-400 mb-1">③ Mutations update the whole UI automatically</p>
            <p className="text-xs text-gray-400 mb-2">
              In a real app, after a mutation you write the updated entity to cache. Every component
              showing that entity re-renders — no manual state synchronization needed. This is why
              mutations use <code className="text-white">update</code> or{' '}
              <code className="text-white">refetchQueries</code> instead of{' '}
              <code className="text-white">setState</code>.
            </p>
            <CodeBlock code={ADVANTAGES_SNIPPET} />
          </div>
        </div>
      </section>

      {/* ── Additional useQuery options ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Essential useQuery options</h2>
          <p className="text-xs text-gray-400">
            Beyond <code className="text-indigo-400">loading</code>, <code className="text-indigo-400">error</code>, and <code className="text-indigo-400">data</code>, useQuery exposes several options you'll reach for in every real app.
          </p>
        </div>
        <CodeBlock code={EXTRA_OPTIONS_SNIPPET} label="skip · refetch · callbacks" />
        <div className="grid grid-cols-3 gap-3">
          <div className="card border-yellow-900">
            <p className="text-xs font-semibold text-yellow-400 mb-1">skip</p>
            <p className="text-xs text-gray-400">
              Prevents the query from firing. Apollo tracks when <code className="text-white">skip</code> becomes <code className="text-white">false</code> and runs automatically. Far better than wrapping <code className="text-white">useQuery</code> in a conditional.
            </p>
          </div>
          <div className="card border-green-900">
            <p className="text-xs font-semibold text-green-400 mb-1">refetch()</p>
            <p className="text-xs text-gray-400">
              Force a fresh network request at any time — great for "pull to refresh" UIs. Passing new variables merges them with the existing ones, so you only need to specify what changes.
            </p>
          </div>
          <div className="card border-blue-900">
            <p className="text-xs font-semibold text-blue-400 mb-1">onCompleted / onError</p>
            <p className="text-xs text-gray-400">
              One-shot callbacks for side effects (toasts, analytics). Do not use them to set component state — that's what <code className="text-white">data</code> and <code className="text-white">error</code> are for.
            </p>
          </div>
        </div>
      </section>

      {/* ── Cache Inspector ── */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white">See it yourself</h2>
        <p className="text-xs text-gray-400">
          Click <span className="text-white font-semibold">Snapshot Cache</span> after the data loads.
          You'll see <code className="text-indigo-400">ROOT_QUERY</code> with{' '}
          <code className="text-indigo-400">__ref</code> pointers, and individual{' '}
          <code className="text-indigo-400">Character:1</code> through{' '}
          <code className="text-indigo-400">Character:20</code> entries as flat objects. Then navigate
          to another page and snapshot again — the same entries are still there, untouched.
        </p>
        <CacheInspector />
      </section>
    </div>
  )
}
