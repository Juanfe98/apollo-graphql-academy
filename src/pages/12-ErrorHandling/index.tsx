import { Component, useState } from 'react'
import { gql, CombinedGraphQLErrors } from '@apollo/client'
import { useQuery, useApolloClient } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import type { Character } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'errorPolicy',
    code: `
// errorPolicy controls what Apollo does with partial errors
useQuery(QUERY, {
  errorPolicy: 'none',    // default — sets data=undefined on any error
  errorPolicy: 'all',     // data + errors coexist (partial data accessible)
  errorPolicy: 'ignore',  // errors silently dropped, data returned as-is
})

// With 'all', a query for a nonexistent character returns:
// data: { character: null }
// error.graphQLErrors: [{ message: 'Character not found' }]`,
  },
  {
    label: 'errorLink',
    code: `
// Error link intercepts ALL errors globally — good for logging
import { ErrorLink } from '@apollo/client/link/error'
import { CombinedGraphQLErrors } from '@apollo/client'

const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, path }) =>
      console.error(\`[GQL] \${operation.operationName} | \${path} | \${message}\`)
    )
  } else {
    console.error('[Network error]:', error)
  }
})`,
  },
  {
    label: 'NetworkStatus',
    code: `
import { NetworkStatus } from '@apollo/client'

const { data, networkStatus, refetch } = useQuery(Q, {
  notifyOnNetworkStatusChange: true,
})

const isRefetching = networkStatus === NetworkStatus.refetch  // 4
const isError      = networkStatus === NetworkStatus.error    // 8
const isReady      = networkStatus === NetworkStatus.ready    // 7`,
  },
  {
    label: 'ErrorBoundary',
    code: `
// Declarative error handling with React Error Boundaries
class ApolloErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) return <ErrorUI error={this.state.error} />
    return this.props.children
  }
}

// Usage:
<ApolloErrorBoundary>
  <CharacterDetail id={id} />
</ApolloErrorBoundary>`,
  },
]

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-800 bg-red-950/30">
          <p className="text-red-400 text-sm font-semibold">ErrorBoundary caught:</p>
          <p className="text-red-300 text-xs mt-1">{(this.state.error as Error).message}</p>
          <button className="btn-secondary text-xs mt-2" onClick={() => this.setState({ error: null })}>Reset</button>
        </div>
      )
    }
    return this.props.children
  }
}

function GraphQLErrorsDemo() {
  const [id, setId] = useState('99999')
  const [policy, setPolicy] = useState<'none' | 'all' | 'ignore'>('all')

  const { data, error, loading } = useQuery<{ character: Character | null }>(
    gql`query GetChar($id: ID!) { character(id: $id) { id name status } }`,
    { variables: { id }, errorPolicy: policy }
  )

  const gqlErrors = CombinedGraphQLErrors.is(error) ? error.errors : []

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-gray-400">GraphQL Errors Demo</p>
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Character ID</label>
          <input className="input w-28" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. 99999" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">errorPolicy</label>
          <select className="input" value={policy} onChange={(e) => setPolicy(e.target.value as 'none' | 'all' | 'ignore')}>
            <option value="none">none (default)</option>
            <option value="all">all</option>
            <option value="ignore">ignore</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-xs text-yellow-400">Loading...</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">data:</p>
          <pre className="code-block text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">error:</p>
          <pre className="code-block text-xs">
            {error
              ? JSON.stringify({ message: error.message, graphQLErrors: gqlErrors.map((e) => e.message) }, null, 2)
              : 'null'}
          </pre>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        With <code className="text-indigo-400">errorPolicy:'all'</code>, both data AND errors are available.
        With <code className="text-indigo-400">'none'</code>, data is undefined when any error occurs.
      </p>
    </div>
  )
}

function NetworkErrorDemo() {
  const client = useApolloClient()
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function simulateNetworkError() {
    setBusy(true)
    client.query({
      query: gql`query TestNetwork { characters { info { count } } }`,
      fetchPolicy: 'network-only',
      context: { uri: 'https://broken.invalid/graphql' },
    }).catch((err: Error) => {
      setLog((prev) => [`Network error caught: ${err.message}`, ...prev])
      setBusy(false)
    })
  }

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-gray-400">Network Error Demo</p>
      <p className="text-xs text-gray-500">
        The <code className="text-indigo-400">ErrorLink</code> in <code className="text-indigo-400">client.ts</code> intercepts all network errors globally.
        Check the browser console for the formatted error log.
      </p>
      <button className="btn-danger" onClick={simulateNetworkError} disabled={busy}>
        {busy ? 'Firing...' : 'Simulate Network Error'}
      </button>
      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => <p key={i} className="text-red-400">{l}</p>)}
        </div>
      )}
    </div>
  )
}

function ErrorBoundaryDemo() {
  const [trigger, setTrigger] = useState(false)

  function ThrowingComponent() {
    if (trigger) throw new Error('Intentional render error for ErrorBoundary demo')
    return <p className="text-xs text-gray-400">Component rendered successfully</p>
  }

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-gray-400">Error Boundary Demo</p>
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
      <button className="btn-secondary text-xs" onClick={() => setTrigger((t) => !t)}>
        {trigger ? 'Reset component' : 'Throw render error'}
      </button>
    </div>
  )
}

export default function ErrorHandling() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="12"
        title="Error Handling & Error Policies"
        level="Advanced"
        description="Apollo has three layers: errorPolicy controls data/error coexistence per-query, the ErrorLink handles all errors globally (great for logging), and React Error Boundaries provide declarative UI fallbacks for render-time errors."
        docsUrl="https://www.apollographql.com/docs/react/data/error-handling/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <GraphQLErrorsDemo />
      <NetworkErrorDemo />
      <ErrorBoundaryDemo />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Error handling decision guide</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 font-semibold">Situation</th>
                <th className="text-left py-2 font-semibold">Recommended approach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ['Show inline error per query', 'Read error from useQuery, render ErrorBanner'],
                ['Log all errors to monitoring (Sentry, Datadog)', 'ErrorLink — intercepts every operation globally'],
                ['Partial data OK (some fields failed)', 'errorPolicy: "all" — data and errors coexist'],
                ['Catch render-time errors (thrown in JSX)', 'React Error Boundary around the component tree'],
                ['Retry failed requests automatically', 'RetryLink in the link chain (page 14)'],
                ['Refresh auth token on 401', 'onError link + fromPromise to retry the operation'],
                ['Per-query side-effect on error', 'onError callback on useQuery/useMutation'],
              ].map(([situation, approach]) => (
                <tr key={situation} className="hover:bg-gray-900/50">
                  <td className="py-2 pr-4 text-gray-300">{situation}</td>
                  <td className="py-2 text-indigo-300">{approach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
