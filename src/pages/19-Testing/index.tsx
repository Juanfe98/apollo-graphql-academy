import { useState } from 'react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTER_CORE } from '../../graphql/queries/characters'
import type { Character } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'MockedProvider',
    code: `
import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'

const mocks = [
  {
    request: {
      query: GET_CHARACTERS,
      // variables must EXACTLY match what the component sends
    },
    result: {
      data: {
        characters: {
          results: [
            { id: '1', name: 'Rick Sanchez', status: 'Alive', __typename: 'Character' }
          ]
        }
      }
    },
    delay: 100,  // simulate network latency
  }
]

test('renders characters', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CharacterList />
    </MockedProvider>
  )
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.getByText('Rick Sanchez')).toBeInTheDocument()
  )
})`,
  },
  {
    label: 'Test loading state',
    code: `
test('shows loading state before data arrives', () => {
  // Pass an empty mocks array — nothing resolves immediately
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      <CharacterList />
    </MockedProvider>
  )
  // Component renders loading state synchronously on mount
  expect(screen.getByTestId('loading-grid')).toBeInTheDocument()
  expect(screen.queryByText('Rick Sanchez')).not.toBeInTheDocument()
})`,
  },
  {
    label: 'Test error state',
    code: `
const errorMocks = [
  {
    request: { query: GET_CHARACTERS },
    error: new Error('Network request failed'),
    // Use 'error' for network errors.
    // Use 'result: { errors: [...] }' for GraphQL errors.
  }
]

test('shows error state on network failure', async () => {
  render(
    <MockedProvider mocks={errorMocks} addTypename={false}>
      <CharacterList />
    </MockedProvider>
  )
  await waitFor(() =>
    expect(screen.getByText(/network request failed/i)).toBeInTheDocument()
  )
})

// GraphQL error alternative:
const gqlErrorMock = {
  request: { query: GET_CHARACTERS },
  result: {
    errors: [{ message: 'Character not found', extensions: { code: 'NOT_FOUND' } }]
  }
}`,
  },
  {
    label: 'Test useMutation',
    code: `
import userEvent from '@testing-library/user-event'

const mutateMocks = [
  {
    request: {
      query: CREATE_POST,
      variables: { input: { title: 'Test', body: 'Body', userId: 1 } },
      // Variables must match EXACTLY — even whitespace in strings matters
    },
    result: {
      data: {
        createPost: { id: '101', title: 'Test', body: 'Body', __typename: 'Post' }
      }
    }
  }
]

test('creates a post on submit', async () => {
  const user = userEvent.setup()
  render(
    <MockedProvider mocks={mutateMocks} addTypename={false}>
      <CreatePostForm />
    </MockedProvider>
  )
  await user.type(screen.getByPlaceholderText('Title'), 'Test')
  await user.type(screen.getByPlaceholderText('Body'), 'Body')
  await user.click(screen.getByRole('button', { name: 'Create Post' }))
  await waitFor(() =>
    expect(screen.getByText('Post created: Test')).toBeInTheDocument()
  )
})`,
  },
  {
    label: '5 common pitfalls',
    code: `
// ① Forgetting addTypename={false}
// Apollo adds __typename to all queries. If your mock data omits it,
// Apollo mismatches the mock. Either add __typename everywhere in mocks,
// or use addTypename={false} (easier for tests).

// ② Not awaiting waitFor
// useQuery is async. Without await waitFor(...), you assert on the
// loading state, not the data state. Always await waitFor for data assertions.

// ③ Variables must match exactly
// { variables: { id: '1' } } ≠ { variables: { id: 1 } }
// (string vs number). MockedProvider uses deep equality.

// ④ Each mock is consumed once
// MockedProvider exhausts mocks in order. If your query fires twice
// (e.g. on refetch), add the mock twice, or use:
// maxUsageCount: Infinity in the mock object (Apollo 3.8+)

// ⑤ Test behavior, not implementation
// ✗ expect(mockMutation).toHaveBeenCalledWith(...)
// ✓ expect(screen.getByText('Post created')).toBeInTheDocument()`,
  },
]

// Scenarios for the interactive MockedProvider demo
type Scenario = 'loading' | 'success' | 'error'

function buildMocks(scenario: Scenario, delay: number) {
  if (scenario === 'success') {
    return [{
      request: { query: GET_CHARACTER_CORE, variables: { id: '1' } },
      result: {
        data: {
          character: {
            __typename: 'Character',
            id: '1',
            name: 'Rick Sanchez',
            status: 'Alive',
            species: 'Human',
            gender: 'Male',
            image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
          }
        }
      },
      delay,
    }]
  }
  if (scenario === 'error') {
    return [{
      request: { query: GET_CHARACTER_CORE, variables: { id: '1' } },
      error: new Error('Mocked network error'),
      delay,
    }]
  }
  // 'loading' — return no mocks so query never resolves
  return []
}

function DemoComponent() {
  const { loading, error, data } = useQuery<{ character: Character }>(
    GET_CHARACTER_CORE,
    { variables: { id: '1' } }
  )
  if (loading) return (
    <div className="flex items-center gap-2 text-yellow-400 text-xs animate-pulse">
      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
      Loading...
    </div>
  )
  if (error) return <p className="text-red-400 text-xs">Error: {error.message}</p>
  if (!data?.character) return <p className="text-gray-500 text-xs">No data</p>
  const { name, status, species, image } = data.character
  return (
    <div className="flex items-center gap-2">
      <img src={image} alt="" className="w-8 h-8 rounded" />
      <div>
        <p className="text-white text-xs font-semibold">{name}</p>
        <p className="text-gray-500 text-xs">{status} · {species}</p>
      </div>
    </div>
  )
}

export default function Testing() {
  const [scenario, setScenario] = useState<Scenario>('success')
  const [delay, setDelay] = useState(500)
  const [renderKey, setRenderKey] = useState(0)

  const mocks = buildMocks(scenario, delay)

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="19"
        title="Testing with MockedProvider"
        level="Advanced"
        description="MockedProvider lets you test Apollo components in complete isolation — no network, no real server. You define exactly what each query returns, including errors and delays. The interactive demo below runs MockedProvider live in the browser so you can see how it behaves before writing real tests."
        docsUrl="https://www.apollographql.com/docs/react/development-testing/testing/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      {/* Interactive MockedProvider demo */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Interactive MockedProvider Demo</h2>
          <p className="text-xs text-gray-400">
            This is not a test runner — it's <code className="text-indigo-400">MockedProvider</code> rendering
            a real component with mocked data, live in the browser. Configure the scenario and hit "Mount Component"
            to see what a test would observe.
          </p>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Scenario</p>
              <div className="flex gap-1">
                {(['loading', 'success', 'error'] as Scenario[]).map((s) => (
                  <button
                    key={s}
                    className={`btn text-xs ${scenario === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setScenario(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Delay</p>
              <div className="flex gap-1">
                {[0, 500, 1500].map((ms) => (
                  <button
                    key={ms}
                    className={`btn text-xs ${delay === ms ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDelay(ms)}
                  >
                    {ms}ms
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => setRenderKey((k) => k + 1)}
          >
            Mount Component (re-run mock)
          </button>

          <div className="border border-gray-700 rounded p-3 min-h-12 flex items-center">
            <MockedProvider key={renderKey} mocks={mocks}>
              <DemoComponent />
            </MockedProvider>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Mocks array used:</p>
            <pre className="code-block text-xs">
              {JSON.stringify(mocks.map(m => ({ ...m, request: m.request })), null, 2)}
            </pre>
          </div>
        </div>
      </section>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Setup for real tests (Vitest)</p>
        <pre className="code-block text-xs">{`// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})

// src/test/setup.ts
import '@testing-library/jest-dom'

// Install:
// npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`}
        </pre>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Advanced testing patterns</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="card border-green-900">
            <p className="text-green-400 font-semibold mb-2">Pre-seeding the cache</p>
            <p className="text-gray-400 mb-2">Instead of mocking a query, write data directly into the cache before rendering. Useful for testing components that use <code className="text-white">useFragment</code> or cache reads.</p>
            <pre className="code-block text-xs">{`const cache = new InMemoryCache()
cache.writeQuery({
  query: GET_CHARACTERS,
  data: { characters: { results: mockCharacters } }
})

render(
  <ApolloProvider client={new ApolloClient({ cache, link: ... })}>
    <CharacterList />
  </ApolloProvider>
)
// Component reads from the pre-seeded cache — no async needed`}</pre>
          </div>
          <div className="card border-yellow-900">
            <p className="text-yellow-400 font-semibold mb-2">Testing reactive variables</p>
            <p className="text-gray-400 mb-2">Reset reactive vars between tests to prevent state leakage.</p>
            <pre className="code-block text-xs">{`// Reset reactive vars in beforeEach:
beforeEach(() => {
  favoritedCharacterIdsVar(new Set())
  characterNotesVar({})
})

test('favorites toggle updates the UI', async () => {
  render(<CharacterList />)
  // Set the var directly — no need to simulate clicks
  act(() => favoritedCharacterIdsVar(new Set([1, 2])))
  await waitFor(() =>
    expect(screen.getAllByText('★')).toHaveLength(2)
  )
})`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
