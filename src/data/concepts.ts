export interface Concept {
  to: string
  num: string
  title: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  desc: string
}

export const concepts: Concept[] = [
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

export const levelColor: Record<string, string> = {
  Beginner:     'border-green-800 hover:border-green-600',
  Intermediate: 'border-yellow-800 hover:border-yellow-600',
  Advanced:     'border-red-800 hover:border-red-600',
}

export const levelBadge: Record<string, string> = {
  Beginner:     'concept-badge-beginner',
  Intermediate: 'concept-badge-intermediate',
  Advanced:     'concept-badge-advanced',
}
