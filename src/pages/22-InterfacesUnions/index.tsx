import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'Interface definition',
    code: `
# Schema definition (server-side SDL)
interface Node {
  id: ID!
}

interface SearchResult {
  id: ID!
  name: String!
}

type Character implements Node & SearchResult {
  id: ID!
  name: String!
  status: String!
  species: String!
}

type Location implements Node & SearchResult {
  id: ID!
  name: String!
  dimension: String!
}

type Episode implements Node & SearchResult {
  id: ID!
  name: String!
  air_date: String!
}

type Query {
  search(text: String!): [SearchResult!]!
}`,
  },
  {
    label: 'Inline fragments',
    code: `
// Use "... on TypeName" to request type-specific fields.
// The __typename field lets you discriminate types at runtime.

const SEARCH = gql\`
  query Search($text: String!) {
    search(text: $text) {
      __typename       # ← REQUIRED for type discrimination
      id
      name             # shared interface field
      ... on Character {
        status         # Character-only field
        species
      }
      ... on Location {
        dimension      # Location-only field
      }
      ... on Episode {
        air_date       # Episode-only field
      }
    }
  }
\`

// Consuming the result:
const { data } = useQuery(SEARCH, { variables: { text: 'Rick' } })

data.search.forEach((result) => {
  if (result.__typename === 'Character') {
    console.log(result.status)   // TS knows this field exists
  } else if (result.__typename === 'Location') {
    console.log(result.dimension)
  }
})`,
  },
  {
    label: 'Union type',
    code: `
# Unions group types WITHOUT a shared interface — no common fields.
# Every field must be in an inline fragment.

union SearchResult = Character | Location | Episode

# Query — every field must be in a fragment, even "id":
query Search($text: String!) {
  search(text: $text) {
    __typename
    ... on Character { id name status }
    ... on Location  { id name dimension }
    ... on Episode   { id name air_date }
  }
}

# Interface vs Union:
# Interface → types share fields (name, id, etc.) — can request them directly
# Union     → types have NOTHING in common — every field needs a fragment`,
  },
  {
    label: 'possibleTypes config',
    code: `
// Apollo's InMemoryCache needs to know which concrete types implement
// each interface or union. Without this, fragments on abstract types
// may not be applied correctly during cache normalization.

import { InMemoryCache } from '@apollo/client'

const cache = new InMemoryCache({
  possibleTypes: {
    // "SearchResult" is either a Character, Location, or Episode
    SearchResult: ['Character', 'Location', 'Episode'],
    // "Node" is any type with an id field
    Node: ['Character', 'Location', 'Episode'],
  },
})

// Best practice: generate possibleTypes from your schema automatically.
// Apollo CLI: npx apollo client:download-schema
// graphql-codegen: use the "fragment-matcher" plugin
// This keeps possibleTypes in sync without manual updates.`,
  },
  {
    label: 'Fragment composition',
    code: `
// Named fragments on abstract types work the same way.
// Define once, reuse across queries.

const SEARCH_RESULT_FIELDS = gql\`
  fragment SearchResultFields on SearchResult {
    __typename
    id
    name
    ... on Character { status species image }
    ... on Location  { type dimension }
    ... on Episode   { episode air_date }
  }
\`

const SEARCH = gql\`
  query Search($text: String!) {
    search(text: $text) { ...SearchResultFields }
  }
  \${SEARCH_RESULT_FIELDS}
\`

// Apollo cache key for abstract types:
// Each concrete object still uses its OWN type: Character:1, Location:5, etc.
// The abstract type name does NOT appear in cache keys.`,
  },
]

export default function InterfacesUnions() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="22"
        title="Interfaces & Unions"
        level="Intermediate"
        description="Interfaces and unions are GraphQL's polymorphism primitives. They let a single field return different object types. On the client, inline fragments (... on TypeName) select type-specific fields, and Apollo's possibleTypes config ensures correct cache normalization."
        docsUrl="https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      {/* ── Interface vs Union explainer ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Interface vs Union — at a glance</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-blue-900">
            <p className="text-blue-400 font-semibold mb-2">Interface</p>
            <ul className="text-gray-400 space-y-1.5 list-disc list-inside">
              <li>Member types <strong className="text-white">share a set of fields</strong> (defined in the interface)</li>
              <li>Shared fields can be queried directly — no fragment required</li>
              <li>Types declare <code className="text-white">implements InterfaceName</code></li>
              <li>Example: <code className="text-white">Node</code> interface — every implementing type has <code className="text-white">id: ID!</code></li>
              <li>Use when types have meaningful shared structure</li>
            </ul>
          </div>
          <div className="card border-purple-900">
            <p className="text-purple-400 font-semibold mb-2">Union</p>
            <ul className="text-gray-400 space-y-1.5 list-disc list-inside">
              <li>Member types have <strong className="text-white">nothing in common</strong></li>
              <li>Every field must be inside an inline fragment</li>
              <li>Types do NOT implement anything — they're just listed in the union</li>
              <li>Example: <code className="text-white">SearchResult = Character | Location | Episode</code></li>
              <li>Use for heterogeneous result sets (search, feeds)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Apollo cache behavior ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">How Apollo caches abstract types</h2>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-1">Cache keys use concrete types</p>
            <p className="text-gray-400">
              A <code className="text-white">SearchResult</code> that is a Character gets cached as{' '}
              <code className="text-indigo-400">Character:1</code>, not <code className="text-white">SearchResult:1</code>.
              The abstract type is irrelevant to the cache key.
            </p>
          </div>
          <div className="card border-red-900">
            <p className="text-red-400 font-semibold mb-1">Without possibleTypes</p>
            <p className="text-gray-400">
              Apollo can't match inline fragments to cached entities — fragment data may be missing or incorrect.
              You'll see warnings like "Found a 2 store fragments" in the console.
            </p>
          </div>
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-1">__typename is mandatory</p>
            <p className="text-gray-400">
              Always request <code className="text-white">__typename</code> in abstract type queries. Apollo adds it
              automatically for queries, but explicit is safer — especially in fragments used across
              multiple queries.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why no live demo ── */}
      <div className="card border-gray-700 text-xs space-y-1">
        <p className="text-gray-400 font-semibold">Why no live demo on this page?</p>
        <p className="text-gray-500">
          The Rick & Morty API doesn't expose interfaces or unions in its public schema. The concepts above
          are universal GraphQL spec features — implemented on the server side. To try them, you'd need a
          schema like GitHub's GraphQL API (which has <code className="text-white">Assignable</code>,{' '}
          <code className="text-white">Node</code>, <code className="text-white">SearchResultItem</code>) or
          a local server built with Apollo Server / GraphQL Yoga.
        </p>
      </div>
    </div>
  )
}
