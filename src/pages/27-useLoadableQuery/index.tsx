import { Component, Suspense, useState } from 'react'
import { gql } from '@apollo/client'
import type { QueryRef } from '@apollo/client/react'
import { useLoadableQuery, useReadQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import type { Character } from '../../types/rickandmorty'

const GET_CHARACTER_LOADABLE = gql`
  query GetCharacterLoadable($id: ID!) {
    character(id: $id) { id name status species gender image type }
  }
`

// ── Error boundary ────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode; resetKey?: unknown },
  { error: Error | null; resetKey?: unknown }
> {
  state = { error: null, resetKey: undefined } as { error: Error | null; resetKey?: unknown }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  static getDerivedStateFromProps(
    props: { resetKey?: unknown },
    state: { error: Error | null; resetKey?: unknown }
  ) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey }
    return null
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-800">
          <p className="text-red-400 text-xs">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Child that reads from the queryRef ───────────────────────────
function CharacterReader({
  queryRef,
}: {
  queryRef: QueryRef<{ character: Character }>
}) {
  const { data } = useReadQuery(queryRef)
  return <CharacterCard character={data!.character as Character} />
}

const SNIPPET_TABS = [
  {
    label: 'useLoadableQuery',
    code: `
import { Suspense } from 'react'
import { useLoadableQuery, useReadQuery } from '@apollo/client/react'
import type { QueryReference } from '@apollo/client/react'

// useLoadableQuery = useLazyQuery + Suspense support
// It does NOT fire on mount. Call loadQuery() to start it.
// Returns [loadQuery, queryRef, { reset }]
function CharacterSearch() {
  const [loadCharacter, queryRef] = useLoadableQuery(GET_CHARACTER)
  // queryRef is null until loadQuery is called

  return (
    <div>
      <input onBlur={(e) => loadCharacter({ variables: { id: e.target.value } })} />

      {queryRef && (  // only mount child when query has been fired
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <CharacterDetail queryRef={queryRef} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}

function CharacterDetail({
  queryRef,
}: {
  queryRef: QueryReference<{ character: Character }>
}) {
  const { data } = useReadQuery(queryRef)  // suspends if not ready
  return <Card character={data.character} />
}`,
  },
  {
    label: 'vs useLazyQuery',
    code: `
// useLazyQuery — classic imperative style
const [getCharacter, { loading, error, data }] = useLazyQuery(GET_CHARACTER)

function handleSearch(id: string) {
  getCharacter({ variables: { id } })
}

// Check loading/error/data in the SAME component:
if (loading) return <Spinner />
if (error) return <ErrorUI />
return data ? <Card character={data.character} /> : null

// ─────────────────────────────────────────────────────────────────
// useLoadableQuery — Suspense style
const [loadCharacter, queryRef] = useLoadableQuery(GET_CHARACTER)

function handleSearch(id: string) {
  loadCharacter({ variables: { id } })
}

// Loading and error are LIFTED to Suspense + ErrorBoundary:
return queryRef ? (
  <ErrorBoundary>
    <Suspense fallback={<Spinner />}>
      <CharacterDetail queryRef={queryRef} />  {/* clean, just renders */}
    </Suspense>
  </ErrorBoundary>
) : null

// Choose based on team preference and whether you want Suspense architecture.`,
  },
  {
    label: 'reset()',
    code: `
// The third return value includes reset — clears queryRef back to null.
// Useful for "clear search" buttons or navigation cleanup.
const [loadQuery, queryRef, { reset }] = useLoadableQuery(GET_CHARACTER)

// Reset clears the queryRef AND disposes the query subscription.
// The child component will unmount (since queryRef becomes null).
<button onClick={reset}>Clear</button>

// Calling loadQuery() again after reset starts fresh:
loadQuery({ variables: { id: '1' } })  // queryRef becomes non-null again`,
  },
  {
    label: 'Preloading on hover',
    code: `
// Preloading pattern: start the query on hover, read on click.
// By the time the user clicks, data may already be in cache.

const [loadCharacter, queryRef] = useLoadableQuery(GET_CHARACTER)
const [show, setShow] = useState(false)

function handleHover(id: string) {
  // Start fetching in the background — user hasn't clicked yet
  loadCharacter({ variables: { id } })
}

function handleClick() {
  setShow(true)  // now show the result — likely already ready
}

return (
  <div onMouseEnter={() => handleHover('1')} onClick={handleClick}>
    Hover to preload, click to show
    {show && queryRef && (
      <Suspense fallback={<Spinner />}>
        <CharacterDetail queryRef={queryRef} />
      </Suspense>
    )}
  </div>
)`,
  },
]

export default function LoadableQueryPage() {
  const [inputId, setInputId] = useState('')
  const [show, setShow] = useState(false)

  const [loadCharacter, queryRef, { reset }] = useLoadableQuery<{ character: Character }>(
    GET_CHARACTER_LOADABLE
  )

  function handleLoad() {
    if (!inputId) return
    setShow(true)
    loadCharacter({ variables: { id: inputId } })
  }

  function handleReset() {
    reset()
    setShow(false)
    setInputId('')
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="27"
        title="useLoadableQuery"
        level="Advanced"
        description="useLoadableQuery is the Suspense-compatible version of useLazyQuery. It does not fire on mount — you call the returned loadQuery function to start it. The queryRef is null until triggered, then read by a child via useReadQuery. Supports preloading on hover and reset()."
        docsUrl="https://www.apollographql.com/docs/react/data/suspense/#initiating-queries-outside-of-react"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live demo — on-demand load with Suspense</h2>
          <p className="text-xs text-gray-400">
            Enter a character ID and click Load. The query starts on demand — queryRef goes from{' '}
            <code className="text-indigo-400">null</code> to non-null, and the child mounts and suspends
            until data arrives.
          </p>
        </div>

        <div className="card space-y-3">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={826}
              className="input w-28 text-xs"
              placeholder="ID (1–826)"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            />
            <button className="btn-primary text-xs" onClick={handleLoad} disabled={!inputId}>
              Load Character
            </button>
            {queryRef && (
              <button className="btn-secondary text-xs" onClick={handleReset}>
                reset()
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-1">queryRef:</p>
              <p className={`font-mono font-semibold ${queryRef ? 'text-green-400' : 'text-gray-600'}`}>
                {queryRef ? 'QueryReference (active)' : 'null'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">show:</p>
              <p className={`font-mono font-semibold ${show ? 'text-green-400' : 'text-gray-600'}`}>
                {String(show)}
              </p>
            </div>
          </div>
        </div>

        {show && queryRef && (
          <ErrorBoundary resetKey={inputId}>
            <Suspense fallback={<LoadingGrid count={1} />}>
              <CharacterReader queryRef={queryRef} />
            </Suspense>
          </ErrorBoundary>
        )}
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Suspense hook comparison</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-1.5 pr-4">Hook</th>
                <th className="text-left py-1.5 pr-4">Fires on mount?</th>
                <th className="text-left py-1.5 pr-4">Suspends in</th>
                <th className="text-left py-1.5">Use case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-400">
              <tr>
                <td className="py-1.5 pr-4 text-white font-mono">useSuspenseQuery</td>
                <td className="pr-4 text-yellow-400">Yes</td>
                <td className="pr-4">The calling component</td>
                <td>Route-level data loading</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 text-white font-mono">useBackgroundQuery</td>
                <td className="pr-4 text-yellow-400">Yes</td>
                <td className="pr-4">Child via useReadQuery</td>
                <td>Parallel queries, parent renders first</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 text-white font-mono">useLoadableQuery</td>
                <td className="pr-4 text-green-400">No — manual trigger</td>
                <td className="pr-4">Child via useReadQuery</td>
                <td>On-demand, search, preload on hover</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
