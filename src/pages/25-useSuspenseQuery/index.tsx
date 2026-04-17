import { Component, Suspense, useState } from 'react'
import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import type { Character, CharactersResult } from '../../types/rickandmorty'

const GET_CHARACTERS_PAGE = gql`
  query GetCharactersForSuspense($page: Int!) {
    characters(page: $page) {
      info { count pages next }
      results { id name status species gender image }
    }
  }
`

const GET_CHARACTER_DETAIL = gql`
  query GetCharacterForSuspense($id: ID!) {
    character(id: $id) { id name status species gender image type }
  }
`

// ── Error boundary for Suspense demos ────────────────────────────
class SuspenseErrorBoundary extends Component<
  { children: React.ReactNode; onReset?: () => void },
  { error: Error | null }
> {
  state = { error: null } as { error: Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-800 space-y-2">
          <p className="text-red-400 text-xs font-semibold">Error caught by boundary:</p>
          <p className="text-red-300 text-xs">{this.state.error.message}</p>
          <button
            className="btn-secondary text-xs"
            onClick={() => { this.setState({ error: null }); this.props.onReset?.() }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Components that use useSuspenseQuery ─────────────────────────
function CharacterList({ page }: { page: number }) {
  const { data } = useSuspenseQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS_PAGE,
    { variables: { page } }
  )
  // data is ALWAYS defined here — no null check needed.
  // If the query is in-flight, this component suspends and
  // the nearest <Suspense fallback> renders instead.
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Page {page} · {data.characters.results.length} characters · {data.characters.info.count} total
      </p>
      <div className="grid grid-cols-2 gap-3">
        {data.characters.results.slice(0, 6).map((c: Character) => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </div>
    </div>
  )
}

function CharacterDetail({ id }: { id: string }) {
  const { data } = useSuspenseQuery<{ character: Character }>(
    GET_CHARACTER_DETAIL,
    { variables: { id } }
  )
  const char = data.character
  return (
    <div className="space-y-2">
      <CharacterCard character={char} />
      <div className="card text-xs space-y-1">
        <p className="text-gray-400">Type: <span className="text-white">{char.type || '—'}</span></p>
        <p className="text-gray-400">Gender: <span className="text-white">{char.gender}</span></p>
      </div>
    </div>
  )
}

const SNIPPET_TABS = [
  {
    label: 'useSuspenseQuery',
    code: `
import { Suspense } from 'react'
import { useSuspenseQuery } from '@apollo/client/react'

// useSuspenseQuery NEVER returns { loading: true }.
// While the query is in-flight, the component SUSPENDS — React pauses
// rendering it and shows the nearest <Suspense fallback> instead.
// When data arrives, React re-renders the component with data defined.

function CharacterList({ page }: { page: number }) {
  const { data } = useSuspenseQuery(GET_CHARACTERS, {
    variables: { page },
  })
  // data is always defined here — no "if (loading)" needed
  return <List items={data.characters.results} />
}

// Parent must wrap in <Suspense> to handle the suspended state:
function Page() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <CharacterList page={1} />
    </Suspense>
  )
}`,
  },
  {
    label: 'Error handling',
    code: `
// useQuery: you check error from the hook return value
// useSuspenseQuery: errors are THROWN — caught by an Error Boundary

import { ErrorBoundary } from 'react-error-boundary'

function Page() {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div>
          <p>Something went wrong: {error.message}</p>
          <button onClick={resetErrorBoundary}>Retry</button>
        </div>
      )}
    >
      <Suspense fallback={<Spinner />}>
        <CharacterList page={1} />
      </Suspense>
    </ErrorBoundary>
  )
}

// Apollo throws ApolloError when errorPolicy is 'none' (default).
// With errorPolicy: 'all', partial data is returned and errors
// are in data.errors — no throw, no ErrorBoundary needed.`,
  },
  {
    label: 'vs useQuery',
    code: `
// useQuery: explicit loading state in EVERY component
function WithUseQuery({ page }) {
  const { loading, error, data } = useQuery(GET_CHARACTERS, { variables: { page } })
  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  return <List items={data.characters.results} />
}

// useSuspenseQuery: loading/error lifted OUT of the component
function WithSuspenseQuery({ page }) {
  const { data } = useSuspenseQuery(GET_CHARACTERS, { variables: { page } })
  return <List items={data.characters.results} />  // always has data
}

// Parent handles loading and error in ONE place:
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Spinner />}>
    <WithSuspenseQuery page={1} />
    <WithSuspenseQuery page={2} />  // both suspend together!
  </Suspense>
</ErrorBoundary>

// Benefit: fewer null checks, cleaner leaf components, shared loading UX`,
  },
  {
    label: 'Variables & refetch',
    code: `
// Variable changes: when variables change, the component suspends again.
// This means the parent's Suspense fallback shows while the new page loads.
// Use startTransition to keep the old UI visible during the transition:

import { startTransition, useState, Suspense } from 'react'

function PaginatedList() {
  const [page, setPage] = useState(1)

  function goToPage(p: number) {
    startTransition(() => setPage(p))
    // Without startTransition, the old UI disappears immediately.
    // With startTransition, it stays visible until new data is ready.
  }

  return (
    <Suspense fallback={<LoadingGrid />}>
      <CharacterList page={page} />
      <button onClick={() => goToPage(page + 1)}>Next</button>
    </Suspense>
  )
}

// refetch() also triggers a suspend:
const { data, refetch } = useSuspenseQuery(GET_CHARACTERS, { variables: { page: 1 } })
// calling refetch() will suspend the component and show the fallback`,
  },
]

export default function SuspenseQueryPage() {
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState('1')
  const [detailKey, setDetailKey] = useState(0)

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="25"
        title="useSuspenseQuery"
        level="Advanced"
        description="useSuspenseQuery is Apollo Client 4.x's Suspense-native data hook. Instead of returning loading/error/data, it suspends the component while loading and throws errors — delegating both to React's Suspense and ErrorBoundary system. Components become simpler: data is always defined."
        docsUrl="https://www.apollographql.com/docs/react/data/suspense/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-2 gap-6">
        {/* ── List demo ── */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Live demo — character list</h2>
            <p className="text-xs text-gray-400">
              The inner component uses <code className="text-indigo-400">useSuspenseQuery</code>.
              Switching pages triggers a suspend — the fallback shows until data arrives.
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`btn text-xs ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPage(p)}
              >
                Page {p}
              </button>
            ))}
          </div>
          <SuspenseErrorBoundary>
            <Suspense fallback={<LoadingGrid count={6} />} key={page}>
              <CharacterList page={page} />
            </Suspense>
          </SuspenseErrorBoundary>
        </section>

        {/* ── Single character demo ── */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Live demo — character detail</h2>
            <p className="text-xs text-gray-400">
              Each ID change re-suspends the inner component. Error boundary catches bad IDs.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={826}
              className="input w-24 text-xs"
              value={detailId}
              onChange={(e) => setDetailId(e.target.value)}
            />
            <button
              className="btn-primary text-xs"
              onClick={() => setDetailKey((k) => k + 1)}
            >
              Load
            </button>
          </div>
          <SuspenseErrorBoundary onReset={() => setDetailKey((k) => k + 1)}>
            <Suspense fallback={<LoadingGrid count={1} />} key={`${detailId}-${detailKey}`}>
              <CharacterDetail id={detailId} />
            </Suspense>
          </SuspenseErrorBoundary>
        </section>
      </div>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">The mental model shift</p>
        <p className="text-gray-400">
          With <code className="text-white">useQuery</code>, every component is responsible for its own loading state.
          With <code className="text-white">useSuspenseQuery</code>, loading and errors are <strong className="text-white">lifted up</strong>{' '}
          to the nearest <code className="text-white">Suspense</code> and <code className="text-white">ErrorBoundary</code> boundaries.
          This mirrors how <code className="text-white">async/await</code> lifts errors to <code className="text-white">try/catch</code> blocks —
          leaf components stay simple and focused on rendering data.
        </p>
      </div>
    </div>
  )
}
