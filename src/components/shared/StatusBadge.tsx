import { NetworkStatus } from '@apollo/client'

interface Props {
  status: number
}

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  [NetworkStatus.loading]:     { label: 'loading (1)',     className: 'bg-yellow-900 text-yellow-300' },
  [NetworkStatus.setVariables]: { label: 'setVariables (2)', className: 'bg-blue-900 text-blue-300' },
  [NetworkStatus.fetchMore]:   { label: 'fetchMore (3)',   className: 'bg-indigo-900 text-indigo-300' },
  [NetworkStatus.refetch]:     { label: 'refetch (4)',     className: 'bg-orange-900 text-orange-300' },
  [NetworkStatus.poll]:        { label: 'poll (6)',        className: 'bg-cyan-900 text-cyan-300 animate-pulse' },
  [NetworkStatus.ready]:       { label: 'ready (7)',       className: 'bg-green-900 text-green-300' },
  [NetworkStatus.error]:       { label: 'error (8)',       className: 'bg-red-900 text-red-300' },
}

export function StatusBadge({ status }: Props) {
  const info = STATUS_MAP[status] ?? { label: `unknown (${status})`, className: 'bg-gray-800 text-gray-400' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${info.className}`}>
      {info.label}
    </span>
  )
}
