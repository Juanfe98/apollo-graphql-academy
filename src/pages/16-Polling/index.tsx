import { useEffect, useRef, useState } from 'react'
import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import { GET_CHARACTER_CORE } from '../../graphql/queries/characters'
import type { CharactersResult, Character } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'pollInterval',
    code: `
// Re-fetch every N milliseconds automatically.
// Apollo handles the timer, cleanup, and deduplication.
const { data, loading, networkStatus } = useQuery(GET_CHARACTERS, {
  pollInterval: 5000,                 // re-fetch every 5 seconds
  notifyOnNetworkStatusChange: true,  // re-render during each poll cycle
  // Without notifyOnNetworkStatusChange, loading stays false during polls
})

// networkStatus === NetworkStatus.poll (6) while a poll is in-flight
// networkStatus === NetworkStatus.ready (7) when data is fresh`,
  },
  {
    label: 'startPolling / stopPolling',
    code: `
// Dynamic control — start and stop polling based on app state.
const { data, startPolling, stopPolling } = useQuery(GET_CHARACTERS)

// Pause when tab is hidden, resume when visible:
useEffect(() => {
  const onVisibility = () => {
    document.hidden ? stopPolling() : startPolling(5000)
  }
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    stopPolling()  // always clean up on unmount
  }
}, [startPolling, stopPolling])`,
  },
  {
    label: 'Detect poll cycles',
    code: `
import { NetworkStatus } from '@apollo/client'

const { data, networkStatus } = useQuery(GET_CHARACTERS, {
  pollInterval: 3000,
  notifyOnNetworkStatusChange: true,
})

const isInitialLoad = networkStatus === NetworkStatus.loading  // 1
const isPolling     = networkStatus === NetworkStatus.poll     // 6
const isReady       = networkStatus === NetworkStatus.ready    // 7

// Use isPolling to show a subtle "refreshing" indicator
// without blocking the entire UI (unlike isInitialLoad).
return (
  <div>
    {isInitialLoad && <Spinner />}
    {isPolling && <small>Refreshing...</small>}
    {data && <CharacterList characters={data.characters.results} />}
  </div>
)`,
  },
  {
    label: 'Polling vs Subscriptions',
    code: `
// Polling: simpler, HTTP, slightly wasteful (fetches even when unchanged)
const { data } = useQuery(GET_FEED, { pollInterval: 5000 })

// Subscriptions: WebSocket, push-based, efficient (server notifies you)
const { data } = useSubscription(ON_NEW_POST)

// The component code consuming data is IDENTICAL in both cases.
// Polling is a great fallback when WebSocket infrastructure isn't available.
// Switch to subscriptions later with minimal component changes.`,
  },
]

function AutoPollingDemo() {
  const [interval, setInterval_] = useState(5000)
  const [pollCount, setPollCount] = useState(0)
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const prevStatus = useRef<number | null>(null)

  const { data, networkStatus, startPolling, stopPolling } = useQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS,
    {
      pollInterval: interval,
      notifyOnNetworkStatusChange: true,
    }
  )

  useEffect(() => {
    if (prevStatus.current === NetworkStatus.poll && networkStatus === NetworkStatus.ready) {
      setPollCount((c) => c + 1)
      setLastFetch(new Date().toLocaleTimeString())
    }
    prevStatus.current = networkStatus
  }, [networkStatus])

  function changeInterval(ms: number) {
    setInterval_(ms)
    stopPolling()
    if (ms > 0) startPolling(ms)
  }

  const isPolling = networkStatus === NetworkStatus.poll

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400">Auto Polling — pollInterval</p>
        <StatusBadge status={networkStatus} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {[2000, 5000, 10000].map((ms) => (
          <button
            key={ms}
            className={`btn text-xs ${interval === ms ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => changeInterval(ms)}
          >
            {ms / 1000}s
          </button>
        ))}
        <button
          className={`btn text-xs ${interval === 0 ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => changeInterval(0)}
        >
          Stop
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card">
          <p className="text-xs text-gray-500">Poll count</p>
          <p className="text-white font-bold text-lg">{pollCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Last refresh</p>
          <p className="text-white text-xs mt-1">{lastFetch ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Status</p>
          <p className={`text-xs mt-1 font-semibold ${isPolling ? 'text-cyan-400 animate-pulse' : 'text-green-400'}`}>
            {isPolling ? 'Polling...' : 'Ready'}
          </p>
        </div>
      </div>

      {data && (
        <p className="text-xs text-gray-500">
          Data: {data.characters.info.count} total characters
          {' '}(this API is static, count won't change — but the fetch is real)
        </p>
      )}
    </div>
  )
}

function ManualPollingDemo() {
  const [active, setActive] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const { data, networkStatus, startPolling, stopPolling, refetch } = useQuery<{ character: Character }>(
    GET_CHARACTER_CORE,
    {
      variables: { id: '1' },
      notifyOnNetworkStatusChange: true,
    }
  )

  function addLog(msg: string) {
    setLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 9)])
  }

  function handleStart() {
    setActive(true)
    startPolling(3000)
    addLog('startPolling(3000) called — will refetch every 3s')
  }

  function handleStop() {
    setActive(false)
    stopPolling()
    addLog('stopPolling() called')
  }

  function handleRefetchOnce() {
    refetch()
    addLog('refetch() called — single manual fetch')
  }

  useEffect(() => {
    if (networkStatus === NetworkStatus.refetch) addLog('networkStatus → refetch (4)')
    if (networkStatus === NetworkStatus.poll) addLog('networkStatus → poll (6) — in-flight')
    if (networkStatus === NetworkStatus.ready && log.length > 0) addLog('networkStatus → ready (7)')
  }, [networkStatus])

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400">Manual Control — startPolling / stopPolling</p>
        <StatusBadge status={networkStatus} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="btn-success" onClick={handleStart} disabled={active}>
          startPolling(3s)
        </button>
        <button className="btn-danger" onClick={handleStop} disabled={!active}>
          stopPolling()
        </button>
        <button className="btn-secondary" onClick={handleRefetchOnce}>
          refetch() once
        </button>
      </div>

      {data?.character && (
        <p className="text-xs text-gray-400">
          Watching: <span className="text-white">{data.character.name}</span>
        </p>
      )}

      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs max-h-36 overflow-y-auto">
          {log.map((l, i) => <p key={i} className="text-cyan-400">{l}</p>)}
        </div>
      )}
    </div>
  )
}

export default function Polling() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="16"
        title="Polling"
        level="Intermediate"
        description="Polling re-executes a query at a fixed interval, giving you near-real-time data without WebSockets. Apollo manages the timer, deduplication, and cleanup automatically. Use pollInterval for static setup, or startPolling/stopPolling for dynamic control (e.g. pause when tab is hidden)."
        docsUrl="https://www.apollographql.com/docs/react/data/queries/#polling"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <AutoPollingDemo />
      <ManualPollingDemo />

      <div className="card border-gray-700 text-xs space-y-2">
        <p className="text-gray-400 font-semibold">NetworkStatus reference</p>
        <div className="grid grid-cols-2 gap-1 text-gray-500">
          {[
            [1, 'loading — initial fetch'],
            [2, 'setVariables — variables changed'],
            [3, 'fetchMore — loading next page'],
            [4, 'refetch — manual refetch'],
            [6, 'poll — in-flight poll cycle ← key'],
            [7, 'ready — data available'],
            [8, 'error — fetch failed'],
          ].map(([code, label]) => (
            <p key={code}>
              <span className={`font-bold ${code === 6 ? 'text-cyan-400' : 'text-white'}`}>{code}</span>
              {' = '}{label}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
