import { useState } from 'react'
import { useLazyQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTER } from '../../graphql/queries/characters'
import type { Character } from '../../types/rickandmorty'

const SNIPPET = `
// useLazyQuery returns [execute, result] — the query does NOT run on mount.
// Call execute() when you need it (button click, search, etc.)
const [getCharacter, { loading, error, data, called, reset }] = useLazyQuery<
  { character: Character },
  { id: string }
>(GET_CHARACTER)

// Trigger on demand:
getCharacter({ variables: { id: '1' } })

// Override fetchPolicy per call — useful for "refresh" buttons:
getCharacter({ variables: { id: '1' }, fetchPolicy: 'network-only' })

// reset() clears the result and resets 'called' back to false:
reset()  // data = undefined, called = false, error = undefined

// 'called' is true after the first execution — useful for "no results yet" UX
`

export default function LazyQuery() {
  const [inputId, setInputId] = useState('1')

  const [getCharacter, { loading, error, data, called }] = useLazyQuery<
    { character: Character },
    { id: string }
  >(GET_CHARACTER)

  function handleSearch() {
    getCharacter({ variables: { id: inputId } })
  }

  const char = data?.character

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="03"
        title="Lazy Queries with useLazyQuery"
        level="Beginner"
        description="useLazyQuery decouples execution from render. Unlike useQuery (which fires on mount), useLazyQuery only fires when you call the returned execute function. Perfect for search, autocomplete, or user-triggered fetches."
        docsUrl="https://www.apollographql.com/docs/react/data/queries/#executing-queries-manually"
      />

      <CodeBlock code={SNIPPET} label="Pattern" />

      <div className="card">
        <p className="text-xs font-semibold text-gray-400 mb-3">Try it — enter a character ID (1–826)</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={826}
            className="input w-32"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Character'}
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-600 space-y-0.5">
          <p><span className="text-gray-500">called:</span> <span className={called ? 'text-green-400' : 'text-gray-600'}>{String(called)}</span></p>
          <p><span className="text-gray-500">loading:</span> <span className={loading ? 'text-yellow-400' : 'text-gray-600'}>{String(loading)}</span></p>
        </div>
      </div>

      {!called && (
        <div className="card border-dashed border-gray-700 text-center py-8">
          <p className="text-gray-600 text-sm">Query has not been executed yet.</p>
          <p className="text-gray-700 text-xs mt-1">Enter an ID and click "Fetch Character"</p>
        </div>
      )}

      {called && !loading && error && <ErrorBanner error={error} />}

      {called && !loading && !error && !char && (
        <div className="card border-yellow-900 text-center py-6">
          <p className="text-yellow-400 text-sm">Character #{inputId} not found</p>
        </div>
      )}

      {char && (
        <div className="space-y-3">
          <CharacterCard character={char} />
          <div className="card text-xs space-y-1">
            <p className="text-gray-500 font-semibold">Full data</p>
            {char.origin && <p className="text-gray-400">Origin: <span className="text-white">{char.origin.name}</span></p>}
            {char.location && <p className="text-gray-400">Location: <span className="text-white">{char.location.name}</span></p>}
            {char.episode && <p className="text-gray-400">Episodes: <span className="text-white">{char.episode.length}</span></p>}
            {char.isFavorited !== undefined && (
              <p className="text-gray-400">Favorited: <span className={char.isFavorited ? 'text-yellow-400' : 'text-gray-600'}>{String(char.isFavorited)}</span> <span className="text-gray-600">(from client field)</span></p>
            )}
          </div>
        </div>
      )}

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">useLazyQuery vs useQuery — when to choose each</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-white font-semibold mb-1">useLazyQuery ✓</p>
            <ul className="text-gray-400 space-y-0.5 list-disc list-inside">
              <li>User-triggered fetches (search, button click)</li>
              <li>Autocomplete / typeahead</li>
              <li>Prefetching on hover (call execute, data is ready on click)</li>
              <li>When you need to call <code className="text-indigo-400">reset()</code> to clear results</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">useQuery ✓</p>
            <ul className="text-gray-400 space-y-0.5 list-disc list-inside">
              <li>Data needed as soon as the component mounts</li>
              <li>Background polling (<code className="text-indigo-400">pollInterval</code>)</li>
              <li>When <code className="text-indigo-400">skip</code> is cleaner than a manual trigger</li>
              <li>Most route-level data fetching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
