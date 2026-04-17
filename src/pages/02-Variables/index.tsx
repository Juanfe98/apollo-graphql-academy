import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTERS_PAGINATED } from '../../graphql/queries/characters'
import type { CharactersResult, FilterCharacter } from '../../types/rickandmorty'

const SNIPPET = `
// Variables are passed as the second argument to useQuery.
// Apollo re-runs the query automatically whenever variables change.
const [filter, setFilter] = useState<FilterCharacter>({})

const { loading, error, data, previousData } = useQuery<
  { characters: CharactersResult },
  { page: number; filter: FilterCharacter }
>(GET_CHARACTERS_PAGINATED, {
  variables: { page: 1, filter },
  notifyOnNetworkStatusChange: true, // re-renders during variable changes too
})

// previousData: holds the LAST successful result while a new fetch is in flight.
// Use it to avoid a blank screen when variables change:
const displayData = data ?? previousData
// This way the old results stay visible until the new ones arrive.
`

const SKIP_SNIPPET = `
// skip prevents the query from running when variables aren't ready.
// This is the correct pattern — never conditionally call useQuery itself.

const [name, setName] = useState('')

const { data } = useQuery(GET_CHARACTERS_PAGINATED, {
  variables: { page: 1, filter: { name } },
  skip: name.length < 2,  // don't query until user types at least 2 chars
  // When skip flips false, Apollo fires automatically — no extra code needed.
})
`

const STATUS_OPTIONS = ['', 'Alive', 'Dead', 'unknown']
const GENDER_OPTIONS = ['', 'Female', 'Male', 'Genderless', 'unknown']

export default function Variables() {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')
  const [species, setSpecies] = useState('')
  const [gender, setGender] = useState('')

  const filter: FilterCharacter = {
    ...(name ? { name } : {}),
    ...(status ? { status } : {}),
    ...(species ? { species } : {}),
    ...(gender ? { gender } : {}),
  }

  const { loading, error, data } = useQuery<
    { characters: CharactersResult },
    { page: number; filter: FilterCharacter }
  >(GET_CHARACTERS_PAGINATED, {
    variables: { page: 1, filter },
    notifyOnNetworkStatusChange: true,
  })

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="02"
        title="Variables & Arguments"
        level="Beginner"
        description="Variables make queries dynamic. When variables change, Apollo automatically re-executes the query. Different variable combinations create separate cache entries — observe this in the Cache Inspector by switching filters."
        docsUrl="https://www.apollographql.com/docs/react/data/queries/#variables"
      />

      <CodeBlock code={SNIPPET} label="Pattern" />

      <div className="card space-y-3">
        <p className="text-xs font-semibold text-gray-400">Filter Variables</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              className="input w-full"
              placeholder="e.g. Rick"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Species</label>
            <input
              className="input w-full"
              placeholder="e.g. Human"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              className="input w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Gender</label>
            <select
              className="input w-full"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g || 'Any'}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Active variables: <span className="text-indigo-400">{JSON.stringify({ page: 1, filter })}</span>
        </div>
      </div>

      <div>
        {loading && <LoadingGrid />}
        {error && <ErrorBanner error={error} />}
        {data && !loading && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {data.characters.info.count} results · {data.characters.info.pages} pages
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.characters.results.map((char: CharactersResult['results'][number]) => (
                <CharacterCard key={char.id} character={char} />
              ))}
            </div>
          </div>
        )}
        {data?.characters.results.length === 0 && (
          <p className="text-sm text-gray-500">No characters match those filters.</p>
        )}
      </div>

      {/* ── skip & previousData ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Two essential patterns: skip & previousData</h2>
          <p className="text-xs text-gray-400">
            Variables queries have two common UX problems: firing before data is ready, and flashing a blank screen during re-fetches. Apollo solves both.
          </p>
        </div>
        <CodeBlock code={SKIP_SNIPPET} label="skip option" />
        <div className="grid grid-cols-2 gap-3">
          <div className="card border-yellow-900">
            <p className="text-xs font-semibold text-yellow-400 mb-1">skip</p>
            <p className="text-xs text-gray-400">
              Pass <code className="text-white">skip: true</code> to freeze the query. It stays dormant and fires the moment <code className="text-white">skip</code> becomes <code className="text-white">false</code>. Never conditionally call <code className="text-white">useQuery</code> itself — React's rules of hooks forbid it.
            </p>
          </div>
          <div className="card border-indigo-900">
            <p className="text-xs font-semibold text-indigo-400 mb-1">previousData</p>
            <p className="text-xs text-gray-400">
              Holds the last successful result while a new fetch is in flight. Use{' '}
              <code className="text-white">data ?? previousData</code> to keep showing the old list while filters change — no blank screen between searches.
            </p>
          </div>
        </div>
      </section>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          Snapshot the cache after applying different filters. You'll see separate cache keys for
          each unique filter combination — Apollo stores them independently.
        </p>
        <CacheInspector />
      </div>
    </div>
  )
}
