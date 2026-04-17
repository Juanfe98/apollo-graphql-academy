import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { GET_CHARACTERS_PAGINATED } from '../../graphql/queries/characters'
import type { CharactersResult } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'Client setup',
    code: `
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({ url: 'wss://your-api.com/graphql' })
)

// HTTP link for queries + mutations
const httpLink = new HttpLink({ uri: 'https://your-api.com/graphql' })

// Split based on operation type:
// subscriptions → wsLink, everything else → httpLink
const splitLink = ApolloLink.split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return (
      def.kind === 'OperationDefinition' &&
      def.operation === 'subscription'
    )
  },
  wsLink,
  httpLink,
)

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})`,
  },
  {
    label: 'useSubscription',
    code: `
import { useSubscription } from '@apollo/client/react'

const ON_MESSAGE_ADDED = gql\`
  subscription OnMessageAdded($roomId: ID!) {
    messageAdded(roomId: $roomId) {
      id text author { name }
    }
  }
\`

function ChatRoom({ roomId }: { roomId: string }) {
  const { data, loading, error } = useSubscription(ON_MESSAGE_ADDED, {
    variables: { roomId },
    onData({ data }) {
      // Called every time a new event arrives
      console.log('New message:', data.data?.messageAdded)
    },
    onError(err) { console.error(err) },
    onComplete() { console.log('Subscription closed by server') },
  })

  // IMPORTANT: data.messageAdded is the MOST RECENT event only.
  // It does NOT accumulate. You must maintain your own list in state
  // or use subscribeToMore (see next tab) to merge with existing data.
  return <div>{data?.messageAdded.text}</div>
}`,
  },
  {
    label: 'subscribeToMore',
    code: `
// subscribeToMore EXTENDS an existing useQuery with live updates.
// The query provides initial data. The subscription pushes incremental updates.
// updateQuery merges them together — this is the standard real-time pattern.

const { data, subscribeToMore } = useQuery(GET_MESSAGES, {
  variables: { roomId },
})

useEffect(() => {
  const unsubscribe = subscribeToMore({
    document: ON_MESSAGE_ADDED,
    variables: { roomId },
    updateQuery(prev, { subscriptionData }) {
      if (!subscriptionData.data) return prev
      const newMsg = subscriptionData.data.messageAdded
      return {
        messages: {
          ...prev.messages,
          items: [...prev.messages.items, newMsg],
        },
      }
    },
  })
  return unsubscribe  // unsubscribes on unmount or when roomId changes
}, [roomId, subscribeToMore])`,
  },
  {
    label: 'Polling fallback',
    code: `
// When WebSocket infrastructure isn't available, polling approximates
// real-time updates. The consuming component code is identical.

// With subscriptions:
const { data } = useSubscription(ON_NEW_CHARACTER)

// With polling as fallback — same data shape, different transport:
const { data } = useQuery(GET_CHARACTERS, {
  pollInterval: 5000,
  fetchPolicy: 'network-only',
})

// This symmetry means you can start with polling and migrate to
// subscriptions later with minimal component changes.`,
  },
]

// Simulated real-time feed using polling to approximate subscribeToMore
function SimulatedFeed() {
  const [events, setEvents] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [running, setRunning] = useState(false)
  const prevCount = useRef(0)
  const intervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)

  const { data, networkStatus, fetchMore } = useQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS_PAGINATED,
    {
      variables: { page: 1, filter: {} },
      notifyOnNetworkStatusChange: true,
    }
  )

  const currentCount = data?.characters.results.length ?? 0

  useEffect(() => {
    if (currentCount > prevCount.current && prevCount.current > 0) {
      const diff = currentCount - prevCount.current
      setEvents((p) => [
        `[${new Date().toLocaleTimeString()}] ← ${diff} new items received (subscribeToMore would push these)`,
        ...p.slice(0, 14),
      ])
    }
    prevCount.current = currentCount
  }, [currentCount])

  function startSimulation() {
    setRunning(true)
    setEvents((p) => [`[${new Date().toLocaleTimeString()}] Simulation started — loading next page every 4s`, ...p])
    let currentPage = page
    intervalRef.current = setInterval(() => {
      currentPage += 1
      if (currentPage > 3) {
        stopSimulation()
        return
      }
      fetchMore({ variables: { page: currentPage, filter: {} } })
      setPage(currentPage)
    }, 4000)
  }

  function stopSimulation() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setEvents((p) => [`[${new Date().toLocaleTimeString()}] Simulation stopped`, ...p])
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <div className="space-y-4">
      <div className="card border-yellow-900 text-xs space-y-1">
        <p className="text-yellow-400 font-semibold">Why no live WebSocket demo?</p>
        <p className="text-gray-400">
          Real subscriptions require a server that emits events. The Rick & Morty API is read-only HTTP.
          This demo simulates <code className="text-indigo-400">subscribeToMore</code> behaviour using{' '}
          <code className="text-indigo-400">fetchMore</code> on a timer — the pattern of accumulating
          results is identical. See page 16 for live polling.
        </p>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400">Simulated subscribeToMore feed</p>
          <StatusBadge status={networkStatus} />
        </div>
        <p className="text-xs text-gray-500">
          In a real app with subscriptions, each event calls <code className="text-indigo-400">updateQuery</code>,
          which merges the new item into the existing list — exactly like appending a page here.
        </p>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={startSimulation} disabled={running}>
            Start Simulation
          </button>
          <button className="btn-secondary" onClick={stopSimulation} disabled={!running}>
            Stop
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Items in cache: <span className="text-white font-bold">{currentCount}</span>
          {' '}/ {data?.characters.info.count ?? '?'} total
        </p>
        {events.length > 0 && (
          <div className="code-block space-y-0.5 text-xs max-h-36 overflow-y-auto">
            {events.map((e, i) => <p key={i} className="text-green-400">{e}</p>)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Subscriptions() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="17"
        title="Subscriptions"
        level="Advanced"
        description="Subscriptions deliver real-time data over a persistent WebSocket connection. Apollo uses GraphQLWsLink to handle the transport. useSubscription receives individual events; subscribeToMore is the standard pattern for merging live updates into an existing query result."
        docsUrl="https://www.apollographql.com/docs/react/data/subscriptions/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <SimulatedFeed />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-blue-900">
          <p className="text-blue-400 font-semibold mb-2">useSubscription ✓</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Standalone subscription (no initial data)</li>
            <li>Notifications, alerts, activity feeds</li>
            <li>data = most recent event only</li>
            <li>Must accumulate events yourself</li>
          </ul>
        </div>
        <div className="card border-indigo-900">
          <p className="text-indigo-400 font-semibold mb-2">subscribeToMore ✓</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Extend existing useQuery with live updates</li>
            <li>Chat rooms, live lists, dashboards</li>
            <li>updateQuery merges events into query result</li>
            <li>Standard pattern — use this most of the time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
