import { Link } from 'react-router-dom'

const concepts = [
  // Beginner
  { to: '/concepts/basic-query',   num: '01', title: 'Basic Queries',        level: 'Beginner',     desc: 'useQuery, loading/error/data, skip, refetch, cache population' },
  { to: '/concepts/variables',     num: '02', title: 'Variables & Arguments', level: 'Beginner',     desc: 'Dynamic queries, previousData, skip option' },
  { to: '/concepts/lazy-query',    num: '03', title: 'Lazy Queries',          level: 'Beginner',     desc: 'useLazyQuery, on-demand execution, reset()' },
  { to: '/concepts/aliases',       num: '20', title: 'Aliases',               level: 'Beginner',     desc: 'Rename fields, query same field with different args' },
  // Intermediate
  { to: '/concepts/fragments',         num: '04', title: 'Fragments',               level: 'Intermediate', desc: 'Reusable selections, composition, @client directive' },
  { to: '/concepts/pagination',        num: '05', title: 'Pagination',              level: 'Intermediate', desc: 'fetchMore, type policy merge functions, offset' },
  { to: '/concepts/cursor-pagination', num: '24', title: 'Cursor Pagination',       level: 'Intermediate', desc: 'relayStylePagination(), after/before cursors' },
  { to: '/concepts/fetch-policies',    num: '06', title: 'Fetch Policies',          level: 'Intermediate', desc: 'cache-first, network-only, nextFetchPolicy' },
  { to: '/concepts/cache-rw',          num: '07', title: 'Cache Read & Write',      level: 'Intermediate', desc: 'readQuery, writeQuery, readFragment, cache.modify()' },
  { to: '/concepts/use-mutation',      num: '13', title: 'useMutation',             level: 'Intermediate', desc: 'Mutations, optimisticResponse, update(), refetchQueries' },
  { to: '/concepts/polling',           num: '16', title: 'Polling',                 level: 'Intermediate', desc: 'pollInterval, startPolling/stopPolling' },
  { to: '/concepts/directives',        num: '18', title: 'Directives',              level: 'Intermediate', desc: '@skip, @include, conditional field selection' },
  { to: '/concepts/introspection',     num: '21', title: 'Introspection',           level: 'Intermediate', desc: '__schema, __type, possibleTypes, tooling' },
  { to: '/concepts/interfaces-unions', num: '22', title: 'Interfaces & Unions',     level: 'Intermediate', desc: 'Polymorphic types, inline fragments, possibleTypes' },
  { to: '/concepts/custom-scalars',    num: '23', title: 'Custom Scalars',          level: 'Intermediate', desc: 'Date, JSON, Upload; scalar links, TypeScript codegen' },
  // Advanced
  { to: '/concepts/cache-invalidation', num: '08', title: 'Cache Invalidation',      level: 'Advanced', desc: 'evict, gc, refetchQueries, resetStore' },
  { to: '/concepts/optimistic-ui',      num: '09', title: 'Optimistic UI',           level: 'Advanced', desc: 'optimisticResponse, rollback on failure' },
  { to: '/concepts/reactive-vars',      num: '10', title: 'Reactive Variables',      level: 'Advanced', desc: 'makeVar, useReactiveVar, local state integration' },
  { to: '/concepts/type-policies',      num: '11', title: 'Type Policies',           level: 'Advanced', desc: 'keyFields, merge, read, toReference' },
  { to: '/concepts/error-handling',     num: '12', title: 'Error Handling',          level: 'Advanced', desc: 'errorPolicy, errorLink, Error Boundaries' },
  { to: '/concepts/link-chain',         num: '14', title: 'Link Chain',              level: 'Advanced', desc: 'Middleware pipeline, auth link, retry link, split' },
  { to: '/concepts/use-fragment',       num: '15', title: 'useFragment',             level: 'Advanced', desc: 'Live cache subscription, fine-grained reactivity' },
  { to: '/concepts/subscriptions',      num: '17', title: 'Subscriptions',           level: 'Advanced', desc: 'WebSocketLink, useSubscription, subscribeToMore' },
  { to: '/concepts/testing',            num: '19', title: 'Testing',                 level: 'Advanced', desc: 'MockedProvider, mock queries/mutations, reactive vars' },
  { to: '/concepts/suspense-query',     num: '25', title: 'useSuspenseQuery',        level: 'Advanced', desc: 'Suspense-native fetching, ErrorBoundary integration' },
  { to: '/concepts/background-query',   num: '26', title: 'useBackgroundQuery',      level: 'Advanced', desc: 'Parallel queries, waterfall avoidance, useReadQuery' },
  { to: '/concepts/loadable-query',     num: '27', title: 'useLoadableQuery',        level: 'Advanced', desc: 'On-demand Suspense loading, preload on hover, reset()' },
  { to: '/concepts/defer',              num: '28', title: '@defer',                  level: 'Advanced', desc: 'Stream expensive fields progressively, incremental delivery' },
  { to: '/concepts/batch-http',         num: '29', title: 'BatchHttpLink',           level: 'Advanced', desc: 'Batch multiple queries into one HTTP request' },
  { to: '/concepts/persisted-queries',  num: '30', title: 'Persisted Queries / APQ', level: 'Advanced', desc: 'SHA-256 hashes instead of query strings, CDN caching' },
  { to: '/concepts/federation',         num: '31', title: 'Apollo Federation',       level: 'Advanced', desc: 'Supergraph, subgraphs, @key, entity resolution' },
  { to: '/concepts/file-uploads',       num: '32', title: 'File Uploads',            level: 'Advanced', desc: 'createUploadLink, multipart request spec, Upload scalar' },
]

const levelColor: Record<string, string> = {
  Beginner:     'border-green-800 hover:border-green-600',
  Intermediate: 'border-yellow-800 hover:border-yellow-600',
  Advanced:     'border-red-800 hover:border-red-600',
}

const levelBadge: Record<string, string> = {
  Beginner:     'concept-badge-beginner',
  Intermediate: 'concept-badge-intermediate',
  Advanced:     'concept-badge-advanced',
}

const beginnerCount     = concepts.filter((c) => c.level === 'Beginner').length
const intermediateCount = concepts.filter((c) => c.level === 'Intermediate').length
const advancedCount     = concepts.filter((c) => c.level === 'Advanced').length

export default function Home() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Apollo GraphQL Academy</h1>
        <p className="text-gray-400 mt-2">
          A hands-on learning app using the{' '}
          <a href="https://rickandmortyapi.com/graphql" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Rick & Morty GraphQL API
          </a>
          . Every concept has live demos, interactive controls, and a Cache Inspector so you can see exactly what Apollo is doing internally.
        </p>
      </div>

      <div className="mb-4 flex gap-4 text-xs text-gray-500">
        <span><span className="concept-badge-beginner mr-1">Beginner</span> {beginnerCount}</span>
        <span><span className="concept-badge-intermediate mr-1">Intermediate</span> {intermediateCount}</span>
        <span><span className="concept-badge-advanced mr-1">Advanced</span> {advancedCount}</span>
        <span className="text-gray-600">{concepts.length} modules total</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {concepts.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`card border transition-colors ${levelColor[c.level]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-gray-600 text-xs">{c.num}</span>
              <span className={levelBadge[c.level]}>{c.level}</span>
            </div>
            <p className="text-white font-semibold text-sm">{c.title}</p>
            <p className="text-gray-500 text-xs mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 card border-indigo-900">
        <p className="text-xs font-semibold text-indigo-400 mb-2">Recommended learning path</p>
        <p className="text-xs text-gray-400">
          Start at 01 → work linearly through Beginner/Intermediate. Each concept builds on the previous.
          The Cache Inspector on every page shows Apollo's InMemoryCache in real time — use it constantly.
          Install{' '}
          <a href="https://chromewebstore.google.com/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Apollo Client DevTools
          </a>
          {' '}for an even richer cache visualization.
          Pages 25–32 cover Apollo Client 4.x features and architecture concepts — tackle them after the core modules.
        </p>
      </div>
    </div>
  )
}
