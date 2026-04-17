import { useState } from 'react'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider, useQuery, useMutation } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import type { GZPost, GZPostsResult, CreatePostInput } from '../../types/graphqlzero'
import { GET_POSTS } from '../../graphql/queries/posts'
import { CREATE_POST, UPDATE_POST, DELETE_POST } from '../../graphql/mutations/posts'
import type { Reference } from '@apollo/client'

// GraphQLZero has a different schema — use its own ApolloClient instance
const gzClient = new ApolloClient({
  link: new HttpLink({ uri: 'https://graphqlzero.almansi.me/api' }),
  cache: new InMemoryCache(),
})

const SNIPPET_TABS = [
  {
    label: 'useMutation',
    code: `
// useMutation returns a tuple: [mutationFn, result]
const [createPost, { loading, error, data, called }] = useMutation(
  CREATE_POST,
  {
    onCompleted(data) { console.log('Created:', data.createPost.id) },
    onError(err)     { console.error('Failed:', err.message) },
  }
)

// Trigger the mutation:
createPost({ variables: { input: { title, body, userId: 1 } } })

// called  → true after first execution (even if loading)
// loading → true while in-flight
// data    → the mutation response
// error   → set if the mutation fails`,
  },
  {
    label: 'optimisticResponse',
    code: `
// Write the EXPECTED result to cache immediately, before the server responds.
// Apollo rolls it back automatically if the mutation fails.
const [updatePost] = useMutation(UPDATE_POST, {
  optimisticResponse: {
    updatePost: {
      __typename: 'Post',
      id,
      title: newTitle,
      body: existingBody,
    }
    // Apollo writes this to cache NOW.
    // The real server response overwrites it when it arrives.
    // On error → Apollo reverts to the pre-optimistic value automatically.
  }
})`,
  },
  {
    label: 'update()',
    code: `
// update() is called after the mutation succeeds.
// Use it to manually sync the cache (e.g. remove a deleted item).
const [deletePost] = useMutation(DELETE_POST, {
  update(cache, _result, { variables }) {
    cache.modify({
      fields: {
        posts(existing: { data: Reference[] }, { readField }) {
          return {
            ...existing,
            data: existing.data.filter(
              (ref) => readField('id', ref) !== variables!.id
            ),
          }
        },
      },
    })
  },
})`,
  },
  {
    label: 'refetchQueries',
    code: `
// Simpler than update() — just re-run the named query after the mutation.
// Use when you don't want to manually construct the new cache state.
const [deletePost] = useMutation(DELETE_POST, {
  refetchQueries: ['GetPosts'],       // by operation name string
  awaitRefetchQueries: true,          // wait before loading=false
})

// Or pass the DocumentNode for type safety:
const [deletePost] = useMutation(DELETE_POST, {
  refetchQueries: [{ query: GET_POSTS }],
})

// update() is faster (no extra network request).
// refetchQueries is simpler and always in sync with the server.`,
  },
  {
    label: 'ignoreResults & variables',
    code: `
// ignoreResults: skip tracking the mutation result entirely.
// Use for fire-and-forget mutations where you don't need loading/data.
// This avoids unnecessary re-renders in the calling component.
const [trackEvent] = useMutation(TRACK_EVENT, {
  ignoreResults: true,
})
trackEvent({ variables: { name: 'page_view' } })  // no re-render

// Default variables at hook level vs call level:
// Hook-level variables act as defaults — the call can override them.
const [updatePost] = useMutation(UPDATE_POST, {
  variables: { userId: currentUser.id },  // always sent
})
// Override at call time (merges, not replaces):
updatePost({ variables: { id: postId, title: newTitle } })
// Actual variables sent: { userId: currentUser.id, id: postId, title: newTitle }

// onCompleted and onError work on useMutation too:
const [createPost] = useMutation(CREATE_POST, {
  onCompleted: (data) => toast.success(\`Created: \${data.createPost.title}\`),
  onError: (err) => toast.error(err.message),
})`,
  },
]

function CreatePostDemo() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [log, setLog] = useState<string[]>([])

  const [createPost, { loading, error }] = useMutation<{ createPost: GZPost }>(
    CREATE_POST,
    {
      onCompleted(data) {
        setLog((p) => [`✓ Created post #${data.createPost.id}: "${data.createPost.title}"`, ...p])
        setTitle('')
        setBody('')
      },
      onError(err) {
        setLog((p) => [`✗ Error: ${err.message}`, ...p])
      },
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createPost({ variables: { input: { title, body, userId: 1 } satisfies CreatePostInput } })
  }

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-gray-400">Create Post — basic mutation</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="input w-full"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input w-full h-16 resize-none"
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
      {error && <ErrorBanner error={error} />}
      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => (
            <p key={i} className={l.startsWith('✓') ? 'text-green-400' : 'text-red-400'}>{l}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function PostsListDemo() {
  const { data, loading } = useQuery<{ posts: GZPostsResult }>(GET_POSTS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [log, setLog] = useState<string[]>([])

  const [updatePost, { loading: updating }] = useMutation<{ updatePost: GZPost }>(UPDATE_POST, {
    onCompleted(d) {
      setLog((p) => [`✓ Optimistic confirmed: "${d.updatePost.title}"`, ...p])
      setEditingId(null)
    },
  })

  const [deletePost, { loading: deleting }] = useMutation<{ deletePost: boolean }>(DELETE_POST, {
    update(cache, _result, { variables }) {
      cache.modify({
        fields: {
          posts(existing, { readField }) {
            const existingObj = (existing as { data?: Reference[] } | undefined) ?? {}
            return {
              ...existingObj,
              data: (existingObj.data ?? []).filter(
                (ref) => readField('id', ref) !== variables?.id
              ),
            }
          }
        },
      })
      setLog((p) => [`✓ Deleted post #${variables!.id} via update() — no refetch needed`, ...p])
    },
  })

  function startEdit(post: GZPost) {
    setEditingId(post.id)
    setEditTitle(post.title)
  }

  function saveEdit(post: GZPost) {
    updatePost({
      variables: { id: post.id, input: { title: editTitle } },
      optimisticResponse: {
        updatePost: { __typename: 'Post', id: post.id, title: editTitle, body: post.body },
      },
    })
    setLog((p) => [`⏳ Optimistic write: "${editTitle}"`, ...p])
  }

  if (loading) return <div className="card animate-pulse h-32" />

  const posts = data?.posts.data ?? []

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="card space-y-2">
            {editingId === post.id ? (
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-xs"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <button className="btn-primary text-xs" onClick={() => saveEdit(post)} disabled={updating}>
                  {updating ? '...' : 'Save'}
                </button>
                <button className="btn-secondary text-xs" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">#{post.id} {post.title}</p>
                  <p className="text-gray-500 text-xs truncate">{post.body}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="btn-secondary text-xs" onClick={() => startEdit(post)}>Edit</button>
                  <button
                    className="btn-danger text-xs"
                    onClick={() => deletePost({ variables: { id: post.id } })}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => (
            <p key={i} className={l.startsWith('✓') ? 'text-green-400' : l.startsWith('⏳') ? 'text-yellow-400' : 'text-gray-400'}>{l}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function PostsDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Live Demo — Create</h2>
        <CreatePostDemo />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white mb-1">Live Demo — Update (optimisticResponse) & Delete (update callback)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Edit a post title — the UI updates <em>before</em> the server responds (optimistic).
          Delete removes the item from cache via <code className="text-indigo-400">update()</code> — no refetch needed.
        </p>
        <PostsListDemo />
      </div>
    </div>
  )
}

export default function UseMutation() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="13"
        title="Mutations with useMutation"
        level="Intermediate"
        description="useMutation is how you write data. It returns a tuple of [executeFn, result]. The real power is in the cache update strategies: optimisticResponse for instant UI feedback, update() to surgically modify the cache, and refetchQueries to stay in sync with the server."
        docsUrl="https://www.apollographql.com/docs/react/data/mutations/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="card border-indigo-900 text-xs space-y-1">
        <p className="text-indigo-400 font-semibold">API used on this page</p>
        <p className="text-gray-400">
          <a href="https://graphqlzero.almansi.me" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">graphqlzero.almansi.me</a>
          {' '}— free public GraphQL API with real CRUD mutations (based on JSONPlaceholder).
          Note: this API simulates mutations — data doesn't actually persist server-side.
        </p>
      </div>

      <ApolloProvider client={gzClient}>
        <PostsDemo />
      </ApolloProvider>
    </div>
  )
}
