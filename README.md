# Apollo GraphQL Academy

A hands-on learning app covering **32 GraphQL and Apollo Client concepts** — from basics to advanced patterns. Every module includes live interactive demos, annotated code snippets, and a real-time Cache Inspector so you can see exactly what Apollo is doing internally.

Built with **Apollo Client 4.x**, **React 19**, **TypeScript**, and the public [Rick & Morty GraphQL API](https://rickandmortyapi.com/graphql).

---

## Getting Started

**Requirements:** Node.js 24+

```bash
# Install dependencies
nvm use 24
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Type-check + production build
npm run build

# Preview the production build
npm run preview
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| GraphQL client | Apollo Client 4.1.x |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Bundler | Vite 8 |
| API | Rick & Morty GraphQL (public, read-only) |

---

## Project Structure

```
src/
├── apollo/
│   ├── client.ts          # ApolloClient — HttpLink, ErrorLink, defaultOptions
│   ├── cache.ts           # InMemoryCache — type policies, merge functions
│   └── reactiveVars.ts    # Global reactive variables (favorites, notes, overrides)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx    # Navigation sidebar grouped by level
│   │   └── Layout.tsx     # App shell (sidebar + main content + cache inspector)
│   └── shared/
│       ├── CacheInspector.tsx   # Live JSON view of Apollo's InMemoryCache
│       ├── ConceptHeader.tsx    # Page header with concept number, level, and docs link
│       ├── CodeBlock.tsx        # Tabbed syntax-highlighted code snippets
│       ├── CharacterCard.tsx    # Reusable character display card
│       ├── LoadingGrid.tsx      # Skeleton loading grid
│       └── ...
│
├── pages/                 # One folder per concept module (01–32)
│   ├── 01-BasicQuery/
│   ├── 02-Variables/
│   └── ...
│
├── types/
│   └── rickandmorty.ts    # TypeScript types for API responses
│
└── App.tsx                # Route definitions
```

---

## Learning Path

Modules are grouped into three levels. Each one builds on the previous.

### Beginner

| # | Module | Key concepts |
|---|---|---|
| 01 | Basic Queries | `useQuery`, loading/error/data, `skip`, `refetch`, cache population |
| 02 | Variables & Arguments | Dynamic queries, `previousData`, `skip` option |
| 03 | Lazy Queries | `useLazyQuery`, on-demand execution, `reset()` |
| 20 | Aliases | Rename fields, query same field with different args |

### Intermediate

| # | Module | Key concepts |
|---|---|---|
| 04 | Fragments | Reusable selections, composition, `@client` directive |
| 05 | Pagination | `fetchMore`, type policy merge functions, offset pagination |
| 24 | Cursor Pagination | `relayStylePagination()`, after/before cursors |
| 06 | Fetch Policies | cache-first, network-only, cache-and-network, `nextFetchPolicy` |
| 07 | Cache Read & Write | `readQuery`, `writeQuery`, `readFragment`, `cache.modify()` |
| 13 | useMutation | Mutations, `optimisticResponse`, `update()`, `refetchQueries` |
| 16 | Polling | `pollInterval`, `startPolling`/`stopPolling` |
| 18 | Directives | `@skip`, `@include`, conditional field selection |
| 21 | Introspection | `__schema`, `__type`, `possibleTypes`, tooling |
| 22 | Interfaces & Unions | Polymorphic types, inline fragments, `possibleTypes` config |
| 23 | Custom Scalars | Date, JSON, Upload; scalar links, TypeScript codegen |

### Advanced

| # | Module | Key concepts |
|---|---|---|
| 08 | Cache Invalidation | `evict`, `gc`, `refetchQueries`, `resetStore` |
| 09 | Optimistic UI | `optimisticResponse`, rollback on failure |
| 10 | Reactive Variables | `makeVar`, `useReactiveVar`, local state integration |
| 11 | Type Policies | `keyFields`, `merge`, `read`, `toReference` |
| 12 | Error Handling | `errorPolicy`, `errorLink`, Error Boundaries |
| 14 | Link Chain | Middleware pipeline, auth link, retry link, `ApolloLink.split` |
| 15 | useFragment | Live cache subscription, fine-grained reactivity |
| 17 | Subscriptions | `WebSocketLink`, `useSubscription`, `subscribeToMore` |
| 19 | Testing | `MockedProvider`, mock queries/mutations, reactive vars |
| 25 | useSuspenseQuery | Suspense-native fetching, ErrorBoundary integration |
| 26 | useBackgroundQuery | Parallel queries, waterfall avoidance, `useReadQuery` |
| 27 | useLoadableQuery | On-demand Suspense loading, preload on hover, `reset()` |
| 28 | @defer | Stream expensive fields progressively, incremental delivery |
| 29 | BatchHttpLink | Batch multiple queries into one HTTP request |
| 30 | Persisted Queries / APQ | SHA-256 hashes instead of query strings, CDN caching |
| 31 | Apollo Federation | Supergraph, subgraphs, `@key`, entity resolution |
| 32 | File Uploads | `createUploadLink`, multipart request spec, Upload scalar |

> **Recommended path:** start at 01 and work linearly through Beginner → Intermediate. Advanced modules (08–19) can be tackled in any order once you're comfortable with the core. Modules 25–32 cover Apollo Client 4.x-specific features.

---

## Apollo Client Setup

The client is configured in `src/apollo/client.ts`:

- **Link chain:** `ErrorLink → HttpLink` — errors are intercepted globally before reaching components.
- **Cache:** `InMemoryCache` with custom type policies for pagination (`characters`), local computed fields (`isFavorited`, `localNote`), and name overrides.
- **Default options:** `cache-first` fetch policy and `errorPolicy: 'all'` globally.
- **DevTools:** enabled in development — install [Apollo Client DevTools](https://chromewebstore.google.com/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm) for a rich cache explorer in Chrome.

---

## Cache Inspector

Every page includes a **Cache Inspector** panel (bottom of the screen) that renders Apollo's `InMemoryCache` as a live JSON tree. Watch cache keys get populated, see normalized objects appear, and observe how updates propagate — in real time as you interact with each demo.

---

## Key Architecture Decisions

**Why the Rick & Morty API?**
It's public, requires no authentication, has a rich schema (characters, episodes, locations), and supports pagination — making it ideal for demonstrating real Apollo patterns without any backend setup.

**Why Apollo Client 4.x?**
Version 4 introduced native Suspense support (`useSuspenseQuery`, `useBackgroundQuery`, `useLoadableQuery`), `@defer` incremental delivery, and improved TypeScript types. All 32 modules use 4.x APIs.

**Read-only API limitations:**
The Rick & Morty API is read-only, so mutation demos (modules 09, 13) simulate writes via optimistic responses and local cache updates rather than persisting to a real backend.

---

## Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check + build for production
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```
