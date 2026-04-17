import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CacheInspector } from '../../components/shared/CacheInspector'
import type { Character } from '../../types/rickandmorty'

const GET_CHARACTER_WITH_DIRECTIVES = gql`
  query GetCharacterWithDirectives(
    $id: ID!
    $includeEpisodes: Boolean!
    $skipLocation: Boolean!
    $includeOrigin: Boolean!
  ) {
    character(id: $id) {
      id
      name
      status
      species
      image
      location @skip(if: $skipLocation) {
        id
        name
        dimension
      }
      origin @include(if: $includeOrigin) {
        id
        name
      }
      episode @include(if: $includeEpisodes) {
        id
        name
        episode
      }
    }
  }
`

const SNIPPET_TABS = [
  {
    label: '@skip',
    code: `
// @skip(if: true)  → field is OMITTED from the request
// @skip(if: false) → field IS included
// The condition is a Boolean variable.

query GetCharacter($id: ID!, $skipLocation: Boolean!) {
  character(id: $id) {
    id
    name
    location @skip(if: $skipLocation) {
      id name dimension
    }
  }
}

// In the component:
useQuery(GET_CHARACTER, {
  variables: { id: '1', skipLocation: true }  // location omitted entirely
})`,
  },
  {
    label: '@include',
    code: `
// @include(if: false) → field is OMITTED from the request
// @include(if: true)  → field IS included
// Logical inverse of @skip.

query GetCharacter($id: ID!, $includeEpisodes: Boolean!) {
  character(id: $id) {
    id
    name
    episode @include(if: $includeEpisodes) {
      id name air_date
    }
  }
}

// Toggle in state — Apollo re-fires the query automatically:
const [show, setShow] = useState(false)
useQuery(GET_CHARACTER, {
  variables: { id: '1', includeEpisodes: show }
})`,
  },
  {
    label: '@skip vs @include',
    code: `
// These are logically equivalent:
location @skip(if: $skipLocation)          // omit when true
location @include(if: $includeLocation)    // include when true

// Choose based on what reads most naturally in your variables.
// Never combine both on the same field — it causes confusion:
// field @skip(if: false) @include(if: false) → OMITTED
// field @skip(if: false) @include(if: true)  → INCLUDED

// A field is included ONLY IF:
//   @skip is false  AND  @include is true
// Omitted if either condition excludes it.`,
  },
  {
    label: 'Cache impact',
    code: `
// Each unique set of variables = a separate cache entry.
// Character:1 with { includeEpisodes: false } is cached separately from
// Character:1 with { includeEpisodes: true }.

// BUT: the normalized Character:1 entity ACCUMULATES fields over time.
// First query: { id, name, status, species, image }
// Second query (with episodes): { id, name, ..., episode: [...] }
// After both run, Character:1 has ALL fields in cache.

// Practical consequence: toggling a directive from false→true triggers
// a network request (first time). Toggling back to false reads from cache
// (the fields are already there in the normalized entity).`,
  },
]

export default function Directives() {
  const [charId, setCharId] = useState('1')
  const [includeEpisodes, setIncludeEpisodes] = useState(false)
  const [skipLocation, setSkipLocation] = useState(false)
  const [includeOrigin, setIncludeOrigin] = useState(true)

  const variables = {
    id: charId,
    includeEpisodes,
    skipLocation,
    includeOrigin,
  }

  const { data, loading } = useQuery<{ character: Character }>(
    GET_CHARACTER_WITH_DIRECTIVES,
    { variables }
  )

  const char = data?.character

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="18"
        title="Directives — @skip & @include"
        level="Intermediate"
        description="@skip and @include conditionally include or omit fields from a query at the GraphQL level. The field selection sent to the server changes based on Boolean variables — this is not JSX conditional rendering. Toggle the fields below and watch the variables object update."
        docsUrl="https://graphql.org/learn/queries/#directives"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-gray-400">Character ID</p>
            <div className="flex gap-1">
              {['1', '2', '3', '5'].map((id) => (
                <button
                  key={id}
                  className={`btn text-xs ${charId === id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCharId(id)}
                >
                  #{id}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <p className="text-xs font-semibold text-gray-400">Field toggles</p>
            {[
              {
                label: 'origin',
                directive: '@include',
                value: includeOrigin,
                set: setIncludeOrigin,
                varName: 'includeOrigin',
              },
              {
                label: 'location',
                directive: '@skip',
                value: !skipLocation,
                set: (v: boolean) => setSkipLocation(!v),
                varName: 'skipLocation',
              },
              {
                label: 'episode',
                directive: '@include',
                value: includeEpisodes,
                set: setIncludeEpisodes,
                varName: 'includeEpisodes',
              },
            ].map((field) => (
              <label key={field.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.set(e.target.checked)}
                  className="accent-indigo-500"
                />
                <span className="text-xs text-gray-300">
                  {field.label}{' '}
                  <code className="text-indigo-400">{field.directive}</code>
                </span>
              </label>
            ))}
          </div>

          <div className="card">
            <p className="text-xs text-gray-500 mb-2">Variables sent to server</p>
            <pre className="text-xs text-green-300">{JSON.stringify(variables, null, 2)}</pre>
          </div>

          {loading && <p className="text-xs text-yellow-400 animate-pulse">Fetching with new field selection...</p>}
        </div>

        {/* Result */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400">Result</p>
          {char && (
            <div className="space-y-2">
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <img src={char.image} alt="" className="w-10 h-10 rounded" />
                  <div>
                    <p className="text-white text-sm font-semibold">{char.name}</p>
                    <p className="text-gray-500 text-xs">{char.status} · {char.species}</p>
                  </div>
                </div>

                {char.origin !== undefined ? (
                  <p className="text-xs text-gray-400">
                    <span className="text-green-400">@include ✓</span> Origin:{' '}
                    <span className="text-white">{char.origin?.name ?? 'null'}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">@include(false) — origin omitted</p>
                )}

                {!skipLocation ? (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="text-green-400">@skip(false) ✓</span> Location:{' '}
                    <span className="text-white">{char.location?.name ?? 'unknown'}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">@skip(true) — location omitted</p>
                )}

                {char.episode !== undefined ? (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="text-green-400">@include ✓</span> Episodes:{' '}
                    <span className="text-white">{char.episode?.length}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">@include(false) — episodes omitted</p>
                )}
              </div>

              <div className="card">
                <p className="text-xs text-gray-500 mb-1">Raw data shape received</p>
                <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                  {JSON.stringify(char, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card border-yellow-900 text-xs space-y-1">
        <p className="text-yellow-400 font-semibold">Cache insight</p>
        <p className="text-gray-400">
          Toggle <strong className="text-white">episodes ON</strong> (first time) — notice a network request fires.
          Toggle it OFF then ON again — no request. The episode data is already in the normalized{' '}
          <code className="text-indigo-400">Character:{charId}</code> cache entry.
          Snapshot the cache below to confirm.
        </p>
      </div>

      <CacheInspector highlight={`Character:${charId}`} />
    </div>
  )
}
