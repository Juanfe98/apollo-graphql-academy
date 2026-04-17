import { useState } from 'react'
import { useQuery, useReactiveVar } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import type { CharactersResult } from '../../types/rickandmorty'
import {
  favoritedCharacterIdsVar,
  characterNotesVar,
} from '../../apollo/reactiveVars'

const SNIPPET_TABS = [
  {
    label: 'makeVar',
    code: `
// Declare reactive variables — Apollo's built-in local state
export const favoritedIdsVar = makeVar<Set<number>>(new Set())
export const notesVar = makeVar<Record<number, string>>({})

// Update a reactive var — all subscribers re-render automatically
function toggleFavorite(id: number) {
  const current = favoritedIdsVar()
  const next = new Set(current)
  next.has(id) ? next.delete(id) : next.add(id)
  favoritedIdsVar(next)  // Write by calling with a value
}`,
  },
  {
    label: 'useReactiveVar',
    code: `
// Option A: consume directly in a component
function FavoriteCount() {
  const ids = useReactiveVar(favoritedIdsVar)
  return <span>{ids.size} favorites</span>
}`,
  },
  {
    label: '@client field',
    code: `
// Option B: consume via @client in a query
// The isFavorited field policy reads the reactive var:
//   isFavorited: {
//     read(_, { readField }) {
//       return favoritedIdsVar().has(readField('id'))
//     }
//   }

const { data } = useQuery(gql\`
  query {
    characters { results {
      id name
      isFavorited @client  // resolved locally, not from network
    }}
  }
\`)`,
  },
  {
    label: 'Persist',
    code: `
// Persist reactive vars to localStorage (production pattern)
const stored = localStorage.getItem('favorites')
export const favoritedIdsVar = makeVar<Set<number>>(
  stored ? new Set(JSON.parse(stored)) : new Set()
)

// Sync on write
useEffect(() => {
  const unsub = favoritedIdsVar.onNextChange((val) => {
    localStorage.setItem('favorites', JSON.stringify([...val]))
  })
  return unsub
}, [])`,
  },
]

export default function ReactiveVariables() {
  const { data } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)
  const characters = data?.characters.results ?? []

  // Option A: useReactiveVar hook — subscribe to reactive var directly
  const favoritedIds = useReactiveVar(favoritedCharacterIdsVar)
  const notes = useReactiveVar(characterNotesVar)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  function toggleFavorite(id: string) {
    const numId = Number(id)
    const current = favoritedCharacterIdsVar()
    const next = new Set(current)
    next.has(numId) ? next.delete(numId) : next.add(numId)
    favoritedCharacterIdsVar(next)
  }

  function saveNote(id: string) {
    const numId = Number(id)
    const current = characterNotesVar()
    characterNotesVar({ ...current, [numId]: noteInputs[id] ?? '' })
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="10"
        title="Reactive Variables"
        level="Advanced"
        description="Reactive variables (makeVar) are Apollo's local state primitive. They live outside the normalized cache but integrate with it via @client field policies. Any component subscribing via useReactiveVar re-renders when the var changes — no Redux, no Context boilerplate."
        docsUrl="https://www.apollographql.com/docs/react/local-state/reactive-variables/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="card border-indigo-900">
        <p className="text-xs font-semibold text-indigo-400 mb-1">Live State (useReactiveVar)</p>
        <p className="text-xs text-gray-400">
          Favorites: <span className="text-white">{favoritedIds.size}</span> ·{' '}
          IDs: <span className="text-white">[{Array.from(favoritedIds).join(', ')}]</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Notes count: <span className="text-white">{Object.keys(notes).length}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {characters.slice(0, 8).map((char: CharactersResult['results'][number]) => {
          const isFav = favoritedIds.has(Number(char.id))
          const note = notes[Number(char.id)] ?? ''

          return (
            <div key={char.id} className="card space-y-2">
              <CharacterCard
                character={{ ...char, isFavorited: isFav, localNote: note }}
                actions={
                  <button
                    onClick={() => toggleFavorite(char.id)}
                    className={`text-lg transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-600'}`}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                }
              />
              <div className="flex gap-1">
                <input
                  className="input flex-1 text-xs"
                  placeholder="Add a note..."
                  value={noteInputs[char.id] ?? note}
                  onChange={(e) => setNoteInputs((p) => ({ ...p, [char.id]: e.target.value }))}
                />
                <button
                  className="btn-secondary text-xs"
                  onClick={() => saveNote(char.id)}
                >
                  Save
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card border-yellow-900">
        <p className="text-xs font-semibold text-yellow-400 mb-1">Key Insight</p>
        <p className="text-xs text-gray-400">
          Star characters here, then visit other pages (Basic Query, Fragments).
          The ★ appears automatically wherever that character is rendered —
          because <code className="text-indigo-400">isFavorited @client</code> reads
          from the reactive var via the type policy. No prop drilling, no context.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-gray-700">
          <p className="text-gray-300 font-semibold mb-2">When to use reactive vars</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Client-only UI state (modals, selections, filters)</li>
            <li>Local overrides of server data (<code className="text-indigo-400">@client</code> fields)</li>
            <li>State that multiple unrelated components need</li>
            <li>When you want to avoid React Context boilerplate</li>
          </ul>
        </div>
        <div className="card border-gray-700">
          <p className="text-gray-300 font-semibold mb-2">When NOT to use reactive vars</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Server data that should be cached and normalized — use <code className="text-indigo-400">useQuery</code></li>
            <li>Local component state with no cross-component sharing — use <code className="text-indigo-400">useState</code></li>
            <li>Form state — <code className="text-indigo-400">useState</code> or a form library is simpler</li>
            <li>State that needs undo/redo — reactive vars have no history</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
