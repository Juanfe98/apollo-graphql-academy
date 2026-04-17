import { useState } from 'react'
import { Link } from 'react-router-dom'
import { concepts, levelColor, levelBadge } from '../data/concepts'
import { useProgress } from '../hooks/useProgress'

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const

const beginnerCount     = concepts.filter((c) => c.level === 'Beginner').length
const intermediateCount = concepts.filter((c) => c.level === 'Intermediate').length
const advancedCount     = concepts.filter((c) => c.level === 'Advanced').length

export default function Home() {
  const [search, setSearch] = useState('')
  const [activeLevel, setActiveLevel] = useState<string>('All')
  const { isCompleted, completedCount } = useProgress()
  const progressPercent = Math.round((completedCount / concepts.length) * 100)

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
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white">Apollo GraphQL Academy</h1>
        <p className="text-gray-400 mt-2">
          A hands-on learning app using the{' '}
          <a href="https://rickandmortyapi.com/graphql" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Rick & Morty GraphQL API
          </a>
          . Every concept has live demos, interactive controls, and a Cache Inspector so you can see exactly what Apollo is doing internally.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 card border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Your progress</span>
          <span className="text-xs font-semibold text-white">{completedCount}/{concepts.length} completed</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full transition-all duration-500 animate-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1.5">{progressPercent}% — mark concepts complete as you learn them</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-children">
          {filtered.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`card-interactive border ${levelColor[c.level]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-gray-600 text-xs">{c.num}</span>
                <div className="flex items-center gap-1.5">
                  {isCompleted(c.to) && (
                    <span className="text-green-400 animate-check-pop" title="Completed">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  <span className={levelBadge[c.level]}>{c.level}</span>
                </div>
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

      {/* Quick Tips & Best Practices */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Quick Tips & Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card border-green-900/50">
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-lg leading-none mt-0.5">+</span>
              <div>
                <p className="text-sm font-semibold text-green-300">Always normalize your cache</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use <code className="text-green-400">keyFields</code> in type policies to ensure entities are stored by unique ID.
                  This makes cache updates automatic when the same entity is fetched from different queries.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-green-900/50">
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-lg leading-none mt-0.5">+</span>
              <div>
                <p className="text-sm font-semibold text-green-300">Co-locate fragments with components</p>
                <p className="text-xs text-gray-400 mt-1">
                  Each component should define a fragment describing exactly the data it needs.
                  Parent components compose these fragments into full queries — this prevents over-fetching and keeps data contracts tight.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-yellow-900/50">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-lg leading-none mt-0.5">!</span>
              <div>
                <p className="text-sm font-semibold text-yellow-300">Avoid network-only as a default</p>
                <p className="text-xs text-gray-400 mt-1">
                  The default <code className="text-yellow-400">cache-first</code> policy exists for a reason. Switching everything to
                  network-only defeats Apollo's biggest advantage. Use <code className="text-yellow-400">cache-and-network</code> when you need fresh data but still want instant UI.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-yellow-900/50">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-lg leading-none mt-0.5">!</span>
              <div>
                <p className="text-sm font-semibold text-yellow-300">Use optimistic responses for mutations</p>
                <p className="text-xs text-gray-400 mt-1">
                  Don't make users wait for server roundtrips. Provide <code className="text-yellow-400">optimisticResponse</code> with
                  your mutations to update the UI instantly and roll back automatically if the server rejects the change.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-indigo-900/50">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 text-lg leading-none mt-0.5">*</span>
              <div>
                <p className="text-sm font-semibold text-indigo-300">Use useSuspenseQuery for new projects</p>
                <p className="text-xs text-gray-400 mt-1">
                  Apollo Client 4.x's Suspense hooks (<code className="text-indigo-400">useSuspenseQuery</code>,{' '}
                  <code className="text-indigo-400">useBackgroundQuery</code>) eliminate loading state boilerplate and integrate
                  naturally with React's concurrent features and error boundaries.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-indigo-900/50">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 text-lg leading-none mt-0.5">*</span>
              <div>
                <p className="text-sm font-semibold text-indigo-300">Set up error link globally</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add an <code className="text-indigo-400">ErrorLink</code> at the top of your link chain to log all GraphQL and network
                  errors centrally. Pair it with <code className="text-indigo-400">errorPolicy: 'all'</code> to surface partial data alongside errors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
