import { Component, Suspense, useState } from 'react'
import { gql } from '@apollo/client'
import type { QueryRef } from '@apollo/client/react'
import { useBackgroundQuery, useReadQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import type { Character, CharactersResult } from '../../types/rickandmorty'

const GET_CHARACTERS_BG = gql`
  query GetCharactersBackground($page: Int!) {
    characters(page: $page) {
      info { count pages next }
      results { id name status species gender image }
    }
  }
`

// ── Error boundary ────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null } as { error: Error | null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-800">
          <p className="text-red-400 text-xs">{this.state.error.message}</p>
          <button className="btn-secondary text-xs mt-2" onClick={() => this.setState({ error: null })}>
            Reset
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Child that reads from the queryRef ───────────────────────────
function CharacterListReader({
  queryRef,
}: {
  queryRef: QueryRef<{ characters: CharactersResult }>
}) {
  // useReadQuery suspends until data is ready — similar to useSuspenseQuery
  // but the QUERY was already started by the parent via useBackgroundQuery.
  const { data } = useReadQuery(queryRef)
  const characters = data!.characters!

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        {characters.results!.length} characters · {characters.info!.count} total
      </p>
      <div className="grid grid-cols-2 gap-2">
        {characters.results!.slice(0, 6).map((c) => (
          <CharacterCard key={c.id!} character={c as Character} />
        ))}
      </div>
    </div>
  )
}

const SNIPPET_TABS = [
  {
    label: 'useBackgroundQuery',
    code: `
import { useBackgroundQuery, useReadQuery } from '@apollo/client/react'
import type { QueryReference } from '@apollo/client/react'
import { Suspense } from 'react'

// ── Parent component ─────────────────────────────────────────────
// useBackgroundQuery starts the query WITHOUT suspending the parent.
// The parent renders immediately and passes a queryRef to the child.
function Page() {
  const [queryRef] = useBackgroundQuery(GET_CHARACTERS, {
    variables: { page: 1 },
  })

  return (
    <div>
      <h1>Characters</h1>     {/* ← renders immediately */}
      <Suspense fallback={<Spinner />}>
        <CharacterList queryRef={queryRef} />  {/* ← suspends here */}
      </Suspense>
    </div>
  )
}

// ── Child component ───────────────────────────────────────────────
// useReadQuery suspends until the queryRef data is ready.
function CharacterList({
  queryRef,
}: {
  queryRef: QueryReference<{ characters: CharactersResult }>
}) {
  const { data } = useReadQuery(queryRef)
  // data is always defined here
  return <List items={data.characters.results} />
}`,
  },
  {
    label: 'vs useSuspenseQuery',
    code: `
// The key difference: WHERE does the suspend happen?

// useSuspenseQuery — query + render are coupled
// The component that calls useSuspenseQuery SUSPENDS ITSELF.
function Page() {
  // ↓ Page suspends here until data is ready
  const { data } = useSuspenseQuery(GET_CHARACTERS, { variables: { page: 1 } })
  return <List items={data.characters.results} />
}

// useBackgroundQuery + useReadQuery — query starts in parent, suspend in child
// The parent renders immediately. Only the child that calls useReadQuery suspends.
function Page() {
  const [queryRef] = useBackgroundQuery(GET_CHARACTERS, { variables: { page: 1 } })
  // ↑ Page renders IMMEDIATELY — query fires in the background

  return (
    <div>
      <Header />     {/* ← renders now */}
      <Sidebar />    {/* ← renders now */}
      <Suspense fallback={<Spinner />}>
        <CharacterList queryRef={queryRef} />  {/* ← suspends here only */}
      </Suspense>
    </div>
  )
}

// Use useBackgroundQuery when you want the parent to render immediately
// and only the data-dependent section to show a loading state.`,
  },
  {
    label: 'Avoiding waterfalls',
    code: `
// Suspense waterfall: components suspend sequentially, each waiting
// for the previous one to finish before starting its own fetch.

// ❌ With multiple useSuspenseQuery — sequential (waterfall):
function Page() {
  return (
    <Suspense>
      <Characters />   {/* suspends → fetches → resolves */}
    </Suspense>
  )
}
function Characters() {
  const { data } = useSuspenseQuery(GET_CHARACTERS)  // fetch 1
  return (
    <Suspense>
      <Episodes count={data.characters.info.count} />  {/* starts AFTER fetch 1 */}
    </Suspense>
  )
}

// ✓ With useBackgroundQuery — parallel:
function Page() {
  // Both queries start SIMULTANEOUSLY in the parent:
  const [charsRef] = useBackgroundQuery(GET_CHARACTERS)
  const [epsRef]   = useBackgroundQuery(GET_EPISODES)

  return (
    <>
      <Suspense fallback={<Spinner />}>
        <Characters queryRef={charsRef} />  {/* resolves independently */}
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <Episodes queryRef={epsRef} />     {/* resolves independently */}
      </Suspense>
    </>
  )
}`,
  },
  {
    label: 'fetchMore & refetch',
    code: `
// useBackgroundQuery also returns fetchMore and refetch utilities.
const [queryRef, { fetchMore, refetch }] = useBackgroundQuery(GET_CHARACTERS, {
  variables: { page: 1 },
})

// fetchMore works the same as with useQuery:
function loadNextPage(nextPage: number) {
  fetchMore({ variables: { page: nextPage } })
  // The merge function in cache.ts accumulates results
}

// refetch re-runs the query:
refetch({ page: 1 })

// The queryRef passed to children automatically reflects updates —
// children using useReadQuery re-render when new data arrives.`,
  },
]

export default function BackgroundQueryPage() {
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)

  // Query starts IMMEDIATELY when the component mounts.
  // The parent does NOT suspend — it renders right away.
  const [queryRef, { fetchMore }] = useBackgroundQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS_BG,
    { variables: { page: 1 } }
  )

  function loadMore() {
    const next = page + 1
    fetchMore({ variables: { page: next } })
    setPage(next)
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="26"
        title="useBackgroundQuery + useReadQuery"
        level="Advanced"
        description="useBackgroundQuery starts a query without suspending the parent — the parent renders immediately and passes a queryRef to child components. useReadQuery in the child suspends only that subtree. This pattern eliminates Suspense waterfalls by firing multiple queries in parallel."
        docsUrl="https://www.apollographql.com/docs/react/data/suspense/#initiating-queries-outside-of-react"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live demo — parent renders instantly</h2>
          <p className="text-xs text-gray-400">
            This parent component called <code className="text-indigo-400">useBackgroundQuery</code> on mount —
            the query is already in-flight. Click "Show Data" to mount the child that reads it.
            If the data is ready, the child renders immediately with no loading state.
          </p>
        </div>

        <div className="card border-indigo-900 space-y-2">
          <p className="text-xs text-indigo-400 font-semibold">Parent component state (rendered immediately)</p>
          <p className="text-xs text-gray-400">
            Query is firing in the background. This card renders without waiting for it.
            The query is currently on page <span className="text-white">{page}</span>.
          </p>
          <div className="flex gap-2">
            <button className="btn-primary text-xs" onClick={() => setShow(true)}>
              Mount child (useReadQuery)
            </button>
            {show && (
              <button className="btn-secondary text-xs" onClick={() => setShow(false)}>
                Unmount child
              </button>
            )}
            <button className="btn-secondary text-xs" onClick={loadMore} disabled={page >= 3}>
              fetchMore (page {page + 1})
            </button>
          </div>
        </div>

        {show && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Child component using <code className="text-indigo-400">useReadQuery</code>:
            </p>
            <ErrorBoundary>
              <Suspense fallback={<LoadingGrid count={6} />}>
                <CharacterListReader queryRef={queryRef} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-green-900">
          <p className="text-green-400 font-semibold mb-1">useBackgroundQuery ✓ when</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>You need the parent to render immediately (navigation, layout)</li>
            <li>Multiple parallel queries (avoid waterfalls)</li>
            <li>You want to preload data before a child mounts</li>
            <li>Parent controls pagination/filtering via fetchMore</li>
          </ul>
        </div>
        <div className="card border-blue-900">
          <p className="text-blue-400 font-semibold mb-1">useSuspenseQuery ✓ when</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>The entire page can show a loading state</li>
            <li>Single data dependency per component</li>
            <li>Simpler mental model — query and render co-located</li>
            <li>Route-level data fetching (whole route suspends)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
