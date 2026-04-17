import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: '@defer basics',
    code: `
# @defer marks a fragment as "stream this later".
# The server sends the base response immediately, then
# streams the deferred fragment(s) as they become ready.

query GetCharacterWithDetails($id: ID!) {
  character(id: $id) {
    id
    name
    status
    # These fields arrive immediately ↑

    ... @defer {
      # This fragment is sent in a separate chunk later.
      # Useful for fields that are slow to compute on the server.
      episode { id name episode air_date }
      origin  { id name dimension }
    }
  }
}

# The response arrives as a multipart stream:
# Chunk 1: { character: { id, name, status } }
# Chunk 2: { character: { episode: [...], origin: {...} } }
# Apollo merges them into the cache automatically.`,
  },
  {
    label: 'Apollo Client 4.x setup',
    code: `
// @defer requires multipart streaming support on both server and client.
// Apollo Client 4.x supports it natively — no extra packages needed.

// 1. Use @apollo/client/link/http (already supports multipart responses):
import { HttpLink } from '@apollo/client'

const httpLink = new HttpLink({
  uri: '/graphql',
  // Apollo Client automatically handles multipart/mixed responses
  // when the server streams deferred fragments.
})

// 2. Server must support @defer and stream multipart responses.
// Apollo Server 4+ and Yoga 3+ support this out of the box.

// 3. Write the query with @defer:
const GET_CHARACTER = gql\`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id name status

      ... @defer(label: "slow-fields") {
        episode { id name }
        origin  { id name }
      }
    }
  }
\``,
  },
  {
    label: 'useQuery with @defer',
    code: `
// useQuery works transparently with @defer.
// Apollo progressively populates the cache as chunks arrive.
// The component re-renders twice: once with base data, once with full data.

function CharacterDetail({ id }: { id: string }) {
  const { data, loading } = useQuery(GET_CHARACTER_DEFERRED, {
    variables: { id },
  })

  if (loading && !data) return <Spinner />  // initial load

  return (
    <div>
      {/* Always available — first chunk */}
      <h1>{data?.character.name}</h1>
      <p>{data?.character.status}</p>

      {/* May be undefined until the deferred chunk arrives */}
      {data?.character.episode
        ? <EpisodeList episodes={data.character.episode} />
        : <p className="text-gray-400 animate-pulse">Loading episodes...</p>
      }
    </div>
  )
}`,
  },
  {
    label: '@defer with Suspense',
    code: `
// With useSuspenseQuery + @defer:
// 1. Component suspends until the FIRST chunk arrives (base fields)
// 2. Re-renders when deferred chunks arrive (no additional suspend)
// 3. Use a loading placeholder for deferred fields

function CharacterDetail({ id }: { id: string }) {
  // Suspends until base data arrives (fast).
  // Does NOT suspend again when deferred chunk arrives.
  const { data } = useSuspenseQuery(GET_CHARACTER_DEFERRED, {
    variables: { id },
  })

  return (
    <div>
      <h1>{data.character.name}</h1>

      {/* Deferred fields: may be null until second chunk */}
      {data.character.episode == null ? (
        <EpisodeSkeleton />  // show skeleton while deferred chunk is in flight
      ) : (
        <EpisodeList episodes={data.character.episode} />
      )}
    </div>
  )
}`,
  },
  {
    label: '@defer with label',
    code: `
// You can label deferred fragments for debugging and granular control.
// A query can have MULTIPLE deferred fragments with different labels.

query GetCharacterFull($id: ID!) {
  character(id: $id) {
    id name status species image   # ← arrives first (fast)

    ... @defer(label: "episodes") {
      episode { id name episode }  # ← arrives second (moderate)
    }

    ... @defer(label: "origin") {
      origin { id name dimension } # ← arrives third (slow)
      location { id name }
    }
  }
}

# Server can prioritize chunks — the label helps with tracing and telemetry.
# Apollo DevTools shows each deferred chunk separately in the network tab.`,
  },
]

export default function DeferPage() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="28"
        title="@defer Directive"
        level="Advanced"
        description="@defer lets you mark expensive fields as 'stream later'. The server sends base fields immediately and streams deferred fragments as they complete. Apollo Client 4.x handles the multipart response natively — no extra packages. Components re-render progressively as chunks arrive."
        docsUrl="https://www.apollographql.com/docs/react/data/defer/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">How @defer improves perceived performance</h2>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="card border-red-900">
            <p className="text-red-400 font-semibold mb-1">Without @defer</p>
            <p className="text-gray-400">
              The entire response waits for the slowest field. If <code className="text-white">episode</code> takes
              300ms to resolve, the whole character card is delayed by 300ms — even though name, status,
              and image are ready in 20ms.
            </p>
          </div>
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-1">With @defer</p>
            <p className="text-gray-400">
              The component renders with name/status/image at 20ms. The episode list appears at 300ms.
              Total time is the same, but the user sees content 280ms earlier — dramatically better UX
              for slow connections.
            </p>
          </div>
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-1">Best use cases</p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Fields requiring expensive DB joins</li>
              <li>Fields from federated subgraphs</li>
              <li>Analytics/metadata not needed for core UI</li>
              <li>Deeply nested fields with slow resolvers</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Requirements & limitations</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-300 font-semibold mb-1">Requirements</p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Server: Apollo Server 4+, GraphQL Yoga 3+, or any server supporting multipart responses</li>
              <li>Client: Apollo Client 4.x (built-in) or 3.8+ with <code className="text-white">@defer</code> support</li>
              <li>Transport: HTTP (not WebSocket) — streaming over HTTP/1.1 chunked or HTTP/2</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-1">Limitations</p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Cannot defer fields in the root selection — only in fragments</li>
              <li>Deferred fragments cannot be used on mutation or subscription operations</li>
              <li>Some CDNs/proxies may buffer the stream — verify end-to-end support</li>
              <li>Rick & Morty API doesn't support @defer (no live demo on this page)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
