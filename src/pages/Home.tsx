import { useState } from 'react'
import { Link } from 'react-router-dom'
import { concepts, levelColor, levelBadge } from '../data/concepts'

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const

const beginnerCount     = concepts.filter((c) => c.level === 'Beginner').length
const intermediateCount = concepts.filter((c) => c.level === 'Intermediate').length
const advancedCount     = concepts.filter((c) => c.level === 'Advanced').length

export default function Home() {
  const [search, setSearch] = useState('')
  const [activeLevel, setActiveLevel] = useState<string>('All')

  const filtered = concepts.filter((c) => {
    const matchesLevel = activeLevel === 'All' || c.level === activeLevel
    const matchesSearch =
      search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase()) ||
      c.num.includes(search)
    return matchesLevel && matchesSearch
  })

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Apollo GraphQL Academy</h1>
        <p className="text-gray-400 mt-2">
          A hands-on learning app using the{' '}
          <a href="https://rickandmortyapi.com/graphql" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Rick & Morty GraphQL API
          </a>
          . Every concept has live demos, interactive controls, and a Cache Inspector so you can see exactly what Apollo is doing internally.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search concepts... (e.g. 'cache', 'mutation', '05')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level === activeLevel ? 'All' : level)}
              className={`btn text-xs transition-all ${
                activeLevel === level
                  ? level === 'All'
                    ? 'bg-indigo-600 text-white'
                    : level === 'Beginner'
                    ? 'bg-green-800 text-green-200'
                    : level === 'Intermediate'
                    ? 'bg-yellow-800 text-yellow-200'
                    : 'bg-red-800 text-red-200'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-4 text-xs text-gray-500">
        <span><span className="concept-badge-beginner mr-1">Beginner</span> {beginnerCount}</span>
        <span><span className="concept-badge-intermediate mr-1">Intermediate</span> {intermediateCount}</span>
        <span><span className="concept-badge-advanced mr-1">Advanced</span> {advancedCount}</span>
        <span className="text-gray-600">
          {filtered.length === concepts.length
            ? `${concepts.length} modules total`
            : `${filtered.length} of ${concepts.length} shown`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card border-gray-700 text-center py-12">
          <p className="text-gray-400 text-sm">No concepts match your search.</p>
          <button onClick={() => { setSearch(''); setActiveLevel('All') }} className="btn-primary mt-3 text-xs">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`card border transition-colors ${levelColor[c.level]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-gray-600 text-xs">{c.num}</span>
                <span className={levelBadge[c.level]}>{c.level}</span>
              </div>
              <p className="text-white font-semibold text-sm">{c.title}</p>
              <p className="text-gray-500 text-xs mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 card border-indigo-900">
        <p className="text-xs font-semibold text-indigo-400 mb-2">Recommended learning path</p>
        <p className="text-xs text-gray-400">
          Start at 01 → work linearly through Beginner/Intermediate. Each concept builds on the previous.
          The Cache Inspector on every page shows Apollo's InMemoryCache in real time — use it constantly.
          Install{' '}
          <a href="https://chromewebstore.google.com/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Apollo Client DevTools
          </a>
          {' '}for an even richer cache visualization.
          Pages 25–32 cover Apollo Client 4.x features and architecture concepts — tackle them after the core modules.
        </p>
      </div>
    </div>
  )
}
