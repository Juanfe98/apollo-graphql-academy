import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useApolloClient } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTERS } from '../../graphql/queries/characters'
import type { CharactersResult, Character } from '../../types/rickandmorty'

const SNIPPET = `
// Optimistic UI: update the cache BEFORE the server responds.
// If the mutation fails, roll back to the original value.
//
// With real useMutation this looks like:
const [updateName] = useMutation(UPDATE_NAME, {
  optimisticResponse: {
    updateCharacter: { id: '1', name: 'New Name (saving...)', __typename: 'Character' }
  },
  // Apollo writes optimisticResponse to cache immediately,
  // then overwrites with the real response when it arrives.
})

// We simulate this manually with writeFragment + setTimeout:
function optimisticRename(id, newName) {
  // 1. Optimistic write — immediate
  cache.writeFragment({ id: \`Character:\${id}\`,
    fragment: gql\`fragment F on Character { name }\`,
    data: { name: \`\${newName} (saving...)\` }
  })
  // 2. Simulate network delay (1.5s)
  setTimeout(() => {
    cache.writeFragment({ id: \`Character:\${id}\`,
      fragment: gql\`fragment F on Character { name }\`,
      data: { name: newName }
    })
  }, 1500)
}
`

interface EditState {
  id: string
  original: string
  pending: boolean
  failed: boolean
}

export default function OptimisticUI() {
  const client = useApolloClient()
  const [editing, setEditing] = useState<Record<string, EditState>>({})
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [log, setLog] = useState<string[]>([])

  const { data } = useQuery<{ characters: CharactersResult }>(GET_CHARACTERS)
  const characters = data?.characters.results ?? []

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)])
  }

  function startEdit(char: Character) {
    setEditing((prev) => ({ ...prev, [char.id]: { id: char.id, original: char.name, pending: false, failed: false } }))
    setInputValues((prev) => ({ ...prev, [char.id]: char.name }))
  }

  function applyOptimistic(id: string, newName: string, fail = false) {
    const original = editing[id]?.original ?? ''

    // Step 1: Optimistic write
    client.cache.writeFragment({
      id: `Character:${id}`,
      fragment: gql`fragment OptimisticName on Character { name }`,
      data: { name: `${newName} ⏳` },
    })
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], pending: true, failed: false } }))
    addLog(`optimistic → Character:${id} name = "${newName} ⏳"`)

    // Step 2: Simulate network delay
    setTimeout(() => {
      if (fail) {
        // Rollback
        client.cache.writeFragment({
          id: `Character:${id}`,
          fragment: gql`fragment RollbackName on Character { name }`,
          data: { name: original },
        })
        setEditing((prev) => ({ ...prev, [id]: { ...prev[id], pending: false, failed: true } }))
        addLog(`rollback → Character:${id} name restored to "${original}"`)
      } else {
        // Confirm
        client.cache.writeFragment({
          id: `Character:${id}`,
          fragment: gql`fragment ConfirmedName on Character { name }`,
          data: { name: newName },
        })
        setEditing((prev) => { const next = { ...prev }; delete next[id]; return next })
        addLog(`confirmed → Character:${id} name = "${newName}"`)
      }
    }, 1500)
  }

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="09"
        title="Optimistic UI"
        level="Advanced"
        description="Optimistic UI writes the expected mutation result to the cache before the server responds, making interactions feel instant. Apollo's useMutation handles this via optimisticResponse. On failure, the cache rolls back automatically."
        docsUrl="https://www.apollographql.com/docs/react/performance/optimistic-ui/"
      />

      <CodeBlock code={SNIPPET} label="Pattern" />

      {log.length > 0 && (
        <div className="code-block space-y-0.5 text-xs">
          {log.map((l, i) => (
            <p key={i} className={l.includes('rollback') ? 'text-red-400' : l.includes('optimistic') ? 'text-yellow-400' : 'text-green-400'}>{l}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {characters.slice(0, 8).map((char: Character) => {
          const state = editing[char.id]
          return (
            <div key={char.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <img src={char.image} alt="" className="w-10 h-10 rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${state?.pending ? 'text-yellow-400' : state?.failed ? 'text-red-400' : 'text-white'}`}>
                    {char.name}
                  </p>
                  <p className="text-xs text-gray-600">#{char.id}</p>
                </div>
                {state?.pending && <span className="text-xs text-yellow-400 animate-pulse">saving…</span>}
                {state?.failed && <span className="text-xs text-red-400">failed</span>}
              </div>

              {!state || state.failed ? (
                <button
                  className="btn-secondary w-full text-xs"
                  onClick={() => startEdit(char)}
                >
                  Rename
                </button>
              ) : !state.pending ? (
                <div className="space-y-1">
                  <input
                    className="input w-full text-xs"
                    value={inputValues[char.id] ?? char.name}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [char.id]: e.target.value }))}
                  />
                  <div className="flex gap-1">
                    <button
                      className="btn-primary flex-1 text-xs"
                      onClick={() => applyOptimistic(char.id, inputValues[char.id] ?? '', false)}
                    >
                      Save (succeed)
                    </button>
                    <button
                      className="btn-danger flex-1 text-xs"
                      onClick={() => applyOptimistic(char.id, inputValues[char.id] ?? '', true)}
                    >
                      Save (fail)
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
