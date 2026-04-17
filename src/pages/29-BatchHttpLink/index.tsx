import { useMemo, useState } from 'react'
import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from '@apollo/client'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { ApolloProvider, useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import type { Character } from '../../types/rickandmorty'

const GET_CHAR = (id: string) => gql`
  query GetChar${id} {
    character(id: "${id}") { id name status species image }
  }
`

function CharQuery({ id }: { id: string }) {
  const { loading, data } = useQuery<{ character: Character }>(GET_CHAR(id))
  if (loading) return <div className="card animate-pulse h-16" />
  if (!data?.character) return null
  return <CharacterCard character={data.character} />
}

const SNIPPET_TABS = [
  {
    label: 'BatchHttpLink setup',
    code: `
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { ApolloClient, InMemoryCache } from '@apollo/client'

// BatchHttpLink collects all queries that fire within a time window
// and sends them in a single HTTP request as a JSON array.
const client = new ApolloClient({
  link: new BatchHttpLink({
    uri: '/graphql',
    batchMax: 5,          // max operations per batch (default: 10)
    batchInterval: 20,    // wait up to 20ms to collect operations (default: 10)
    batchDebounce: false, // if true, timer resets on each new operation
  }),
  cache: new InMemoryCache(),
})

// Without batching — 3 components → 3 HTTP requests:
// POST /graphql  { query: "query A {...}" }
// POST /graphql  { query: "query B {...}" }
// POST /graphql  { query: "query C {...}" }

// With BatchHttpLink — 3 components → 1 HTTP request:
// POST /graphql  [
//   { query: "query A {...}" },
//   { query: "query B {...}" },
//   { query: "query C {...}" }
// ]`,
  },
  {
    label: 'Selective batching',
    code: `
import { ApolloLink, HttpLink } from '@apollo/client'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

// Use ApolloLink.split to batch only some operations.
// Mutations with side effects should NOT be batched to avoid
// unexpected ordering and error handling issues.

const batchLink = new BatchHttpLink({ uri: '/graphql', batchMax: 5 })
const httpLink  = new HttpLink({ uri: '/graphql' })

const splitLink = ApolloLink.split(
  (operation) => operation.getContext().batch === true,
  batchLink,   // use batch for operations with context.batch = true
  httpLink,    // use regular HTTP for everything else
)

// In a component, opt-in to batching per-query:
useQuery(GET_DATA, {
  context: { batch: true },
})`,
  },
  {
    label: 'Server requirement',
    code: `
// The server must accept batched requests (JSON arrays).
// Apollo Server handles this automatically.
// Express-based servers need the batch middleware:

// Apollo Server 4 (handles batching natively):
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'

const server = new ApolloServer({ typeDefs, resolvers })
app.use('/graphql', expressMiddleware(server))
// ↑ batching works out of the box

// Other servers (graphql-http, Yoga, etc.) also support batch requests
// when configured. Check your server's docs for batch request support.`,
  },
  {
    label: 'When to use',
    code: `
// ✓ BatchHttpLink is a good fit when:
// - You have many small queries mounting simultaneously (list + detail panels)
// - Dashboard pages with independent data fetching components
// - Server roundtrip latency is high (batching amortizes it)
// - You want to reduce the number of HTTP connections

// ✗ Do NOT use BatchHttpLink when:
// - Mutations that MUST complete in a specific order
// - Queries requiring different auth headers per operation
// - Server doesn't support batch requests
// - Latency is already very low (batching adds the wait interval)

// Alternative to batching: automatic query deduplication.
// Apollo deduplicates IDENTICAL queries in flight by default —
// two components with the same query + variables share one request.
// Batching is for DIFFERENT queries fired at the same time.`,
  },
]

export default function BatchHttpLinkPage() {
  const [mode, setMode] = useState<'batch' | 'single'>('batch')
  const [mounted, setMounted] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const demoClient = useMemo(() => {
    const addLog = (msg: string) => setLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 14)])

    const loggingLink = new ApolloLink((operation, forward) => {
      addLog(`→ Operation "${operation.operationName}" entering link`)
      return forward(operation)
    })

    const targetLink = mode === 'batch'
      ? new BatchHttpLink({
          uri: 'https://rickandmortyapi.com/graphql',
          batchMax: 10,
          batchInterval: 30,
        })
      : new HttpLink({ uri: 'https://rickandmortyapi.com/graphql' })

    return new ApolloClient({
      link: ApolloLink.from([loggingLink, targetLink]),
      cache: new InMemoryCache(),
    })
  }, [mode])

  const ids = ['1', '2', '3', '4', '5']

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="29"
        title="BatchHttpLink"
        level="Advanced"
        description="BatchHttpLink collects multiple in-flight operations within a time window and sends them as a single HTTP request (a JSON array). The server processes each operation and returns an array of results. Reduces round-trips when many components fetch independently on the same render cycle."
        docsUrl="https://www.apollographql.com/docs/react/api/link/apollo-link-batch-http/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live demo — 5 queries, single mount</h2>
          <p className="text-xs text-gray-400">
            Both modes fire 5 separate <code className="text-indigo-400">useQuery</code> calls for characters 1–5.
            In batch mode, they're collected into one HTTP request. Watch the logging link — it fires 5 times,
            but the network tab shows only 1 request.{' '}
            <strong className="text-white">Open DevTools → Network</strong> to see the difference.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1">
            {(['batch', 'single'] as const).map((m) => (
              <button
                key={m}
                className={`btn text-xs ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setMode(m); setMounted(false); setLog([]) }}
              >
                {m === 'batch' ? 'BatchHttpLink' : 'HttpLink (normal)'}
              </button>
            ))}
          </div>
          <button
            className="btn-primary text-xs"
            onClick={() => { setMounted(false); setLog([]); setTimeout(() => setMounted(true), 50) }}
          >
            Mount 5 components
          </button>
          {mounted && (
            <button className="btn-secondary text-xs" onClick={() => { setMounted(false); setLog([]) }}>
              Unmount
            </button>
          )}
        </div>

        <div className={`card border-dashed text-xs ${mode === 'batch' ? 'border-green-800' : 'border-yellow-800'}`}>
          <p className={`font-semibold mb-1 ${mode === 'batch' ? 'text-green-400' : 'text-yellow-400'}`}>
            Mode: {mode === 'batch' ? 'BatchHttpLink — 5 ops → 1 request' : 'HttpLink — 5 ops → 5 requests'}
          </p>
          <p className="text-gray-500">
            {mode === 'batch'
              ? 'Operations within 30ms are grouped into a single POST with a JSON array body.'
              : 'Each useQuery fires its own POST request independently.'}
          </p>
        </div>

        {log.length > 0 && (
          <div className="code-block text-xs space-y-0.5 max-h-36 overflow-y-auto">
            {log.map((l, i) => <p key={i} className="text-blue-400">{l}</p>)}
          </div>
        )}

        {mounted && (
          <ApolloProvider client={demoClient}>
            <div className="grid grid-cols-5 gap-2">
              {ids.map((id) => (
                <div key={id} className="space-y-1">
                  <p className="text-xs text-gray-600 text-center">#{id}</p>
                  <CharQuery id={id} />
                </div>
              ))}
            </div>
          </ApolloProvider>
        )}

        {!mounted && (
          <div className="card border-dashed border-gray-700 text-center py-8">
            <p className="text-gray-600 text-xs">Click "Mount 5 components" to start the demo</p>
          </div>
        )}
      </section>

      <div className="card border-yellow-900 text-xs space-y-1">
        <p className="text-yellow-400 font-semibold">Important: Rick & Morty API and batching</p>
        <p className="text-gray-400">
          The Rick & Morty API supports batch requests. In the logging link above, you'll see all 5 operations
          enter the link chain. In batch mode, they're collected by BatchHttpLink into a single request.
          The logging link doesn't distinguish — that's intentional: batching is transparent to the rest of
          the link chain and to components.
        </p>
      </div>
    </div>
  )
}
