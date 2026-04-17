import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'Federation overview',
    code: `
// Apollo Federation is a supergraph architecture:
// Multiple GraphQL APIs (subgraphs) are composed into a single unified API (supergraph).
// The Apollo Router/Gateway merges subgraph schemas and routes queries.

// Without Federation — monolithic GraphQL server:
// Frontend ──────────────────→ Single GraphQL API
//                                    │
//                              DB / services

// With Federation — distributed subgraphs:
// Frontend → Apollo Router (supergraph) → users-subgraph
//                                       → products-subgraph
//                                       → orders-subgraph
//                                       → reviews-subgraph

// Each team owns their subgraph independently.
// The Router merges schemas and plans query execution across subgraphs.
// From the client's perspective: one endpoint, one schema.`,
  },
  {
    label: 'Subgraph schema',
    code: `
# Subgraph: users-service
# Defines User type with @key (the entity's primary key)

type Query {
  user(id: ID!): User
  me: User
}

type User @key(fields: "id") {
  id:       ID!
  username: String!
  email:    String!
}

# Subgraph: reviews-service
# Extends User with review data — owned by the reviews team
type User @key(fields: "id") {
  id:      ID!  # must include the @key field
  reviews: [Review!]!  # extends User with this field
}

type Review @key(fields: "id") {
  id:      ID!
  rating:  Int!
  comment: String!
  author:  User!   # reference across subgraphs
}`,
  },
  {
    label: 'Entity resolution',
    code: `
# The Router uses __resolveReference to fetch an entity from its subgraph.
# When the products subgraph needs User data owned by users-subgraph,
# the Router calls users-subgraph with a reference object.

# In the users-subgraph resolver:
const resolvers = {
  User: {
    __resolveReference(reference: { id: string }, context) {
      // Apollo Router calls this with { __typename: "User", id: "42" }
      return context.db.users.findById(reference.id)
    }
  }
}

# What the client sees (single unified query):
query GetUserWithReviews($id: ID!) {
  user(id: $id) {
    username       # from users-subgraph
    email          # from users-subgraph
    reviews {      # from reviews-subgraph
      rating
      comment
    }
  }
}
# The Router plans: fetch user from users, then fetch reviews from reviews.`,
  },
  {
    label: 'Client setup',
    code: `
// From the CLIENT perspective, Federation is nearly invisible.
// You talk to one URL (the Router), query one unified schema.
// No client-side configuration for Federation itself.

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

export const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://your-router.example.com/graphql',  // ← Router URL
  }),
  cache: new InMemoryCache(),
})

// The only client-side consideration: possibleTypes for interfaces/unions.
// If subgraphs define abstract types, configure possibleTypes from introspection.

// Apollo Studio (GraphOS) manages schema composition, routing, and observability.
// Schema checks, contract APIs, and query planning are all server/infra concerns.`,
  },
  {
    label: '@key variations',
    code: `
# @key can use a single field, multiple fields, or nested fields.

# Single field key (most common):
type Product @key(fields: "id") {
  id:    ID!
  title: String!
}

# Composite key (multiple fields together):
type OrderItem @key(fields: "orderId productId") {
  orderId:   ID!
  productId: ID!
  quantity:  Int!
}

# Nested key (key is a nested object):
type User @key(fields: "account { id }") {
  account: Account!
  name: String!
}

# Unresolvable entity — defined in one subgraph, referenced in another,
# but NEVER resolved directly (no __resolveReference):
type Category @key(fields: "id", resolvable: false) {
  id: ID!
}`,
  },
]

export default function FederationPage() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="31"
        title="Apollo Federation"
        level="Advanced"
        description="Apollo Federation is a supergraph architecture where multiple GraphQL APIs (subgraphs) are composed into a single unified schema by the Apollo Router. Each team owns a subgraph. From the client, it looks like one endpoint — Federation is handled at the infrastructure layer."
        docsUrl="https://www.apollographql.com/docs/federation/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Key Federation concepts</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-blue-900">
            <p className="text-blue-400 font-semibold mb-2">Entities</p>
            <p className="text-gray-400 mb-2">
              Types decorated with <code className="text-white">@key</code> are <strong className="text-white">entities</strong> —
              they can be referenced across subgraphs. The Router resolves them via <code className="text-white">__resolveReference</code>.
            </p>
            <p className="text-gray-500">Example: <code className="text-indigo-400">User</code> is owned by the users subgraph but extended by reviews, orders, and products subgraphs.</p>
          </div>
          <div className="card border-purple-900">
            <p className="text-purple-400 font-semibold mb-2">Query planning</p>
            <p className="text-gray-400 mb-2">
              The Router analyses each query and creates a <strong className="text-white">query plan</strong> —
              which subgraphs to fetch from, in what order, and how to merge results.
            </p>
            <p className="text-gray-500">Parallel fetches happen when fields are independent. Sequential fetches happen when one subgraph's result is needed to query another.</p>
          </div>
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-2">Schema composition</p>
            <p className="text-gray-400 mb-2">
              Apollo Rover CLI (or Apollo Studio) merges subgraph schemas into a supergraph schema.
              Composition validates that entity extensions are consistent and that no type conflicts exist.
            </p>
          </div>
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-2">Contracts & variants</p>
            <p className="text-gray-400 mb-2">
              Apollo GraphOS (Studio) lets you create schema <strong className="text-white">contracts</strong> —
              filtered variants of the supergraph for different consumers (public API vs. internal API).
              Tag fields with <code className="text-white">@tag</code> to include/exclude them.
            </p>
          </div>
        </div>
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Client perspective summary</p>
        <p className="text-gray-400">
          Apollo Federation is <strong className="text-white">entirely a server/infrastructure concern</strong> from the Apollo Client perspective.
          Your client code — queries, mutations, hooks, caching — remains identical whether the backend is
          a single monolithic GraphQL server or a federated supergraph of 20 subgraphs.
          The only client-side consideration is ensuring <code className="text-white">possibleTypes</code> is
          configured if abstract types (interfaces/unions) span subgraph boundaries.
        </p>
      </div>
    </div>
  )
}
