import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'What are APQs?',
    code: `
// Automatic Persisted Queries (APQ) replace the full query string
// with a short SHA-256 hash on the wire.

// WITHOUT APQ — every request sends the full query string:
// POST /graphql
// Body: { "query": "query GetCharacter($id: ID!) { character(id: $id) { id name status ... }}" }
// → Large payloads, especially for complex queries

// WITH APQ — first request:
// POST /graphql
// Body: { "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "abc123..." } } }
// Server: "I don't know this hash" → 404 PersistedQueryNotFound

// Second request (with hash + query, then cached by server):
// POST /graphql
// Body: { "query": "...", "extensions": { "persistedQuery": { ... } } }
// Server: stores hash → full query mapping, returns result

// All subsequent requests — only the hash:
// POST /graphql
// Body: { "extensions": { "persistedQuery": { "sha256Hash": "abc123..." } } }
// → Tiny payload, CDN-cacheable`,
  },
  {
    label: 'Apollo Client setup',
    code: `
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { generatePersistedQueryIdsFromManifest } from '@apollo/persisted-query-lists'
import { sha256 } from 'crypto-hash'

// Option A: Automatic Persisted Queries (APQ)
// Hashes are computed at runtime and negotiated with the server.
const apqLink = createPersistedQueryLink({ sha256 })

export const client = new ApolloClient({
  link: ApolloLink.from([apqLink, new HttpLink({ uri: '/graphql' })]),
  cache: new InMemoryCache(),
})

// Option B: Pre-registered (Safelisted) queries
// Hashes are generated at build time from a manifest.
// Server ONLY allows pre-registered operations — blocks arbitrary queries.
const safelistLink = createPersistedQueryLink({
  generateHash: generatePersistedQueryIdsFromManifest({
    loadManifest: () => import('./persisted-query-manifest.json'),
  }),
})`,
  },
  {
    label: 'GET requests',
    code: `
// APQ hashes are short enough to fit in a GET query string.
// GET requests are CDN-cacheable — a major performance win.

const apqLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,  // ← use GET for APQ requests
})

// First request (hash miss):
// POST /graphql  { extensions: { persistedQuery: { sha256Hash: "abc123" } } }
// Server: "not found" → 404

// Second request (hash + query):
// POST /graphql  { query: "...", extensions: { persistedQuery: { sha256Hash: "abc123" } } }
// Server: stores mapping

// All subsequent:
// GET /graphql?extensions={"persistedQuery":{"sha256Hash":"abc123"}}&variables={...}
// ↑ This can now be cached by a CDN like Cloudflare or Fastly`,
  },
  {
    label: 'Safelisted queries',
    code: `
// For maximum security: pre-register queries at build time.
// The server ONLY accepts pre-registered operation IDs.
// Unknown queries are rejected — eliminates arbitrary query execution.

// 1. Generate the manifest at build time (e.g. via graphql-codegen):
// persisted-query-manifest.json:
// {
//   "format": "apollo-persisted-query-manifest",
//   "operations": [
//     { "id": "abc123", "body": "query GetCharacter($id: ID!) {...}", "name": "GetCharacter" }
//   ]
// }

// 2. Client sends only the operation ID:
// POST /graphql  { "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "abc123" } } }

// 3. Server looks up the full query by ID and executes it.
// No query string EVER goes over the wire in production — maximum security.

// Generate with Apollo CLI:
// npx apollo client:extract extractedQueries.json`,
  },
]

export default function PersistedQueriesPage() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="30"
        title="Persisted Queries / APQ"
        level="Advanced"
        description="Automatic Persisted Queries (APQ) replace large query strings with SHA-256 hashes on the wire. This reduces payload sizes and enables CDN caching via GET requests. Pre-registered safelisted queries add a security layer by rejecting arbitrary queries in production."
        docsUrl="https://www.apollographql.com/docs/apollo-server/performance/apq/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">APQ flow — step by step</h2>
        <div className="space-y-2">
          {[
            { step: '1', label: 'Client hashes the query', detail: 'sha256("query GetCharacter { ... }") → "abc123"', color: 'border-gray-700' },
            { step: '2', label: 'Client sends hash only', detail: 'POST /graphql { extensions: { persistedQuery: { sha256Hash: "abc123" } } }', color: 'border-blue-900' },
            { step: '3', label: 'Server responds: hash not found', detail: 'HTTP 200 with errors: [{ message: "PersistedQueryNotFound" }]', color: 'border-red-900' },
            { step: '4', label: 'Client re-sends with full query + hash', detail: 'POST /graphql { query: "query GetCharacter...", extensions: { persistedQuery: {...} } }', color: 'border-yellow-900' },
            { step: '5', label: 'Server stores hash → query mapping, returns data', detail: 'Server caches the mapping. All future requests for this hash need no query string.', color: 'border-green-900' },
            { step: '6', label: 'All subsequent requests use hash only', detail: 'GET /graphql?extensions={"persistedQuery":{"sha256Hash":"abc123"}} — CDN-cacheable', color: 'border-green-900' },
          ].map(({ step, label, detail, color }) => (
            <div key={step} className={`card border ${color} flex gap-3`}>
              <span className="text-xs text-gray-500 flex-shrink-0 w-4">{step}.</span>
              <div>
                <p className="text-xs text-white font-semibold">{label}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-green-900">
          <p className="text-green-400 font-semibold mb-1">Performance benefits</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Smaller request payloads (hash vs. full query string)</li>
            <li>GET requests enable CDN caching — repeat reads served from edge</li>
            <li>Reduced bandwidth on mobile networks</li>
            <li>Server can pre-parse and validate cached queries</li>
          </ul>
        </div>
        <div className="card border-indigo-900">
          <p className="text-indigo-400 font-semibold mb-1">Security benefits (safelisted)</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Only pre-registered operations are accepted</li>
            <li>Blocks introspection and arbitrary query attacks</li>
            <li>No full query string ever transmitted in production</li>
            <li>Operations reviewed at build time, not at runtime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
