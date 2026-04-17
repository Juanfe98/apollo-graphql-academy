import { useState } from 'react'
import { gql } from '@apollo/client'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import { CHARACTER_CORE_FRAGMENT } from '../../graphql/fragments/characterCore'
import type { Character, CharactersResult } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'readQuery',
    code: `
// Read a full query result from cache — no network call
const data = client.readQuery({
  query: GET_CHARACTERS,
})
// Returns null if the query is not in cache yet`,
  },
  {
    label: 'writeQuery',
    code: `
// Write/overwrite a full query result in cache
client.writeQuery({
  query: GET_CHARACTERS,
  data: {
    characters: {
      ...existing,
      results: [newCharacter, ...existing.results]
    }
  }
})`,
  },
  {
    label: 'readFragment',
    code: `
// Read specific fields from a cached entity by its cache key
const char = client.readFragment({
  id: 'Character:1',
  fragment: CHARACTER_CORE_FRAGMENT,
})`,
  },
  {
    label: 'writeFragment',
    code: `
// Patch specific fields on a cached entity — like a local mutation
client.writeFragment({
  id: 'Character:5',
  fragment: gql\`fragment Patch on Character { name }\`,
  data: { name: 'Patched Name' }
})
// All active queries that include Character:5 re-render instantly`,
  },
  {
    label: 'cache.modify()',
    code: `
// cache.modify() is the most surgical cache update tool.
// Unlike writeFragment, it works with References (no data fetching needed).
// It's what useMutation's update() callback uses under the hood.

// Example: remove a deleted item from a list without a refetch
cache.modify({
  fields: {
    characters(existingRefs, { readField }) {
      return {
        ...existingRefs,
        results: existingRefs.results.filter(
          (ref) => readField('id', ref) !== deletedId
        ),
      }
    },
  },
})

// Example: update a single field on a specific entity
cache.modify({
  id: cache.identify({ __typename: 'Character', id: '1' }),
  fields: {
    name: () => 'Updated Name',
    status: (existing) => existing === 'Alive' ? 'Dead' : existing,
  },
})

// cache.identify() generates the cache key from an object — no string guessing.`,
  },
]

const SYNTHETIC_CHARACTER: Character = {
  id: '9999',
  name: '⚡ Local-Only Character',
  status: 'Alive',
  species: 'Human',
  gender: 'unknown',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  type: '',
}

export default function CacheReadWrite() {
  const client = useApolloClient()
  const [readResult, setReadResult] = useState<string | null>(null)
  const [fragmentResult, setFragmentResult] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const { data, refetch } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)])
  }

  function handleReadQuery() {
    const cached = client.readQuery<{ characters: CharactersResult }>({ query: GET_CHARACTERS })
    if (cached) {
      setReadResult(`Found ${cached.characters.results.length} characters in cache`)
      addLog(`readQuery → ${cached.characters.results.length} results`)
    } else {
      setReadResult('Cache miss — query not in cache yet')
      addLog('readQuery → cache miss')
    }
  }

  function handleWriteQuery() {
    const existing = client.readQuery<{ characters: CharactersResult }>({ query: GET_CHARACTERS })
    if (!existing) { addLog('writeQuery → no existing data to patch'); return }

    client.writeQuery({
      query: GET_CHARACTERS,
      data: {
        characters: {
          ...existing.characters,
          results: [SYNTHETIC_CHARACTER, ...existing.characters.results.filter((c: Character) => c.id !== '9999')],
        },
      },
    })
    addLog('writeQuery → injected synthetic character #9999')
  }

  function handleReadFragment() {
    const frag = client.readFragment<Character>({
      id: 'Character:1',
      fragment: CHARACTER_CORE_FRAGMENT,
    })
    if (frag) {
      setFragmentResult(JSON.stringify(frag, null, 2))
      addLog(`readFragment Character:1 → name="${frag.name}"`)
    } else {
      setFragmentResult('Fragment not in cache — fetch character #1 first')
      addLog('readFragment → cache miss')
    }
  }

  function handleWriteFragment() {
    client.writeFragment({
      id: 'Character:2',
      fragment: gql`fragment PatchName on Character { name }`,
      data: { name: '✏️ Patched by writeFragment' },
    })
    addLog('writeFragment → patched Character:2 name')
  }

  function handleReset() {
    client.cache.evict({ id: 'Character:2' })
    client.cache.evict({ id: 'Character:9999' })
    client.cache.gc()
    refetch()
    setReadResult(null)
    setFragmentResult(null)
    addLog('reset — evicted patched entries, refetched')
  }

  const characters = data?.characters.results ?? []

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="07"
        title="Cache Read & Write"
        level="Intermediate"
        description="Apollo's InMemoryCache exposes readQuery, writeQuery, readFragment, and writeFragment for direct cache manipulation. These are the building blocks that useMutation uses internally to update the UI after a server response."
        docsUrl="https://www.apollographql.com/docs/react/caching/cache-interaction/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary" onClick={handleReadQuery}>
          readQuery
        </button>
        <button className="btn-primary" onClick={handleWriteQuery}>
          writeQuery (inject #9999)
        </button>
        <button className="btn-secondary" onClick={handleReadFragment}>
          readFragment Character:1
        </button>
        <button className="btn-primary" onClick={handleWriteFragment}>
          writeFragment Character:2
        </button>
        <button className="btn-danger col-span-2" onClick={handleReset}>
          Reset Cache
        </button>
      </div>

      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}

      {readResult && (
        <div className="card border-green-900">
          <p className="text-xs text-green-400 font-semibold mb-1">readQuery result</p>
          <p className="text-xs text-gray-300">{readResult}</p>
        </div>
      )}

      {fragmentResult && (
        <div className="card border-indigo-900">
          <p className="text-xs text-indigo-400 font-semibold mb-1">readFragment result</p>
          <pre className="text-xs text-gray-300 overflow-auto">{fragmentResult}</pre>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-2">Live list — reflects cache writes instantly</p>
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {characters.slice(0, 6).map((c: Character) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      </div>

      {/* ── cache.modify() explainer ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">cache.modify() — surgical cache updates</h2>
          <p className="text-xs text-gray-400">
            <code className="text-indigo-400">cache.modify()</code> is the preferred way to update the cache after a mutation. Unlike <code className="text-indigo-400">writeFragment</code>, it works with <strong className="text-white">References</strong> directly — you never need to re-read or construct the full object.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="card border-purple-900">
            <p className="text-purple-400 font-semibold mb-1">vs writeFragment</p>
            <p className="text-gray-400"><code className="text-white">writeFragment</code> replaces fields with new data. <code className="text-white">modify()</code> receives the current value and lets you transform it — ideal for toggling, incrementing, or filtering lists.</p>
          </div>
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-1">readField()</p>
            <p className="text-gray-400">Inside a <code className="text-white">modify</code> callback, <code className="text-white">readField('id', ref)</code> reads a field off a Reference without dereferencing the full object. Essential for filtering lists by id.</p>
          </div>
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-1">cache.identify()</p>
            <p className="text-gray-400">Generates the cache key (<code className="text-white">"Character:1"</code>) from a plain object. Use this instead of building the key string manually — it respects custom <code className="text-white">keyFields</code>.</p>
          </div>
        </div>
      </section>

      <CacheInspector highlight="Character:2" />
    </div>
  )
}
