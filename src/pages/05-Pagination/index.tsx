import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { EpisodeCard } from '../../components/shared/EpisodeCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTERS_PAGINATED } from '../../graphql/queries/characters'
import { GET_EPISODES } from '../../graphql/queries/episodes'
import type { CharactersResult, EpisodesResult } from '../../types/rickandmorty'

const SNIPPET = `
// fetchMore appends the next page to the existing query result.
// The merge function in cache.ts is what makes this work:
//   merge(existing, incoming) {
//     return { ...incoming, results: [...existing.results, ...incoming.results] }
//   }

const { data, fetchMore, loading } = useQuery(GET_CHARACTERS_PAGINATED, {
  variables: { page: 1 }
})

function loadMore() {
  fetchMore({
    variables: { page: currentPage + 1 }
    // No updateQuery needed — type policy merge handles it
  })
}
`

type Tab = 'characters' | 'episodes'

function CharactersPagination() {
  const [page, setPage] = useState(1)
  const [allLoaded, setAllLoaded] = useState(false)

  const { data, loading, error, fetchMore } = useQuery<{ characters: CharactersResult }>(
    GET_CHARACTERS_PAGINATED,
    { variables: { page: 1, filter: {} } }
  )

  async function loadMore() {
    if (!data?.characters.info.next) return
    const nextPage = page + 1
    await fetchMore({ variables: { page: nextPage, filter: {} } })
    setPage(nextPage)
    if (!data.characters.info.next) setAllLoaded(true)
  }

  const results = data?.characters.results ?? []
  const info = data?.characters.info

  return (
    <div className="space-y-4">
      <CodeBlock code={SNIPPET} label="fetchMore pattern" />

      {error && <ErrorBanner error={error} />}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">
            Loaded <span className="text-white">{results.length}</span> of{' '}
            <span className="text-white">{info?.count ?? '...'}</span> characters
            {' '}· Page {page} / {info?.pages ?? '...'}
          </p>
        </div>

        {loading && page === 1 ? (
          <LoadingGrid />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((char: CharactersResult['results'][number]) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 pt-2">
        {info?.next && (
          <button
            className="btn-primary"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : `Load Page ${page + 1}`}
          </button>
        )}
        {allLoaded && <p className="text-xs text-gray-500">All pages loaded</p>}
      </div>

      <p className="text-xs text-gray-600">
        Snapshot the cache and observe <span className="text-indigo-400">ROOT_QUERY.characters</span> —
        its results array grows with each page. The type policy merge function concatenates pages in-place.
      </p>
      <CacheInspector />
    </div>
  )
}

function EpisodesPagination() {
  const [page, setPage] = useState(1)

  const { data, loading, error, fetchMore } = useQuery<{ episodes: EpisodesResult }>(
    GET_EPISODES,
    { variables: { page: 1 } }
  )

  async function loadMore() {
    if (!data?.episodes.info.next) return
    await fetchMore({ variables: { page: page + 1 } })
    setPage((p) => p + 1)
  }

  const results = data?.episodes.results ?? []
  const info = data?.episodes.info

  return (
    <div className="space-y-4">
      {error && <ErrorBanner error={error} />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Loaded <span className="text-white">{results.length}</span> episodes · Page {page} / {info?.pages ?? '...'}
        </p>
      </div>

      {loading && page === 1 ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-16 bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((ep: EpisodesResult['results'][number]) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      )}

      {info?.next && (
        <button className="btn-primary w-full" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : `Load More Episodes`}
        </button>
      )}
    </div>
  )
}

export default function Pagination() {
  const [tab, setTab] = useState<Tab>('characters')

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="05"
        title="Pagination with fetchMore"
        level="Intermediate"
        description="fetchMore fetches additional pages and merges them into the existing cache entry. The magic lives in the merge function in your type policy — Apollo calls it automatically. No updateQuery boilerplate needed."
        docsUrl="https://www.apollographql.com/docs/react/pagination/core-api/"
      />

      <div className="flex gap-2">
        <button
          className={tab === 'characters' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('characters')}
        >
          Characters (offset)
        </button>
        <button
          className={tab === 'episodes' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('episodes')}
        >
          Episodes
        </button>
      </div>

      {tab === 'characters' && <CharactersPagination />}
      {tab === 'episodes' && <EpisodesPagination />}

      {/* ── Pagination strategies ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Offset vs Cursor-based pagination</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-2">Offset pagination (this demo)</p>
            <p className="text-gray-400 mb-2">
              Uses a page number or offset integer. Simple to implement.
            </p>
            <pre className="code-block text-xs">{`fetchMore({ variables: { page: 2 } })
// keyArgs: ['filter'] keeps pages together
// merge() appends incoming.results`}</pre>
            <p className="text-gray-500 mt-2">Limitation: inserting/deleting items shifts page boundaries — you can miss or duplicate items between fetches.</p>
          </div>
          <div className="card border-indigo-900">
            <p className="text-indigo-400 font-semibold mb-2">Cursor-based pagination</p>
            <p className="text-gray-400 mb-2">
              Uses an opaque cursor pointing to the last item. Stable under inserts and deletes.
            </p>
            <pre className="code-block text-xs">{`// Apollo ships a helper for Relay-style cursors:
import { relayStylePagination } from '@apollo/client/utilities'

new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        feed: relayStylePagination(['filter']),
      }
    }
  }
})
// fetchMore with { after: endCursor } — no merge fn needed`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
