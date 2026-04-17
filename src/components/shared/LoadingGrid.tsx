interface Props {
  count?: number
}

export function LoadingGrid({ count = 6 }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex gap-3 animate-pulse">
          <div className="w-16 h-16 bg-gray-800 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-gray-800 rounded w-3/4" />
            <div className="h-2 bg-gray-800 rounded w-1/2" />
            <div className="h-2 bg-gray-800 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
