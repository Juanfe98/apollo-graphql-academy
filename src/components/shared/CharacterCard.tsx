import type { Character } from '../../types/rickandmorty'

interface Props {
  character: Character
  onClick?: () => void
  actions?: React.ReactNode
}

const statusColor: Record<string, string> = {
  Alive: 'bg-green-500',
  Dead: 'bg-red-500',
  unknown: 'bg-gray-500',
}

export function CharacterCard({ character, onClick, actions }: Props) {
  return (
    <div
      className={`card flex gap-3 ${onClick ? 'cursor-pointer hover:border-indigo-600 transition-colors' : ''}`}
      onClick={onClick}
    >
      <img
        src={character.image}
        alt={character.name}
        className="w-16 h-16 rounded-lg flex-shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-white truncate text-sm">{character.name}</p>
          {character.isFavorited && <span className="text-yellow-400 flex-shrink-0">★</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor[character.status] ?? 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">
            {character.status} — {character.species}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">#{character.id} · {character.gender}</p>
        {character.localNote && (
          <p className="text-xs text-indigo-400 mt-1 italic truncate">Note: {character.localNote}</p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  )
}
