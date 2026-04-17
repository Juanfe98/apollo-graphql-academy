import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'Offset vs Cursor',
    code: `
// ── Offset pagination ─────────────────────────────────────────────
// Simple but unstable — inserting/deleting items shifts page boundaries.
query GetCharacters($page: Int) {
  characters(page: $page) {
    info { next }
    results { id name }
  }
}

fetchMore({ variables: { page: 2 } })

// ── Cursor pagination ─────────────────────────────────────────────
// Stable — cursor points to a specific item, not a position.
// Standard in the Relay spec (used by GitHub, Shopify, etc.)
query GetFeed($after: String, $first: Int) {
  feed(after: $after, first: $first) {
    pageInfo {
      hasNextPage
      endCursor    # pass this as "after" for the next page
    }
    edges {
      cursor
      node { id title body }
    }
  }
}

fetchMore({
  variables: { after: data.feed.pageInfo.endCursor, first: 10 }
})`,
  },
  {
    label: 'relayStylePagination',
    code: `
import { InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

// relayStylePagination() is a pre-built type policy for Relay-spec cursors.
// It handles the merge + read functions automatically.
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // All args are used as cache keys by default.
        // Pass keyArgs to scope by specific args (e.g. ignore "after"):
        feed: relayStylePagination(['filter']),
        //    ↑ only the "filter" arg creates new cache entries
        //      "after" and "first" are ignored (they're pagination args)
      },
    },
  },
})

// fetchMore works exactly the same — relayStylePagination handles merging:
const { data, fetchMore } = useQuery(GET_FEED, {
  variables: { first: 10 },
})

function loadMore() {
  fetchMore({
    variables: {
      after: data.feed.pageInfo.endCursor,
      first: 10,
    },
  })
}`,
  },
  {
    label: 'Manual cursor policy',
    code: `
// If relayStylePagination doesn't match your schema shape,
// write the merge/read functions manually.
// The key: merge appends edges, read returns the accumulated list.

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        posts: {
          keyArgs: ['filter'],
          merge(existing, incoming, { args }) {
            const existingEdges = existing?.edges ?? []
            const incomingEdges = incoming?.edges ?? []

            return {
              ...incoming,
              edges: args?.after
                ? [...existingEdges, ...incomingEdges]  // append
                : incomingEdges,                         // fresh start (no cursor)
            }
          },
          read(existing) {
            return existing   // return as-is, no transformation needed
          },
        },
      },
    },
  },
})`,
  },
  {
    label: 'Connection type pattern',
    code: `
// The Relay cursor spec defines a standard "connection" shape.
// Most cursor-paginated APIs follow this pattern.

# Schema (SDL):
type PostConnection {
  pageInfo: PageInfo!
  edges: [PostEdge!]!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage:     Boolean!
  hasPreviousPage: Boolean!
  startCursor:     String
  endCursor:       String
}

# Querying backward (previous pages):
query GetPostsBefore($before: String, $last: Int) {
  posts(before: $before, last: $last) {
    pageInfo { hasPreviousPage startCursor }
    edges { cursor node { id title } }
  }
}`,
  },
]

export default function CursorPagination() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="24"
        title="Cursor-based Pagination"
        level="Intermediate"
        description="Cursor pagination is more stable than offset pagination — a cursor points to a specific item, not a position, so inserts/deletes don't corrupt pages. Apollo ships relayStylePagination() to handle the Relay cursor spec out of the box. Page 05 covers the offset approach."
        docsUrl="https://www.apollographql.com/docs/react/pagination/cursor-based/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Offset vs Cursor — comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 font-semibold">Property</th>
                <th className="text-left py-2 pr-4 font-semibold">Offset (page number)</th>
                <th className="text-left py-2 font-semibold">Cursor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ['Stability under inserts', 'Unstable — items shift', 'Stable — cursor is fixed'],
                ['Stability under deletes', 'Unstable — items skip', 'Stable'],
                ['Random page access', 'Yes — jump to page 5', 'No — must walk forward/backward'],
                ['Implementation complexity', 'Simple', 'Moderate'],
                ['Best for', 'Static datasets, simple UIs', 'Live feeds, infinite scroll'],
                ['Apollo helper', 'Manual merge function', 'relayStylePagination()'],
                ['Server support needed', 'page/offset args', 'after/before/first/last args'],
              ].map(([prop, offset, cursor]) => (
                <tr key={prop} className="hover:bg-gray-900/50">
                  <td className="py-2 pr-4 text-gray-300">{prop}</td>
                  <td className="py-2 pr-4 text-yellow-300">{offset}</td>
                  <td className="py-2 text-green-300">{cursor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-indigo-900">
          <p className="text-indigo-400 font-semibold mb-1">relayStylePagination() internals</p>
          <p className="text-gray-400">
            The helper generates a type policy with a <code className="text-white">merge</code> function that
            concatenates <code className="text-white">edges</code> arrays and a <code className="text-white">read</code> function
            that returns the full accumulated list. It also handles <code className="text-white">pageInfo</code> correctly —
            always using the latest page's cursor values.
          </p>
        </div>
        <div className="card border-yellow-900">
          <p className="text-yellow-400 font-semibold mb-1">Why no live demo?</p>
          <p className="text-gray-400">
            The Rick & Morty API uses offset pagination (page numbers), not cursor pagination.
            To try cursor pagination live, use APIs like GitHub's GraphQL API or Shopify Storefront
            API — both implement the Relay cursor spec with <code className="text-white">after/before/first/last</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
