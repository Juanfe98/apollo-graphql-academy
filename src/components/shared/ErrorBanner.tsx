import { CombinedGraphQLErrors } from '@apollo/client'

interface Props {
  error: CombinedGraphQLErrors | Error | string
  onRetry?: () => void
}

export function ErrorBanner({ error, onRetry }: Props) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : String(error)

  const graphQLErrors = CombinedGraphQLErrors.is(error) ? error.errors : []

  return (
    <div className="card border-red-800 bg-red-950/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-red-400 text-sm font-semibold">Error</p>
          <p className="text-red-300 text-xs mt-1">{message}</p>
          {graphQLErrors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {graphQLErrors.map((e, i) => (
                <li key={i} className="text-xs text-red-400">
                  {e.path?.join(' → ')} — {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onRetry && (
          <button className="btn-danger flex-shrink-0" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
