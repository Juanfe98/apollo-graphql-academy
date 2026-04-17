import { useMemo, useState } from 'react'
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client'
import { ApolloProvider, useQuery } from '@apollo/client/react'
import { SetContextLink } from '@apollo/client/link/context'
import { RetryLink } from '@apollo/client/link/retry'
import { map } from 'rxjs'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { LinkChainDiagram } from '../../components/shared/LinkChainDiagram'

const SNIPPET_TABS = [
  {
    label: 'Custom ApolloLink',
    code: `
import { ApolloLink } from '@apollo/client'

// A link is middleware: it receives an operation and calls forward() to pass
// it to the next link. Return an Observable wrapping forward(operation).
const loggingLink = new ApolloLink((operation, forward) => {
  console.log(\`→ [\${operation.operationName}] sent\`)

  return forward(operation).map((result) => {
    console.log(\`← [\${operation.operationName}] received\`, result)
    return result
  })
})

// Terminating links (like HttpLink) do NOT call forward() — they hit the network.
// Non-terminating links MUST call forward(operation) or the chain breaks.`,
  },
  {
    label: 'SetContextLink (auth)',
    code: `
import { SetContextLink } from '@apollo/client/link/context'

// SetContextLink lets you inject headers or context values per-request.
// This is the standard pattern for attaching auth tokens.
const authLink = new SetContextLink((prevContext) => ({
  headers: {
    ...prevContext.headers,
    Authorization: \`Bearer \${getTokenFromStorage()}\`,
    'x-app-version': '1.0.0',
  },
}))

// The context is NOT sent over the wire — it's internal to the link chain.
// HttpLink reads context.headers and adds them to the fetch() call.`,
  },
  {
    label: 'RetryLink',
    code: `
import { RetryLink } from '@apollo/client/link/retry'

const retryLink = new RetryLink({
  delay: {
    initial: 300,    // first retry waits 300ms
    max: 3000,       // cap at 3s
    jitter: true,    // add randomness to avoid thundering herd
  },
  attempts: {
    max: 3,
    retryIf: (error, operation) => {
      // Only retry queries, not mutations (mutations may have side effects)
      const isMutation = operation.query.definitions.some(
        (d) => d.kind === 'OperationDefinition' && d.operation === 'mutation'
      )
      return !!error && !isMutation
    },
  },
})`,
  },
  {
    label: 'from() composition',
    code: `
import { ApolloClient, from, HttpLink, InMemoryCache } from '@apollo/client'

// from([]) composes links into a chain.
// Request flows LEFT → RIGHT.
// Response flows RIGHT → LEFT (like middleware onion).
export const client = new ApolloClient({
  link: from([
    loggingLink,   // 1st: logs every outgoing operation
    authLink,      // 2nd: injects Authorization header
    retryLink,     // 3rd: retries on network failure
    httpLink,      // 4th: TERMINATING — hits the network
  ]),
  cache: new InMemoryCache(),
})

// Order matters:
// ✓ loggingLink before authLink → logs before header injection
// ✓ retryLink wraps httpLink → retries the actual network call
// ✗ httpLink first → chain breaks, nothing after it runs`,
  },
  {
    label: 'Operation context',
    code: `
// Each operation carries a "context" object you can read/write from links.
// Use it to pass per-request configuration (e.g. skip auth for public endpoints).

// In a component:
useQuery(GET_PUBLIC_DATA, {
  context: { skipAuth: true },
})

// In the auth link:
const authLink = new SetContextLink((prevContext) => {
  if (prevContext.skipAuth) return {}   // skip this request
  return {
    headers: { Authorization: \`Bearer \${token}\` }
  }
})`,
  },
]

const DEMO_QUERY = gql`
  query DemoLinkChain {
    characters(page: 1) {
      info { count }
      results { id name }
    }
  }
`

function LiveDemo() {
  const [log, setLog] = useState<string[]>([])
  const [isActive, setIsActive] = useState(false)
  const addLog = (msg: string) => setLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 14)])

  const demoClient = useMemo(() => {
    const loggingLink = new ApolloLink((operation, forward) => {
      setIsActive(true)
      addLog(`→ [LoggingLink] Operation "${operation.operationName}" entering chain`)
      return forward(operation).pipe(map((result) => {
        setIsActive(false)
        const count = (result.data as { characters?: { results?: unknown[] } } | undefined)?.characters?.results?.length ?? 0
        addLog(`← [LoggingLink] Response received — ${count} items`)
        return result
      }))
    })

    const authLink = new SetContextLink((prevContext) => {
      addLog(`→ [AuthLink] Injecting Authorization header`)
      return {
        headers: {
          ...prevContext.headers,
          Authorization: `Bearer demo-token-${Date.now()}`,
        },
      }
    })

    const retryLink = new RetryLink({
      attempts: { max: 1 },
    })

    return new ApolloClient({
      link: ApolloLink.from([loggingLink, authLink, retryLink, new HttpLink({ uri: 'https://rickandmortyapi.com/graphql' })]),
      cache: new InMemoryCache(),
    })
  }, [])

  const links = [
    { name: 'LoggingLink', color: 'border-purple-700 bg-purple-950 text-purple-300', active: isActive, description: 'logs ops' },
    { name: 'AuthLink', color: 'border-blue-700 bg-blue-950 text-blue-300', active: isActive, description: 'adds headers' },
    { name: 'RetryLink', color: 'border-yellow-700 bg-yellow-950 text-yellow-300', active: isActive, description: 'retries errors' },
    { name: 'HttpLink', color: 'border-green-700 bg-green-950 text-green-300', active: isActive, description: 'terminating' },
  ]

  return (
    <ApolloProvider client={demoClient}>
      <div className="space-y-4">
        <LinkChainDiagram links={links} />
        <LiveQueryTrigger addLog={addLog} />
        {log.length > 0 && (
          <div className="code-block space-y-0.5 text-xs max-h-48 overflow-y-auto">
            {log.map((l, i) => (
              <p key={i} className={l.includes('→') ? 'text-blue-400' : 'text-green-400'}>{l}</p>
            ))}
          </div>
        )}
      </div>
    </ApolloProvider>
  )
}

function LiveQueryTrigger({ addLog }: { addLog: (m: string) => void }) {
  const { loading, data, refetch } = useQuery<{ characters: { info: { count: number }; results: { id: string; name: string }[] } }>(DEMO_QUERY, { fetchPolicy: 'network-only' })
  return (
    <div className="flex items-center gap-3">
      <button
        className="btn-primary"
        onClick={() => { addLog('—— Firing query through the chain ——'); refetch() }}
        disabled={loading}
      >
        {loading ? 'In-flight...' : 'Fire Query Through Chain'}
      </button>
      {data && (
        <span className="text-xs text-green-400">
          {data.characters.info.count} total characters
        </span>
      )}
    </div>
  )
}

export default function LinkChain() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="14"
        title="The Link Chain"
        level="Advanced"
        description="Apollo's link chain is a middleware pipeline. Every query and mutation flows through it before hitting the network. You compose links with from([]) to add logging, authentication, retrying, batching, or any custom behaviour — without touching component code."
        docsUrl="https://www.apollographql.com/docs/react/api/link/introduction/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Live Demo</h2>
        <p className="text-xs text-gray-400">
          A demo client is built with LoggingLink → AuthLink → RetryLink → HttpLink.
          Click "Fire Query" and watch each link log its activity in order.
        </p>
        <LiveDemo />
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Key rules</p>
        <ul className="text-gray-400 space-y-1 list-disc list-inside">
          <li>Non-terminating links <strong className="text-white">must</strong> call <code className="text-indigo-400">forward(operation)</code></li>
          <li>Only the <strong className="text-white">last</strong> link should be terminating (HttpLink, WsLink)</li>
          <li>Request flows <strong className="text-white">left → right</strong>, response flows <strong className="text-white">right → left</strong></li>
          <li><code className="text-indigo-400">SetContextLink</code> is the correct way to inject headers in Apollo v4 (replaces the deprecated <code className="text-indigo-400">setContext</code> function)</li>
        </ul>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">ApolloLink.split — routing by operation type</h2>
        <p className="text-xs text-gray-400">
          <code className="text-indigo-400">ApolloLink.split(test, trueLink, falseLink)</code> routes operations to different links based on a predicate. The most common use case: send subscriptions over WebSocket and everything else over HTTP.
        </p>
        <div className="code-block text-xs">
          <pre>{`import { ApolloLink, HttpLink } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'

const splitLink = ApolloLink.split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,    // subscriptions → WebSocket
  httpLink,  // queries + mutations → HTTP
)

// You can also split by context — useful for directing some queries
// to a different backend (e.g. a REST link for legacy endpoints):
const splitByContext = ApolloLink.split(
  (operation) => operation.getContext().useRest === true,
  restLink,
  httpLink,
)`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Common link patterns</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-blue-900">
            <p className="text-blue-400 font-semibold mb-1">Token refresh on 401</p>
            <pre className="code-block text-xs">{`// In an onError link, refresh the token then retry:
new ErrorLink(({ error, operation, forward }) => {
  if (error?.statusCode === 401) {
    return fromPromise(
      refreshToken().then((token) => {
        operation.setContext({ headers: { Authorization: \`Bearer \${token}\` } })
        return forward(operation)
      })
    )
  }
})`}</pre>
          </div>
          <div className="card border-purple-900">
            <p className="text-purple-400 font-semibold mb-1">Request deduplication</p>
            <p className="text-gray-400 mb-1">Apollo deduplicates identical in-flight queries automatically. Two components mounting simultaneously with the same query + variables share one network request. Disable with:</p>
            <pre className="code-block text-xs">{`useQuery(GET_CHARACTERS, {
  // Force a separate network request even if
  // an identical one is already in-flight:
  fetchPolicy: 'no-cache',
})`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
