import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useFragment, useApolloClient } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import type { Character, CharactersResult } from '../../types/rickandmorty'

const CHARACTER_LIVE_FRAGMENT = gql`
  fragment CharacterLive on Character {
    id
    name
    status
    species
    image
  }
`

const SNIPPET_TABS = [
  {
    label: 'useFragment basics',
    code: `
import { useFragment } from '@apollo/client/react'

const CHARACTER_FRAGMENT = gql\`
  fragment CharacterLive on Character {
    id name status species image
  }
\`

function CharacterCard({ id }: { id: string }) {
  const { data, complete } = useFragment({
    fragment: CHARACTER_FRAGMENT,
    from: { __typename: 'Character', id },
    // 'from' = which cache entry to watch.
    // No network request is ever fired.
    // This only reads and subscribes to the cache.
  })

  if (!complete) return <p>Not in cache yet</p>
  return <div>{data.name} — {data.status}</div>
}`,
  },
  {
    label: 'vs useQuery',
    code: `
// useQuery: fires a network request, caches the response,
//           re-renders when the query result changes.
const { data } = useQuery(GET_CHARACTER, { variables: { id } })

// useFragment: NEVER fires a network request.
//              Subscribes directly to a cache entry.
//              Re-renders ONLY when that entity's cached fields change.
//              Perfect for list items that need their own cache subscription
//              without running individual queries for each item.
const { data, complete } = useFragment({
  fragment: CHARACTER_FRAGMENT,
  from: { __typename: 'Character', id },
})

// complete: boolean — false if any fragment fields are missing from cache.
//           Use it to show a placeholder until the parent query loads.`,
  },
  {
    label: 'List pattern',
    code: `
// Pattern: parent loads the list, children subscribe individually.
// Each child reads exactly the fields it needs — no prop drilling.

function CharacterList() {
  // Populates cache with all characters:
  const { data } = useQuery(GET_CHARACTERS)

  return (
    <>
      {data?.characters.results.map(({ id }) => (
        // Pass ONLY the id — the child reads the rest from cache
        <CharacterCard key={id} id={id} />
      ))}
    </>
  )
}

function CharacterCard({ id }: { id: string }) {
  // No prop drilling. Subscribes directly to Character:\${id} in cache.
  const { data, complete } = useFragment({
    fragment: CHARACTER_FRAGMENT,
    from: { __typename: 'Character', id },
  })
  if (!complete) return null
  return <div>{data.name}</div>
}`,
  },
  {
    label: 'Live cache updates',
    code: `
// When any code writes to Character:1 in cache,
// the useFragment subscriber re-renders automatically.

// This includes:
// ✓ Another useQuery that happens to fetch Character:1
// ✓ A useMutation result that includes Character:1
// ✓ A direct client.writeFragment({ id: 'Character:1', ... })
// ✓ An optimistic response that patches Character:1

// The parent component knows nothing about the update.
// Only the specific card subscribed to that fragment re-renders.
// This is fine-grained reactivity at the entity level.`,
  },
]

const statusColor: Record<string, string> = {
  Alive: 'bg-green-500',
  Dead: 'bg-red-500',
  unknown: 'bg-gray-500',
}

// This card uses ONLY useFragment — no props beyond id
function CharacterFragmentCard({ id, highlight }: { id: string; highlight: boolean }) {
  const { data, complete } = useFragment<Character>({
    fragment: CHARACTER_LIVE_FRAGMENT,
    from: { __typename: 'Character', id },
  })

  if (!complete) {
    return (
      <div className="card animate-pulse flex gap-2 items-center border-gray-800">
        <div className="w-8 h-8 bg-gray-800 rounded flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-gray-800 rounded w-3/4" />
          <div className="h-2 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className={`card flex gap-2 items-center transition-all ${highlight ? 'border-yellow-600 bg-yellow-950/20' : 'border-gray-800'}`}>
      <img src={data.image} alt="" className="w-10 h-10 rounded flex-shrink-0 object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor[data.status] ?? 'bg-gray-500'}`} />
          <p className="text-white text-xs font-semibold truncate">{data.name}</p>
        </div>
        <p className="text-gray-500 text-xs">{data.species}</p>
      </div>
      <span className="text-xs text-green-600 flex-shrink-0">complete ✓</span>
    </div>
  )
}

export default function UseFragment() {
  const client = useApolloClient()
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [originalName, setOriginalName] = useState<string | null>(null)

  const { data, loading } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)
  const characters = data?.characters.results ?? []

  function addLog(msg: string) {
    setLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 9)])
  }

  function patchCharacter() {
    const char = characters[0]
    if (!char) return
    setOriginalName(char.name)
    setHighlightId(char.id)
    client.writeFragment({
      id: `Character:${char.id}`,
      fragment: CHARACTER_LIVE_FRAGMENT,
      data: { ...char, name: `⚡ ${char.name} (patched)`, status: 'Alive' },
    })
    addLog(`writeFragment → Character:${char.id} — CharacterFragmentCard re-renders automatically`)
  }

  function resetCharacter() {
    const char = characters[0]
    if (!char || !originalName) return
    client.writeFragment({
      id: `Character:${char.id}`,
      fragment: CHARACTER_LIVE_FRAGMENT,
      data: { ...char, name: originalName },
    })
    setHighlightId(null)
    setOriginalName(null)
    addLog(`writeFragment → Character:${char.id} reset to original name`)
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="15"
        title="useFragment"
        level="Advanced"
        description="useFragment creates a live binding to a specific entity in the Apollo cache. Unlike useQuery, it never fires a network request — it only subscribes. When that cache entry changes (from any source), only the subscribed component re-renders. Fine-grained reactivity at the entity level."
        docsUrl="https://www.apollographql.com/docs/react/api/react/hooks/#usefragment"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live Demo — cache write triggers re-render</h2>
          <p className="text-xs text-gray-400 mb-3">
            Each card below uses <code className="text-indigo-400">useFragment</code> — no data is passed as props.
            Click "Patch Character #1" to write directly to the cache. Only that card re-renders.
            The parent component is completely unaware of the change.
          </p>
          <div className="flex gap-2 mb-3">
            <button className="btn-primary" onClick={patchCharacter} disabled={loading || characters.length === 0}>
              Patch Character #1 via writeFragment
            </button>
            {originalName && (
              <button className="btn-secondary" onClick={resetCharacter}>Reset</button>
            )}
          </div>
        </div>

        {log.length > 0 && (
          <div className="code-block space-y-0.5 text-xs">
            {log.map((l, i) => <p key={i} className="text-yellow-400">{l}</p>)}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-yellow-400">Loading characters into cache...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {characters.slice(0, 10).map((c) => (
              <CharacterFragmentCard
                key={c.id}
                id={c.id}
                highlight={highlightId === c.id}
              />
            ))}
          </div>
        )}
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">When to use useFragment vs useQuery</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-white font-semibold mb-1">useFragment ✓</p>
            <ul className="text-gray-400 space-y-0.5 list-disc list-inside">
              <li>List items that each need reactivity</li>
              <li>Components receiving only an id prop</li>
              <li>When cache is already populated by a parent query</li>
              <li>Fine-grained updates (re-render only the changed item)</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">useQuery ✓</p>
            <ul className="text-gray-400 space-y-0.5 list-disc list-inside">
              <li>Initial data loading</li>
              <li>When you need network control (fetchPolicy, polling)</li>
              <li>When the entity may not be in cache yet</li>
              <li>Root-level data fetching</li>
            </ul>
          </div>
        </div>
      </div>

      <CacheInspector highlight={`Character:${characters[0]?.id}`} />
    </div>
  )
}
