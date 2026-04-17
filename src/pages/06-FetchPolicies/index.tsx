import type { WatchQueryFetchPolicy } from '@apollo/client'
import { useQuery, useApolloClient } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTER_CORE } from '../../graphql/queries/characters'
import type { Character } from '../../types/rickandmorty'

const POLICIES: { policy: WatchQueryFetchPolicy; color: string; description: string }[] = [
  {
    policy: 'cache-first',
    color: 'border-green-700',
    description: 'Read cache → if miss, fetch network. Default. Best for stable data.',
  },
  {
    policy: 'network-only',
    color: 'border-blue-700',
    description: 'Always hit network, update cache. Use when freshness is critical.',
  },
  {
    policy: 'cache-and-network',
    color: 'border-yellow-700',
    description: 'Return cache immediately, then refetch in background. Best UX.',
  },
  {
    policy: 'no-cache',
    color: 'border-red-700',
    description: "Always hit network, don't write to cache. For sensitive/one-time data.",
  },
]

const SNIPPET = `
// fetchPolicy controls when Apollo hits the network vs reads from cache

useQuery(GET_CHARACTER, {
  variables: { id: '1' },
  fetchPolicy: 'cache-first',      // default
  // fetchPolicy: 'network-only'
  // fetchPolicy: 'cache-and-network'
  // fetchPolicy: 'no-cache'
  // fetchPolicy: 'cache-only'     // cache miss throws, no network call
  // fetchPolicy: 'standby'        // like cache-first but no re-render on cache changes
})
`

const NEXT_FETCH_POLICY_SNIPPET = `
// nextFetchPolicy controls what happens AFTER the first fetch completes.
// This is a subtle but important option for network-only and cache-and-network.

useQuery(GET_CHARACTERS, {
  fetchPolicy: 'network-only',      // first load: always hit the network
  nextFetchPolicy: 'cache-first',   // subsequent renders: read from cache
  // Without nextFetchPolicy, network-only re-fetches on EVERY re-render
  // (e.g. parent component updates, route changes with keep-alive).
})

// Common pairing:
// fetchPolicy: 'cache-and-network' + nextFetchPolicy: 'cache-first'
// → First render shows cache immediately + background refetch.
// → After that, reads from cache (no unnecessary network calls).

// Default nextFetchPolicy when not set:
// cache-first uses cache-first
// network-only STAYS network-only (re-fetches on every re-render — often surprising)
// cache-and-network falls back to cache-first
`

function PolicyPanel({
  policy,
  color,
  description,
}: {
  policy: WatchQueryFetchPolicy
  color: string
  description: string
}) {
  const { loading, data, networkStatus } = useQuery<{ character: Character }>(
    GET_CHARACTER_CORE,
    {
      variables: { id: '1' },
      fetchPolicy: policy,
      notifyOnNetworkStatusChange: true,
    }
  )

  return (
    <div className={`card border ${color} space-y-2`}>
      <div className="flex items-center justify-between">
        <code className="text-xs text-white font-semibold">{policy}</code>
        <span className={`text-xs px-1.5 py-0.5 rounded ${loading ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-400'}`}>
          {loading ? 'fetching' : `ns:${networkStatus}`}
        </span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
      {data?.character && (
        <div className="flex items-center gap-2">
          <img src={data.character.image} alt="" className="w-8 h-8 rounded" />
          <p className="text-xs text-gray-300">{data.character.name}</p>
        </div>
      )}
    </div>
  )
}

export default function FetchPolicies() {
  const client = useApolloClient()

  function clearCache() {
    client.cache.evict({ id: 'Character:1' })
    client.cache.gc()
    client.refetchQueries({ include: 'active' })
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="06"
        title="Fetch Policies"
        level="Intermediate"
        description="fetchPolicy controls whether Apollo reads from cache, hits the network, or both. Choosing the right policy is about balancing freshness vs performance vs UX. All 4 panels query the same character — watch networkStatus (ns) to see when network is hit."
        docsUrl="https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy"
      />

      <CodeBlock code={SNIPPET} label="How to set fetch policy" />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Clear the cache to force all policies to re-fetch and compare behavior
        </p>
        <button className="btn-danger" onClick={clearCache}>
          Evict Character:1 from Cache
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {POLICIES.map((p) => (
          <PolicyPanel key={p.policy} {...p} />
        ))}
      </div>

      {/* ── nextFetchPolicy ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">nextFetchPolicy — what happens after the first fetch</h2>
          <p className="text-xs text-gray-400">
            <code className="text-indigo-400">fetchPolicy</code> only controls the <em>first</em> request. <code className="text-indigo-400">nextFetchPolicy</code> controls every subsequent read — preventing unnecessary re-fetches on re-renders.
          </p>
        </div>
        <CodeBlock code={NEXT_FETCH_POLICY_SNIPPET} label="nextFetchPolicy" />
      </section>

      {/* ── Full policy reference ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">All 6 fetch policies at a glance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 font-semibold">Policy</th>
                <th className="text-left py-2 pr-4 font-semibold">Reads cache?</th>
                <th className="text-left py-2 pr-4 font-semibold">Hits network?</th>
                <th className="text-left py-2 font-semibold">Writes to cache?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ['cache-first (default)', 'Yes — returns immediately on hit', 'Only on miss', 'Yes'],
                ['network-only', 'No', 'Always', 'Yes'],
                ['cache-and-network', 'Yes — returns immediately, then refetches', 'Always', 'Yes'],
                ['no-cache', 'No', 'Always', 'No'],
                ['cache-only', 'Yes — throws on miss', 'Never', 'No'],
                ['standby', 'Like cache-first', 'Only on miss', 'Yes — but no re-render on cache changes'],
              ].map(([policy, reads, network, writes]) => (
                <tr key={policy} className="hover:bg-gray-900/50">
                  <td className="py-2 pr-4 text-white font-mono">{policy}</td>
                  <td className="py-2 pr-4">{reads}</td>
                  <td className="py-2 pr-4">{network}</td>
                  <td className="py-2">{writes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="card border-gray-700">
        <p className="text-xs font-semibold text-gray-400 mb-2">Network Status Codes</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
          <span>1 = loading</span>
          <span>2 = setVariables</span>
          <span>3 = fetchMore</span>
          <span>4 = refetch</span>
          <span>6 = poll</span>
          <span>7 = ready</span>
          <span>8 = error</span>
        </div>
      </div>
    </div>
  )
}
