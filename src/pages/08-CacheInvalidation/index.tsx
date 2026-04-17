import { useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import type { CharactersResult } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'evict',
    code: `
// Remove a specific entity (or field) from cache.
// Any query watching that entity re-renders with undefined.
client.cache.evict({ id: 'Character:1' })
client.cache.gc()  // Clean up dangling references

// Evict a specific field only:
client.cache.evict({ id: 'Character:1', fieldName: 'name' })`,
  },
  {
    label: 'gc',
    code: `
// Garbage collect — removes unreachable objects.
// After evict(), references to the removed entity become
// "dangling references". gc() cleans those up.
const removed = client.cache.gc()
console.log('removed keys:', removed)`,
  },
  {
    label: 'refetchQueries',
    code: `
// Force active queries to re-run after a mutation or invalidation.
// 'active' — all currently mounted queries
// ['QueryName'] — only named queries
await client.refetchQueries({ include: 'active' })
await client.refetchQueries({ include: ['GetCharacters'] })`,
  },
  {
    label: 'reset',
    code: `
// Nuclear option: clear the entire cache.
// All active queries will re-fetch.
await client.resetStore()

// Or just clear without refetching:
await client.clearStore()`,
  },
]

export default function CacheInvalidation() {
  const client = useApolloClient()
  const [log, setLog] = useState<string[]>([])
  const [evictedIds, setEvictedIds] = useState<Set<string>>(new Set())

  const { data } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)
  const characters = data?.characters.results ?? []

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 14)])
  }

  function evictCharacter(id: string) {
    client.cache.evict({ id: `Character:${id}` })
    const removed = client.cache.gc()
    setEvictedIds((prev) => new Set([...prev, id]))
    addLog(`evict Character:${id} → gc removed ${removed.length} keys`)
  }

  function evictAll() {
    characters.slice(0, 5).forEach((c: CharactersResult['results'][number]) => {
      client.cache.evict({ id: `Character:${c.id}` })
    })
    const removed = client.cache.gc()
    setEvictedIds(new Set(characters.slice(0, 5).map((c: CharactersResult['results'][number]) => c.id)))
    addLog(`evicted first 5 characters → gc removed ${removed.length} dangling refs`)
  }

  async function refetchActive() {
    addLog('refetchQueries include:active — firing...')
    await client.refetchQueries({ include: 'active' })
    setEvictedIds(new Set())
    addLog('refetchQueries complete — cache repopulated')
  }

  async function refetchNamed() {
    addLog('refetchQueries include:["GetCharacters"] — firing...')
    await client.refetchQueries({ include: ['GetCharacters'] })
    setEvictedIds(new Set())
    addLog('GetCharacters refetched')
  }

  async function resetStore() {
    addLog('client.resetStore() — clearing all cache and refetching...')
    await client.resetStore()
    setEvictedIds(new Set())
    addLog('store reset complete')
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="08"
        title="Cache Invalidation"
        level="Advanced"
        description="Apollo provides fine-grained cache control: evict removes specific entities, gc cleans dangling references, refetchQueries forces re-fetches, and resetStore nukes everything. Understanding these gives you full control over data freshness."
        docsUrl="https://www.apollographql.com/docs/react/caching/garbage-collection/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-danger" onClick={evictAll}>
          Evict Characters 1–5
        </button>
        <button className="btn-secondary" onClick={() => { const r = client.cache.gc(); addLog(`gc() → removed ${r.length} keys`) }}>
          Run gc()
        </button>
        <button className="btn-primary" onClick={refetchActive}>
          refetchQueries (all active)
        </button>
        <button className="btn-primary" onClick={refetchNamed}>
          refetchQueries (by name)
        </button>
        <button className="btn-danger col-span-2" onClick={resetStore}>
          client.resetStore() — nuke everything
        </button>
      </div>

      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => <p key={i} className={l.includes('evict') ? 'text-red-400' : l.includes('refetch') || l.includes('reset') ? 'text-green-400' : 'text-green-300'}>{l}</p>)}
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-2">
          Click individual characters to evict them from cache
        </p>
        <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
          {characters.slice(0, 10).map((c: CharactersResult['results'][number]) => (
            <div
              key={c.id}
              className={`transition-opacity ${evictedIds.has(c.id) ? 'opacity-30' : ''}`}
            >
              <CharacterCard
                character={c}
                onClick={() => evictCharacter(c.id)}
                actions={
                  evictedIds.has(c.id) ? (
                    <span className="text-xs text-red-400">evicted</span>
                  ) : (
                    <span className="text-xs text-gray-600">click to evict</span>
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      <CacheInspector />
    </div>
  )
}
