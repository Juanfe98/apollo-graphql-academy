import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import type { Character } from '../../types/rickandmorty'

// Aliasing lets you query the same field multiple times with different args.
// Without aliases this would error — two "character" fields would conflict.
const GET_ALIASED_CHARACTERS = gql`
  query GetAliasedCharacters {
    rick:  character(id: "1") { id name status species image }
    morty: character(id: "2") { id name status species image }
    beth:  character(id: "4") { id name status species image }
  }
`

const GET_STATUS_COUNTS = gql`
  query GetStatusCounts {
    alive:   characters(filter: { status: "Alive"   }) { info { count } }
    dead:    characters(filter: { status: "Dead"    }) { info { count } }
    unknown: characters(filter: { status: "unknown" }) { info { count } }
  }
`

type AliasedChars = { rick: Character; morty: Character; beth: Character }
type StatusCounts = {
  alive:   { info: { count: number } }
  dead:    { info: { count: number } }
  unknown: { info: { count: number } }
}

const SNIPPET_TABS = [
  {
    label: 'Basic alias',
    code: `
// Without aliases — this ERRORS because "character" appears twice:
query Bad {
  character(id: "1") { id name }
  character(id: "2") { id name }  // ← duplicate field!
}

// With aliases — each result gets its own key:
query GetDuo {
  rick:  character(id: "1") { id name status }
  morty: character(id: "2") { id name status }
}

// The response shape mirrors the alias names:
// { "rick": { "id": "1", "name": "Rick Sanchez" },
//   "morty": { "id": "2", "name": "Morty Smith" } }`,
  },
  {
    label: 'Apollo cache keys',
    code: `
// Aliases only change the RESPONSE key — they do NOT affect cache keys.
// Apollo normalizes by type + id, so rick and morty still land in cache as:
//   Character:1 → Rick Sanchez
//   Character:2 → Morty Smith
//
// The alias is transparent to the cache.
// Both Character:1 and Character:2 are stored/deduplicated normally.

// useQuery gives you the aliased shape on the JS side:
const { data } = useQuery(GET_DUO)
console.log(data.rick.name)   // "Rick Sanchez"
console.log(data.morty.name)  // "Morty Smith"`,
  },
  {
    label: 'Aggregate counts',
    code: `
// A common pattern: alias the same root field to get multiple aggregations
// in a single request — no N+1, one network call.

query StatusCounts {
  alive:   characters(filter: { status: "Alive"   }) { info { count } }
  dead:    characters(filter: { status: "Dead"    }) { info { count } }
  unknown: characters(filter: { status: "unknown" }) { info { count } }
}

// data.alive.info.count   → 439
// data.dead.info.count    → 224
// data.unknown.info.count → 163

// This is more efficient than 3 separate queries.`,
  },
  {
    label: 'Field-level alias',
    code: `
// You can also alias individual fields — useful when consuming APIs
// that use snake_case or non-JS-friendly field names, or to rename
// fields to match your component's expected prop shape.

query GetCharacterRenamed {
  character(id: "1") {
    characterId: id          // rename "id" → "characterId"
    fullName:    name        // rename "name" → "fullName"
    lifeStatus:  status      // rename "status" → "lifeStatus"
    airDate:     episode {
      broadcastDate: air_date  // nested field alias
    }
  }
}`,
  },
]

export default function Aliases() {
  const { data: chars, loading: charsLoading } = useQuery<AliasedChars>(GET_ALIASED_CHARACTERS)
  const { data: counts, loading: countsLoading } = useQuery<StatusCounts>(GET_STATUS_COUNTS)

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="20"
        title="Aliases"
        level="Beginner"
        description="Aliases let you rename a field in the query response, and more importantly, query the same field multiple times with different arguments. Without aliases, two fields with the same name would conflict. Aliases are transparent to the Apollo cache — normalization still uses type + id."
        docsUrl="https://graphql.org/learn/queries/#aliases"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      {/* ── Same field, multiple results ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live demo — one query, three characters</h2>
          <p className="text-xs text-gray-400">
            A single query fetches Rick, Morty, and Beth using aliases. Each result key maps to the alias name.
            Snapshot the cache — you'll see them stored as <code className="text-indigo-400">Character:1</code>,{' '}
            <code className="text-indigo-400">Character:2</code>, and <code className="text-indigo-400">Character:4</code>{' '}
            — not under the alias names.
          </p>
        </div>

        {charsLoading && <LoadingGrid count={3} />}
        {chars && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'rick', label: 'rick:', char: chars.rick },
              { key: 'morty', label: 'morty:', char: chars.morty },
              { key: 'beth', label: 'beth:', char: chars.beth },
            ].map(({ key, label, char }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-indigo-400 font-mono">{label}</p>
                <CharacterCard character={char} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Status counts ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Aggregate counts — one request</h2>
          <p className="text-xs text-gray-400">
            Three aliased fields on the same root query fetch all three counts in a single HTTP request.
          </p>
        </div>
        {countsLoading && <div className="card animate-pulse h-12" />}
        {counts && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'alive', count: counts.alive.info.count, color: 'text-green-400 border-green-900' },
              { label: 'dead', count: counts.dead.info.count, color: 'text-red-400 border-red-900' },
              { label: 'unknown', count: counts.unknown.info.count, color: 'text-gray-400 border-gray-700' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`card border text-center ${color}`}>
                <p className="text-xs font-mono mb-1">{label}:</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-600 mt-1">characters</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="card border-yellow-900 text-xs space-y-1">
        <p className="text-yellow-400 font-semibold">Cache insight</p>
        <p className="text-gray-400">
          Aliases are a <strong className="text-white">query document feature</strong>, not a cache feature.
          Apollo strips the alias before normalizing — the cache key is always{' '}
          <code className="text-indigo-400">TypeName:id</code>. Whether you query Rick as{' '}
          <code className="text-indigo-400">rick</code> or <code className="text-indigo-400">protagonist</code>,
          he ends up in the same <code className="text-indigo-400">Character:1</code> slot.
        </p>
      </div>

      <CacheInspector />
    </div>
  )
}
