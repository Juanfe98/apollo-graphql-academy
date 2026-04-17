import type { Episode } from '../../types/rickandmorty'

interface Props {
  episode: Episode
  onClick?: () => void
}

export function EpisodeCard({ episode, onClick }: Props) {
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:border-indigo-600 transition-colors' : ''}`}
      onClick={onClick}
    >
      <p className="text-indigo-400 text-xs font-semibold">{episode.episode}</p>
      <p className="text-white text-sm font-semibold mt-0.5">{episode.name}</p>
      <p className="text-gray-500 text-xs mt-1">{episode.air_date}</p>
    </div>
  )
}
