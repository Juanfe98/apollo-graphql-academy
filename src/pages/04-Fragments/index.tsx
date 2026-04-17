import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CharacterCard } from '../../components/shared/CharacterCard'
import { EpisodeCard } from '../../components/shared/EpisodeCard'
import { LoadingGrid } from '../../components/shared/LoadingGrid'
import { CacheInspector } from '../../components/shared/CacheInspector'
import { CodeBlock } from '../../components/shared/CodeBlock'
import { GET_CHARACTER } from '../../graphql/queries/characters'
import { GET_EPISODE_WITH_CHARACTERS } from '../../graphql/queries/episodes'
import type { Character, Episode } from '../../types/rickandmorty'

const SNIPPET_TABS = [
  {
    label: 'CharacterCore',
    code: `
fragment CharacterCore on Character {
  id
  name
  status
  species
  gender
  image
}`,
  },
  {
    label: 'CharacterFull',
    code: `
fragment CharacterFull on Character {
  ...CharacterCore       # Composed from CharacterCore
  type
  origin { id name type dimension }
  location { id name type dimension }
  episode { id name episode air_date }
  isFavorited @client   # Local-only: resolved by type policy
  localNote @client     # Local-only: resolved by reactive var
}`,
  },
  {
    label: 'Usage',
    code: `
// Two different queries use the same CharacterCore fragment.
// After both run, the cache has only ONE Character:1 entry
// because Apollo normalizes by id — deduplication is automatic.

query GetCharacter($id: ID!) {
  character(id: $id) { ...CharacterFull }
}

query GetEpisodeWithCharacters($id: ID!) {
  episode(id: $id) {
    ...EpisodeCore
    characters { ...CharacterCore }  // same fragment!
  }
}`,
  },
]

export default function Fragments() {
  const [charId] = useState('1')
  const [episodeId] = useState('1')

  const charQuery = useQuery<{ character: Character }>(GET_CHARACTER, {
    variables: { id: charId },
  })

  const episodeQuery = useQuery<{ episode: Episode }>(GET_EPISODE_WITH_CHARACTERS, {
    variables: { id: episodeId },
  })

  const char = charQuery.data?.character
  const episode = episodeQuery.data?.episode

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="04"
        title="Fragments"
        level="Intermediate"
        description="Fragments are reusable field selections. They enable composition (CharacterFull extends CharacterCore) and deduplication — two queries fetching the same Character by id share a single cache entry. The @client directive marks local-only fields resolved by type policies."
        docsUrl="https://www.apollographql.com/docs/react/data/fragments/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">
            Character #1 via <code className="text-indigo-400">CharacterFull</code>
          </p>
          {charQuery.loading && <LoadingGrid count={1} />}
          {char && (
            <div className="space-y-2">
              <CharacterCard character={char} />
              <div className="card text-xs space-y-1">
                {char.origin && <p className="text-gray-400">Origin: <span className="text-white">{char.origin.name}</span></p>}
                <p className="text-gray-400">Episodes: <span className="text-white">{char.episode?.length}</span></p>
                <p className="text-gray-400">isFavorited <span className="text-gray-600">(@client):</span> <span className="text-indigo-400">{String(char.isFavorited)}</span></p>
                <p className="text-gray-400">localNote <span className="text-gray-600">(@client):</span> <span className="text-indigo-400">"{char.localNote}"</span></p>
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">
            Episode #1 characters via <code className="text-indigo-400">CharacterCore</code>
          </p>
          {episodeQuery.loading && <LoadingGrid count={2} />}
          {episode && (
            <div className="space-y-2">
              <EpisodeCard episode={episode} />
              <p className="text-xs text-gray-600">
                {episode.characters?.length} characters — same CharacterCore fragment, same cache entries
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {episode.characters?.slice(0, 4).map((c: Character) => (
                  <CharacterCard key={c.id} character={c} />
                ))}
                {(episode.characters?.length ?? 0) > 4 && (
                  <p className="text-xs text-gray-600">+{(episode.characters?.length ?? 0) - 4} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          Snapshot the cache. Notice that <strong className="text-white">Character:1</strong> appears
          only once — even though it was fetched by two different queries. That's normalization in action.
        </p>
        <CacheInspector highlight="Character:1" />
      </div>
    </div>
  )
}
