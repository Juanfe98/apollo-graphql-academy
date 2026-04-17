interface Props {
  number: string
  title: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  docsUrl?: string
}

const levelClass = {
  Beginner: 'concept-badge-beginner',
  Intermediate: 'concept-badge-intermediate',
  Advanced: 'concept-badge-advanced',
}

export function ConceptHeader({ number, title, description, level, docsUrl }: Props) {
  return (
    <div className="mb-6 border-b border-gray-800 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-gray-600 text-sm font-semibold">#{number}</span>
            <span className={levelClass[level]}>{level}</span>
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">{description}</p>
        </div>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0"
          >
            Apollo Docs ↗
          </a>
        )}
      </div>
    </div>
  )
}
