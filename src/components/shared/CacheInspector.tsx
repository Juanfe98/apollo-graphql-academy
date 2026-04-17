import { useApolloClient } from '@apollo/client/react'
import { useState } from 'react'

interface Props {
  highlight?: string // Cache key to highlight (e.g. "Character:1")
}

export function CacheInspector({ highlight }: Props) {
  const client = useApolloClient()
  const [open, setOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({})

  function refresh() {
    setSnapshot(client.cache.extract() as Record<string, unknown>)
    setOpen(true)
  }

  const keys = Object.keys(snapshot)
  const sorted = [
    ...keys.filter((k) => highlight && k.includes(highlight)),
    ...keys.filter((k) => !highlight || !k.includes(highlight)),
  ]

  return (
    <div className="card border-indigo-900">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-indigo-400">Cache Inspector</p>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={refresh}>
            Snapshot Cache
          </button>
          {open && (
            <button className="btn-secondary text-xs" onClick={() => setOpen(false)}>
              Hide
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="text-xs text-gray-500">Cache is empty</p>
          )}
          {sorted.map((key) => (
            <div
              key={key}
              className={`rounded p-2 text-xs ${
                highlight && key.includes(highlight)
                  ? 'bg-yellow-900/40 border border-yellow-700'
                  : 'bg-gray-950 border border-gray-800'
              }`}
            >
              <p className="text-indigo-300 font-semibold mb-1">{key}</p>
              <pre className="text-gray-300 whitespace-pre-wrap overflow-auto text-xs">
                {JSON.stringify(snapshot[key], null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
